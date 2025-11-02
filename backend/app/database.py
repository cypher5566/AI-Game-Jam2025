"""
Supabase 資料庫連接模組
"""

from supabase import create_client, Client
from app.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Database:
    """Supabase 資料庫管理類"""

    _instance: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """獲取 Supabase 客戶端（單例模式）"""
        if cls._instance is None:
            try:
                cls._instance = create_client(
                    settings.supabase_url,
                    settings.supabase_key
                )
                logger.info("✅ Supabase 連接成功")
            except Exception as e:
                logger.error(f"❌ Supabase 連接失敗: {e}")
                raise

        return cls._instance

    @classmethod
    def get_service_client(cls) -> Client:
        """獲取 Supabase 服務端客戶端（具有完整權限）"""
        try:
            return create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        except Exception as e:
            logger.error(f"❌ Supabase 服務端連接失敗: {e}")
            raise


# 便利函數
def get_db() -> Client:
    """獲取資料庫客戶端"""
    return Database.get_client()


def get_service_db() -> Client:
    """獲取服務端資料庫客戶端"""
    return Database.get_service_client()
