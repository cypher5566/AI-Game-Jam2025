"""
FastAPI 主應用程式
GenPoke Backend - AI Game Jam 2025
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import sys

from app.config import settings

logger = logging.getLogger(__name__)

# 創建 FastAPI 應用
app = FastAPI(
    title="GenPoke API",
    description="GenPoke 後端 API - AI Game Jam 2025",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 啟動驗證 =====

@app.on_event("startup")
async def validate_environment():
    """應用啟動時驗證環境變數"""
    logger.info("🔍 驗證環境變數配置...")

    missing_vars = []
    warnings = []

    # 必要環境變數檢查
    required_vars = {
        "supabase_url": "SUPABASE_URL",
        "supabase_key": "SUPABASE_KEY",
        "supabase_service_key": "SUPABASE_SERVICE_KEY",
        "gemini_api_key": "GEMINI_API_KEY",
        "secret_key": "SECRET_KEY"
    }

    for attr, var_name in required_vars.items():
        value = getattr(settings, attr, None)
        if not value or value == "your_secret_key_change_in_production":
            missing_vars.append(var_name)

    # 檢查上傳目錄
    import os
    if not os.path.exists(settings.upload_dir):
        try:
            os.makedirs(settings.upload_dir, exist_ok=True)
            logger.info(f"✅ 創建上傳目錄: {settings.upload_dir}")
        except Exception as e:
            warnings.append(f"無法創建上傳目錄 {settings.upload_dir}: {e}")

    # 報告結果
    if missing_vars:
        error_msg = f"❌ 缺少必要的環境變數: {', '.join(missing_vars)}"
        logger.error(error_msg)
        logger.error("請檢查 .env 檔案配置")
        sys.exit(1)

    if warnings:
        for warning in warnings:
            logger.warning(f"⚠️  {warning}")

    logger.info("✅ 環境變數驗證通過")
    logger.info(f"📍 環境: {settings.environment}")
    logger.info(f"🌐 允許的來源: {', '.join(settings.allowed_origins_list)}")


# ===== 根路由和健康檢查 =====

@app.get("/")
async def root():
    """根路由"""
    return {
        "message": "GenPoke API - AI Game Jam 2025",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0"
    }


# ===== 基礎資訊端點 =====

@app.get("/api/v1/types")
async def get_pokemon_types():
    """獲取所有寶可夢屬性列表"""
    return {
        "success": True,
        "data": {
            "types": [
                {
                    "id": type_id,
                    "name": settings.POKEMON_TYPES_CHINESE[type_id],
                    "name_en": type_id
                }
                for type_id in settings.POKEMON_TYPES
            ],
            "total": len(settings.POKEMON_TYPES)
        }
    }


# ===== 全局錯誤處理 =====

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局異常處理器"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.environment == "development" else "伺服器錯誤"
            }
        }
    )


# ===== 路由註冊 =====
from app.routers import pokemon_router, battle_router, rooms_router
from app.routers import skills, ai_usage

app.include_router(pokemon_router, prefix="/api/v1/pokemon", tags=["Pokemon"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["Skills"])
app.include_router(battle_router, prefix="/api/v1/battle", tags=["Battle"])
app.include_router(rooms_router, prefix="/api/v1/rooms", tags=["Rooms"])
app.include_router(ai_usage.router, tags=["AI Usage"])


# ===== 應用程式啟動 =====

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )
