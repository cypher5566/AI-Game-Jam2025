"""
Prompt 評分服務
使用 Gemini 2.0 Flash 評估玩家的戰鬥 Prompt 創意度和有效性
"""

from google import genai
import logging
from typing import Optional
import os

from app.config import settings

logger = logging.getLogger(__name__)


class PromptEvaluatorService:
    """Prompt 評分服務類"""

    def __init__(self):
        """初始化 Gemini API 客戶端"""
        try:
            api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY 未設置")

            self.client = genai.Client(api_key=api_key)
            self.model = 'gemini-2.5-flash-lite'  # 使用 Gemini 2.5 Flash Lite (省錢版本)

            logger.info("✅ Prompt Evaluator 初始化成功")
            logger.info(f"   Model: {self.model}")

        except Exception as e:
            logger.error(f"❌ Prompt Evaluator 初始化失敗: {e}")
            raise

    async def evaluate_prompt(
        self,
        player_prompt: str,
        skill_name: str,
        skill_type: str,
        boss_name: str,
        boss_type: str
    ) -> float:
        """
        評估玩家的戰鬥 Prompt

        評分標準:
        1. 戰術運用 (50%): 是否提到環境利用、Boss 弱點、團隊配合等戰術
        2. 技能屬性對齊 (50%): Prompt 是否與技能屬性特徵相符

        Args:
            player_prompt: 玩家輸入的 Prompt
            skill_name: 使用的技能名稱
            skill_type: 技能屬性 (fire, water, ...)
            boss_name: Boss 名稱
            boss_type: Boss 屬性

        Returns:
            Prompt 倍率 (0.0, 0.1, 0.2, 0.3, 0.4, 0.5)
            - 0.0 = 0%: 完全無關或空白
            - 0.1 = 10%: 基本描述
            - 0.2 = 20%: 有提到技能/Boss
            - 0.3 = 30%: 有簡單戰術或屬性描述
            - 0.4 = 40%: 戰術明確且有屬性描述
            - 0.5 = 50%: 戰術精妙且完美契合技能屬性

        Fallback:
            如果 API 失敗，返回 0.1 (10% 預設獎勵)
        """
        # 空白或過短的 Prompt
        if not player_prompt or len(player_prompt.strip()) < 3:
            logger.info("⚠️  Prompt 為空或過短，返回 0% 獎勵")
            return 0.0

        try:
            # 獲取中文屬性名稱
            skill_type_chinese = settings.POKEMON_TYPES_CHINESE.get(skill_type, skill_type)
            boss_type_chinese = settings.POKEMON_TYPES_CHINESE.get(boss_type, boss_type)

            # 構建評分 Prompt
            evaluation_prompt = f"""
你是一個寶可夢戰鬥系統的評分專家。請評估玩家的戰鬥描述 (Prompt) 的創意度和有效性。

**戰鬥情境:**
- 玩家使用技能: {skill_name} (屬性: {skill_type_chinese}系)
- Boss: {boss_name} (屬性: {boss_type_chinese}系)
- 玩家的描述: "{player_prompt}"

**評分標準 (總分 100 分):**

1. **戰術運用 (50 分):**
   - 是否提到環境利用 (例如: 利用水池、高溫環境、岩石掩護等)
   - 是否針對 Boss 弱點 (例如: {boss_type_chinese}系怕什麼屬性)
   - 是否有團隊配合描述 (例如: 分散注意力、掩護隊友等)
   - 是否有具體行動細節

2. **技能屬性對齊 (50 分):**
   - 描述是否契合 {skill_type_chinese}系特徵
   - 例如:
     * 火系: 應提到火焰、高溫、燃燒、爆炸等
     * 水系: 應提到水流、波浪、急流、沖擊等
     * 電系: 應提到閃電、電流、電擊、麻痺等
     * 草系: 應提到藤蔓、種子、光合作用等
   - 是否生動描繪技能效果

**評分等級 (返回 0-5 的整數):**
- 0 分 (0-19): 完全無關、只有單詞、或空泛描述
- 1 分 (20-39): 基本描述，但無戰術或屬性特徵
- 2 分 (40-59): 有提到技能或 Boss，但不深入
- 3 分 (60-74): 有簡單戰術或明確的屬性描述
- 4 分 (75-89): 戰術明確且有生動的屬性描述
- 5 分 (90-100): 戰術精妙、屬性描述完美契合、有創意細節

**重要**: 只需回傳一個數字 (0, 1, 2, 3, 4, 或 5)，不要有其他文字。
"""

            logger.info(f"🤖 開始評估 Prompt: '{player_prompt[:50]}...'")
            logger.debug(f"   技能: {skill_name} ({skill_type_chinese}系)")
            logger.debug(f"   Boss: {boss_name} ({boss_type_chinese}系)")

            # 調用 Gemini API
            response = self.client.models.generate_content(
                model=self.model,
                contents=[evaluation_prompt]
            )

            # 解析評分
            score_text = response.text.strip()
            logger.debug(f"   AI 原始回應: {score_text}")

            # 提取數字
            try:
                score = int(score_text)
                # 確保在 0-5 範圍內
                score = max(0, min(5, score))

                # 轉換為倍率: 0→0.0, 1→0.1, 2→0.2, 3→0.3, 4→0.4, 5→0.5
                multiplier = score * 0.1

                logger.info(f"✅ Prompt 評分成功: {score}/5 → {int(multiplier*100)}% 獎勵")
                return multiplier

            except ValueError:
                logger.warning(f"⚠️  無法解析評分: {score_text}，使用預設 10%")
                return 0.1

        except Exception as e:
            logger.error(f"❌ Prompt 評估失敗: {e}")
            logger.info("   使用預設獎勵: 10%")
            # Fallback: 返回 10% 預設獎勵
            return 0.1


# 創建全局單例
_prompt_evaluator: Optional[PromptEvaluatorService] = None


def get_prompt_evaluator() -> PromptEvaluatorService:
    """獲取 Prompt Evaluator 單例"""
    global _prompt_evaluator
    if _prompt_evaluator is None:
        _prompt_evaluator = PromptEvaluatorService()
    return _prompt_evaluator
