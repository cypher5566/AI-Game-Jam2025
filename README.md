# GenPoke - AI Game Jam 2025

寶可夢風格的多人對戰遊戲，使用 AI 生成你的專屬寶可夢！

## 📋 專案簡介

GenPoke 是一款結合 AI 圖像生成技術的寶可夢風格對戰遊戲。玩家可以上傳圖片，經由 AI 處理後生成專屬的像素化寶可夢，並進行多人連線對戰。

## 📁 專案結構

```
AI-Game-Jam2025/
├── frontend/              # 前端開發區域
└── backend/               # 後端開發區域
    ├── app/
    │   ├── main.py        # FastAPI 主應用
    │   ├── config.py      # 配置管理
    │   ├── database.py    # Supabase 連接
    │   ├── models/        # 資料模型
    │   ├── routers/       # API 路由
    │   ├── services/      # 業務邏輯
    │   └── utils/         # 工具函數
    ├── migrations/        # 資料庫遷移
    └── requirements.txt
```

## 👥 團隊分工

- **Backend**: cypher5566
- **Frontend**: bbkuan

---

## 🎨 Frontend 前端

### 負責人
待定

### 技術棧

- **框架**: React Native + Expo (v54.0)
- **語言**: TypeScript
- **導航**: React Navigation (Native Stack)
- **狀態管理**: React Context + useReducer
- **UI 動畫**: React Native Reanimated
- **部署**: 支援 Web, iOS, Android

### 專案結構

```
pokemon-battle/
├── src/
│   ├── assets/           # 資源管理
│   ├── components/       # 可重用組件
│   │   ├── HPBar.tsx
│   │   ├── PokemonSprite.tsx
│   │   └── PlaceholderAsset.tsx
│   ├── contexts/         # React Context
│   │   └── GameContext.tsx
│   ├── data/            # 遊戲資料
│   │   ├── dialogues.ts
│   │   ├── maps.ts
│   │   └── pokemon.ts
│   ├── hooks/           # 自定義 Hooks
│   ├── screens/         # 遊戲畫面
│   │   ├── StartScreen.tsx
│   │   ├── DialogueScreen.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── SkillSelectionScreen.tsx
│   │   ├── BattleScreen.tsx
│   │   └── ErrorScreen.tsx
│   ├── services/        # API 服務
│   │   ├── pokemonMovesAPI.ts
│   │   └── skillPreloader.ts
│   └── types/           # TypeScript 類型定義
└── package.json
```

### 快速開始

#### 安裝依賴

```bash
cd frontend/pokemon-battle
npm install
```

#### 啟動開發服務器

```bash
# 啟動 Expo 開發服務器
npm start

# 在網頁瀏覽器中運行
npm run web

# 在 Android 模擬器中運行
npm run android

# 在 iOS 模擬器中運行
npm run ios
```

#### 建置 Web 版本

```bash
npm run build:web
```

### ✅ 已完成功能

#### Phase 1: 基礎系統 ✅
- [x] React Native + Expo 專案設置
- [x] TypeScript 配置
- [x] 遊戲狀態管理 (GameContext)
- [x] 螢幕導航系統
- [x] 基礎 UI 組件 (HP Bar, Pokemon Sprite)

#### Phase 2: 遊戲流程 ✅
- [x] 開始畫面 (StartScreen)
- [x] 對話系統 (DialogueScreen)
  - [x] 劇情對話
  - [x] 寶可夢暱稱輸入
- [x] 地圖探索系統 (MapScreen)
  - [x] 玩家移動
  - [x] 隨機遇敵機制
- [x] 載入畫面 (LoadingScreen)
- [x] 錯誤處理畫面 (ErrorScreen)

#### Phase 3: 技能系統 ✅
- [x] Google Sheets API 整合
- [x] 技能獲取 API (pokemonMovesAPI.ts)
- [x] 技能預加載服務 (skillPreloader.ts)
  - [x] 24 技能緩衝池
  - [x] 背景預加載機制
- [x] 技能選擇畫面 (SkillSelectionScreen)
  - [x] 從 12 個隨機技能中選擇 4 個

#### Phase 4: 戰鬥系統 ✅
- [x] 戰鬥畫面 (BattleScreen)
- [x] 回合制戰鬥邏輯
- [x] 技能使用系統
- [x] HP 條動畫
- [x] 戰鬥日誌
- [x] 勝負判定

### 🚧 待完成功能

#### Phase 5: 後端整合 🚧
- [ ] 圖片上傳功能
- [ ] 後端 API 整合
  - [ ] 寶可夢創建 API 連接
  - [ ] 圖片處理狀態查詢
- [ ] AI 生成寶可夢顯示

#### Phase 6: 戰鬥強化 🚧
- [ ] 戰鬥流程改版
  - [ ] 新增 VS 過場畫面（1-2秒自動消失）
  - [ ] 技能選擇改為戰鬥畫面上的卡片 overlay
  - [ ] 保持 4輪3選1 技能選擇邏輯
  - [ ] 整合選卡介面到戰鬥背景上層顯示
- [ ] 屬性相剋系統整合
- [ ] 傷害計算 API 整合
- [ ] 戰鬥動畫強化
- [ ] 音效和背景音樂

#### Phase 7: 多人連線 ⏳
- [ ] WebSocket 客戶端
- [ ] 房間創建/加入
- [ ] 即時對戰同步
- [ ] Boss 戰系統

#### Phase 8: 優化與美化 ⏳
- [ ] UI/UX 優化
- [ ] 響應式設計
- [ ] 資源優化
- [ ] 性能優化

### 🔌 API 整合

#### Google Sheets API (已整合)

技能資料 API 端點：
```
https://script.google.com/macros/s/AKfycbyvDy_1ke3ko9vP4N5GkkY_9nwxrlDwXrDWv8VZDSwtANaNlCTZVC2jvtOVx_4x-ga06Q/exec
```

參數：
- `type1`: 寶可夢主屬性（必填）
- `type2`: 寶可夢副屬性（可選）

詳細文件請參考：[Pokemon_Moves_API_Documentation.md](./frontend/Pokemon_Moves_API_Documentation.md)

#### Backend API (待整合)

待整合的後端端點：
- `POST /api/v1/pokemon/upload` - 上傳圖片
- `GET /api/v1/pokemon/process/{upload_id}` - 查詢處理狀態
- `POST /api/v1/pokemon/create` - 創建寶可夢
- `GET /api/v1/pokemon/{pokemon_id}` - 獲取寶可夢資料

### 📱 遊戲流程

1. **開始遊戲** → 顯示遊戲標題和開始按鈕
2. **劇情對話** → 教授介紹遊戲，玩家為寶可夢命名
3. **技能預加載** → 背景載入 24 個技能到緩衝池
4. **地圖探索** → 玩家在地圖上移動，觸發隨機遇敵
5. **技能選擇** → 從 12 個技能中選擇 4 個作為寶可夢招式
6. **戰鬥** → 回合制戰鬥，使用選擇的技能
7. **戰鬥結束** → 返回地圖，背景預加載下一批技能

### 🎮 操作說明

- **鍵盤控制**（Web 版本）
  - 方向鍵：移動角色
  - Enter/Space：確認/對話

- **觸控控制**（移動版本）
  - 點擊按鈕進行操作
  - 滑動移動角色（待實作）

---

## 🚀 Backend 後端

### 快速開始

#### 1. 安裝依賴

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows

# 安裝依賴
cd backend
pip install -r requirements.txt
```

#### 2. 配置環境變數

```bash
# 複製範例檔案
cd backend
cp .env.example .env

# 編輯 .env 填入真實的值
# 必須配置:
# - SUPABASE_URL
# - SUPABASE_KEY
# - SUPABASE_SERVICE_KEY
# - GEMINI_API_KEY
# - POKEMON_MOVES_SHEET_ID
# - SECRET_KEY
```

#### 3. 設置資料庫

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 進入 SQL Editor
3. 執行 `backend/migrations/001_initial_schema.sql` 中的 SQL

#### 4. 啟動服務器

```bash
# 開發模式（自動重載）
cd backend
python -m app.main

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 5. 訪問 API 文檔

服務器啟動後，訪問：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康檢查**: http://localhost:8000/health

### 📡 API 端點

#### 基礎端點

- `GET /` - API 資訊
- `GET /health` - 健康檢查
- `GET /api/v1/types` - 獲取寶可夢屬性列表

#### Pokemon 圖片處理

- `POST /api/v1/pokemon/upload` - 上傳圖片
- `GET /api/v1/pokemon/process/{upload_id}` - 獲取處理結果
- `POST /api/v1/pokemon/create` - 創建寶可夢記錄
- `GET /api/v1/pokemon/{pokemon_id}` - 獲取寶可夢資料

#### 測試流程

```bash
# 1. 上傳圖片
curl -X POST http://localhost:8000/api/v1/pokemon/upload \
  -F "file=@test_image.png"

# 返回: {"success": true, "upload_id": "xxx-xxx-xxx"}

# 2. 查詢處理狀態
curl http://localhost:8000/api/v1/pokemon/process/xxx-xxx-xxx

# 3. 創建寶可夢
curl -X POST http://localhost:8000/api/v1/pokemon/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "小火龍",
    "type": "fire",
    "front_image": "data:image/png;base64,...",
    "back_image": "data:image/png;base64,..."
  }'
```

### ✅ 已完成功能

#### Phase 1: 基礎建設 ✅
- [x] FastAPI 專案結構
- [x] Supabase 資料庫連接
- [x] 環境變數管理
- [x] 資料庫 Schema 設計
- [x] 基礎 API 端點
- [x] 系統架構文檔

#### Phase 2: 圖片處理 ✅
- [x] 圖片上傳 API
- [x] 像素化處理 (32x32)
- [x] AI 屬性判斷 (Gemini Vision)
- [x] 背面圖片生成 (含 fallback 鏡像)

#### Phase 3: 技能系統 🚧
- [ ] Google Sheets 整合
- [ ] 技能獲取 API

#### Phase 4: 戰鬥系統 🚧
- [ ] 傷害計算 API
- [ ] 屬性相剋表 API

#### Phase 5: 多人連線 ⏳
- [ ] WebSocket 基礎架構
- [ ] 房間系統
- [ ] Boss 戰邏輯

### 🔧 開發建議

#### 測試圖片上傳

建議使用一張簡單的測試圖片，例如：
- 紅色/橙色的圖片 → AI 可能判斷為 fire
- 藍色的圖片 → AI 可能判斷為 water
- 綠色的圖片 → AI 可能判斷為 grass

#### Fallback 機制

- **AI 屬性判斷失敗** → 返回 "normal"
- **背面生成失敗** → 使用鏡像圖片
- **圖片處理失敗** → 返回友善錯誤訊息

### 🐛 常見問題

**Q: Gemini API 報錯？**
A: 檢查 `GEMINI_API_KEY` 是否正確設置，並確保有足夠的配額。

**Q: Supabase 連接失敗？**
A: 確認 `.env` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 正確。

**Q: 圖片處理很慢？**
A: 處理是異步的，可以通過 `GET /api/v1/pokemon/process/{upload_id}` 查詢狀態。

**Q: 上傳的圖片儲存在哪？**
A: `backend/uploads/` 目錄。處理完成後會自動清理。

---

## 📚 詳細文檔

- [後端系統架構文檔](./backend/ARCHITECTURE.md) - 完整的系統設計和 API 規範
- [資料庫遷移指南](./backend/migrations/README.md) - 資料庫設置指南

---

## 🎯 開發路線圖

1. **Phase 3**: 整合 Google Sheets 技能資料
2. **Phase 4**: 實作戰鬥計算邏輯
3. **Phase 5**: 建立 WebSocket 多人系統

---

## 📝 版本資訊

- **專案**: GenPoke
- **版本**: 1.0.0
- **最後更新**: 2025-11-02
