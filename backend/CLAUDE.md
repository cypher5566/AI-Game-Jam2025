# GenPoke Backend - 開發狀態與架構文檔

> AI Game Jam 2025 - Pokemon 風格多人對戰遊戲後端系統
>
> **開發原則**: 穩定度優先 > 速度，Game Jam 時間限制下確保功能可用

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

### ⏳ Phase 4: 戰鬥系統 API (待開發)

**預計實作**:
- [ ] 傷害計算 API (`POST /api/v1/battle/calculate-damage`)
- [ ] 18x18 屬性相剋表 (`GET /api/v1/battle/type-effectiveness`)
- [ ] 使用技能端點 (`POST /api/v1/battle/use-skill`)
- [ ] 戰鬥邏輯服務 (`app/services/battle_service.py`)

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

### ⏳ Phase 5: WebSocket 多人對戰 (待開發)

**預計實作**:
- [ ] WebSocket 連接管理器 (`app/websocket/manager.py`)
- [ ] 房間創建/加入/離開 (`app/websocket/room.py`)
- [ ] Boss 戰邏輯 (`app/services/boss_service.py`)
- [ ] 即時狀態同步（血量、回合、技能使用）
- [ ] 房間 API (`POST /api/v1/rooms/create`, `POST /api/v1/rooms/join`)

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

**需要創建的文件**:
- `app/websocket/__init__.py`
- `app/websocket/manager.py` - WebSocket 連接管理
- `app/websocket/room.py` - 房間邏輯
- `app/services/boss_service.py` - Boss AI
- `app/routers/rooms.py` - 房間 REST API

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

### Battle (待開發)
- `POST /api/v1/battle/calculate-damage` - 計算傷害
- `GET /api/v1/battle/type-effectiveness` - 查詢屬性相剋
- `POST /api/v1/battle/use-skill` - 使用技能

### Rooms (待開發)
- `POST /api/v1/rooms/create` - 創建房間
- `POST /api/v1/rooms/join` - 加入房間
- `GET /api/v1/rooms/{room_code}` - 獲取房間資訊
- `DELETE /api/v1/rooms/{room_code}/leave` - 離開房間

### WebSocket (待開發)
- `WS /ws/room/{room_code}` - 房間 WebSocket 連接

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
1. **MCP 授權問題**: Supabase MCP 連接有授權問題，暫時由其他團隊成員手動執行 SQL migrations
2. **背面圖生成**: 目前使用鏡像 fallback，Gemini 2.0 Flash 不支持圖片生成
3. **處理狀態存儲**: 目前存在內存（`processing_status` dict），生產環境應改用 Redis

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

**最後更新**: 2025-11-02
**文檔版本**: 1.0
**下一步**: 開發 Phase 4 戰鬥系統 API
