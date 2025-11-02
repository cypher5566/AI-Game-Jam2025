"""
配置管理模組
使用 pydantic-settings 管理環境變數
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, ClassVar, Dict
import os


class Settings(BaseSettings):
    """應用程式配置"""

    # Supabase 配置
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_KEY")

    # Google Gemini AI 配置
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")

    # Google Sheets 配置
    google_sheets_credentials_file: str = Field(
        default="credentials.json",
        env="GOOGLE_SHEETS_CREDENTIALS_FILE"
    )
    pokemon_moves_sheet_id: str = Field(
        ...,
        env="POKEMON_MOVES_SHEET_ID"
    )

    # 服務器配置
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    environment: str = Field(default="development", env="ENVIRONMENT")

    # CORS 配置
    allowed_origins: str = Field(
        default="http://localhost:8081,http://localhost:19006",
        env="ALLOWED_ORIGINS"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """將 CORS origins 字串轉換為列表"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    # 圖片儲存配置
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_upload_size: int = Field(default=10485760, env="MAX_UPLOAD_SIZE")  # 10MB

    # WebSocket 配置
    ws_heartbeat_interval: int = Field(default=30, env="WS_HEARTBEAT_INTERVAL")
    ws_timeout: int = Field(default=300, env="WS_TIMEOUT")

    # Boss 戰配置
    boss_base_hp: int = Field(default=1000, env="BOSS_BASE_HP")
    boss_hp_per_player: int = Field(default=500, env="BOSS_HP_PER_PLAYER")
    max_players_per_room: int = Field(default=4, env="MAX_PLAYERS_PER_ROOM")

    # 安全配置
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")

    # 18種寶可夢屬性
    POKEMON_TYPES: ClassVar[List[str]] = [
        "normal", "fire", "water", "electric", "grass", "ice",
        "fighting", "poison", "ground", "flying", "psychic", "bug",
        "rock", "ghost", "dragon", "dark", "steel", "fairy"
    ]

    POKEMON_TYPES_CHINESE: ClassVar[Dict[str, str]] = {
        "normal": "一般",
        "fire": "火",
        "water": "水",
        "electric": "電",
        "grass": "草",
        "ice": "冰",
        "fighting": "格鬥",
        "poison": "毒",
        "ground": "地面",
        "flying": "飛行",
        "psychic": "超能力",
        "bug": "蟲",
        "rock": "岩石",
        "ghost": "幽靈",
        "dragon": "龍",
        "dark": "惡",
        "steel": "鋼",
        "fairy": "妖精"
    }

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


# 創建全局設定實例
settings = Settings(_env_file=".env", _env_file_encoding="utf-8")


# 確保上傳目錄存在
os.makedirs(settings.upload_dir, exist_ok=True)
