"""
戰鬥系統 API 路由
提供傷害計算、屬性相剋查詢等端點
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict
import logging

from app.services.battle_service import BattleService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# 請求/響應模型
class DamageCalculationRequest(BaseModel):
    """傷害計算請求"""
    attacker_level: int = Field(ge=1, le=100, description="攻擊方等級")
    attacker_attack: int = Field(ge=1, description="攻擊方攻擊力")
    defender_defense: int = Field(ge=1, description="防禦方防禦力")
    skill_power: int = Field(ge=0, description="技能威力")
    skill_type: str = Field(description="技能屬性")
    defender_type: str = Field(description="防禦方屬性")
    is_critical: Optional[bool] = Field(default=None, description="是否會心一擊（可選）")


class DamageCalculationResponse(BaseModel):
    """傷害計算響應"""
    damage: int = Field(description="計算出的傷害值")
    type_effectiveness: float = Field(description="屬性相剋倍率")
    is_critical: bool = Field(description="是否會心一擊")
    message: str = Field(description="效果訊息")


class TypeEffectivenessResponse(BaseModel):
    """屬性相剋查詢響應"""
    attack_type: str
    defense_type: str
    effectiveness: float
    message: str


@router.post("/calculate-damage", response_model=DamageCalculationResponse)
async def calculate_damage(request: DamageCalculationRequest):
    """
    計算戰鬥傷害

    基於 Pokemon 經典傷害公式計算傷害值，考慮：
    - 等級差異
    - 攻防比例
    - 技能威力
    - 屬性相剋
    - 會心一擊（5% 機率或指定）
    - 隨機浮動（85%-100%）
    """
    try:
        # 驗證屬性是否合法
        if request.skill_type not in settings.POKEMON_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"無效的技能屬性: {request.skill_type}"
            )
        if request.defender_type not in settings.POKEMON_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"無效的防禦方屬性: {request.defender_type}"
            )

        # 計算傷害
        damage, effectiveness, message = BattleService.calculate_damage(
            attacker_level=request.attacker_level,
            attacker_attack=request.attacker_attack,
            defender_defense=request.defender_defense,
            skill_power=request.skill_power,
            skill_type=request.skill_type,
            defender_type=request.defender_type,
            is_critical=request.is_critical if request.is_critical is not None else False
        )

        # 判斷是否會心
        is_critical = "會心一擊" in message

        return DamageCalculationResponse(
            damage=damage,
            type_effectiveness=effectiveness,
            is_critical=is_critical,
            message=message
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 傷害計算失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/type-effectiveness", response_model=TypeEffectivenessResponse)
async def get_type_effectiveness(attack_type: str, defense_type: str):
    """
    查詢屬性相剋倍率

    Args:
        attack_type: 攻擊方屬性
        defense_type: 防禦方屬性

    Returns:
        倍率和效果訊息
    """
    try:
        # 驗證屬性
        if attack_type not in settings.POKEMON_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"無效的攻擊屬性: {attack_type}"
            )
        if defense_type not in settings.POKEMON_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"無效的防禦屬性: {defense_type}"
            )

        # 查詢倍率
        effectiveness = BattleService.get_type_effectiveness(attack_type, defense_type)
        message = BattleService.get_effectiveness_message(effectiveness)

        return TypeEffectivenessResponse(
            attack_type=attack_type,
            defense_type=defense_type,
            effectiveness=effectiveness,
            message=message
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 屬性相剋查詢失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/type-chart")
async def get_type_chart():
    """
    獲取完整的 18x18 屬性相剋表

    Returns:
        完整的屬性相剋矩陣
    """
    try:
        chart = BattleService.get_all_type_chart()

        return {
            "success": True,
            "data": chart,
            "types": settings.POKEMON_TYPES,
            "types_chinese": settings.POKEMON_TYPES_CHINESE
        }

    except Exception as e:
        logger.error(f"❌ 獲取屬性相剋表失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_all_types():
    """
    獲取所有寶可夢屬性列表

    Returns:
        18 種屬性的英文和中文名稱
    """
    return {
        "success": True,
        "data": [
            {
                "type": type_en,
                "name_zh": settings.POKEMON_TYPES_CHINESE[type_en]
            }
            for type_en in settings.POKEMON_TYPES
        ]
    }
