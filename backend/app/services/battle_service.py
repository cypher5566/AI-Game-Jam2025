"""
戰鬥系統服務
負責傷害計算、屬性相剋等戰鬥邏輯
"""

import random
from typing import Dict, Tuple
from app.config import settings


# 18x18 屬性相剋表
# 格式: TYPE_EFFECTIVENESS[攻擊屬性][防禦屬性] = 倍率
# 新版倍率: +0.25 (優勢), 0.0 (普通), -0.2 (劣勢), -1.0 (免疫)
TYPE_EFFECTIVENESS: Dict[str, Dict[str, float]] = {
    "normal": {
        "rock": -0.2,
        "ghost": -1.0,
        "steel": -0.2,
    },
    "fire": {
        "fire": -0.2,
        "water": -0.2,
        "grass": 0.25,
        "ice": 0.25,
        "bug": 0.25,
        "rock": -0.2,
        "dragon": -0.2,
        "steel": 0.25,
    },
    "water": {
        "fire": 0.25,
        "water": -0.2,
        "grass": -0.2,
        "ground": 0.25,
        "rock": 0.25,
        "dragon": -0.2,
    },
    "electric": {
        "water": 0.25,
        "electric": -0.2,
        "grass": -0.2,
        "ground": -1.0,
        "flying": 0.25,
        "dragon": -0.2,
    },
    "grass": {
        "fire": -0.2,
        "water": 0.25,
        "grass": -0.2,
        "poison": -0.2,
        "ground": 0.25,
        "flying": -0.2,
        "bug": -0.2,
        "rock": 0.25,
        "dragon": -0.2,
        "steel": -0.2,
    },
    "ice": {
        "fire": -0.2,
        "water": -0.2,
        "grass": 0.25,
        "ice": -0.2,
        "ground": 0.25,
        "flying": 0.25,
        "dragon": 0.25,
        "steel": -0.2,
    },
    "fighting": {
        "normal": 0.25,
        "ice": 0.25,
        "poison": -0.2,
        "flying": -0.2,
        "psychic": -0.2,
        "bug": -0.2,
        "rock": 0.25,
        "ghost": -1.0,
        "dark": 0.25,
        "steel": 0.25,
        "fairy": -0.2,
    },
    "poison": {
        "grass": 0.25,
        "poison": -0.2,
        "ground": -0.2,
        "rock": -0.2,
        "ghost": -0.2,
        "steel": -1.0,
        "fairy": 0.25,
    },
    "ground": {
        "fire": 0.25,
        "electric": 0.25,
        "grass": -0.2,
        "poison": 0.25,
        "flying": -1.0,
        "bug": -0.2,
        "rock": 0.25,
        "steel": 0.25,
    },
    "flying": {
        "electric": -0.2,
        "grass": 0.25,
        "fighting": 0.25,
        "bug": 0.25,
        "rock": -0.2,
        "steel": -0.2,
    },
    "psychic": {
        "fighting": 0.25,
        "poison": 0.25,
        "psychic": -0.2,
        "dark": -1.0,
        "steel": -0.2,
    },
    "bug": {
        "fire": -0.2,
        "grass": 0.25,
        "fighting": -0.2,
        "poison": -0.2,
        "flying": -0.2,
        "psychic": 0.25,
        "ghost": -0.2,
        "dark": 0.25,
        "steel": -0.2,
        "fairy": -0.2,
    },
    "rock": {
        "fire": 0.25,
        "ice": 0.25,
        "fighting": -0.2,
        "ground": -0.2,
        "flying": 0.25,
        "bug": 0.25,
        "steel": -0.2,
    },
    "ghost": {
        "normal": -1.0,
        "psychic": 0.25,
        "ghost": 0.25,
        "dark": -0.2,
    },
    "dragon": {
        "dragon": 0.25,
        "steel": -0.2,
        "fairy": -1.0,
    },
    "dark": {
        "fighting": -0.2,
        "psychic": 0.25,
        "ghost": 0.25,
        "dark": -0.2,
        "fairy": -0.2,
    },
    "steel": {
        "fire": -0.2,
        "water": -0.2,
        "electric": -0.2,
        "ice": 0.25,
        "rock": 0.25,
        "steel": -0.2,
        "fairy": 0.25,
    },
    "fairy": {
        "fire": -0.2,
        "fighting": 0.25,
        "poison": -0.2,
        "dragon": 0.25,
        "dark": 0.25,
        "steel": -0.2,
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
            倍率 (-1.0 = 免疫, -0.2 = 劣勢, 0.0 = 普通, +0.25 = 優勢)
        """
        # 驗證屬性是否合法
        if attack_type not in settings.POKEMON_TYPES:
            attack_type = "normal"
        if defense_type not in settings.POKEMON_TYPES:
            defense_type = "normal"

        # 查詢倍率，預設為 0.0（普通傷害）
        effectiveness = TYPE_EFFECTIVENESS.get(attack_type, {}).get(defense_type, 0.0)
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
        if effectiveness == -1.0:
            return "完全沒有效果..."
        elif effectiveness == -0.2:
            return "效果不佳..."
        elif effectiveness == 0.25:
            return "效果絕佳！"
        else:
            return ""

    @classmethod
    def calculate_damage(
        cls,
        skill_power: int,
        skill_type: str,
        defender_type: str,
        prompt_multiplier: float = 0.0
    ) -> Tuple[int, float, str]:
        """
        計算傷害
        新版簡化公式: 威力 × (1 + 屬性倍率 + Prompt倍率)

        Args:
            skill_power: 技能威力
            skill_type: 技能屬性
            defender_type: 防禦方屬性
            prompt_multiplier: Prompt倍率 (0.0 到 0.5，預設 0.0)

        Returns:
            (傷害值, 屬性相剋倍率, 效果訊息)
        """
        # 獲取屬性相剋倍率
        attribute_multiplier = cls.get_type_effectiveness(skill_type, defender_type)

        # 檢查是否免疫（-1.0）
        if attribute_multiplier == -1.0:
            return 0, attribute_multiplier, cls.get_effectiveness_message(attribute_multiplier)

        # 計算傷害: 威力 × (1 + 屬性倍率 + Prompt倍率)
        # 屬性倍率: +0.25 (優勢), 0.0 (普通), -0.2 (劣勢)
        # Prompt倍率: 0.0 ~ 0.5 (0%, 10%, 20%, 30%, 40%, 50%)
        final_damage = skill_power * (1 + attribute_multiplier + prompt_multiplier)

        # 轉為整數
        final_damage = int(final_damage)

        # 最少傷害為 1（除非免疫）
        final_damage = max(1, final_damage)

        # 效果訊息
        message = cls.get_effectiveness_message(attribute_multiplier)

        return final_damage, attribute_multiplier, message

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
