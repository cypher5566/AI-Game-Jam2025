"""
寶可夢資料模型
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PokemonStats(BaseModel):
    """寶可夢數值"""
    hp: int = Field(default=100, ge=1, le=999)
    attack: int = Field(default=50, ge=1, le=999)
    defense: int = Field(default=50, ge=1, le=999)
    speed: int = Field(default=50, ge=1, le=999)
    level: int = Field(default=5, ge=1, le=100)


class PokemonCreate(BaseModel):
    """創建寶可夢的請求模型"""
    user_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=50)
    type: str  # 寶可夢屬性
    front_image_url: str
    back_image_url: str
    stats: Optional[PokemonStats] = None


class Pokemon(BaseModel):
    """寶可夢完整模型"""
    id: str
    user_id: Optional[str] = None
    name: str
    type: str
    front_image_url: str
    back_image_url: str
    stats: Dict[str, Any]  # 儲存為 JSONB
    created_at: datetime

    class Config:
        from_attributes = True


class PokemonResponse(BaseModel):
    """API 響應模型"""
    success: bool = True
    data: Optional[Pokemon] = None
    error: Optional[Dict[str, str]] = None
