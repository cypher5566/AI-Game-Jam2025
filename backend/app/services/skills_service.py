"""
技能管理服務
從本地 CSV 檔案讀取技能資料
"""

import csv
import os
from typing import List, Dict, Optional
import logging
import random

from app.config import settings

logger = logging.getLogger(__name__)


class Skill:
    """技能資料類"""
    def __init__(self, data: Dict):
        self.id = data.get('編號', '')
        self.name_zh = data.get('中文名', '')
        self.name_ja = data.get('日文名', '')
        self.name_en = data.get('英文名', '')
        self.type = self._convert_type(data.get('屬性', ''))
        self.category = data.get('分類', '')
        self.power = self._parse_power(data.get('威力', ''))
        self.accuracy = self._parse_accuracy(data.get('命中', ''))
        self.pp = self._parse_int(data.get('PP', ''))
        self.description = data.get('說明', '')

    def _convert_type(self, type_zh: str) -> str:
        """將中文屬性轉換為英文"""
        type_map = {
            '一般': 'normal',
            '火': 'fire',
            '水': 'water',
            '草': 'grass',
            '電': 'electric',
            '冰': 'ice',
            '格鬥': 'fighting',
            '毒': 'poison',
            '地面': 'ground',
            '飛行': 'flying',
            '超能力': 'psychic',
            '蟲': 'bug',
            '岩石': 'rock',
            '幽靈': 'ghost',
            '龍': 'dragon',
            '惡': 'dark',
            '鋼': 'steel',
            '妖精': 'fairy'
        }
        return type_map.get(type_zh, 'normal')

    def _parse_power(self, power_str: str) -> int:
        """解析威力值"""
        try:
            # 處理 "—" 或空值
            if power_str in ['—', '-', '', 'None']:
                return 0
            return int(power_str)
        except (ValueError, TypeError):
            return 0

    def _parse_accuracy(self, acc_str: str) -> int:
        """解析命中率"""
        try:
            if acc_str in ['—', '-', '', 'None']:
                return 100  # 預設 100%
            return int(acc_str)
        except (ValueError, TypeError):
            return 100

    def _parse_int(self, value: str) -> int:
        """解析整數"""
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0

    def to_dict(self) -> Dict:
        """轉換為字典"""
        return {
            'id': f"skill_{self.id}",
            'name': self.name_zh,
            'name_en': self.name_en,
            'type': self.type,
            'category': self.category,
            'power': self.power,
            'accuracy': self.accuracy,
            'pp': self.pp,
            'description': self.description
        }


class SkillsService:
    """技能管理服務"""

    def __init__(self):
        self.skills: List[Skill] = []
        self.skills_by_type: Dict[str, List[Skill]] = {}
        self._loaded = False

    def load_skills(self, csv_path: str = None):
        """
        從 CSV 檔案載入技能

        Args:
            csv_path: CSV 檔案路徑，如果不提供則使用預設路徑
        """
        if csv_path is None:
            csv_path = os.path.join('data', 'pokemon_moves.csv')

        if not os.path.exists(csv_path):
            logger.warning(f"⚠️  找不到技能 CSV 檔案: {csv_path}")
            logger.warning("⚠️  將使用預設技能資料")
            self._load_default_skills()
            return

        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    skill = Skill(row)
                    # 只保留有威力的技能（攻擊技能）
                    if skill.power > 0:
                        self.skills.append(skill)

            # 按屬性分類
            self.skills_by_type = {}
            for skill in self.skills:
                if skill.type not in self.skills_by_type:
                    self.skills_by_type[skill.type] = []
                self.skills_by_type[skill.type].append(skill)

            self._loaded = True
            logger.info(f"✅ 成功載入 {len(self.skills)} 個技能")
            logger.info(f"📊 屬性分布: {[(t, len(s)) for t, s in self.skills_by_type.items()]}")

        except Exception as e:
            logger.error(f"❌ 載入技能失敗: {e}")
            self._load_default_skills()

    def _load_default_skills(self):
        """載入預設技能（fallback）"""
        default_skills_data = [
            # 火系
            {'編號': '1', '中文名': '火花', '英文名': 'Ember', '屬性': '火', '分類': '特殊', '威力': '40', '命中': '100', 'PP': '25', '說明': '發射小火焰攻擊對手'},
            {'編號': '2', '中文名': '火焰放射', '英文名': 'Flamethrower', '屬性': '火', '分類': '特殊', '威力': '90', '命中': '100', 'PP': '15', '說明': '向對手噴射烈焰'},
            {'編號': '3', '中文名': '大字爆炎', '英文名': 'Fire Blast', '屬性': '火', '分類': '特殊', '威力': '110', '命中': '85', 'PP': '5', '說明': '用大字形狀的火焰燒盡對手'},
            {'編號': '4', '中文名': '火焰拳', '英文名': 'Fire Punch', '屬性': '火', '分類': '物理', '威力': '75', '命中': '100', 'PP': '15', '說明': '用充滿火焰的拳頭攻擊'},
            # 水系
            {'編號': '5', '中文名': '水槍', '英文名': 'Water Gun', '屬性': '水', '分類': '特殊', '威力': '40', '命中': '100', 'PP': '25', '說明': '向對手噴射水柱'},
            {'編號': '6', '中文名': '水炮', '英文名': 'Hydro Pump', '屬性': '水', '分類': '特殊', '威力': '110', '命中': '80', 'PP': '5', '說明': '向對手猛烈地噴射水柱'},
            {'編號': '7', '中文名': '衝浪', '英文名': 'Surf', '屬性': '水', '分類': '特殊', '威力': '90', '命中': '100', 'PP': '15', '說明': '掀起大浪攻擊對手'},
            {'編號': '8', '中文名': '泡泡光線', '英文名': 'Bubble Beam', '屬性': '水', '分類': '特殊', '威力': '65', '命中': '100', 'PP': '20', '說明': '向對手發射大量泡泡'},
            # 電系
            {'編號': '9', '中文名': '電擊', '英文名': 'Thunder Shock', '屬性': '電', '分類': '特殊', '威力': '40', '命中': '100', 'PP': '30', '說明': '用電擊攻擊對手'},
            {'編號': '10', '中文名': '十萬伏特', '英文名': 'Thunderbolt', '屬性': '電', '分類': '特殊', '威力': '90', '命中': '100', 'PP': '15', '說明': '向對手發射強力電流'},
            {'編號': '11', '中文名': '打雷', '英文名': 'Thunder', '屬性': '電', '分類': '特殊', '威力': '110', '命中': '70', 'PP': '10', '說明': '向對手劈下暴雷'},
            {'編號': '12', '中文名': '電光一閃', '英文名': 'Thunder Wave', '屬性': '電', '分類': '變化', '威力': '0', '命中': '90', 'PP': '20', '說明': '放出微弱的電擊'},
            # 草系
            {'編號': '13', '中文名': '藤鞭', '英文名': 'Vine Whip', '屬性': '草', '分類': '物理', '威力': '45', '命中': '100', 'PP': '25', '說明': '用藤蔓抽打對手'},
            {'編號': '14', '中文名': '飛葉快刀', '英文名': 'Razor Leaf', '屬性': '草', '分類': '物理', '威力': '55', '命中': '95', 'PP': '25', '說明': '射出葉片切斬對手'},
            {'編號': '15', '中文名': '日光束', '英文名': 'Solar Beam', '屬性': '草', '分類': '特殊', '威力': '120', '命中': '100', 'PP': '10', '說明': '吸收陽光後發射光束'},
            {'編號': '16', '中文名': '種子機關槍', '英文名': 'Seed Bomb', '屬性': '草', '分類': '物理', '威力': '80', '命中': '100', 'PP': '15', '說明': '發射硬化的種子'},
            # 一般系
            {'編號': '17', '中文名': '撞擊', '英文名': 'Tackle', '屬性': '一般', '分類': '物理', '威力': '40', '命中': '100', 'PP': '35', '說明': '用整個身體撞向對手'},
            {'編號': '18', '中文名': '抓', '英文名': 'Scratch', '屬性': '一般', '分類': '物理', '威力': '40', '命中': '100', 'PP': '35', '說明': '用尖銳的爪子抓對手'},
        ]

        for data in default_skills_data:
            skill = Skill(data)
            if skill.power > 0:
                self.skills.append(skill)

        # 按屬性分類
        self.skills_by_type = {}
        for skill in self.skills:
            if skill.type not in self.skills_by_type:
                self.skills_by_type[skill.type] = []
            self.skills_by_type[skill.type].append(skill)

        self._loaded = True
        logger.info(f"✅ 使用預設技能資料 ({len(self.skills)} 個)")

    def get_skills_by_type(self, pokemon_type: str, count: int = 12) -> List[Dict]:
        """
        根據屬性獲取技能

        Args:
            pokemon_type: 寶可夢屬性
            count: 需要的技能數量

        Returns:
            技能字典列表

        策略:
            - 優先選擇同屬性技能 (8個)
            - 補充一般系技能 (2個)
            - 隨機其他屬性 (2個)
            - 確保威力分布合理 (弱/中/強)
        """
        if not self._loaded:
            self.load_skills()

        result = []

        # 1. 優先選擇同屬性技能
        same_type_skills = self.skills_by_type.get(pokemon_type, [])
        if same_type_skills:
            # 按威力排序分組
            weak = [s for s in same_type_skills if s.power <= 50]
            medium = [s for s in same_type_skills if 50 < s.power <= 80]
            strong = [s for s in same_type_skills if s.power > 80]

            # 平衡選擇
            selected = []
            selected.extend(random.sample(weak, min(3, len(weak))))
            selected.extend(random.sample(medium, min(3, len(medium))))
            selected.extend(random.sample(strong, min(2, len(strong))))

            # 如果不足 8 個，補足
            if len(selected) < 8 and len(same_type_skills) >= 8:
                remaining = [s for s in same_type_skills if s not in selected]
                selected.extend(random.sample(remaining, 8 - len(selected)))

            result.extend([s.to_dict() for s in selected[:8]])

        # 2. 補充一般系技能
        normal_skills = self.skills_by_type.get('normal', [])
        if normal_skills and len(result) < count:
            need = min(2, count - len(result))
            selected_normal = random.sample(normal_skills, min(need, len(normal_skills)))
            result.extend([s.to_dict() for s in selected_normal])

        # 3. 隨機其他屬性
        if len(result) < count:
            other_skills = [s for s in self.skills if s.type != pokemon_type and s.type != 'normal']
            need = count - len(result)
            if other_skills:
                selected_other = random.sample(other_skills, min(need, len(other_skills)))
                result.extend([s.to_dict() for s in selected_other])

        # 4. 如果還是不足，用所有技能補足
        if len(result) < count:
            all_available = [s for s in self.skills if s.to_dict() not in result]
            need = count - len(result)
            if all_available:
                selected_fill = random.sample(all_available, min(need, len(all_available)))
                result.extend([s.to_dict() for s in selected_fill])

        return result[:count]


# 創建全局單例
_skills_service: Optional[SkillsService] = None


def get_skills_service() -> SkillsService:
    """獲取技能服務單例"""
    global _skills_service
    if _skills_service is None:
        _skills_service = SkillsService()
    return _skills_service
