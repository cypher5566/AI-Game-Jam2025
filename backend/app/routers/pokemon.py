"""
Pokemon 相關 API 路由
處理圖片上傳、像素化、AI 屬性判斷等
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging
import os
import asyncio

from app.services.image_processor import ImageProcessor
from app.services.gemini_service import get_gemini_service
from app.services.skills_service import SkillsService
from app.database import get_service_db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload_pokemon_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    上傳寶可夢圖片

    Args:
        file: 圖片檔案

    Returns:
        {
            "success": true,
            "upload_id": "uuid",
            "message": "圖片上傳成功，正在處理..."
        }
    """
    try:
        # 儲存上傳的圖片
        upload_id, file_path = await ImageProcessor.save_upload(file)

        # 在資料庫建立處理記錄
        db = get_service_db()
        db.table("upload_queue").insert({
            "upload_id": upload_id,
            "file_path": file_path,
            "status": "processing",
            "processed_data": None,
            "error_message": None
        }).execute()

        # 在背景處理圖片
        background_tasks.add_task(process_pokemon_image, upload_id, file_path)

        return {
            "success": True,
            "upload_id": upload_id,
            "message": "圖片上傳成功，正在處理..."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ 上傳失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_pokemon_image(upload_id: str, file_path: str):
    """
    背景任務：處理寶可夢圖片

    1. 像素化正面圖
    2. AI 判斷屬性
    3. 生成/鏡像背面圖
    """
    db = get_service_db()

    try:
        logger.info(f"🔄 開始處理圖片: {upload_id}")

        # 1. 像素化正面圖
        front_image_bytes = await ImageProcessor.pixelate(file_path)
        front_image_b64 = ImageProcessor.to_base64(front_image_bytes)

        # 2. AI 判斷屬性
        gemini = get_gemini_service()
        pokemon_type = await gemini.detect_pokemon_type(front_image_bytes)
        type_chinese = settings.POKEMON_TYPES_CHINESE.get(pokemon_type, "未知")

        # 3. 嘗試生成背面圖
        back_image_bytes = await gemini.generate_back_view(front_image_bytes, pokemon_type)

        if back_image_bytes is None:
            # Fallback: 使用鏡像
            logger.info(f"📸 使用鏡像作為背面圖: {upload_id}")
            back_image_bytes = ImageProcessor.mirror_image(front_image_bytes)

        back_image_b64 = ImageProcessor.to_base64(back_image_bytes)

        # 4. 根據屬性選擇 12 個技能
        skills_service = SkillsService()
        skills = skills_service.get_skills_by_type(pokemon_type, count=12)

        logger.info(f"🎯 為 {pokemon_type} 屬性選擇了 {len(skills)} 個技能")

        # 更新資料庫狀態為完成
        db.table("upload_queue").update({
            "status": "completed",
            "processed_data": {
                "front_image": front_image_b64,
                "back_image": back_image_b64,
                "type": pokemon_type,
                "type_chinese": type_chinese,
                "skills": skills
            }
        }).eq("upload_id", upload_id).execute()

        logger.info(f"✅ 圖片處理完成: {upload_id} (屬性: {pokemon_type})")

        # 清理原始上傳檔案
        await ImageProcessor.cleanup_upload(file_path)

    except Exception as e:
        logger.error(f"❌ 圖片處理失敗: {upload_id} - {e}")
        # 更新資料庫狀態為失敗
        db.table("upload_queue").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("upload_id", upload_id).execute()


@router.get("/process/{upload_id}")
async def get_processing_status(upload_id: str):
    """
    獲取圖片處理狀態和結果

    Args:
        upload_id: 上傳 ID

    Returns:
        {
            "success": true,
            "status": "completed",  // processing, completed, failed
            "data": {
                "front_image": "data:image/png;base64,...",
                "back_image": "data:image/png;base64,...",
                "type": "fire",
                "type_chinese": "火",
                "skills": [
                    {
                        "id": 52,
                        "name": "火焰放射",
                        "name_en": "Flamethrower",
                        "type": "fire",
                        "power": 90,
                        "accuracy": 100,
                        "pp": 15,
                        "description": "..."
                    },
                    // ... 11 more skills
                ]
            }
        }
    """
    try:
        db = get_service_db()

        # 從資料庫查詢處理狀態
        result = db.table("upload_queue").select("*").eq("upload_id", upload_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="找不到此上傳記錄")

        record = result.data[0]
        status = record["status"]

        if status == "failed":
            return {
                "success": False,
                "status": "failed",
                "error": {
                    "code": "PROCESSING_FAILED",
                    "message": record.get("error_message", "處理失敗")
                }
            }

        if status == "processing":
            return {
                "success": True,
                "status": "processing",
                "message": "正在處理中，請稍候..."
            }

        # completed
        processed_data = record.get("processed_data", {})
        return {
            "success": True,
            "status": "completed",
            "data": {
                "front_image": processed_data.get("front_image"),
                "back_image": processed_data.get("back_image"),
                "type": processed_data.get("type"),
                "type_chinese": processed_data.get("type_chinese"),
                "skills": processed_data.get("skills", [])
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ 查詢處理狀態失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_pokemon(
    name: str,
    type: str,
    front_image: str,
    back_image: str,
    user_id: str = None
):
    """
    創建寶可夢記錄到資料庫

    Args:
        name: 寶可夢名稱
        type: 屬性
        front_image: 正面圖 (base64)
        back_image: 背面圖 (base64)
        user_id: 用戶 ID (可選)

    Returns:
        {
            "success": true,
            "data": {
                "id": "uuid",
                "name": "...",
                ...
            }
        }
    """
    try:
        db = get_service_db()

        # 插入資料
        result = db.table("pokemon").insert({
            "user_id": user_id,
            "name": name,
            "type": type,
            "front_image_url": front_image,
            "back_image_url": back_image,
            "stats": {
                "hp": 100,
                "attack": 50,
                "defense": 50,
                "speed": 50,
                "level": 5
            }
        }).execute()

        if result.data:
            pokemon = result.data[0]
            logger.info(f"✅ 寶可夢創建成功: {pokemon['id']}")
            return {
                "success": True,
                "data": pokemon
            }
        else:
            raise HTTPException(status_code=500, detail="創建失敗")

    except Exception as e:
        logger.error(f"❌ 創建寶可夢失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pokemon_id}")
async def get_pokemon(pokemon_id: str):
    """
    獲取寶可夢資料

    Args:
        pokemon_id: 寶可夢 ID

    Returns:
        {
            "success": true,
            "data": Pokemon 對象
        }
    """
    try:
        db = get_service_db()

        result = db.table("pokemon").select("*").eq("id", pokemon_id).execute()

        if result.data and len(result.data) > 0:
            return {
                "success": True,
                "data": result.data[0]
            }
        else:
            raise HTTPException(status_code=404, detail="找不到此寶可夢")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ 獲取寶可夢失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
