"""
技能相關 API 路由
提供技能查詢功能
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
import logging

from app.services.skills_service import get_skills_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
async def get_skills(
    type: str = Query(..., description="寶可夢屬性，例如: fire, water, grass"),
    count: int = Query(12, ge=1, le=20, description="需要的技能數量")
):
    """
    根據屬性獲取技能列表

    Args:
        type: 寶可夢屬性 (fire, water, grass, electric, etc.)
        count: 需要的技能數量 (預設 12)

    Returns:
        {
            "success": true,
            "data": [
                {
                    "id": "skill_1",
                    "name": "火花",
                    "name_en": "Ember",
                    "type": "fire",
                    "category": "特殊",
                    "power": 40,
                    "accuracy": 100,
                    "pp": 25,
                    "description": "發射小火焰攻擊對手"
                },
                ...
            ],
            "count": 12
        }
    """
    try:
        skills_service = get_skills_service()

        # 獲取技能
        skills = skills_service.get_skills_by_type(type, count)

        if not skills:
            logger.warning(f"⚠️  找不到 {type} 屬性的技能")
            return {
                "success": False,
                "error": {
                    "code": "NO_SKILLS_FOUND",
                    "message": f"找不到 {type} 屬性的技能"
                }
            }

        logger.info(f"✅ 返回 {len(skills)} 個 {type} 屬性技能")
        return {
            "success": True,
            "data": skills,
            "count": len(skills)
        }

    except Exception as e:
        logger.error(f"❌ 獲取技能失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_available_types():
    """
    獲取所有可用的屬性列表

    Returns:
        {
            "success": true,
            "data": {
                "types": ["fire", "water", "grass", ...],
                "counts": {"fire": 50, "water": 45, ...}
            }
        }
    """
    try:
        skills_service = get_skills_service()

        if not skills_service._loaded:
            skills_service.load_skills()

        types = list(skills_service.skills_by_type.keys())
        counts = {t: len(skills) for t, skills in skills_service.skills_by_type.items()}

        return {
            "success": True,
            "data": {
                "types": sorted(types),
                "counts": counts,
                "total_skills": len(skills_service.skills)
            }
        }

    except Exception as e:
        logger.error(f"❌ 獲取屬性列表失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload")
async def reload_skills():
    """
    重新載入技能資料

    當更新 CSV 檔案後，可以調用此端點重新載入

    Returns:
        {
            "success": true,
            "message": "技能資料已重新載入",
            "count": 900
        }
    """
    try:
        skills_service = get_skills_service()
        skills_service.load_skills()

        return {
            "success": True,
            "message": "技能資料已重新載入",
            "count": len(skills_service.skills)
        }

    except Exception as e:
        logger.error(f"❌ 重新載入技能失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
