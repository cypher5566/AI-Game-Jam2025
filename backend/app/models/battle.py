"""
戰鬥資料模型
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DamageCalculationRequest(BaseModel):
    """傷害計算請求（符合前端 BATTLE_API_SPEC.md）"""
    attackerId: str
    defenderId: str
    skillId: str
    attackerLevel: int = Field(ge=1, le=100)
    attackerAttack: int = Field(ge=1)
    defenderDefense: int = Field(ge=1)
    skillPower: int = Field(ge=0)
    skillType: str
    defenderType: str


class DamageCalculationResponse(BaseModel):
    """傷害計算響應"""
    success: bool = True
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None


class DamageCalculation(BaseModel):
    """傷害計算結果"""
    damage: int = Field(ge=0)
    isCritical: bool = False
    effectiveness: float = Field(ge=0)  # 0.5, 1.0, 2.0
    effectivenessText: str  # "super", "normal", "not-very"
    message: str


class UseSkillRequest(BaseModel):
    """使用技能請求"""
    battleId: str
    attackerId: str
    defenderId: str
    skillId: str
    attackerCurrentHp: int = Field(ge=0)
    defenderCurrentHp: int = Field(ge=0)


class UseSkillResponse(BaseModel):
    """使用技能響應"""
    success: bool = True
    data: Optional[Dict[str, Any]] = None


class BattleLogEntry(BaseModel):
    """戰鬥日誌條目"""
    turn: int
    attacker_id: str
    defender_id: str
    skill_id: str
    damage: int
    is_critical: bool
    effectiveness: float
    message: str
    timestamp: datetime


class BattleLog(BaseModel):
    """完整戰鬥日誌"""
    battle_id: str
    entries: List[BattleLogEntry]


class Battle(BaseModel):
    """戰鬥記錄"""
    id: str
    room_id: str
    battle_log: Dict[str, Any]  # JSONB
    result: Optional[str] = None  # "win", "lose"
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True
