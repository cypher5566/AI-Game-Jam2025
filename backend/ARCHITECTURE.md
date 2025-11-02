# GenPoke 後端系統架構文檔

## 📋 目錄
- [系統概覽](#系統概覽)
- [技術棧](#技術棧)
- [系統架構圖](#系統架構圖)
- [資料庫設計](#資料庫設計)
- [API 端點設計](#api-端點設計)
- [核心服務](#核心服務)
- [WebSocket 協議](#websocket-協議)
- [部署指南](#部署指南)

---

## 系統概覽

GenPoke 是一個支援多人連線的寶可夢風格對戰遊戲後端系統，核心特色：

### 主要功能
1. **AI 圖片處理**: 上傳圖片 → 像素化(32x32) → AI判斷屬性 → AI生成背面
2. **技能系統**: 從 Google Sheets (900+技能) 根據屬性返回 12 個技能
3. **多人對戰**: WebSocket 即時同步，2-4人團體戰對抗 Boss
4. **戰鬥系統**: 回合制戰鬥，傷害計算，屬性相剋(18種屬性)

### 設計原則
- **穩定度優先**: Game Jam 時間緊迫，所有功能都有 fallback 機制
- **即時性**: 使用 WebSocket 實現真正的多人即時對戰
- **可擴展性**: 模組化設計，便於後續擴展

---

## 技術棧

### 核心框架
- **FastAPI** 0.104.1 - 現代化的 Python Web 框架
  - 自動生成 API 文檔 (Swagger UI)
  - 原生支援 WebSocket
  - 非同步處理，高效能

### AI 服務
- **Google Gemini 2.5 Flash**
  - Vision API: 圖片屬性判斷
  - Image Generation: 背面圖片生成

### 資料庫
- **Supabase (PostgreSQL)**
  - 即時資料庫
  - 內建 RLS (Row Level Security)
  - 自動 REST API 生成

### 外部整合
- **Google Sheets API**: 技能資料管理
  - 900+ 招式資料
  - 支援即時更新

### 圖片處理
- **Pillow (PIL)**: 像素化處理

---

## 系統架構圖

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React Native)                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ 圖片上傳  │  │ 技能選擇  │  │   戰鬥   │  │ 多人房間管理 │  │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
└────────┼──────────────┼──────────────┼────────────────┼──────────┘
         │              │              │                │
      HTTP POST      HTTP GET      HTTP POST      WebSocket
         │              │              │                │
┌────────┼──────────────┼──────────────┼────────────────┼──────────┐
│        ▼              ▼              ▼                ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 FastAPI Application                       │  │
│  │                      (Port 8000)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Routers    │  │   Services   │  │   WebSocket Manager  │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ /pokemon     │  │ image_       │  │ ConnectionManager    │  │
│  │ /skills      │  │   processor  │  │ RoomManager          │  │
│  │ /battle      │  │ gemini_      │  │ BattleCoordinator    │  │
│  │ /rooms       │  │   service    │  │ HeartbeatHandler     │  │
│  │              │  │ skills_      │  │                      │  │
│  │              │  │   service    │  │                      │  │
│  │              │  │ battle_      │  │                      │  │
│  │              │  │   service    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                     │               │
│         ▼                  ▼                     ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   External Services                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Gemini AI         Supabase             Supabase        │  │
│  │  - Vision API      - 技能資料庫          - PostgreSQL    │  │
│  │  - Image Gen       - 900+ 招式           - 即時同步      │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 資料流

#### 1. 圖片處理流程
```
用戶上傳圖片
    ↓
POST /api/v1/pokemon/upload (儲存原圖，返回 upload_id)
    ↓
後端異步處理:
  ├─ Pillow 像素化 (32x32)
  ├─ Gemini Vision API 判斷屬性
  └─ Gemini Image Gen 生成背面
    ↓
GET /api/v1/pokemon/process/{upload_id} (返回處理結果)
    ↓
前端獲得: {front_image, back_image, type}
```

#### 2. 技能獲取流程
```
前端請求技能 (GET /api/v1/skills?type=fire&count=12)
    ↓
後端檢查快取
    ├─ 有快取 → 直接返回
    └─ 無快取 → Google Sheets API 抓取
    ↓
篩選邏輯:
  ├─ 同屬性技能 8 個 (fire 系)
  ├─ 一般系技能 2 個
  └─ 隨機其他屬性 2 個
    ↓
確保威力分布 (弱/中/強)
    ↓
返回 12 個技能
```

#### 3. 多人對戰流程
```
玩家 A 創建房間
    ↓
POST /api/v1/rooms/create → {room_code: "ABC123"}
    ↓
玩家 B,C,D 加入房間
    ↓
POST /api/v1/rooms/join {room_code, pokemon_id}
    ↓
所有玩家連接 WebSocket
    ↓
WS /ws/room/ABC123
    ↓
房間狀態同步
  ├─ WAITING → 等待玩家
  ├─ READY → 所有人準備完成
  ├─ BATTLE → 戰鬥開始
  └─ FINISHED → 戰鬥結束
    ↓
回合制戰鬥:
  1. 所有玩家選擇技能 (WS: select_skill)
  2. 按速度順序執行 (WS: turn_result)
  3. Boss 攻擊所有玩家 (WS: boss_attack)
  4. 檢查勝負條件 (WS: battle_end)
  5. 重複直到結束
```

---

## 資料庫設計

### Supabase Tables

#### 1. `pokemon` 表
```sql
CREATE TABLE pokemon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- fire, water, grass, etc.
    front_image_url TEXT NOT NULL,
    back_image_url TEXT NOT NULL,
    stats JSONB DEFAULT '{
        "hp": 100,
        "attack": 50,
        "defense": 50,
        "speed": 50,
        "level": 5
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_pokemon_user_id ON pokemon(user_id);
CREATE INDEX idx_pokemon_type ON pokemon(type);
```

#### 2. `rooms` 表
```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,  -- 6位數房間代碼
    status TEXT NOT NULL DEFAULT 'waiting',  -- waiting, ready, battle, finished
    boss_hp INTEGER NOT NULL,
    boss_max_hp INTEGER NOT NULL,
    current_turn INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_status ON rooms(status);
```

#### 3. `room_members` 表
```sql
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    pokemon_id UUID REFERENCES pokemon(id),
    user_id TEXT,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 確保同一房間內不會有重複的 pokemon
    UNIQUE(room_id, pokemon_id)
);

-- 索引
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_pokemon ON room_members(pokemon_id);
```

#### 4. `battles` 表
```sql
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id),
    battle_log JSONB DEFAULT '[]'::jsonb,  -- 戰鬥日誌
    result TEXT,  -- 'win', 'lose'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_battles_room ON battles(room_id);
CREATE INDEX idx_battles_created ON battles(created_at DESC);
```

---

## API 端點設計

### 基礎端點

| 方法 | 端點 | 描述 | 認證 |
|------|------|------|------|
| GET | `/` | 根路由，返回 API 資訊 | ❌ |
| GET | `/health` | 健康檢查 | ❌ |
| GET | `/api/v1/types` | 獲取 18 種屬性列表 | ❌ |

### Pokemon 相關

| 方法 | 端點 | 描述 | 請求體 | 響應 |
|------|------|------|--------|------|
| POST | `/api/v1/pokemon/upload` | 上傳圖片 | `multipart/form-data` | `{upload_id}` |
| GET | `/api/v1/pokemon/process/{upload_id}` | 獲取處理結果 | - | `{front_image, back_image, type}` |
| GET | `/api/v1/pokemon/{id}` | 獲取寶可夢資料 | - | `Pokemon` 對象 |

### Skills 相關

| 方法 | 端點 | 描述 | 參數 | 響應 |
|------|------|------|------|------|
| GET | `/api/v1/skills` | 獲取技能列表 | `?type=fire&count=12` | `[Skill]` 陣列 |

### Battle 相關

| 方法 | 端點 | 描述 | 請求體 | 響應 |
|------|------|------|--------|------|
| POST | `/api/v1/battle/calculate-damage` | 計算傷害 | `DamageCalculationRequest` | `DamageCalculationResponse` |
| GET | `/api/v1/battle/type-effectiveness` | 獲取屬性相剋表 | - | 18x18 矩陣 |
| POST | `/api/v1/battle/use-skill` | 使用技能 | `UseSkillRequest` | `UseSkillResponse` |

### Rooms 相關

| 方法 | 端點 | 描述 | 請求體 | 響應 |
|------|------|------|--------|------|
| POST | `/api/v1/rooms/create` | 創建房間 | `{max_players}` | `{room_code, room_id}` |
| POST | `/api/v1/rooms/join` | 加入房間 | `{room_code, pokemon_id}` | `Room` 對象 |
| GET | `/api/v1/rooms/{room_code}` | 獲取房間資訊 | - | `Room` + 成員列表 |

### WebSocket

| 端點 | 描述 | 協議 |
|------|------|------|
| `/ws/room/{room_code}` | 房間 WebSocket 連線 | JSON 訊息 |

---

## 核心服務

### 1. Image Processor Service
```python
class ImageProcessor:
    """圖片處理服務"""

    async def pixelate(image: bytes) -> bytes:
        """像素化處理 (32x32)"""
        - 使用 Pillow 調整大小
        - 應用像素化演算法
        - 返回處理後的圖片

    async def save_upload(file: UploadFile) -> str:
        """儲存上傳的圖片"""
        - 驗證檔案格式
        - 檢查檔案大小 (< 10MB)
        - 儲存到 ./uploads/ 目錄
        - 返回 upload_id
```

### 2. Gemini Service
```python
class GeminiService:
    """Gemini AI 服務"""

    async def detect_type(image: bytes) -> str:
        """判斷寶可夢屬性"""
        - 使用 Vision API 分析圖片
        - Prompt: "判斷這個圖片最像哪種寶可夢屬性 (18種)"
        - Fallback: 如果失敗返回 "normal"

    async def generate_back_view(image: bytes, type: str) -> bytes:
        """生成背面圖片"""
        - 使用 Image Generation API
        - Prompt: "Generate back view of this pokemon..."
        - Fallback: 如果失敗使用鏡像或預設圖
```

### 3. Skills Service
```python
class SkillsService:
    """技能管理服務"""

    async def fetch_from_sheets() -> List[Skill]:
        """從 Google Sheets 抓取技能"""
        - 使用 gspread 連接
        - 讀取 900+ 招式資料
        - 快取到記憶體 (1小時)

    async def get_skills_by_type(type: str, count: int) -> List[Skill]:
        """根據屬性獲取技能"""
        - 優先選擇同屬性 (8個)
        - 補充一般系 (2個)
        - 隨機其他屬性 (2個)
        - 確保威力分布合理
```

### 4. Battle Service
```python
class BattleService:
    """戰鬥邏輯服務"""

    def calculate_damage(request: DamageCalculationRequest) -> DamageCalculation:
        """計算傷害"""
        - 基礎傷害 = (攻擊力/防禦力) * 技能威力 * 屬性克制
        - 暴擊判定 (10% 機率, x1.5 傷害)
        - 隨機波動 (0.85 ~ 1.0)
        - 返回結果

    def get_type_effectiveness(atk_type: str, def_type: str) -> float:
        """獲取屬性相剋倍率"""
        - 查表返回 0.5, 1.0, 或 2.0
        - 支援 18 種屬性
```

### 5. WebSocket Manager
```python
class ConnectionManager:
    """WebSocket 連線管理"""

    async def connect(websocket: WebSocket, room_code: str):
        """接受新連線"""
        - 驗證房間存在
        - 加入房間連線池
        - 廣播新成員加入

    async def broadcast(room_code: str, message: dict):
        """廣播訊息到房間所有成員"""
        - 序列化訊息為 JSON
        - 發送給房間內所有活躍連線

    async def disconnect(websocket: WebSocket, room_code: str):
        """處理斷線"""
        - 從連線池移除
        - 廣播成員離開
        - 清理資源
```

---

## WebSocket 協議

### 訊息格式
所有 WebSocket 訊息使用 JSON 格式:
```json
{
  "type": "message_type",
  "data": { ... },
  "timestamp": "2025-11-02T10:30:00Z"
}
```

### 客戶端 → 服務器

#### 1. 加入房間
```json
{
  "type": "join_room",
  "data": {
    "pokemon_id": "uuid",
    "user_id": "optional"
  }
}
```

#### 2. 準備就緒
```json
{
  "type": "ready",
  "data": {
    "is_ready": true
  }
}
```

#### 3. 選擇技能
```json
{
  "type": "select_skill",
  "data": {
    "skill_id": "ember",
    "turn": 1
  }
}
```

#### 4. 離開房間
```json
{
  "type": "leave_room",
  "data": {}
}
```

### 服務器 → 客戶端

#### 1. 房間狀態更新
```json
{
  "type": "room_update",
  "data": {
    "status": "waiting",  // waiting, ready, battle, finished
    "members": [
      {"pokemon_id": "...", "is_ready": true},
      ...
    ],
    "member_count": 3
  }
}
```

#### 2. 戰鬥開始
```json
{
  "type": "battle_start",
  "data": {
    "boss": {
      "name": "Boss Pokemon",
      "type": "dragon",
      "hp": 2000,
      "max_hp": 2000
    },
    "turn": 1
  }
}
```

#### 3. 回合結果
```json
{
  "type": "turn_result",
  "data": {
    "turn": 1,
    "actions": [
      {
        "attacker_id": "pokemon1",
        "skill_name": "火焰放射",
        "damage": 150,
        "is_critical": false,
        "effectiveness": 2.0
      },
      ...
    ],
    "boss_hp": 1700,
    "next_turn": 2
  }
}
```

#### 4. Boss 攻擊
```json
{
  "type": "boss_attack",
  "data": {
    "skill_name": "龍之怒",
    "targets": [
      {
        "pokemon_id": "...",
        "damage": 80,
        "remaining_hp": 20
      },
      ...
    ]
  }
}
```

#### 5. 戰鬥結束
```json
{
  "type": "battle_end",
  "data": {
    "result": "win",  // win, lose
    "battle_id": "uuid",
    "statistics": {
      "total_turns": 15,
      "total_damage": 2500
    }
  }
}
```

#### 6. 錯誤訊息
```json
{
  "type": "error",
  "data": {
    "code": "INVALID_SKILL",
    "message": "技能不存在"
  }
}
```

---

## 部署指南

### 本地開發環境設置

#### 1. 安裝 Python 依賴
```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows

# 安裝依賴
pip install -r requirements.txt
```

#### 2. 配置環境變數
```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 填入真實的 API keys
# - SUPABASE_URL, SUPABASE_KEY
# - GEMINI_API_KEY
# - POKEMON_MOVES_SHEET_ID
```

#### 3. 啟動開發服務器
```bash
python -m app.main

# 或使用 uvicorn 直接啟動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. 訪問 API 文檔
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 生產環境部署

#### 選項 1: Railway / Render
1. 連接 GitHub 倉庫
2. 設置環境變數
3. 自動部署

#### 選項 2: VPS (Ubuntu)
```bash
# 安裝 Python 3.10+
sudo apt update
sudo apt install python3.10 python3-pip

# 克隆專案
git clone <repo-url>
cd backend

# 安裝依賴
pip install -r requirements.txt

# 使用 systemd 或 supervisor 管理服務
# 或使用 PM2 for Python
```

#### 選項 3: Supabase Functions (Edge Functions)
- 可以直接部署到 Supabase Edge Functions
- 支援 Deno 環境

### 環境變數清單

必須配置的環境變數:
```
SUPABASE_URL=*
SUPABASE_KEY=*
SUPABASE_SERVICE_KEY=*
GEMINI_API_KEY=*
POKEMON_MOVES_SHEET_ID=*
SECRET_KEY=*
```

可選配置:
```
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourfrontend.com
```

---

## 錯誤處理與 Fallback 機制

### AI 處理失敗
- **屬性判斷失敗** → 預設返回 "normal" (一般屬性)
- **背面生成失敗** → 使用鏡像圖片或預設背面圖

### Google Sheets 失敗
- **API 失敗** → 使用記憶體快取的舊資料
- **初次啟動** → 預先載入一組預設技能

### WebSocket 斷線
- **心跳檢測** → 每 30 秒發送 ping
- **自動重連** → 前端實作斷線重連邏輯
- **狀態恢復** → 從資料庫恢復房間狀態

### 資料庫錯誤
- **連線失敗** → 重試 3 次
- **查詢超時** → 返回友善錯誤訊息

---

## 性能優化

### 快取策略
- **技能資料**: 記憶體快取 1 小時
- **屬性相剋表**: 啟動時載入，永久快取

### 非同步處理
- **圖片處理**: 背景任務處理，不阻塞 API
- **AI 調用**: 使用 asyncio 併發處理

### 連線池
- **資料庫連線**: Supabase 自動管理
- **WebSocket**: 使用 ConnectionManager 管理

---

## 測試

### 手動測試
```bash
# 測試健康檢查
curl http://localhost:8000/health

# 測試獲取屬性列表
curl http://localhost:8000/api/v1/types

# 測試圖片上傳
curl -X POST http://localhost:8000/api/v1/pokemon/upload \
  -F "file=@test_image.png"
```

### WebSocket 測試
可以使用 `wscat` 工具:
```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/room/ABC123
```

---

## 常見問題

### Q: 如何更新技能資料？
A: 直接在 Google Sheets 中編輯，快取會在 1 小時後自動更新。或重啟服務器立即更新。

### Q: Boss HP 如何計算？
A: `Boss HP = BOSS_BASE_HP + (玩家數量 * BOSS_HP_PER_PLAYER)`
   預設: 1000 + (玩家數 * 500)

### Q: 支援多少人同時對戰？
A: 每個房間最多 4 人 (`MAX_PLAYERS_PER_ROOM=4`)

### Q: 圖片儲存在哪裡？
A: 本地檔案系統 `./uploads/` 目錄。生產環境建議使用 S3 或 Supabase Storage。

---

## 後續擴展建議

### 短期 (1週內)
- [ ] 實作圖片存儲到 Supabase Storage
- [ ] 增加更多 Boss 類型
- [ ] 實作排行榜系統

### 中期 (1個月)
- [ ] 用戶認證系統 (JWT)
- [ ] 戰鬥回放功能
- [ ] 更複雜的戰鬥機制 (狀態異常、buff/debuff)

### 長期 (3個月+)
- [ ] 寶可夢進化系統
- [ ] 道具系統
- [ ] 社交功能 (好友、聊天)

---

## 聯絡資訊

- **開發者**: cypher5566
- **專案**: GenPoke Backend - AI Game Jam 2025
- **版本**: 1.0.0

**最後更新**: 2025-11-02
