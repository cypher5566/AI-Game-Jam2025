"""
AI 用量查詢 API
提供 AI 使用量統計和成本監控
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.database import get_service_db
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai-usage", tags=["AI Usage"])


class DailyUsage(BaseModel):
    """每日使用量模型"""
    date: str
    ai_generations_count: int
    estimated_cost_usd: float
    created_at: datetime
    updated_at: datetime


class UsageSummary(BaseModel):
    """使用量總結"""
    today_count: int
    today_cost: float
    month_count: int
    month_cost: float
    daily_limit: int
    monthly_budget: float
    remaining_today: int
    remaining_budget: float
    is_ai_enabled: bool


@router.get("/today", response_model=Optional[DailyUsage])
async def get_today_usage():
    """
    獲取今日 AI 使用量

    Returns:
        今日使用量統計
    """
    try:
        today = date.today().isoformat()
        supabase = get_service_db()

        result = supabase.table("ai_usage_tracking").select("*").eq("date", today).execute()

        if result.data and len(result.data) > 0:
            return result.data[0]
        else:
            # 如果沒有記錄，返回 0
            return {
                "date": today,
                "ai_generations_count": 0,
                "estimated_cost_usd": 0.0,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

    except Exception as e:
        logger.error(f"獲取今日使用量失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[DailyUsage])
async def get_usage_history(days: int = 7):
    """
    獲取歷史使用量

    Args:
        days: 查詢天數（預設 7 天）

    Returns:
        歷史使用量列表
    """
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()
        supabase = get_service_db()

        result = supabase.table("ai_usage_tracking") \
            .select("*") \
            .gte("date", start_date) \
            .order("date", desc=True) \
            .execute()

        return result.data or []

    except Exception as e:
        logger.error(f"獲取歷史使用量失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=UsageSummary)
async def get_usage_summary():
    """
    獲取使用量總結

    Returns:
        完整的使用量統計和限額信息
    """
    try:
        today = date.today().isoformat()
        month_start = date.today().replace(day=1).isoformat()
        supabase = get_service_db()

        # 查詢今日使用量
        today_result = supabase.table("ai_usage_tracking") \
            .select("*") \
            .eq("date", today) \
            .execute()

        today_data = today_result.data[0] if today_result.data else {
            "ai_generations_count": 0,
            "estimated_cost_usd": 0.0
        }

        # 查詢本月總使用量
        month_result = supabase.table("ai_usage_tracking") \
            .select("ai_generations_count, estimated_cost_usd") \
            .gte("date", month_start) \
            .execute()

        month_count = sum(row["ai_generations_count"] for row in month_result.data) if month_result.data else 0
        month_cost = sum(float(row["estimated_cost_usd"]) for row in month_result.data) if month_result.data else 0.0

        # 計算剩餘額度
        remaining_today = max(0, settings.max_daily_ai_generations - today_data["ai_generations_count"])
        remaining_budget = max(0, settings.max_monthly_budget_usd - month_cost)

        return UsageSummary(
            today_count=today_data["ai_generations_count"],
            today_cost=float(today_data["estimated_cost_usd"]),
            month_count=month_count,
            month_cost=month_cost,
            daily_limit=settings.max_daily_ai_generations,
            monthly_budget=settings.max_monthly_budget_usd,
            remaining_today=remaining_today,
            remaining_budget=remaining_budget,
            is_ai_enabled=settings.enable_ai_generation
        )

    except Exception as e:
        logger.error(f"獲取使用量總結失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_ai_config():
    """
    獲取 AI 配置信息

    Returns:
        AI 相關配置
    """
    return {
        "enable_ai_generation": settings.enable_ai_generation,
        "max_daily_ai_generations": settings.max_daily_ai_generations,
        "max_monthly_budget_usd": settings.max_monthly_budget_usd,
        "cost_per_image": 0.039
    }
