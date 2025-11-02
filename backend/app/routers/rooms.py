"""
房間系統 API 路由
提供房間創建、加入、WebSocket 連線等端點
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import json

from app.websocket.manager import manager as ws_manager
from app.websocket.room import room_manager, Room
from app.services.boss_service import BossService, Boss
from app.services.battle_service import BattleService
from app.database import get_service_db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ===== 請求/響應模型 =====

class CreateRoomRequest(BaseModel):
    """創建房間請求"""
    max_players: int = Field(default=4, ge=2, le=4, description="最大玩家數（2-4）")
    boss_base_hp: Optional[int] = Field(default=None, description="Boss 基礎血量")


class CreateRoomResponse(BaseModel):
    """創建房間響應"""
    success: bool
    room_code: str
    message: str


class JoinRoomRequest(BaseModel):
    """加入房間請求"""
    room_code: str = Field(description="房間代碼")
    pokemon_id: str = Field(description="寶可夢 ID")
    player_name: str = Field(default="Trainer", description="玩家名稱")


class RoomInfoResponse(BaseModel):
    """房間資訊響應"""
    success: bool
    data: Optional[Dict[str, Any]]


# ===== REST API 端點 =====

@router.post("/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest):
    """
    創建房間

    Returns:
        房間代碼和資訊
    """
    try:
        room = await room_manager.create_room(
            max_players=request.max_players,
            boss_base_hp=request.boss_base_hp
        )

        return CreateRoomResponse(
            success=True,
            room_code=room.room_code,
            message=f"房間創建成功！代碼: {room.room_code}"
        )

    except Exception as e:
        logger.error(f"❌ 創建房間失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{room_code}", response_model=RoomInfoResponse)
async def get_room_info(room_code: str):
    """
    獲取房間資訊

    Args:
        room_code: 房間代碼

    Returns:
        房間詳細資訊
    """
    room = room_manager.get_room(room_code)

    if not room:
        raise HTTPException(status_code=404, detail="房間不存在")

    return RoomInfoResponse(
        success=True,
        data=room.to_dict()
    )


@router.get("/")
async def list_rooms():
    """
    列出所有活動房間

    Returns:
        房間列表
    """
    rooms = room_manager.get_all_rooms()

    return {
        "success": True,
        "data": [room.to_dict() for room in rooms],
        "count": len(rooms)
    }


# ===== WebSocket 端點 =====

@router.websocket("/ws/{room_code}")
async def websocket_room(
    websocket: WebSocket,
    room_code: str,
    pokemon_id: str = Query(..., description="寶可夢 ID"),
    player_name: str = Query(default="Trainer", description="玩家名稱")
):
    """
    房間 WebSocket 連線

    Args:
        room_code: 房間代碼
        pokemon_id: 寶可夢 ID（作為連線 ID）
        player_name: 玩家名稱
    """
    connection_id = pokemon_id

    # 檢查房間是否存在，不存在則創建
    room = room_manager.get_room(room_code)
    if not room:
        logger.info(f"🎮 房間 {room_code} 不存在，嘗試創建...")
        # 這裡可以選擇拒絕或自動創建
        await websocket.close(code=4004, reason="房間不存在")
        return

    # 建立 WebSocket 連線
    try:
        connection = await ws_manager.connect(
            websocket, connection_id, room_code,
            user_data={"player_name": player_name}
        )
    except Exception as e:
        logger.error(f"❌ WebSocket 連線失敗: {e}")
        return

    # 加入房間
    joined_room = await room_manager.join_room(
        room_code, connection_id, pokemon_id, player_name
    )

    if not joined_room:
        await ws_manager.disconnect(connection_id)
        return

    # 發送歡迎訊息
    await ws_manager.send_personal_message(connection_id, {
        "type": "welcome",
        "message": f"歡迎加入房間 {room_code}！",
        "room": room.to_dict()
    })

    # 廣播房間更新
    await broadcast_room_update(room_code)

    # Boss 實例（戰鬥中才有）
    boss: Optional[Boss] = None

    try:
        while True:
            # 接收訊息
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")

                logger.debug(f"📩 收到訊息: {message_type} from {connection_id}")

                # 更新心跳
                ws_manager.update_heartbeat(connection_id)

                # 處理不同類型的訊息
                if message_type == "heartbeat":
                    # 心跳回應
                    await ws_manager.send_personal_message(connection_id, {
                        "type": "heartbeat_ack"
                    })

                elif message_type == "ready":
                    # 玩家準備
                    is_ready = message.get("is_ready", True)
                    room.set_member_ready(connection_id, is_ready)

                    await broadcast_room_update(room_code)

                    # 檢查是否所有人都準備好
                    if room.is_all_ready() and room.status == "waiting":
                        # 開始戰鬥
                        await start_battle(room_code, room)
                        boss = await BossService.generate_boss(
                            player_count=len(room.members),
                            base_hp=room.boss_base_hp
                        )

                elif message_type == "use_skill":
                    # 使用技能
                    if room.status != "battle":
                        await ws_manager.send_personal_message(connection_id, {
                            "type": "error",
                            "message": "戰鬥尚未開始"
                        })
                        continue

                    skill_id = message.get("skill_id")
                    await handle_player_attack(
                        room_code, room, boss, connection_id, skill_id
                    )

                elif message_type == "chat":
                    # 聊天訊息
                    chat_message = message.get("message", "")
                    member = room.members.get(connection_id)

                    await ws_manager.broadcast_to_room(room_code, {
                        "type": "chat",
                        "player": member.player_name if member else "Unknown",
                        "message": chat_message
                    })

                else:
                    logger.warning(f"⚠️  未知訊息類型: {message_type}")

            except json.JSONDecodeError:
                logger.error(f"❌ 無效的 JSON: {data}")
                await ws_manager.send_personal_message(connection_id, {
                    "type": "error",
                    "message": "無效的訊息格式"
                })

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket 斷線: {connection_id}")
    except Exception as e:
        logger.error(f"❌ WebSocket 錯誤: {e}")
    finally:
        # 清理連線
        await ws_manager.disconnect(connection_id)
        await room_manager.leave_room(room_code, connection_id)
        await broadcast_room_update(room_code)


# ===== 輔助函數 =====

async def broadcast_room_update(room_code: str):
    """廣播房間狀態更新"""
    room = room_manager.get_room(room_code)
    if not room:
        return

    await ws_manager.broadcast_to_room(room_code, {
        "type": "room_update",
        "data": room.to_dict()
    })


async def start_battle(room_code: str, room: Room):
    """開始戰鬥"""
    if not room.start_battle():
        return

    await ws_manager.broadcast_to_room(room_code, {
        "type": "battle_start",
        "message": "戰鬥開始！",
        "room": room.to_dict()
    })


async def handle_player_attack(
    room_code: str,
    room: Room,
    boss: Optional[Boss],
    connection_id: str,
    skill_id: int
):
    """處理玩家攻擊"""
    if not boss:
        logger.error("❌ Boss 不存在")
        return

    member = room.members.get(connection_id)
    if not member:
        logger.error(f"❌ 找不到成員: {connection_id}")
        return

    # 獲取技能資料
    # TODO: 從資料庫或成員資料中獲取技能
    # 暫時使用假技能
    skill = {
        "id": skill_id,
        "name": "火焰放射",
        "type": "fire",
        "power": 90
    }

    # 計算傷害
    player_stats = member.pokemon_data.get("stats", {})
    damage, effectiveness, message = BossService.calculate_player_damage(
        player_level=player_stats.get("level", 5),
        player_attack=player_stats.get("attack", 50),
        boss=boss,
        skill=skill
    )

    # 對 Boss 造成傷害
    actual_damage, is_defeated = boss.take_damage(damage)

    # 廣播戰鬥動作
    await ws_manager.broadcast_to_room(room_code, {
        "type": "battle_action",
        "data": {
            "actor": member.player_name,
            "action": "attack",
            "skill": skill["name"],
            "target": boss.name,
            "damage": actual_damage,
            "boss_hp": boss.current_hp,
            "boss_max_hp": boss.max_hp,
            "effectiveness": effectiveness,
            "message": f"{member.player_name} 使用了 {skill['name']}！{message}"
        }
    })

    # 檢查是否擊敗 Boss
    if is_defeated:
        room.status = "finished"
        await ws_manager.broadcast_to_room(room_code, {
            "type": "battle_end",
            "result": "win",
            "message": "🎉 恭喜！Boss 被擊敗了！"
        })
        return

    # Boss 回合
    await handle_boss_turn(room_code, room, boss)


async def handle_boss_turn(room_code: str, room: Room, boss: Boss):
    """處理 Boss 回合"""
    # 獲取所有玩家作為目標
    targets = [
        {
            "id": member.connection_id,
            "name": member.player_name,
            "type": member.pokemon_data.get("type", "normal"),
            "stats": member.pokemon_data.get("stats", {})
        }
        for member in room.members.values()
    ]

    # Boss 行動
    result = await BossService.boss_turn(boss, targets)

    if not result.get("success"):
        return

    # 廣播 Boss 動作
    await ws_manager.broadcast_to_room(room_code, {
        "type": "battle_action",
        "data": {
            "actor": boss.name,
            "action": "attack",
            "skill": result["skill"]["name"],
            "target": result["target"]["name"],
            "damage": result["damage"],
            "effectiveness": result["effectiveness"],
            "message": f"{boss.name} 使用了 {result['skill']['name']}！{result['message']}"
        }
    })
