"""
房間資料模型
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoomStatus(str, Enum):
    """房間狀態"""
    WAITING = "waiting"  # 等待玩家加入
    READY = "ready"  # 準備開始
    BATTLE = "battle"  # 戰鬥中
    FINISHED = "finished"  # 已結束


class RoomCreate(BaseModel):
    """創建房間請求"""
    max_players: int = Field(default=4, ge=2, le=4)


class RoomMember(BaseModel):
    """房間成員"""
    room_id: str
    pokemon_id: str
    user_id: Optional[str] = None
    is_ready: bool = False
    joined_at: datetime


class Room(BaseModel):
    """房間完整模型"""
    id: str
    room_code: str  # 6位數房間代碼
    status: RoomStatus
    boss_hp: int
    boss_max_hp: int
    current_turn: int = 0
    max_players: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoomJoinRequest(BaseModel):
    """加入房間請求"""
    room_code: str = Field(..., min_length=6, max_length=6)
    pokemon_id: str
    user_id: Optional[str] = None


class RoomResponse(BaseModel):
    """房間響應"""
    success: bool = True
    data: Optional[Room] = None
    members: Optional[List[RoomMember]] = None
    error: Optional[dict] = None
