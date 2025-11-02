"""
WebSocket 連線管理器
處理連線、斷線、心跳檢測、訊息廣播
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional, Any
import asyncio
import logging
import time
import json

logger = logging.getLogger(__name__)


class Connection:
    """單一 WebSocket 連接"""

    def __init__(
        self,
        websocket: WebSocket,
        connection_id: str,
        room_code: str,
        user_data: Optional[Dict[str, Any]] = None
    ):
        self.websocket = websocket
        self.connection_id = connection_id
        self.room_code = room_code
        self.user_data = user_data or {}
        self.last_heartbeat = time.time()
        self.is_alive = True

    async def send_json(self, data: Dict[str, Any]):
        """發送 JSON 訊息"""
        try:
            await self.websocket.send_json(data)
        except Exception as e:
            logger.error(f"❌ 發送訊息失敗: {e}")
            self.is_alive = False

    async def send_text(self, message: str):
        """發送文字訊息"""
        try:
            await self.websocket.send_text(message)
        except Exception as e:
            logger.error(f"❌ 發送訊息失敗: {e}")
            self.is_alive = False

    def update_heartbeat(self):
        """更新心跳時間"""
        self.last_heartbeat = time.time()

    def is_timeout(self, timeout: int = 300) -> bool:
        """檢查是否逾時（預設 5 分鐘）"""
        return (time.time() - self.last_heartbeat) > timeout


class ConnectionManager:
    """
    WebSocket 連線管理器

    功能:
    - 管理所有 WebSocket 連線
    - 處理心跳檢測
    - 房間訊息廣播
    - 自動清理斷線連接
    """

    def __init__(self):
        # 所有活動連線 {connection_id: Connection}
        self.active_connections: Dict[str, Connection] = {}

        # 房間連線索引 {room_code: [connection_id, ...]}
        self.room_connections: Dict[str, List[str]] = {}

        # 心跳檢測任務
        self.heartbeat_task: Optional[asyncio.Task] = None

    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        room_code: str,
        user_data: Optional[Dict[str, Any]] = None
    ) -> Connection:
        """
        建立新連線

        Args:
            websocket: WebSocket 實例
            connection_id: 連線 ID（通常是 user_id 或 pokemon_id）
            room_code: 房間代碼
            user_data: 用戶資料（可選）

        Returns:
            Connection 實例
        """
        await websocket.accept()

        connection = Connection(websocket, connection_id, room_code, user_data)
        self.active_connections[connection_id] = connection

        # 加入房間索引
        if room_code not in self.room_connections:
            self.room_connections[room_code] = []
        self.room_connections[room_code].append(connection_id)

        logger.info(f"✅ WebSocket 連線建立: {connection_id} → 房間 {room_code}")
        logger.info(f"📊 當前連線數: {len(self.active_connections)}")

        # 啟動心跳檢測（如果尚未啟動）
        if self.heartbeat_task is None or self.heartbeat_task.done():
            self.heartbeat_task = asyncio.create_task(self._heartbeat_checker())

        return connection

    async def disconnect(self, connection_id: str):
        """
        斷開連線

        Args:
            connection_id: 連線 ID
        """
        if connection_id not in self.active_connections:
            return

        connection = self.active_connections[connection_id]
        room_code = connection.room_code

        # 從活動連線中移除
        del self.active_connections[connection_id]

        # 從房間索引中移除
        if room_code in self.room_connections:
            if connection_id in self.room_connections[room_code]:
                self.room_connections[room_code].remove(connection_id)

            # 如果房間沒有連線了，移除房間索引
            if len(self.room_connections[room_code]) == 0:
                del self.room_connections[room_code]
                logger.info(f"🗑️  房間 {room_code} 已清空")

        logger.info(f"❌ WebSocket 斷線: {connection_id} ← 房間 {room_code}")
        logger.info(f"📊 當前連線數: {len(self.active_connections)}")

    async def send_personal_message(self, connection_id: str, message: Dict[str, Any]):
        """
        發送個人訊息

        Args:
            connection_id: 連線 ID
            message: 訊息內容
        """
        if connection_id in self.active_connections:
            connection = self.active_connections[connection_id]
            await connection.send_json(message)

    async def broadcast_to_room(
        self,
        room_code: str,
        message: Dict[str, Any],
        exclude: Optional[List[str]] = None
    ):
        """
        向房間內所有連線廣播訊息

        Args:
            room_code: 房間代碼
            message: 訊息內容
            exclude: 排除的連線 ID 列表（可選）
        """
        if room_code not in self.room_connections:
            logger.warning(f"⚠️  房間 {room_code} 不存在")
            return

        exclude = exclude or []
        connection_ids = self.room_connections[room_code]

        # 並發發送訊息
        tasks = []
        for conn_id in connection_ids:
            if conn_id not in exclude and conn_id in self.active_connections:
                connection = self.active_connections[conn_id]
                tasks.append(connection.send_json(message))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.debug(f"📢 廣播訊息到房間 {room_code}: {len(tasks)} 個連線")

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """
        向所有連線廣播訊息

        Args:
            message: 訊息內容
        """
        tasks = [
            conn.send_json(message)
            for conn in self.active_connections.values()
        ]

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.debug(f"📢 廣播訊息到所有連線: {len(tasks)} 個")

    def get_room_connections(self, room_code: str) -> List[Connection]:
        """
        獲取房間內所有連線

        Args:
            room_code: 房間代碼

        Returns:
            Connection 列表
        """
        if room_code not in self.room_connections:
            return []

        return [
            self.active_connections[conn_id]
            for conn_id in self.room_connections[room_code]
            if conn_id in self.active_connections
        ]

    def get_room_count(self, room_code: str) -> int:
        """獲取房間內連線數量"""
        if room_code not in self.room_connections:
            return 0
        return len(self.room_connections[room_code])

    async def _heartbeat_checker(self):
        """
        背景任務：心跳檢測

        每 30 秒檢查一次，移除超時連線
        """
        logger.info("❤️  心跳檢測器啟動")

        while True:
            try:
                await asyncio.sleep(30)  # 每 30 秒檢查一次

                # 檢查所有連線
                timeout_connections = []
                for conn_id, connection in self.active_connections.items():
                    if connection.is_timeout(timeout=300):  # 5 分鐘超時
                        timeout_connections.append(conn_id)
                        logger.warning(f"⏰ 連線超時: {conn_id}")

                # 移除超時連線
                for conn_id in timeout_connections:
                    await self.disconnect(conn_id)

                # 發送心跳包給所有連線
                heartbeat_message = {
                    "type": "heartbeat",
                    "timestamp": time.time()
                }
                await self.broadcast_to_all(heartbeat_message)

            except Exception as e:
                logger.error(f"❌ 心跳檢測錯誤: {e}")

    def update_heartbeat(self, connection_id: str):
        """
        更新連線心跳

        Args:
            connection_id: 連線 ID
        """
        if connection_id in self.active_connections:
            self.active_connections[connection_id].update_heartbeat()


# 全局 ConnectionManager 實例
manager = ConnectionManager()
