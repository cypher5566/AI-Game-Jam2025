"""
API 路由模組
"""

from .pokemon import router as pokemon_router
from .battle import router as battle_router
from .rooms import router as rooms_router

__all__ = [
    "pokemon_router",
    "battle_router",
    "rooms_router",
]
