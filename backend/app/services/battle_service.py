"""
戰鬥系統服務
負責傷害計算、屬性相剋等戰鬥邏輯
"""

import random
from typing import Dict, Tuple
from app.config import settings


# 18x18 屬性相剋表
# 格式: TYPE_EFFECTIVENESS[攻擊屬性][防禦屬性] = 倍率
TYPE_EFFECTIVENESS: Dict[str, Dict[str, float]] = {
    "normal": {
        "rock": 0.5,
        "ghost": 0.0,
        "steel": 0.5,
    },
    "fire": {
        "fire": 0.5,
        "water": 0.5,
        "grass": 2.0,
        "ice": 2.0,
        "bug": 2.0,
        "rock": 0.5,
        "dragon": 0.5,
        "steel": 2.0,
    },
    "water": {
        "fire": 2.0,
        "water": 0.5,
        "grass": 0.5,
        "ground": 2.0,
        "rock": 2.0,
        "dragon": 0.5,
    },
    "electric": {
        "water": 2.0,
        "electric": 0.5,
        "grass": 0.5,
        "ground": 0.0,
        "flying": 2.0,
        "dragon": 0.5,
    },
    "grass": {
        "fire": 0.5,
        "water": 2.0,
        "grass": 0.5,
        "poison": 0.5,
        "ground": 2.0,
        "flying": 0.5,
        "bug": 0.5,
        "rock": 2.0,
        "dragon": 0.5,
        "steel": 0.5,
    },
    "ice": {
        "fire": 0.5,
        "water": 0.5,
        "grass": 2.0,
        "ice": 0.5,
        "ground": 2.0,
        "flying": 2.0,
        "dragon": 2.0,
        "steel": 0.5,
    },
    "fighting": {
        "normal": 2.0,
        "ice": 2.0,
        "poison": 0.5,
        "flying": 0.5,
        "psychic": 0.5,
        "bug": 0.5,
        "rock": 2.0,
        "ghost": 0.0,
        "dark": 2.0,
        "steel": 2.0,
        "fairy": 0.5,
    },
    "poison": {
        "grass": 2.0,
        "poison": 0.5,
        "ground": 0.5,
        "rock": 0.5,
        "ghost": 0.5,
        "steel": 0.0,
        "fairy": 2.0,
    },
    "ground": {
        "fire": 2.0,
        "electric": 2.0,
        "grass": 0.5,
        "poison": 2.0,
        "flying": 0.0,
        "bug": 0.5,
        "rock": 2.0,
        "steel": 2.0,
    },
    "flying": {
        "electric": 0.5,
        "grass": 2.0,
        "fighting": 2.0,
        "bug": 2.0,
        "rock": 0.5,
        "steel": 0.5,
    },
    "psychic": {
        "fighting": 2.0,
        "poison": 2.0,
        "psychic": 0.5,
        "dark": 0.0,
        "steel": 0.5,
    },
    "bug": {
        "fire": 0.5,
        "grass": 2.0,
        "fighting": 0.5,
        "poison": 0.5,
        "flying": 0.5,
        "psychic": 2.0,
        "ghost": 0.5,
        "dark": 2.0,
        "steel": 0.5,
        "fairy": 0.5,
    },
    "rock": {
        "fire": 2.0,
        "ice": 2.0,
        "fighting": 0.5,
        "ground": 0.5,
        "flying": 2.0,
        "bug": 2.0,
        "steel": 0.5,
    },
    "ghost": {
        "normal": 0.0,
        "psychic": 2.0,
        "ghost": 2.0,
        "dark": 0.5,
    },
    "dragon": {
        "dragon": 2.0,
        "steel": 0.5,
        "fairy": 0.0,
    },
    "dark": {
        "fighting": 0.5,
        "psychic": 2.0,
        "ghost": 2.0,
        "dark": 0.5,
        "fairy": 0.5,
    },
    "steel": {
        "fire": 0.5,
        "water": 0.5,
        "electric": 0.5,
        "ice": 2.0,
        "rock": 2.0,
        "steel": 0.5,
        "fairy": 2.0,
    },
    "fairy": {
        "fire": 0.5,
        "fighting": 2.0,
        "poison": 0.5,
        "dragon": 2.0,
        "dark": 2.0,
        "steel": 0.5,
    },
}


class BattleService:
    """戰鬥系統服務類"""

    @classmethod
    def get_type_effectiveness(cls, attack_type: str, defense_type: str) -> float:
        """
        獲取屬性相剋倍率

        Args:
            attack_type: 攻擊方屬性
            defense_type: 防禦方屬性

        Returns:
            倍率 (0.0 = 無效, 0.5 = 不佳, 1.0 = 普通, 2.0 = 效果絕佳)
        """
        # 驗證屬性是否合法
        if attack_type not in settings.POKEMON_TYPES:
            attack_type = "normal"
        if defense_type not in settings.POKEMON_TYPES:
            defense_type = "normal"

        # 查詢倍率，預設為 1.0（普通傷害）
        effectiveness = TYPE_EFFECTIVENESS.get(attack_type, {}).get(defense_type, 1.0)
        return effectiveness

    @classmethod
    def get_effectiveness_message(cls, effectiveness: float) -> str:
        """
        根據倍率返回效果訊息

        Args:
            effectiveness: 倍率

        Returns:
            效果訊息（中文）
        """
        if effectiveness == 0.0:
            return "完全沒有效果..."
        elif effectiveness == 0.5:
            return "效果不佳..."
        elif effectiveness == 2.0:
            return "效果絕佳！"
        else:
            return ""

    @classmethod
    def calculate_damage(
        cls,
        attacker_level: int,
        attacker_attack: int,
        defender_defense: int,
        skill_power: int,
        skill_type: str,
        defender_type: str,
        is_critical: bool = False
    ) -> Tuple[int, float, str]:
        """
        計算傷害
        基於 Pokemon 經典傷害公式

        Args:
            attacker_level: 攻擊方等級
            attacker_attack: 攻擊方攻擊力
            defender_defense: 防禦方防禦力
            skill_power: 技能威力
            skill_type: 技能屬性
            defender_type: 防禦方屬性
            is_critical: 是否會心一擊（可選，預設隨機判定）

        Returns:
            (傷害值, 屬性相剋倍率, 效果訊息)
        """
        # 基礎傷害計算
        # damage = ((2 * level / 5 + 2) * power * (attack / defense)) / 50 + 2
        base_damage = (
            ((2 * attacker_level / 5 + 2) * skill_power * (attacker_attack / defender_defense))
            / 50
            + 2
        )

        # 會心一擊判定（5% 機率）
        if not is_critical:
            is_critical = random.random() < 0.05

        if is_critical:
            base_damage *= 1.5

        # 屬性相剋
        effectiveness = cls.get_type_effectiveness(skill_type, defender_type)
        base_damage *= effectiveness

        # 隨機浮動 (85% ~ 100%)
        random_factor = random.uniform(0.85, 1.0)
        final_damage = int(base_damage * random_factor)

        # 最少傷害為 1
        final_damage = max(1, final_damage)

        # 效果訊息
        message = cls.get_effectiveness_message(effectiveness)
        if is_critical:
            message = "會心一擊！" + message

        return final_damage, effectiveness, message

    @classmethod
    def get_all_type_chart(cls) -> Dict[str, Dict[str, float]]:
        """
        獲取完整的 18x18 屬性相剋表

        Returns:
            完整的屬性相剋字典
        """
        # 構建完整的對照表（包含預設值 1.0）
        full_chart = {}
        for attack_type in settings.POKEMON_TYPES:
            full_chart[attack_type] = {}
            for defense_type in settings.POKEMON_TYPES:
                full_chart[attack_type][defense_type] = cls.get_type_effectiveness(
                    attack_type, defense_type
                )

        return full_chart
