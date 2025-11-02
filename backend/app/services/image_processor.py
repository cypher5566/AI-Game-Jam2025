"""
圖片處理服務
負責圖片上傳、像素化等處理
"""

from PIL import Image
import io
import os
import uuid
import base64
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class ImageProcessor:
    """圖片處理服務類"""

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
    PIXEL_SIZE = 32  # 32x32 像素

    @classmethod
    async def save_upload(cls, file: UploadFile) -> Tuple[str, str]:
        """
        儲存上傳的圖片

        Args:
            file: 上傳的檔案

        Returns:
            (upload_id, file_path): 上傳 ID 和檔案路徑

        Raises:
            HTTPException: 如果檔案格式或大小不合法
        """
        # 驗證檔案格式
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if file_ext not in cls.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"不支援的檔案格式。允許的格式: {', '.join(cls.ALLOWED_EXTENSIONS)}"
            )

        # 讀取檔案內容
        content = await file.read()

        # 檢查檔案大小
        if len(content) > settings.max_upload_size:
            raise HTTPException(
                status_code=400,
                detail=f"檔案過大。最大允許 {settings.max_upload_size / 1024 / 1024:.1f}MB"
            )

        # 生成唯一的 upload_id
        upload_id = str(uuid.uuid4())
        file_path = os.path.join(settings.upload_dir, f"{upload_id}{file_ext}")

        # 儲存檔案
        try:
            with open(file_path, "wb") as f:
                f.write(content)
            logger.info(f"✅ 圖片上傳成功: {upload_id}")
            return upload_id, file_path
        except Exception as e:
            logger.error(f"❌ 儲存圖片失敗: {e}")
            raise HTTPException(status_code=500, detail="儲存圖片失敗")

    @classmethod
    async def pixelate(cls, image_path: str) -> bytes:
        """
        像素化處理圖片 (32x32)

        Args:
            image_path: 圖片檔案路徑

        Returns:
            處理後的圖片 bytes

        Raises:
            HTTPException: 如果處理失敗
        """
        try:
            # 開啟圖片
            with Image.open(image_path) as img:
                # 轉換為 RGB（處理 PNG 透明背景）
                if img.mode in ("RGBA", "LA", "P"):
                    # 創建白色背景
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                    img = background
                elif img.mode != "RGB":
                    img = img.convert("RGB")

                # 第一步：縮小到 32x32 (使用 NEAREST 保持像素風格)
                img_small = img.resize((cls.PIXEL_SIZE, cls.PIXEL_SIZE), Image.Resampling.NEAREST)

                # 可選：再放大回更大的尺寸 (例如 128x128) 以便顯示
                # 這樣可以保持像素化效果同時讓圖片更清晰
                display_size = 128
                img_pixelated = img_small.resize((display_size, display_size), Image.Resampling.NEAREST)

                # 轉換為 bytes
                output = io.BytesIO()
                img_pixelated.save(output, format="PNG")
                output.seek(0)

                logger.info(f"✅ 圖片像素化成功: {cls.PIXEL_SIZE}x{cls.PIXEL_SIZE}")
                return output.read()

        except Exception as e:
            logger.error(f"❌ 圖片像素化失敗: {e}")
            raise HTTPException(status_code=500, detail=f"圖片處理失敗: {str(e)}")

    @classmethod
    def to_base64(cls, image_bytes: bytes) -> str:
        """
        將圖片 bytes 轉換為 base64 字串

        Args:
            image_bytes: 圖片位元組

        Returns:
            base64 編碼的字串 (data URI 格式)
        """
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    @classmethod
    def mirror_image(cls, image_bytes: bytes) -> bytes:
        """
        鏡像翻轉圖片 (作為背面生成的 fallback)

        Args:
            image_bytes: 圖片位元組

        Returns:
            鏡像後的圖片 bytes
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            mirrored = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

            output = io.BytesIO()
            mirrored.save(output, format="PNG")
            output.seek(0)

            return output.read()
        except Exception as e:
            logger.error(f"❌ 圖片鏡像失敗: {e}")
            # 如果鏡像也失敗，直接返回原圖
            return image_bytes

    @classmethod
    async def cleanup_upload(cls, file_path: str):
        """
        清理暫存的上傳檔案

        Args:
            file_path: 要刪除的檔案路徑
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"🗑️  清理暫存檔案: {file_path}")
        except Exception as e:
            logger.warning(f"⚠️  清理檔案失敗: {e}")
