"""
房間系統 API 路由
提供房間創建、加入、WebSocket 連線等端點
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import json
import asyncio

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
                        # 生成 Boss
                        boss = await BossService.generate_boss(
                            player_count=len(room.members),
                            base_hp=room.boss_base_hp
                        )

                        # 開始戰鬥（啟動計時器）
                        await start_battle(room_code, room, boss)

                elif message_type == "use_skill":
                    # 提交技能行動 (Phase 3&4 - 收集而非立即執行)
                    if room.status != "battle":
                        await ws_manager.send_personal_message(connection_id, {
                            "type": "error",
                            "message": "戰鬥尚未開始"
                        })
                        continue

                    skill_id = message.get("skill_id")
                    prompt = message.get("prompt", "")  # 玩家的戰術描述

                    # 提交行動（儲存到 room.pending_actions）
                    success = room.submit_action(connection_id, skill_id, prompt)

                    if success:
                        await ws_manager.send_personal_message(connection_id, {
                            "type": "action_submitted",
                            "message": "行動已提交！"
                        })

                        # 廣播更新
                        await broadcast_room_update(room_code)
                    else:
                        await ws_manager.send_personal_message(connection_id, {
                            "type": "error",
                            "message": "提交行動失敗"
                        })

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

        # 清理計時器任務 (Phase 3)
        if room and room.turn_timer_task:
            room.turn_timer_task.cancel()
            try:
                await room.turn_timer_task
            except asyncio.CancelledError:
                pass
            logger.info(f"⏹️ 計時器已清理")

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


async def start_battle(room_code: str, room: Room, boss: Boss):
    """開始戰鬥"""
    if not room.start_battle():
        return None

    # 開始第一回合
    room.start_turn()

    await ws_manager.broadcast_to_room(room_code, {
        "type": "battle_start",
        "message": "戰鬥開始！",
        "boss": {
            "name": boss.name,
            "type": boss.type,
            "hp": boss.current_hp,
            "max_hp": boss.max_hp
        },
        "room": room.to_dict()
    })

    # 啟動回合計時器 (Phase 3)
    timer_task = asyncio.create_task(turn_timer_loop(room_code, room, boss))
    room.turn_timer_task = timer_task

    logger.info(f"⏱️ 房間 {room_code} 計時器已啟動")

    return timer_task


# handle_player_attack 已被 process_turn_actions 取代 (批次處理)


async def handle_boss_turn(room_code: str, room: Room, boss: Boss):
    """處理 Boss 回合"""
    # 獲取所有玩家作為目標
    targets = [
        {
            "id": member.connection_id,
            "name": member.player_name,
            "type": member.pokemon_data.get("type", "normal"),
            "stats": member.pokemon_data.get("stats", {}),
            "hp": member.current_hp,
            "max_hp": member.max_hp
        }
        for member in room.members.values()
    ]

    # Boss 行動
    result = await BossService.boss_turn(boss, targets)

    if not result.get("success"):
        return

    # 扣除玩家 HP (Phase 5)
    target_id = result["target"]["id"]
    if target_id in room.members:
        member = room.members[target_id]
        member.current_hp = max(0, member.current_hp - result["damage"])

        # 檢查玩家是否被擊敗
        if member.current_hp == 0:
            logger.warning(f"⚠️ 玩家 {member.player_name} 被擊敗！")

    # 廣播 Boss 動作
    await ws_manager.broadcast_to_room(room_code, {
        "type": "battle_action",
        "data": {
            "actor": boss.name,
            "action": "attack",
            "skill": result["skill"]["name"],
            "target": result["target"]["name"],
            "damage": result["damage"],
            "target_hp": room.members[target_id].current_hp if target_id in room.members else 0,
            "effectiveness": result["effectiveness"],
            "message": f"{boss.name} 使用了 {result['skill']['name']}！{result['message']}"
        }
    })

    # 檢查是否所有玩家都被擊敗 (Phase 5)
    all_defeated = all(member.current_hp == 0 for member in room.members.values())
    if all_defeated:
        room.status = "finished"
        await ws_manager.broadcast_to_room(room_code, {
            "type": "battle_end",
            "result": "lose",
            "message": "💀 全軍覆沒！挑戰失敗..."
        })
        return True  # 返回 True 表示戰鬥結束

    return False  # 返回 False 表示戰鬥繼續


async def process_turn_actions(room_code: str, room: Room, boss: Boss):
    """
    批次處理所有玩家的回合行動 (Phase 3&4)

    流程:
    1. 為所有行動評分 Prompt
    2. 計算所有傷害
    3. 廣播所有玩家攻擊結果
    4. Boss 反擊
    """
    from app.services.prompt_evaluator_service import get_prompt_evaluator
    from app.services.skills_service import get_skills_service

    logger.info(f"⚔️ 開始處理回合 {room.current_turn + 1} 的所有行動...")

    # 處理超時的玩家（使用第一個技能，無 Prompt 獎勵）
    skills_service = get_skills_service()
    for member_id in room.get_pending_player_ids():
        member = room.members.get(member_id)
        if not member:
            continue

        # 獲取該屬性的第一個技能
        pokemon_type = member.pokemon_data.get("type", "normal")
        skills = skills_service.get_skills_by_type(pokemon_type, count=1)

        if skills:
            default_skill_id = skills[0]["id"]
            room.submit_action(member_id, default_skill_id, prompt="")
            logger.warning(f"⏰ 玩家 {member.player_name} 超時，自動使用技能 {skills[0]['name']}")

    # 1. 評分所有 Prompt 並計算傷害
    evaluator = get_prompt_evaluator()
    player_actions = []

    for member_id, action in room.pending_actions.items():
        member = room.members.get(member_id)
        if not member:
            continue

        # 獲取技能資料
        skill_id = action["skill_id"]
        prompt = action.get("prompt", "")

        # TODO: 從資料庫獲取真實技能，目前使用 skills_service
        skills = skills_service.get_skills_by_type(
            member.pokemon_data.get("type", "normal"),
            count=12
        )
        skill = next((s for s in skills if s["id"] == skill_id), None)

        if not skill:
            # 使用預設技能
            skill = {"id": skill_id, "name": "撞擊", "type": "normal", "power": 40}

        # 評分 Prompt
        prompt_multiplier = await evaluator.evaluate_prompt(
            player_prompt=prompt,
            skill_name=skill["name"],
            skill_type=skill["type"],
            boss_name=boss.name,
            boss_type=boss.type
        )

        # 計算傷害
        damage, effectiveness, message = BattleService.calculate_damage(
            skill_power=skill["power"],
            skill_type=skill["type"],
            defender_type=boss.type,
            prompt_multiplier=prompt_multiplier
        )

        player_actions.append({
            "member_id": member_id,
            "member": member,
            "skill": skill,
            "prompt": prompt,
            "prompt_multiplier": prompt_multiplier,
            "damage": damage,
            "effectiveness": effectiveness,
            "message": message
        })

    # 2. 對 Boss 造成所有傷害
    total_damage = sum(action["damage"] for action in player_actions)
    boss.current_hp = max(0, boss.current_hp - total_damage)

    logger.info(f"💥 總傷害: {total_damage}，Boss 剩餘 HP: {boss.current_hp}/{boss.max_hp}")

    # 3. 廣播所有玩家的攻擊結果
    for action in player_actions:
        await ws_manager.broadcast_to_room(room_code, {
            "type": "battle_action",
            "data": {
                "actor": action["member"].player_name,
                "action": "attack",
                "skill": action["skill"]["name"],
                "prompt": action["prompt"],
                "prompt_score": int(action["prompt_multiplier"] * 100),  # 0-50
                "damage": action["damage"],
                "boss_hp": boss.current_hp,
                "boss_max_hp": boss.max_hp,
                "effectiveness": action["effectiveness"],
                "message": f"{action['member'].player_name} 使用了 {action['skill']['name']}！{action['message']} (Prompt獎勵: {int(action['prompt_multiplier']*100)}%)"
            }
        })

        # 稍微延遲讓前端能依序顯示
        await asyncio.sleep(0.5)

    # 檢查是否擊敗 Boss (Phase 5)
    if boss.current_hp == 0:
        room.status = "finished"
        await ws_manager.broadcast_to_room(room_code, {
            "type": "battle_end",
            "result": "win",
            "message": "🎉 恭喜！Boss 被擊敗了！"
        })
        return True  # 返回 True 表示戰鬥結束

    # 4. Boss 反擊
    battle_ended = await handle_boss_turn(room_code, room, boss)

    if battle_ended:
        return True

    # 回合結束
    room.current_turn += 1
    return False


async def turn_timer_loop(room_code: str, room: Room, boss: Boss):
    """
    回合計時器循環 (Phase 3)

    每秒廣播剩餘時間，30秒到時自動處理行動
    """
    try:
        while room.status == "battle":
            remaining = room.get_remaining_time()

            # 廣播剩餘時間
            await ws_manager.broadcast_to_room(room_code, {
                "type": "turn_timer",
                "data": {
                    "remaining_time": remaining,
                    "current_turn": room.current_turn,
                    "pending_count": len(room.get_pending_player_ids())
                }
            })

            # 檢查是否時間到或所有人都已提交
            if remaining <= 0 or room.is_all_actions_submitted():
                # 處理所有行動
                battle_ended = await process_turn_actions(room_code, room, boss)

                if battle_ended:
                    break

                # 開始新回合
                room.start_turn()

                # 廣播新回合開始
                await ws_manager.broadcast_to_room(room_code, {
                    "type": "new_turn",
                    "data": {
                        "turn": room.current_turn,
                        "boss_hp": boss.current_hp,
                        "boss_max_hp": boss.max_hp
                    }
                })

            # 每秒更新一次
            await asyncio.sleep(1)

    except asyncio.CancelledError:
        logger.info(f"⏹️ 房間 {room_code} 計時器已停止")
    except Exception as e:
        logger.error(f"❌ 計時器錯誤: {e}")
