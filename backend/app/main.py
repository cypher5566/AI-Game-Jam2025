"""
FastAPI 主應用程式
GenPoke Backend - AI Game Jam 2025
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.config import settings

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
from app.routers import pokemon_router
from app.routers import skills

app.include_router(pokemon_router, prefix="/api/v1/pokemon", tags=["Pokemon"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["Skills"])

# TODO: 在後續階段會註冊其他路由
# from app.routers import battle, rooms
# app.include_router(battle.router, prefix="/api/v1/battle", tags=["Battle"])
# app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["Rooms"])


# ===== 應用程式啟動 =====

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )
