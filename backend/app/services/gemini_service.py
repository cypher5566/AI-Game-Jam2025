"""
Gemini AI 服務
負責使用 Google Gemini API 進行圖片分析和生成
"""

import google.generativeai as genai
from PIL import Image
import io
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AI 服務類"""

    def __init__(self):
        """初始化 Gemini API"""
        try:
            genai.configure(api_key=settings.gemini_api_key)
            # 使用 Gemini 2.5 Flash 模型
            self.vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            # TODO: Image generation 可能需要不同的模型或 API
            logger.info("✅ Gemini API 初始化成功")
        except Exception as e:
            logger.error(f"❌ Gemini API 初始化失敗: {e}")
            raise

    async def detect_pokemon_type(self, image_bytes: bytes) -> str:
        """
        使用 Vision API 判斷圖片中的寶可夢屬性

        Args:
            image_bytes: 圖片位元組

        Returns:
            屬性英文名稱 (例如: "fire", "water", ...)

        Fallback:
            如果 API 失敗，返回 "normal" (一般屬性)
        """
        try:
            # 載入圖片
            image = Image.open(io.BytesIO(image_bytes))

            # 構建 prompt
            prompt = f"""
請分析這張圖片，判斷它最像哪一種寶可夢屬性。

可選的屬性（只能選一種）:
- normal (一般)
- fire (火)
- water (水)
- electric (電)
- grass (草)
- ice (冰)
- fighting (格鬥)
- poison (毒)
- ground (地面)
- flying (飛行)
- psychic (超能力)
- bug (蟲)
- rock (岩石)
- ghost (幽靈)
- dragon (龍)
- dark (惡)
- steel (鋼)
- fairy (妖精)

請根據圖片中的：
1. 顏色 (例如：紅色/橙色→fire，藍色→water)
2. 形狀和特徵 (例如：翅膀→flying，角→dragon)
3. 整體氣質

**只需回傳一個英文單字，例如: fire**
"""

            # 調用 Gemini Vision API
            response = self.vision_model.generate_content([prompt, image])

            # 解析結果
            detected_type = response.text.strip().lower()

            # 驗證返回的屬性是否合法
            if detected_type in settings.POKEMON_TYPES:
                logger.info(f"✅ AI 判斷屬性成功: {detected_type}")
                return detected_type
            else:
                logger.warning(f"⚠️  AI 返回未知屬性: {detected_type}，使用 normal")
                return "normal"

        except Exception as e:
            logger.error(f"❌ AI 屬性判斷失敗: {e}")
            # Fallback: 返回一般屬性
            return "normal"

    async def generate_back_view(self, front_image_bytes: bytes, pokemon_type: str) -> Optional[bytes]:
        """
        生成寶可夢背面圖片

        Args:
            front_image_bytes: 正面圖片
            pokemon_type: 寶可夢屬性

        Returns:
            背面圖片 bytes，如果失敗返回 None

        Note:
            目前 Gemini API 可能沒有直接的圖片生成功能
            這裡提供架構，實際實作可能需要：
            1. 使用其他 API (如 DALL-E, Stable Diffusion)
            2. 或使用簡單的鏡像作為 fallback
        """
        try:
            # TODO: 實作真正的 AI 圖片生成
            # 目前 Gemini 2.5 Flash 主要是文字和分析，沒有圖片生成
            # 可能的選項:
            # 1. 使用 Imagen (Google 的圖片生成模型) - 需要額外配置
            # 2. 使用 OpenAI DALL-E
            # 3. 使用 Stable Diffusion

            logger.warning("⚠️  AI 圖片生成尚未實作，返回 None (將使用 fallback)")
            return None

        except Exception as e:
            logger.error(f"❌ AI 背面生成失敗: {e}")
            return None

    async def generate_back_view_with_prompt(self, pokemon_type: str) -> Optional[bytes]:
        """
        使用純文字 prompt 生成背面圖片
        這個方法預留給未來整合圖片生成 API

        Args:
            pokemon_type: 寶可夢屬性

        Returns:
            生成的圖片 bytes
        """
        try:
            type_chinese = settings.POKEMON_TYPES_CHINESE.get(pokemon_type, "一般")

            prompt = f"""
Generate a 32x32 pixel art style image of the back view of a {pokemon_type}-type pokemon.

Style requirements:
- Pixel art aesthetic
- Back view (showing the pokemon from behind)
- {type_chinese} type characteristics
- Simple and clear design
- Cute and friendly appearance
"""

            # TODO: 整合圖片生成 API
            logger.info(f"📝 生成 prompt: {prompt}")
            return None

        except Exception as e:
            logger.error(f"❌ Prompt 生成失敗: {e}")
            return None


# 創建全局單例
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """獲取 Gemini 服務單例"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
