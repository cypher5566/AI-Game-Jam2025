"""
Boss 戰鬥服務
處理 Boss 生成、技能選擇、AI 行為
"""

from typing import Dict, List, Any, Optional, Tuple
import random
import logging

from app.config import settings
from app.services.battle_service import BattleService
from app.services.skills_service import SkillsService

logger = logging.getLogger(__name__)


class Boss:
    """Boss 實體"""

    def __init__(
        self,
        name: str,
        pokemon_type: str,
        level: int,
        max_hp: int,
        attack: int,
        defense: int,
        speed: int,
        skills: List[Dict[str, Any]]
    ):
        self.name = name
        self.type = pokemon_type
        self.level = level
        self.max_hp = max_hp
        self.current_hp = max_hp
        self.attack = attack
        self.defense = defense
        self.speed = speed
        self.skills = skills

    def take_damage(self, damage: int) -> Tuple[int, bool]:
        """
        受到傷害

        Returns:
            (實際傷害, 是否被擊敗)
        """
        actual_damage = min(damage, self.current_hp)
        self.current_hp -= actual_damage
        is_defeated = self.current_hp == 0
        return actual_damage, is_defeated

    def select_skill(self) -> Dict[str, Any]:
        """
        選擇技能（AI 邏輯）

        目前使用簡單隨機選擇，未來可以加入策略：
        - 優先使用高威力技能
        - 根據玩家屬性選擇相剋技能
        - 血量低時使用特殊技能
        """
        if not self.skills:
            # Fallback: 基礎攻擊
            return {
                "id": 0,
                "name": "撞擊",
                "name_en": "Tackle",
                "type": self.type,
                "power": 40,
                "accuracy": 100
            }

        # 簡單策略：70% 高威力，30% 隨機
        if random.random() < 0.7:
            # 選擇威力最高的技能
            return max(self.skills, key=lambda s: s.get("power", 0))
        else:
            # 隨機選擇
            return random.choice(self.skills)

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "name": self.name,
            "type": self.type,
            "type_chinese": settings.POKEMON_TYPES_CHINESE.get(self.type, "未知"),
            "level": self.level,
            "current_hp": self.current_hp,
            "max_hp": self.max_hp,
            "stats": {
                "attack": self.attack,
                "defense": self.defense,
                "speed": self.speed
            },
            "skills": self.skills
        }


class BossService:
    """Boss 服務"""

    # Boss 名稱池（每種屬性一個）
    BOSS_NAMES = {
        "normal": "普通之王",
        "fire": "烈焰霸主",
        "water": "深海巨獸",
        "electric": "雷電君主",
        "grass": "森林守護者",
        "ice": "極地冰龍",
        "fighting": "格鬥宗師",
        "poison": "毒霧魔王",
        "ground": "大地泰坦",
        "flying": "天空霸者",
        "psychic": "超能魔神",
        "bug": "蟲群女王",
        "rock": "岩石巨靈",
        "ghost": "幽靈領主",
        "dragon": "龍族皇者",
        "dark": "暗黑支配者",
        "steel": "鋼鐵巨神",
        "fairy": "妖精女王"
    }

    @classmethod
    async def generate_boss(
        cls,
        player_count: int,
        base_hp: int = 1000,
        boss_type: Optional[str] = None
    ) -> Boss:
        """
        生成 Boss

        Args:
            player_count: 玩家數量（影響血量和強度）
            base_hp: 基礎血量
            boss_type: Boss 屬性（可選，不指定則隨機）

        Returns:
            Boss 實例
        """
        # 隨機屬性
        if boss_type is None or boss_type not in settings.POKEMON_TYPES:
            boss_type = random.choice(settings.POKEMON_TYPES)

        # Boss 名稱
        boss_name = cls.BOSS_NAMES.get(boss_type, "神秘 Boss")

        # Boss 等級（根據玩家數量調整）
        boss_level = 10 + (player_count * 5)

        # Boss 血量（基礎 + 每個額外玩家增加）
        boss_hp = base_hp + (player_count - 1) * settings.boss_hp_per_player

        # Boss 屬性值（根據等級和玩家數量）
        difficulty_multiplier = 1.0 + (player_count - 1) * 0.3
        boss_attack = int(80 * difficulty_multiplier)
        boss_defense = int(60 * difficulty_multiplier)
        boss_speed = int(70 * difficulty_multiplier)

        # Boss 技能（選擇 4 個強力技能）
        skills_service = SkillsService()
        all_skills = skills_service.get_skills_by_type(boss_type, count=20)

        # 選擇 4 個技能：2 個高威力 + 2 個中威力
        skills_by_power = sorted(all_skills, key=lambda s: s.power, reverse=True)
        boss_skills = []

        # 高威力技能（前 5 個中選 2 個）
        high_power = [s.to_dict() for s in skills_by_power[:5]]
        boss_skills.extend(random.sample(high_power, min(2, len(high_power))))

        # 中威力技能（6-15 個中選 2 個）
        mid_power = [s.to_dict() for s in skills_by_power[5:15]]
        boss_skills.extend(random.sample(mid_power, min(2, len(mid_power))))

        # 創建 Boss
        boss = Boss(
            name=boss_name,
            pokemon_type=boss_type,
            level=boss_level,
            max_hp=boss_hp,
            attack=boss_attack,
            defense=boss_defense,
            speed=boss_speed,
            skills=boss_skills
        )

        logger.info(f"🐉 生成 Boss: {boss_name} ({boss_type}) Lv.{boss_level} HP:{boss_hp}")
        return boss

    @classmethod
    def calculate_boss_damage(
        cls,
        boss: Boss,
        target_defense: int,
        skill: Dict[str, Any],
        target_type: str
    ) -> Tuple[int, float, str]:
        """
        計算 Boss 造成的傷害

        Args:
            boss: Boss 實例
            target_defense: 目標防禦力
            skill: 使用的技能
            target_type: 目標屬性

        Returns:
            (傷害值, 屬性相剋倍率, 訊息)
        """
        return BattleService.calculate_damage(
            attacker_level=boss.level,
            attacker_attack=boss.attack,
            defender_defense=target_defense,
            skill_power=skill.get("power", 40),
            skill_type=skill.get("type", boss.type),
            defender_type=target_type,
            is_critical=False  # Boss 固定不會心
        )

    @classmethod
    def calculate_player_damage(
        cls,
        player_level: int,
        player_attack: int,
        boss: Boss,
        skill: Dict[str, Any]
    ) -> Tuple[int, float, str]:
        """
        計算玩家對 Boss 造成的傷害

        Args:
            player_level: 玩家等級
            player_attack: 玩家攻擊力
            boss: Boss 實例
            skill: 使用的技能

        Returns:
            (傷害值, 屬性相剋倍率, 訊息)
        """
        return BattleService.calculate_damage(
            attacker_level=player_level,
            attacker_attack=player_attack,
            defender_defense=boss.defense,
            skill_power=skill.get("power", 40),
            skill_type=skill.get("type", "normal"),
            defender_type=boss.type,
            is_critical=None  # 隨機會心
        )

    @classmethod
    async def boss_turn(
        cls,
        boss: Boss,
        targets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Boss 回合行動

        Args:
            boss: Boss 實例
            targets: 可攻擊的目標列表（玩家資料）

        Returns:
            行動結果
        """
        if not targets:
            return {
                "success": False,
                "message": "沒有可攻擊的目標"
            }

        # 選擇技能
        skill = boss.select_skill()

        # 選擇目標（隨機或策略）
        # 簡單策略：隨機選擇一個目標
        target = random.choice(targets)

        # 計算傷害
        target_defense = target.get("stats", {}).get("defense", 50)
        target_type = target.get("type", "normal")

        damage, effectiveness, message = cls.calculate_boss_damage(
            boss, target_defense, skill, target_type
        )

        return {
            "success": True,
            "action": "attack",
            "skill": skill,
            "target": target,
            "damage": damage,
            "effectiveness": effectiveness,
            "message": message
        }
