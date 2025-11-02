"""
Gemini AI 服務
負責使用 Google Gemini API 進行圖片分析和生成

使用新的 Google GenAI SDK (google-genai)
- Vision API: gemini-2.5-flash
- Image Generation: gemini-2.5-flash-image (Nano Banana 🍌)
"""

from google import genai
from google.genai import types
from PIL import Image
import io
import logging
from typing import Optional
import os

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini AI 服務類"""

    def __init__(self):
        """初始化 Gemini API 客戶端"""
        try:
            # 使用新的 SDK - 需要顯式創建 Client
            api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY 未設置")

            self.client = genai.Client(api_key=api_key)

            # 模型名稱
            self.vision_model = 'gemini-2.5-flash'  # 用於屬性判斷
            self.image_model = 'gemini-2.5-flash-image'  # 用於圖片生成 (Nano Banana)

            logger.info("✅ Gemini API 初始化成功")
            logger.info(f"   Vision Model: {self.vision_model}")
            logger.info(f"   Image Model: {self.image_model}")

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

            # 調用 Gemini Vision API (新 SDK)
            response = self.client.models.generate_content(
                model=self.vision_model,
                contents=[prompt, image]
            )

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
        生成寶可夢背面圖片 (使用 Gemini 2.5 Flash Image - Nano Banana 🍌)

        Args:
            front_image_bytes: 正面圖片 (32x32 像素化後的圖片)
            pokemon_type: 寶可夢屬性

        Returns:
            背面圖片 bytes，如果失敗返回 None

        實作方式:
            1. 使用 Gemini 2.5 Flash Image 進行圖片生成
            2. Prompt 要求生成背面視角
            3. 保持像素風格
        """
        try:
            # 載入正面圖片
            front_image = Image.open(io.BytesIO(front_image_bytes))

            # 獲取中文屬性名稱
            type_chinese = settings.POKEMON_TYPES_CHINESE.get(pokemon_type, "一般")

            # 構建 prompt - 要求生成背面圖片
            prompt = f"""
Based on this front-view image, generate the BACK VIEW (from behind) of this pokemon character.

Requirements:
- Show the pokemon from BEHIND (back view, not front)
- Maintain the EXACT same pixel art style (32x32 pixel aesthetic)
- Keep the same color scheme and {pokemon_type} type characteristics ({type_chinese}系)
- Simple and clear design
- Same size and proportions
- The pokemon should be facing AWAY from the viewer

Important: This is a back sprite for a pokemon game, similar to Pokemon games where you see your pokemon from behind in battle.
"""

            logger.info(f"🎨 開始生成背面圖片 (使用 {self.image_model})...")
            logger.debug(f"   屬性: {pokemon_type} ({type_chinese})")

            # 調用 Gemini 2.5 Flash Image API
            response = self.client.models.generate_content(
                model=self.image_model,
                contents=[prompt, front_image],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],  # 只返回圖片
                    image_config=types.ImageConfig(
                        aspect_ratio="1:1"  # 正方形圖片
                    )
                )
            )

            # 提取生成的圖片
            for part in response.parts:
                if part.inline_data is not None:
                    # 獲取圖片數據
                    generated_image_bytes = part.inline_data.data

                    logger.info("✅ AI 背面圖片生成成功")
                    logger.debug(f"   圖片大小: {len(generated_image_bytes)} bytes")

                    return generated_image_bytes

            # 如果沒有找到圖片數據
            logger.warning("⚠️  API 返回成功但沒有圖片數據")
            return None

        except Exception as e:
            logger.error(f"❌ AI 背面生成失敗: {e}")
            logger.info("   將使用 fallback 機制（鏡像翻轉）")
            return None

    async def generate_back_view_with_prompt_only(self, pokemon_type: str) -> Optional[bytes]:
        """
        使用純文字 prompt 生成背面圖片（不需要正面圖片）

        這個方法用於從頭生成寶可夢背面圖，不依賴正面圖片

        Args:
            pokemon_type: 寶可夢屬性

        Returns:
            生成的圖片 bytes
        """
        try:
            type_chinese = settings.POKEMON_TYPES_CHINESE.get(pokemon_type, "一般")

            prompt = f"""
Generate a 32x32 pixel art style image of the BACK VIEW (from behind) of a {pokemon_type}-type pokemon.

Style requirements:
- Pixel art aesthetic (像素風格)
- Back view (showing the pokemon from behind)
- {type_chinese} type characteristics ({pokemon_type} 系寶可夢特徵)
- Simple and clear design
- Cute and friendly appearance
- Square format (1:1 aspect ratio)

The pokemon should be:
- Facing AWAY from the viewer
- Showing its back
- In the style of classic Pokemon game back sprites
"""

            logger.info(f"🎨 開始生成背面圖片 (純文字 prompt)...")

            # 調用 Gemini 2.5 Flash Image API
            response = self.client.models.generate_content(
                model=self.image_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                    image_config=types.ImageConfig(
                        aspect_ratio="1:1"
                    )
                )
            )

            # 提取生成的圖片
            for part in response.parts:
                if part.inline_data is not None:
                    generated_image_bytes = part.inline_data.data
                    logger.info("✅ AI 背面圖片生成成功 (純文字)")
                    return generated_image_bytes

            logger.warning("⚠️  API 返回成功但沒有圖片數據")
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
