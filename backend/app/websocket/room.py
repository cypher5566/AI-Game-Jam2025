"""
房間管理器
處理房間創建、加入、離開、狀態管理
"""

from typing import Dict, List, Optional, Any
import logging
import random
import string
from datetime import datetime

from app.database import get_service_db
from app.config import settings

logger = logging.getLogger(__name__)


class RoomMember:
    """房間成員"""

    def __init__(
        self,
        connection_id: str,
        pokemon_id: str,
        pokemon_data: Dict[str, Any],
        player_name: str = "Trainer"
    ):
        self.connection_id = connection_id
        self.pokemon_id = pokemon_id
        self.pokemon_data = pokemon_data
        self.player_name = player_name
        self.is_ready = False
        self.current_hp = pokemon_data.get("stats", {}).get("hp", 100)
        self.max_hp = self.current_hp

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "connection_id": self.connection_id,
            "pokemon_id": self.pokemon_id,
            "player_name": self.player_name,
            "pokemon": {
                "name": self.pokemon_data.get("name", "Unknown"),
                "type": self.pokemon_data.get("type", "normal"),
                "front_image": self.pokemon_data.get("front_image_url", ""),
                "stats": self.pokemon_data.get("stats", {}),
            },
            "is_ready": self.is_ready,
            "current_hp": self.current_hp,
            "max_hp": self.max_hp
        }


class Room:
    """房間"""

    def __init__(
        self,
        room_code: str,
        max_players: int = 4,
        boss_base_hp: int = 1000
    ):
        self.room_code = room_code
        self.max_players = max_players
        self.boss_base_hp = boss_base_hp
        self.status = "waiting"  # waiting, ready, battle, finished
        self.members: Dict[str, RoomMember] = {}
        self.boss_hp = 0
        self.boss_max_hp = 0
        self.current_turn = 0
        self.battle_log: List[Dict[str, Any]] = []
        self.created_at = datetime.now()

    def add_member(self, member: RoomMember) -> bool:
        """
        加入成員

        Returns:
            是否成功加入
        """
        if len(self.members) >= self.max_players:
            logger.warning(f"⚠️  房間 {self.room_code} 已滿")
            return False

        if member.connection_id in self.members:
            logger.warning(f"⚠️  成員 {member.connection_id} 已在房間中")
            return False

        self.members[member.connection_id] = member
        logger.info(f"✅ 成員加入房間 {self.room_code}: {member.player_name}")
        return True

    def remove_member(self, connection_id: str) -> bool:
        """
        移除成員

        Returns:
            是否成功移除
        """
        if connection_id not in self.members:
            return False

        member = self.members[connection_id]
        del self.members[connection_id]
        logger.info(f"❌ 成員離開房間 {self.room_code}: {member.player_name}")

        # 如果房間空了，標記為 finished
        if len(self.members) == 0:
            self.status = "finished"

        return True

    def set_member_ready(self, connection_id: str, is_ready: bool = True):
        """設定成員準備狀態"""
        if connection_id in self.members:
            self.members[connection_id].is_ready = is_ready

    def is_all_ready(self) -> bool:
        """檢查是否所有成員都準備好"""
        if len(self.members) == 0:
            return False
        return all(member.is_ready for member in self.members.values())

    def start_battle(self):
        """開始戰鬥"""
        if not self.is_all_ready():
            logger.warning(f"⚠️  房間 {self.room_code} 尚未所有人準備好")
            return False

        # 計算 Boss 血量（基礎 + 每人額外血量）
        player_count = len(self.members)
        self.boss_max_hp = self.boss_base_hp + (player_count - 1) * settings.boss_hp_per_player
        self.boss_hp = self.boss_max_hp

        self.status = "battle"
        self.current_turn = 0
        self.battle_log = []

        logger.info(f"⚔️  房間 {self.room_code} 開始戰鬥！Boss HP: {self.boss_hp}")
        return True

    def apply_damage(self, damage: int) -> Dict[str, Any]:
        """
        對 Boss 造成傷害

        Returns:
            戰鬥結果
        """
        self.boss_hp = max(0, self.boss_hp - damage)
        self.current_turn += 1

        result = {
            "damage": damage,
            "boss_hp": self.boss_hp,
            "boss_max_hp": self.boss_max_hp,
            "is_defeated": self.boss_hp == 0
        }

        if self.boss_hp == 0:
            self.status = "finished"
            logger.info(f"🎉 房間 {self.room_code} Boss 被擊敗！")

        return result

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "room_code": self.room_code,
            "status": self.status,
            "max_players": self.max_players,
            "current_players": len(self.members),
            "members": [member.to_dict() for member in self.members.values()],
            "boss": {
                "hp": self.boss_hp,
                "max_hp": self.boss_max_hp
            },
            "current_turn": self.current_turn,
            "created_at": self.created_at.isoformat()
        }


class RoomManager:
    """
    房間管理器

    功能:
    - 創建房間
    - 加入/離開房間
    - 房間狀態管理
    """

    def __init__(self):
        # 所有活動房間 {room_code: Room}
        self.rooms: Dict[str, Room] = {}

    def generate_room_code(self) -> str:
        """
        生成 8 位房間代碼

        格式: ABCD1234 (4 個英文字母 + 4 個數字)
        """
        while True:
            letters = ''.join(random.choices(string.ascii_uppercase, k=4))
            digits = ''.join(random.choices(string.digits, k=4))
            code = letters + digits

            if code not in self.rooms:
                return code

    async def create_room(
        self,
        max_players: int = 4,
        boss_base_hp: Optional[int] = None
    ) -> Room:
        """
        創建房間

        Args:
            max_players: 最大玩家數（2-4）
            boss_base_hp: Boss 基礎血量

        Returns:
            Room 實例
        """
        # 驗證參數
        max_players = max(2, min(4, max_players))
        boss_base_hp = boss_base_hp or settings.boss_base_hp

        room_code = self.generate_room_code()
        room = Room(room_code, max_players, boss_base_hp)
        self.rooms[room_code] = room

        # 儲存到資料庫
        try:
            db = get_service_db()
            db.table("rooms").insert({
                "room_code": room_code,
                "status": "waiting",
                "boss_hp": 0,
                "boss_max_hp": 0,
                "max_players": max_players
            }).execute()
        except Exception as e:
            logger.error(f"❌ 儲存房間到資料庫失敗: {e}")

        logger.info(f"🎮 創建房間: {room_code} (最多 {max_players} 人)")
        return room

    async def join_room(
        self,
        room_code: str,
        connection_id: str,
        pokemon_id: str,
        player_name: str = "Trainer"
    ) -> Optional[Room]:
        """
        加入房間

        Args:
            room_code: 房間代碼
            connection_id: 連線 ID
            pokemon_id: 寶可夢 ID
            player_name: 玩家名稱

        Returns:
            Room 實例，如果失敗則返回 None
        """
        # 檢查房間是否存在
        if room_code not in self.rooms:
            logger.warning(f"⚠️  房間 {room_code} 不存在")
            return None

        room = self.rooms[room_code]

        # 檢查房間狀態
        if room.status != "waiting":
            logger.warning(f"⚠️  房間 {room_code} 已開始或結束")
            return None

        # 獲取寶可夢資料
        try:
            db = get_service_db()
            result = db.table("pokemon").select("*").eq("id", pokemon_id).execute()

            if not result.data or len(result.data) == 0:
                logger.warning(f"⚠️  找不到寶可夢: {pokemon_id}")
                return None

            pokemon_data = result.data[0]
        except Exception as e:
            logger.error(f"❌ 獲取寶可夢資料失敗: {e}")
            return None

        # 創建成員並加入房間
        member = RoomMember(connection_id, pokemon_id, pokemon_data, player_name)
        if not room.add_member(member):
            return None

        # 儲存到資料庫
        try:
            db.table("room_members").insert({
                "room_id": room_code,  # 使用 room_code 作為臨時 ID
                "pokemon_id": pokemon_id,
                "user_id": connection_id,
                "is_ready": False
            }).execute()
        except Exception as e:
            logger.error(f"❌ 儲存房間成員失敗: {e}")

        return room

    async def leave_room(self, room_code: str, connection_id: str):
        """
        離開房間

        Args:
            room_code: 房間代碼
            connection_id: 連線 ID
        """
        if room_code not in self.rooms:
            return

        room = self.rooms[room_code]
        room.remove_member(connection_id)

        # 如果房間空了，移除房間
        if len(room.members) == 0:
            del self.rooms[room_code]
            logger.info(f"🗑️  刪除空房間: {room_code}")

    def get_room(self, room_code: str) -> Optional[Room]:
        """獲取房間"""
        return self.rooms.get(room_code)

    def get_all_rooms(self) -> List[Room]:
        """獲取所有房間"""
        return list(self.rooms.values())


# 全局 RoomManager 實例
room_manager = RoomManager()
