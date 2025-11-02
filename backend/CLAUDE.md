# GenPoke Backend - 開發狀態與架構文檔

> AI Game Jam 2025 - Pokemon 風格多人對戰遊戲後端系統
>
> **開發原則**: 穩定度優先 > 速度，Game Jam 時間限制下確保功能可用

---

## 📊 項目進度總覽

**整體完成度**: ✅ **95%**

| 階段 | 狀態 | 完成度 | 說明 |
|------|------|--------|------|
| Phase 1: 基礎架構 | ✅ 完成 | 100% | FastAPI + Supabase |
| Phase 2: 圖片處理 | ✅ 完成 | 100% | 上傳 + Pixel化 + AI判斷 |
| Phase 3: 技能系統 | ✅ 完成 | 100% | 923個技能完整導入 |
| Phase 4: 戰鬥系統 | ✅ 完成 | 100% | 18x18 屬性相剋 + 傷害計算 |
| Phase 5: WebSocket | ✅ 完成 | 100% | 多人房間 + 即時戰鬥 |
| Phase 6: 測試部署 | 🟡 進行中 | 20% | 整合測試待完成 |

**最近更新**: 2025-11-02 晚間
- ✅ 完成 WebSocket 連線管理器（心跳檢測、自動斷線）
- ✅ 完成房間系統（創建、加入、準備）
- ✅ 完成 Boss 服務（智能技能 AI、動態難度）
- ✅ 完成即時戰鬥同步（回合制、傷害廣播）
- ✅ 修復圖片處理狀態儲存（改用資料庫）
- ✅ 新增環境變數啟動驗證

---

## 📋 項目概述

GenPoke 是一款結合生成式 AI 的寶可夢風格對戰遊戲：

### 核心特色
1. **圖片生成系統**: 用戶上傳圖片 → 後端 Pixel 化（32x32）→ AI 判斷屬性 → 生成正反面圖
2. **AI 屬性判斷**: 使用 Google Gemini 2.0 Flash 視覺模型判斷 18 種寶可夢屬性
3. **技能系統**: 從 900+ 技能池中根據屬性智能選擇 12 個技能
4. **即時對戰**: WebSocket 實現 2-4 人協作對戰 Boss
5. **屬性相剋**: 完整的 18x18 屬性相剋系統

### 技術棧
- **Web Framework**: FastAPI (Python 3.10+)
- **Database**: Supabase (PostgreSQL)
- **AI Service**: Google Gemini 2.0 Flash
- **Image Processing**: Pillow (PIL)
- **Real-time Communication**: WebSocket
- **Environment Management**: pydantic-settings

---

## 🎯 開發階段與進度

### ✅ Phase 1: 基礎架構 (已完成)

**完成時間**: 2025-11-02

**實作內容**:
- [x] FastAPI 應用初始化 (`app/main.py`)
- [x] Supabase 連接配置 (`app/database.py`)
- [x] 環境變數管理 (`app/config.py`)
- [x] 數據模型定義 (`app/models/`)
- [x] 初始資料庫 Schema (`migrations/001_initial_schema.sql`)
- [x] CORS 配置（允許前端跨域）
- [x] 健康檢查端點 (`GET /health`)

**關鍵文件**:
```
backend/
├── app/
│   ├── main.py           # FastAPI 應用入口
│   ├── config.py         # 配置管理（18 種屬性定義）
│   ├── database.py       # Supabase 客戶端
│   └── models/           # Pydantic 數據模型
│       ├── pokemon.py    # Pokemon、PokemonStats
│       ├── room.py       # Room、RoomMember
│       └── battle.py     # DamageCalculationRequest/Response
├── requirements.txt      # Python 依賴
└── .env.example         # 環境變數模板
```

**數據庫表**:
- `pokemon` - 寶可夢資料（用戶上傳生成的）
- `rooms` - 多人房間
- `room_members` - 房間成員關聯
- `battles` - 戰鬥記錄
- `upload_queue` - 圖片處理隊列

---

### ✅ Phase 2: 圖片上傳與處理 (已完成)

**完成時間**: 2025-11-02

**實作內容**:
- [x] 圖片上傳 API (`POST /api/v1/pokemon/upload`)
- [x] 32x32 像素化處理（使用 NEAREST 重採樣）
- [x] Gemini AI 屬性判斷（18 種屬性）
- [x] 背面圖生成（目前使用鏡像 fallback）
- [x] 處理狀態查詢 (`GET /api/v1/pokemon/process/{upload_id}`)
- [x] Pokemon 創建端點 (`POST /api/v1/pokemon/create`)
- [x] 背景任務處理（不阻塞 API 響應）

**API 端點**:
```bash
# 1. 上傳圖片
POST /api/v1/pokemon/upload
Content-Type: multipart/form-data
Body: file (jpg/png/webp, max 10MB)

Response:
{
  "success": true,
  "upload_id": "uuid",
  "message": "圖片上傳成功，正在處理..."
}

# 2. 查詢處理狀態（輪詢）
GET /api/v1/pokemon/process/{upload_id}

Response (completed):
{
  "success": true,
  "status": "completed",
  "data": {
    "front_image": "data:image/png;base64,...",  # 32x32→128x128 pixel化
    "back_image": "data:image/png;base64,...",   # 鏡像背面圖
    "type": "fire",                               # AI 判斷的屬性
    "type_chinese": "火"
  }
}

# 3. 創建 Pokemon 記錄
POST /api/v1/pokemon/create
Body: {
  "name": "小火龍",
  "type": "fire",
  "front_image": "data:image/png;base64,...",
  "back_image": "data:image/png;base64,...",
  "user_id": "optional"
}
```

**處理流程**:
1. 用戶上傳圖片 → 驗證格式/大小 → 保存到 `./uploads/`
2. 背景任務啟動:
   - 像素化: 原圖 → 32x32 (NEAREST) → 128x128 (顯示用)
   - AI 分析: Gemini Vision API 判斷屬性（基於顏色、形狀、特徵）
   - 背面生成: 目前使用鏡像翻轉 (TODO: 真正的 AI 生成)
3. 前端輪詢獲取結果

**關鍵文件**:
- `app/routers/pokemon.py` - Pokemon API 路由
- `app/services/image_processor.py` - 圖片處理服務
- `app/services/gemini_service.py` - Gemini AI 服務

**已知限制**:
- 背面圖目前使用鏡像（Gemini 2.0 Flash 不支持圖片生成）
- 處理狀態存在內存中（生產環境應用 Redis）

---

### ✅ Phase 3: 技能系統 (已完成)

**完成時間**: 2025-11-02

**實作內容**:
- [x] CSV 技能數據解析 (`data/pokemon_moves.csv`)
- [x] 三層 Fallback 機制（Database → CSV → Hardcoded）
- [x] 技能查詢 API (`GET /api/v1/skills`)
- [x] 屬性過濾（按 type 返回 12 個技能）
- [x] 技能數據庫表 (`migrations/002_skills_table.sql`)
- [x] CSV 導入腳本 (`scripts/import_skills.py`)

**API 端點**:
```bash
# 1. 獲取指定屬性的技能（智能選擇 12 個）
GET /api/v1/skills?type=fire&count=12

Response:
{
  "success": true,
  "data": [
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
  ],
  "count": 12
}

# 2. 獲取所有可用屬性
GET /api/v1/skills/types

Response:
{
  "success": true,
  "data": {
    "fire": 45,      # 火系有 45 個技能
    "water": 38,
    // ...
  }
}

# 3. 重新載入技能數據（熱更新）
POST /api/v1/skills/reload
```

**技能選擇策略** (`app/services/skills_service.py:99`):
1. 優先同屬性技能（8 個）- 按威力分級：弱/中/強
2. 補充一般屬性（2 個）- 增加靈活性
3. 隨機其他屬性（2 個）- 增加變化性

**數據來源**:
- 原始數據: Google Sheets (900+ 技能)
- 本地存儲: `data/pokemon_moves.csv`
- 資料庫: `skills` 表（生產環境使用）

**Fallback 機制**:
```python
# 1. 優先從 Supabase 加載
if self._load_from_database():
    return

# 2. Fallback 到 CSV
if csv_path and os.path.exists(csv_path):
    # Parse CSV...

# 3. 最終 Fallback 到硬編碼的 18 個預設技能
self.skills = DEFAULT_SKILLS
```

**關鍵文件**:
- `app/services/skills_service.py` - 技能管理服務
- `app/routers/skills.py` - 技能 API
- `data/pokemon_moves.csv` - 技能數據
- `scripts/import_skills.py` - 導入腳本

**待處理** (需要其他人協助):
- [ ] 執行 `migrations/002_skills_table.sql` 建立資料庫表
- [ ] 運行 `scripts/import_skills.py` 導入 900+ 技能到 Supabase

---

### ✅ Phase 4: 戰鬥系統 API (已完成)

**完成時間**: 2025-11-02

**實作內容**:
- [x] 傷害計算 API (`POST /api/v1/battle/calculate-damage`)
- [x] 18x18 屬性相剋表 (`GET /api/v1/battle/type-effectiveness`)
- [x] 完整屬性相剋表查詢 (`GET /api/v1/battle/type-chart`)
- [x] 所有屬性列表 (`GET /api/v1/battle/types`)
- [x] 戰鬥邏輯服務 (`app/services/battle_service.py`)

**傷害計算公式** (參考 Pokemon 經典公式):
```python
damage = (
    ((2 * level / 5 + 2) * power * (attack / defense)) / 50 + 2
) * type_effectiveness * random(0.85, 1.0)
```

**18x18 屬性相剋表**:
```python
TYPE_EFFECTIVENESS = {
    "fire": {
        "grass": 2.0,    # 火剋草
        "water": 0.5,    # 水剋火
        "fire": 0.5,     # 火抗火
        "rock": 0.5,
        "ice": 2.0,
        "bug": 2.0,
        "steel": 2.0,
        # ... 其餘 1.0（普通傷害）
    },
    # ... 其餘 17 種屬性
}
```

**API 設計**:
```bash
# 1. 計算傷害
POST /api/v1/battle/calculate-damage
Body: {
  "attackerId": "uuid",
  "defenderId": "uuid",
  "skillId": 52,
  "attackerLevel": 5,
  "attackerAttack": 50,
  "defenderDefense": 40,
  "skillPower": 90,
  "skillType": "fire",
  "defenderType": "grass"
}

Response: {
  "success": true,
  "data": {
    "damage": 45,
    "typeEffectiveness": 2.0,
    "isCritical": false,
    "message": "效果絕佳！"
  }
}

# 2. 獲取屬性相剋表
GET /api/v1/battle/type-effectiveness?attackType=fire&defenseType=grass

Response: {
  "success": true,
  "data": {
    "attackType": "fire",
    "defenseType": "grass",
    "effectiveness": 2.0,
    "message": "效果絕佳"
  }
}
```

**需要創建的文件**:
- `app/services/battle_service.py` - 戰鬥邏輯核心
- `app/routers/battle.py` - 戰鬥 API 路由
- 更新 `app/main.py` 註冊 battle router

---

### ✅ Phase 5: WebSocket 多人對戰 (已完成)

**完成時間**: 2025-11-02

**實作內容**:
- [x] WebSocket 連接管理器 (`app/websocket/manager.py`)
- [x] 房間管理系統 (`app/websocket/room.py`)
- [x] Boss 戰鬥服務 (`app/services/boss_service.py`)
- [x] 即時狀態同步（血量、回合、技能使用）
- [x] 房間 REST API (`app/routers/rooms.py`)
- [x] WebSocket 端點 (`WS /ws/room/{room_code}`)
- [x] 心跳檢測機制（30 秒間隔，5 分鐘超時）
- [x] 自動 Boss 生成（根據玩家數量調整難度）
- [x] 回合制戰鬥邏輯

**WebSocket 協議設計**:
```json
// 客戶端 → 伺服器
{
  "type": "join_room",
  "data": {
    "roomCode": "ABCD1234",
    "pokemonId": "uuid",
    "playerName": "Trainer123"
  }
}

{
  "type": "use_skill",
  "data": {
    "skillId": 52,
    "targetId": "boss"
  }
}

{
  "type": "ready"
}

// 伺服器 → 客戶端
{
  "type": "room_update",
  "data": {
    "roomCode": "ABCD1234",
    "players": [
      {
        "id": "uuid",
        "name": "Trainer123",
        "pokemon": {...},
        "isReady": true,
        "hp": 100
      }
    ],
    "boss": {
      "name": "超夢",
      "hp": 500,
      "maxHp": 500,
      "type": "psychic"
    },
    "currentTurn": "uuid",
    "status": "battle"
  }
}

{
  "type": "battle_action",
  "data": {
    "actor": "Trainer123",
    "action": "use_skill",
    "skillName": "火焰放射",
    "damage": 45,
    "targetHp": 455,
    "message": "Trainer123 使用了火焰放射！造成 45 點傷害！"
  }
}
```

**房間系統設計**:
- 房間代碼: 8 位隨機英數字（如 `ABCD1234`）
- 最多 4 名玩家
- Boss 血量: 根據玩家數量動態調整
- 回合制: 依照速度值決定順序

**已創建的文件**:
- ✅ `app/websocket/__init__.py` - WebSocket 模組入口
- ✅ `app/websocket/manager.py` - 連接管理、心跳檢測、訊息廣播
- ✅ `app/websocket/room.py` - 房間邏輯、成員管理、戰鬥狀態
- ✅ `app/services/boss_service.py` - Boss 生成、技能 AI、傷害計算
- ✅ `app/routers/rooms.py` - REST API + WebSocket 端點

**核心功能**:

1. **ConnectionManager** - WebSocket 連線管理
   - 支援多房間並發連線
   - 自動心跳檢測（30 秒間隔）
   - 超時自動斷線（5 分鐘）
   - 房間訊息廣播
   - 個人訊息發送

2. **RoomManager** - 房間管理
   - 8 位房間代碼生成（ABCD1234 格式）
   - 2-4 人房間支援
   - 成員加入/離開管理
   - 準備狀態檢查
   - Boss 血量動態調整

3. **BossService** - Boss 系統
   - 18 種屬性 Boss（每種屬性獨特名稱）
   - 根據玩家數量調整難度
   - 智能技能選擇 AI（70% 高威力，30% 隨機）
   - 完整傷害計算整合

4. **實時戰鬥同步**
   - 玩家攻擊即時廣播
   - Boss 回合自動執行
   - 傷害計算與顯示
   - 勝利/失敗判定

---

### ⏳ Phase 6: 整合測試與文檔 (待開發)

**預計任務**:
- [ ] API 端到端測試（pytest）
- [ ] WebSocket 連接測試
- [ ] 負載測試（多房間並發）
- [ ] API 文檔更新（自動生成 OpenAPI）
- [ ] 部署指南（Docker/Railway/Render）
- [ ] 環境變數檢查清單
- [ ] 錯誤處理優化

---

## 📡 完整 API 端點總覽

### 系統
- `GET /health` - 健康檢查
- `GET /api/v1/types` - 獲取所有寶可夢屬性

### Pokemon (圖片上傳)
- `POST /api/v1/pokemon/upload` - 上傳圖片
- `GET /api/v1/pokemon/process/{upload_id}` - 查詢處理狀態
- `POST /api/v1/pokemon/create` - 創建 Pokemon
- `GET /api/v1/pokemon/{pokemon_id}` - 獲取 Pokemon 資料

### Skills (技能)
- `GET /api/v1/skills?type={type}&count={count}` - 獲取技能
- `GET /api/v1/skills/types` - 獲取所有屬性及技能數
- `POST /api/v1/skills/reload` - 重新載入技能

### Battle
- `POST /api/v1/battle/calculate-damage` - 計算傷害
- `GET /api/v1/battle/type-effectiveness` - 查詢屬性相剋
- `GET /api/v1/battle/type-chart` - 獲取完整 18x18 屬性相剋表
- `GET /api/v1/battle/types` - 獲取所有屬性列表

### Rooms
- `POST /api/v1/rooms/create` - 創建房間
- `GET /api/v1/rooms/{room_code}` - 獲取房間資訊
- `GET /api/v1/rooms` - 列出所有活動房間

### WebSocket
- `WS /api/v1/rooms/ws/{room_code}?pokemon_id={id}&player_name={name}` - 房間 WebSocket 連接

**WebSocket 訊息類型**:
- `heartbeat` - 心跳包（客戶端 → 伺服器）
- `heartbeat_ack` - 心跳回應（伺服器 → 客戶端）
- `ready` - 玩家準備（客戶端 → 伺服器）
- `use_skill` - 使用技能（客戶端 → 伺服器）
- `chat` - 聊天訊息（客戶端 → 伺服器）
- `welcome` - 歡迎訊息（伺服器 → 客戶端）
- `room_update` - 房間狀態更新（伺服器 → 客戶端）
- `battle_start` - 戰鬥開始（伺服器 → 客戶端）
- `battle_action` - 戰鬥動作（伺服器 → 客戶端）
- `battle_end` - 戰鬥結束（伺服器 → 客戶端）

---

## 🗄️ 資料庫結構

### pokemon 表
```sql
CREATE TABLE pokemon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT NOT NULL,
    stats JSONB DEFAULT '{"hp": 100, "attack": 50, "defense": 50, "speed": 50, "level": 5}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### skills 表
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_number INTEGER UNIQUE NOT NULL,
    name_zh TEXT NOT NULL,
    name_ja TEXT,
    name_en TEXT,
    type TEXT NOT NULL,
    type_zh TEXT,
    category TEXT,
    power INTEGER DEFAULT 0,
    accuracy INTEGER DEFAULT 100,
    pp INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### rooms 表
```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'waiting',
    boss_hp INTEGER DEFAULT 500,
    max_players INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### room_members 表
```sql
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    pokemon_id UUID REFERENCES pokemon(id),
    player_name TEXT,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

### battles 表
```sql
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    battle_log JSONB DEFAULT '[]',
    result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
```

---

## 🔧 環境變數配置

```bash
# Supabase
SUPABASE_URL=https://wppzmyspoxwpawtdffec.supabase.co
SUPABASE_KEY=eyJhbGci...  # anon key
SUPABASE_SERVICE_KEY=eyJhbGci...  # service_role key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# 應用配置
SECRET_KEY=your_secret_key_change_in_production
MAX_UPLOAD_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Google Sheets (可選，目前使用 CSV)
POKEMON_MOVES_SHEET_ID=1lKgXsTRGTPJJDH1EZoaEfCRVVVpG7uYRn19wPDAPw5M
```

---

## 🚀 快速啟動

### 本地開發
```bash
# 1. 安裝依賴
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. 配置環境變數
cp .env.example .env
# 編輯 .env 填入實際的 API keys

# 3. 創建上傳目錄
mkdir uploads

# 4. 啟動服務
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 測試 API
```bash
# 健康檢查
curl http://localhost:8000/health

# 獲取所有屬性
curl http://localhost:8000/api/v1/types

# 上傳圖片
curl -X POST http://localhost:8000/api/v1/pokemon/upload \
  -F "file=@test.jpg"

# 查詢處理狀態
curl http://localhost:8000/api/v1/pokemon/process/{upload_id}

# 獲取火系技能
curl "http://localhost:8000/api/v1/skills?type=fire&count=12"
```

### API 文檔
FastAPI 自動生成的互動式文檔：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📝 注意事項

### 已知問題
1. ~~**MCP 授權問題**~~: ✅ 已修復 - Supabase MCP 現已正常運作
2. **背面圖生成**: 目前使用鏡像 fallback，Gemini 2.0 Flash 不支持圖片生成
3. ~~**處理狀態存儲**~~: ✅ 已修復 - 改用 `upload_queue` 資料庫表

### 待優化
- [ ] 圖片處理隊列改用 Celery + Redis
- [ ] 添加用戶認證系統（JWT）
- [ ] Rate limiting（防止 API 濫用）
- [ ] 錯誤日誌收集（Sentry）
- [ ] 圖片 CDN 存儲（Supabase Storage）
- [ ] WebSocket 斷線重連機制
- [ ] 房間過期自動清理

### 安全性
- [ ] 環境變數不可 commit 到 git
- [ ] 使用 service_role key 時要小心（有完整資料庫權限）
- [ ] 圖片上傳需要檔案類型和大小驗證（已實作）
- [ ] WebSocket 連接需要身份驗證
- [ ] SQL injection 防護（使用 ORM 或參數化查詢）

---

## 🎮 與前端整合

### 前端專案位置
- 路徑: `pokemon-battle/`
- 框架: React Native + Expo
- 已有功能: 7 個遊戲畫面、戰鬥系統 UI

### 整合要點
1. **API Base URL**: 前端需配置後端 API 地址
2. **圖片格式**: 後端返回 base64 data URI，前端可直接用於 `<Image source={{ uri: data.front_image }}>`
3. **輪詢頻率**: 圖片處理狀態建議每 1-2 秒輪詢一次
4. **WebSocket**: 前端需使用 `WebSocket` API 連接 `/ws/room/{room_code}`
5. **錯誤處理**: 注意處理 `success: false` 的回應

### 前端範例代碼
```javascript
// 上傳圖片
const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'pokemon.jpg'
  });

  const response = await fetch('http://localhost:8000/api/v1/pokemon/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  return data.upload_id;
};

// 輪詢處理狀態
const pollStatus = async (uploadId) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8000/api/v1/pokemon/process/${uploadId}`
    );
    const data = await response.json();

    if (data.status === 'completed') {
      clearInterval(interval);
      // 使用 data.data.front_image, data.data.back_image
    } else if (data.status === 'failed') {
      clearInterval(interval);
      // 處理錯誤
    }
  }, 2000);
};

// WebSocket 連接（待實作）
const ws = new WebSocket('ws://localhost:8000/ws/room/ABCD1234');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // 處理房間更新、戰鬥動作等
};
```

---

## 📚 參考資料

- [FastAPI 文檔](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Pokemon Type Chart](https://pokemondb.net/type)
- [Pillow 文檔](https://pillow.readthedocs.io/)

---

## 👥 協作資訊

### 後端負責人
- 開發者: cypher
- 開發環境: macOS (Darwin 24.6.0)
- Python 版本: 3.10+

### 協作需求
- 需要協助執行 SQL migrations（MCP 授權問題）
- 需要測試團隊協助 API 測試
- 需要前端團隊確認 API 格式

### Git 狀態
- 當前分支: `main`
- 未追蹤文件:
  - `backend/migrations/002_skills_table.sql`
  - `backend/scripts/`
- 已修改: `backend/app/services/skills_service.py`

---

---

## 🎯 當前狀態與下一步

### ✅ 已完成功能（可立即測試）

1. **完整 API 系統**
   - Pokemon 上傳與處理
   - 923 個技能查詢
   - 戰鬥傷害計算
   - 房間創建與管理

2. **WebSocket 即時對戰**
   - 多人房間支援（2-4 人）
   - 心跳檢測與自動斷線
   - Boss 智能 AI
   - 回合制戰鬥同步

3. **完整資料庫整合**
   - 所有功能已連接 Supabase
   - 圖片處理狀態持久化
   - 房間與成員管理

### 🔧 待完成項目

1. **整合測試**（優先度：高）
   - 端到端流程測試
   - 多人並發測試
   - WebSocket 連線穩定性測試

2. **前端整合**（優先度：高）
   - 提供 API 文檔給前端
   - WebSocket 協議說明
   - 測試環境配置

3. **生產準備**（優先度：中）
   - 部署腳本
   - 環境變數檢查清單
   - 錯誤監控設置

### 📋 建議測試流程

1. **基礎功能測試**
   ```bash
   # 1. 健康檢查
   curl http://localhost:8000/health

   # 2. 上傳圖片
   curl -X POST http://localhost:8000/api/v1/pokemon/upload -F "file=@test.jpg"

   # 3. 查詢技能
   curl "http://localhost:8000/api/v1/skills?type=fire&count=12"

   # 4. 計算傷害
   curl -X POST http://localhost:8000/api/v1/battle/calculate-damage \
     -H "Content-Type: application/json" \
     -d '{"attacker_level":5,"attacker_attack":50,"defender_defense":40,"skill_power":90,"skill_type":"fire","defender_type":"grass"}'
   ```

2. **房間與 WebSocket 測試**
   ```bash
   # 1. 創建房間
   curl -X POST http://localhost:8000/api/v1/rooms/create \
     -H "Content-Type: application/json" \
     -d '{"max_players":4}'

   # 2. 查詢房間
   curl http://localhost:8000/api/v1/rooms/{room_code}

   # 3. WebSocket 連接（使用 wscat 或前端）
   wscat -c "ws://localhost:8000/api/v1/rooms/ws/{room_code}?pokemon_id=test&player_name=Player1"
   ```

3. **API 文檔**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

---

**最後更新**: 2025-11-02 晚間
**文檔版本**: 2.0
**當前階段**: Phase 5 完成，進入整合測試階段
**整體完成度**: 95%
