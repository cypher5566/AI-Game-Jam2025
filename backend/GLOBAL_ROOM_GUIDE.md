# 全域房間模式 - 前端整合指南

> 更新時間: 2025-11-02
> 狀態: ✅ 完成

---

## 📋 概述

為了簡化玩家體驗，後端已實作**單一全域房間模式**：

### 核心特性
- ✅ **單一房間**: 所有玩家都在同一個 `GLOBAL` 房間中
- ✅ **隨時加入**: 玩家可以在任何時間加入，包括戰鬥進行中
- ✅ **單人模式**: 一個人也可以獨自對戰 Boss
- ✅ **自動準備**: 加入後自動開始戰鬥，無需點擊「準備」按鈕
- ✅ **自動命名**: Pokemon 名稱自動生成（如：火寶、水寶、草寶）
- ✅ **無房間限制**: 支援最多 99 名玩家同時遊玩

---

## 🎮 玩家流程

### 前端流程（簡化版）

```
1. 玩家輸入名稱（顯示名稱）
   ↓
2. 玩家上傳圖片
   ↓
3. 後端處理圖片 → 判斷屬性 → 自動創建 Pokemon（名稱：火寶/水寶/etc）
   ↓
4. 前端自動連接 WebSocket: ws://api/rooms/ws/GLOBAL
   ↓
5. 進入戰鬥（立即開始，無需等待）
```

### 與原始流程的差異

| 項目 | 原始多房間模式 | 新的全域房間模式 |
|------|--------------|---------------|
| 房間代碼 | 需要輸入/創建 8 位代碼 | 固定使用 `GLOBAL` |
| 最大玩家數 | 2-4 人 | 99 人（實際上無限制） |
| 準備狀態 | 需要所有玩家點擊「準備」 | 自動準備，加入即開始 |
| 單人遊玩 | 不支援 | ✅ 支援 |
| 戰鬥中加入 | 不允許 | ✅ 允許，可看到當前狀態 |
| Pokemon 命名 | 玩家輸入 | 自動生成（火寶、水寶...） |

---

## 📡 API 變更

### 1. Pokemon 創建 API

**端點**: `POST /api/v1/pokemon/create`

**變更**: `name` 參數現在是**可選的**

```javascript
// 舊版（需要提供名稱）
POST /api/v1/pokemon/create
Body: {
  name: "小火龍",        // 必填
  type: "fire",
  front_image: "data:image/png;base64,...",
  back_image: "data:image/png;base64,..."
}

// 新版（名稱可選，會自動生成）
POST /api/v1/pokemon/create
Body: {
  type: "fire",          // 必填
  front_image: "data:image/png;base64,...",
  back_image: "data:image/png;base64,..."
  // name 省略 → 自動生成 "火寶"
}
```

**自動生成規則**:
```javascript
屬性 → 名稱
fire → 火寶
water → 水寶
grass → 草寶
electric → 電寶
psychic → 超能寶
dragon → 龍寶
// ... 以此類推（18 種屬性）
```

---

### 2. WebSocket 連接

**端點**: `ws://backend/api/v1/rooms/ws/GLOBAL`

**變更**: 房間代碼固定為 `GLOBAL`

```javascript
// 舊版（需要動態房間代碼）
const roomCode = "ABCD1234";  // 從用戶輸入或 API 獲取
const ws = new WebSocket(
  `ws://localhost:8000/api/v1/rooms/ws/${roomCode}?pokemon_id=${pokemonId}&player_name=${playerName}`
);

// 新版（固定使用 GLOBAL）
const ws = new WebSocket(
  `ws://localhost:8000/api/v1/rooms/ws/GLOBAL?pokemon_id=${pokemonId}&player_name=${playerName}`
);
```

---

### 3. 房間狀態查詢

**端點**: `GET /api/v1/rooms/GLOBAL`

```bash
curl http://localhost:8000/api/v1/rooms/GLOBAL
```

**響應**:
```json
{
  "success": true,
  "data": {
    "room_code": "GLOBAL",
    "status": "battle",         // waiting, battle, finished
    "max_players": 99,
    "current_players": 3,
    "members": [
      {
        "player_name": "Player1",
        "pokemon": {
          "name": "火寶",
          "type": "fire",
          ...
        },
        "current_hp": 85,
        "max_hp": 100,
        "is_ready": true         // GLOBAL 房間永遠是 true
      },
      // ... 其他玩家
    ],
    "boss": {
      "hp": 450,
      "max_hp": 1000
    },
    "current_turn": 5,
    "turn_timer": {
      "remaining_time": 18.5,
      "duration": 30,
      "is_active": true
    }
  }
}
```

---

## 🔧 前端實作範例

### React Native / Expo 完整範例

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Image } from 'react-native';

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

export default function GlobalRoomGame() {
  const [playerName, setPlayerName] = useState('');
  const [pokemonId, setPokemonId] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const ws = useRef(null);

  // 步驟 1: 上傳圖片並創建 Pokemon
  const uploadAndCreatePokemon = async (imageUri) => {
    try {
      // 1.1 上傳圖片
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'pokemon.jpg'
      });

      const uploadResponse = await fetch(`${API_BASE}/api/v1/pokemon/upload`, {
        method: 'POST',
        body: formData
      });
      const { upload_id } = await uploadResponse.json();

      // 1.2 輪詢處理狀態
      let processed = false;
      let processedData = null;

      while (!processed) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `${API_BASE}/api/v1/pokemon/process/${upload_id}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          processed = true;
          processedData = statusData.data;
        } else if (statusData.status === 'failed') {
          throw new Error('圖片處理失敗');
        }
      }

      // 1.3 創建 Pokemon（名稱自動生成）
      const createResponse = await fetch(`${API_BASE}/api/v1/pokemon/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          type: processedData.type,
          front_image: processedData.front_image,
          back_image: processedData.back_image
          // name 不提供，會自動生成 "火寶"、"水寶" 等
        })
      });

      const { data: pokemon } = await createResponse.json();
      setPokemonId(pokemon.id);

      // 1.4 自動連接 WebSocket
      connectToGlobalRoom(pokemon.id);

    } catch (error) {
      console.error('Pokemon 創建失敗:', error);
    }
  };

  // 步驟 2: 連接全域房間
  const connectToGlobalRoom = (pokemonId) => {
    // 固定連接到 GLOBAL 房間
    ws.current = new WebSocket(
      `${WS_BASE}/api/v1/rooms/ws/GLOBAL?pokemon_id=${pokemonId}&player_name=${playerName}`
    );

    ws.current.onopen = () => {
      console.log('✅ 已連接到全域房間');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'welcome':
          console.log('歡迎訊息:', message.message);
          setRoomState(message.room);
          break;

        case 'room_update':
          setRoomState(message.data);
          break;

        case 'battle_start':
          console.log('⚔️ 戰鬥開始！');
          setRoomState(prev => ({ ...prev, status: 'battle' }));
          break;

        case 'turn_timer':
          console.log(`⏱️ 剩餘時間: ${message.data.remaining_time}s`);
          break;

        case 'battle_action':
          console.log(`${message.data.actor} 使用了 ${message.data.skill}！`);
          console.log(`造成 ${message.data.damage} 點傷害`);
          break;

        case 'battle_end':
          console.log(message.result === 'win' ? '🎉 勝利！' : '💀 失敗');
          break;

        case 'heartbeat_ack':
          // 心跳回應（每 30 秒）
          break;

        default:
          console.log('未知訊息:', message);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket 錯誤:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket 已關閉');
    };
  };

  // 步驟 3: 使用技能
  const useSkill = (skillId, prompt) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'use_skill',
        skill_id: skillId,
        prompt: prompt  // 玩家的戰術描述（影響傷害加成）
      }));
    }
  };

  // 心跳維持連線（每 30 秒）
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      ws.current?.close();
    };
  }, []);

  return (
    <View>
      {/* UI 實作... */}
      <Text>全域房間</Text>
      {roomState && (
        <View>
          <Text>當前玩家數: {roomState.current_players}</Text>
          <Text>Boss HP: {roomState.boss.hp}/{roomState.boss.max_hp}</Text>
          {/* ... */}
        </View>
      )}
    </View>
  );
}
```

---

## 🎯 重要注意事項

### 1. 無需「創建房間」按鈕
- ❌ 移除「創建房間」UI
- ❌ 移除「輸入房間代碼」UI
- ✅ 直接連接到 `GLOBAL` 房間

### 2. 無需「準備」按鈕
- ❌ 移除「準備」按鈕
- ✅ 玩家加入後自動開始戰鬥
- ✅ 單人玩家也能立即開始

### 3. Pokemon 名稱
- ❌ 不需要讓用戶輸入 Pokemon 名稱
- ✅ 後端自動根據屬性生成（火寶、水寶...）
- ℹ️ 如果前端仍想自訂，可以在創建時傳入 `name` 參數

### 4. 戰鬥中加入
- ✅ 玩家可以在戰鬥進行中加入
- ✅ 加入後會收到當前房間狀態
- ⚠️ 需要處理「加入時已經在戰鬥中」的 UI 狀態

### 5. 斷線重連
- ⚠️ WebSocket 斷線後需要重新連接
- ⚠️ 重連時會重新加入房間（如果還在戰鬥中）
- ℹ️ 建議實作自動重連機制

---

## 📊 後端變更總結

### 修改的檔案

1. ✅ `app/main.py` - 啟動時創建 GLOBAL 房間
2. ✅ `app/websocket/room.py` - 允許加入戰鬥中的 GLOBAL 房間、自動準備
3. ✅ `app/routers/pokemon.py` - Pokemon 名稱自動生成
4. ✅ `app/routers/rooms.py` - GLOBAL 房間自動開始戰鬥（單人模式）

### 新功能

- ✅ 全域房間自動創建（max_players=99）
- ✅ 戰鬥中允許加入
- ✅ 自動設定準備狀態
- ✅ 單人即可開始戰鬥
- ✅ Pokemon 名稱自動生成

---

## 🧪 測試

### 本地測試步驟

```bash
# 1. 啟動後端
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. 確認 GLOBAL 房間已創建
curl http://localhost:8000/api/v1/rooms/GLOBAL

# 3. 測試 Pokemon 創建（無名稱）
curl -X POST "http://localhost:8000/api/v1/pokemon/create?type=fire&front_image=test&back_image=test"
# 應返回 name: "火寶"

# 4. 連接 WebSocket（使用 wscat）
npm install -g wscat
wscat -c "ws://localhost:8000/api/v1/rooms/ws/GLOBAL?pokemon_id=test&player_name=TestPlayer"

# 5. 應自動開始戰鬥（單人模式）
```

---

## 💡 前端建議

### UI/UX 優化

1. **Loading 狀態**
   - 上傳圖片時顯示處理進度
   - WebSocket 連接時顯示「加入房間中...」

2. **戰鬥中加入**
   - 如果加入時已在戰鬥中，顯示「戰鬥進行中，已為你加入」
   - 顯示當前回合數和 Boss 血量

3. **單人提示**
   - 如果玩家是第一個加入，顯示「你是第一位玩家，等待其他人加入或單獨挑戰」
   - 戰鬥開始時顯示「單人模式」或「多人模式 (X 人)」

4. **斷線處理**
   - 自動重連機制
   - 重連後恢復戰鬥狀態
   - 顯示「連線中斷，正在重新連接...」

---

## 🚀 部署注意事項

### 環境變數

```bash
# 確保這些環境變數已設置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
SECRET_KEY=your_secret_key
```

### WebSocket URL

```javascript
// 開發環境
const WS_BASE = 'ws://localhost:8000';

// 生產環境（Railway/Vercel）
const WS_BASE = 'wss://your-backend.railway.app';
```

---

## 📞 支援

如有問題，請參考：
- `BATTLE_SYSTEM_IMPLEMENTATION.md` - 戰鬥系統詳細說明
- `FRONTEND_INTEGRATION_GUIDE.md` - 完整 WebSocket 協議
- Swagger UI: `http://localhost:8000/docs`

---

**更新者**: Claude Code
**日期**: 2025-11-02
**版本**: 1.0 - 全域房間模式
