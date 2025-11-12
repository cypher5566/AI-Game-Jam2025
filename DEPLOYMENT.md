# GenPoke 部署指南

> AI Game Jam 2025 - 完整部署流程

##   📋 目錄

- [概覽](#概覽)
- [前端部署（Vercel）](#前端部署vercel)
- [後端部署](#後端部署)
  - [方案 A: Railway](#方案-a-railway推薦)
  - [方案 B: Render](#方案-b-render)
- [環境變數配置](#環境變數配置)
- [數據庫遷移](#數據庫遷移)
- [故障排除](#故障排除)

---

## 概覽

GenPoke 採用**前後端分離架構**：

```
前端 (Vercel)  →  後端 (Railway/Render)  →  Supabase
     ↓                    ↓                        ↓
React Native Web    FastAPI + WebSocket      PostgreSQL
```

### 部署順序

1. ✅ **後端先部署** - 獲取 API URL
2. ✅ **配置前端** - 設定後端 URL
3. ✅ **前端部署** - Vercel 自動構建

---

## 前端部署（Vercel）

### 步驟 1: 準備工作

**檢查配置文件**（已由 Claude 創建）：
- `frontend/pokemon-battle/vercel.json` - 構建配置
- `frontend/pokemon-battle/.vercelignore` - 忽略文件
- `frontend/pokemon-battle/.env.example` - 環境變數模板

### 步驟 2: 連接 GitHub

1. 登入 [Vercel](https://vercel.com/)
2. 點擊 **"Add New Project"**
3. 選擇 GitHub 倉庫: `1101_Game_Jam`
4. **重要**: 設定 **Root Directory** 為 `frontend/pokemon-battle`

### 步驟 3: 配置構建設定

在 Vercel 專案設定頁面：

**Framework Preset**: `Other`

**Build Command**:
```bash
npm run vercel-build
```

**Output Directory**: `dist`

**Install Command**:
```bash
npm install
```

### 步驟 4: 設定環境變數

在 Vercel Dashboard → Settings → Environment Variables 添加：

| 變數名 | 值 | 說明 |
|--------|-----|------|
| `EXPO_PUBLIC_API_URL` | `https://your-backend.railway.app` | 後端 API URL（部署後端後獲得） |
| `EXPO_PUBLIC_WS_URL` | `wss://your-backend.railway.app` | WebSocket URL（同上，改為 wss）|

⚠️ **注意**: 先部署後端，獲取 URL 後再設定這些變數

### 步驟 5: 部署

點擊 **"Deploy"** - Vercel 會自動：
1. Clone 代碼
2. 安裝依賴
3. 執行 `expo export:web`
4. 部署到 CDN

**預計時間**: 3-5 分鐘

### 步驟 6: 驗證

部署成功後訪問 Vercel 提供的 URL（如 `https://your-app.vercel.app`），應該能看到遊戲畫面。

---

## 後端部署

選擇以下任一方案：

---

## 方案 A: Railway（推薦）

✅ **優點**: 簡單、快速、完整 WebSocket 支援、免費額度足夠

### 步驟 1: 創建 Railway 專案

1. 登入 [Railway](https://railway.app/)
2. 點擊 **"New Project"**
3. 選擇 **"Deploy from GitHub repo"**
4. 選擇倉庫: `1101_Game_Jam`

### 步驟 2: 配置 Root Directory

在 Railway Settings:
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 步驟 3: 設定環境變數

在 Railway → Variables 添加以下變數：

```bash
# 必填
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
GEMINI_API_KEY=AIza...

# 伺服器配置
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000

# CORS（替換為你的 Vercel URL）
ALLOWED_ORIGINS=https://your-app.vercel.app

# 安全密鑰（Railway 會自動生成）
SECRET_KEY=${{ RAILWAY_STATIC_URL }}

# WebSocket
WS_HEARTBEAT_INTERVAL=30
WS_TIMEOUT=300

# Boss 配置
BOSS_BASE_HP=1000
BOSS_HP_PER_PLAYER=500
MAX_PLAYERS_PER_ROOM=4
```

### 步驟 4: 部署

點擊 **"Deploy"** - Railway 會自動：
1. 偵測 Python 環境
2. 安裝依賴 (`requirements.txt`)
3. 啟動 FastAPI 服務

**預計時間**: 5-8 分鐘

### 步驟 5: 獲取 URL

部署成功後，Railway 會提供一個 URL（如 `https://your-project.up.railway.app`）

**測試 API**:
```bash
curl https://your-project.up.railway.app/health
```

應該返回: `{"status":"healthy"}`

### 步驟 6: 執行數據庫遷移

**方法 1: 使用 Supabase Dashboard**（推薦）
1. 登入 Supabase → SQL Editor
2. 執行 `backend/migrations/001_initial_schema.sql`
3. 執行 `backend/migrations/002_skills_table.sql`

**方法 2: 使用 Railway Shell**
```bash
# 在 Railway Console 執行
cd backend
# 需要手動透過 Supabase API 或 psql 執行
```

### 步驟 7: 匯入技能資料

```bash
# 本地執行（需要配置 .env）
cd backend
python scripts/import_skills.py
```

---

## 方案 B: Render

✅ **優點**: 免費層、自動 SSL、易用

### 步驟 1: 創建 Web Service

1. 登入 [Render](https://render.com/)
2. 點擊 **"New +" → "Web Service"**
3. 連接 GitHub 倉庫

### 步驟 2: 配置服務

| 設定項 | 值 |
|--------|-----|
| Name | genpoke-backend |
| Root Directory | `backend` |
| Environment | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

### 步驟 3: 設定環境變數

在 Render → Environment 添加（同 Railway）。

### 步驟 4: 部署

點擊 **"Create Web Service"** - 自動部署。

**預計時間**: 8-10 分鐘（Render 免費層較慢）

### 步驟 5: 驗證

訪問 `https://your-service.onrender.com/docs` 查看 API 文檔。

---

## 環境變數配置

### 前端環境變數

**本地開發** (`.env.local`):
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_WS_URL=ws://localhost:8000
```

**生產環境** (Vercel Dashboard):
```bash
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
EXPO_PUBLIC_WS_URL=wss://your-backend.railway.app
```

### 後端環境變數

**必填項目**:
```bash
# Supabase（從 Supabase Dashboard 獲取）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Gemini AI（從 Google AI Studio 獲取）
GEMINI_API_KEY=AIza...

# 安全密鑰（生產環境務必更換）
SECRET_KEY=your-random-secret-key-min-32-chars
```

**可選項目**:
```bash
# 伺服器
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000

# CORS（允許的前端 URL）
ALLOWED_ORIGINS=https://your-app.vercel.app

# 上傳（Serverless 環境建議使用 Supabase Storage）
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760

# WebSocket
WS_HEARTBEAT_INTERVAL=30
WS_TIMEOUT=300

# Boss 配置
BOSS_BASE_HP=1000
BOSS_HP_PER_PLAYER=500
MAX_PLAYERS_PER_ROOM=4
```

---

## 數據庫遷移

### 執行 SQL 遷移

**方法 1: Supabase Dashboard**（推薦）

1. 登入 [Supabase](https://supabase.com/) → 選擇專案
2. 左側菜單 → **SQL Editor**
3. 複製 `backend/migrations/001_initial_schema.sql` 內容
4. 貼上並點擊 **"Run"**
5. 重複步驟 3-4 執行 `002_skills_table.sql`

**方法 2: psql 命令行**

```bash
# 從 Supabase Settings → Database 獲取連接字串
psql 'postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres' \
  -f backend/migrations/001_initial_schema.sql

psql 'postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres' \
  -f backend/migrations/002_skills_table.sql
```

### 匯入技能資料

**步驟 1: 確保資料庫遷移已完成**

檢查 `skills` 表是否存在：
```sql
SELECT COUNT(*) FROM skills;
```

**步驟 2: 執行導入腳本**

```bash
cd backend

# 確保 .env 已配置 Supabase 連線資訊
python scripts/import_skills.py
```

應該看到：
```
✅ 讀取到 923 個技能
🔗 連接 Supabase...
✅ 已匯入 923/923 個技能
🎉 匯入完成！
```

---

## 故障排除

### Vercel 部署失敗

**問題**: `Error: No Output Directory named "web-build" found`

**解決**:
- ✅ 確認 `vercel.json` 中 `distDir` 為 `"dist"`
- ✅ 確認 `package.json` 有 `"vercel-build": "expo export:web"`

---

**問題**: 前端無法連接後端 API

**檢查**:
1. 確認後端已部署並可訪問（訪問 `/health` 端點）
2. 確認 Vercel 環境變數 `EXPO_PUBLIC_API_URL` 正確
3. 確認後端 `ALLOWED_ORIGINS` 包含 Vercel URL
4. 檢查瀏覽器 Console 是否有 CORS 錯誤

---

### Railway/Render 部署失敗

**問題**: `ModuleNotFoundError: No module named 'xxx'`

**解決**:
- 確認 `requirements.txt` 包含所有依賴
- 重新觸發部署（有時是暫時性問題）

---

**問題**: WebSocket 連接失敗

**檢查**:
1. 確認使用 `wss://`（生產環境）而非 `ws://`
2. 確認 Railway/Render 支援 WebSocket（都支援）
3. 檢查防火牆設定

---

### 數據庫問題

**問題**: `relation "skills" does not exist`

**解決**:
- 執行 `002_skills_table.sql` 遷移文件

---

**問題**: 技能匯入失敗

**檢查**:
1. 確認 `data/Pokemon-skillsets.csv` 存在
2. 確認 Supabase 連線正常（檢查環境變數）
3. 確認 `skills` 表已創建

---

## 部署檢查清單

### 前端（Vercel）

- [ ] 連接 GitHub 倉庫
- [ ] 設定 Root Directory 為 `frontend/pokemon-battle`
- [ ] 配置環境變數（`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WS_URL`）
- [ ] 驗證構建成功
- [ ] 測試網頁可正常訪問

### 後端（Railway/Render）

- [ ] 連接 GitHub 倉庫
- [ ] 設定 Root Directory 為 `backend`
- [ ] 配置所有必填環境變數
- [ ] 驗證部署成功（訪問 `/health`）
- [ ] 訪問 `/docs` 查看 API 文檔
- [ ] 執行數據庫遷移
- [ ] 匯入技能資料
- [ ] 測試 API 端點
- [ ] 測試 WebSocket 連接

### Supabase

- [ ] 創建專案
- [ ] 執行 SQL 遷移（2 個文件）
- [ ] 驗證表結構正確
- [ ] 確認技能資料已匯入（923 條）
- [ ] 配置 RLS（目前已關閉，Game Jam 可接受）

### 整合測試

- [ ] 前端可連接後端 API
- [ ] 圖片上傳功能正常
- [ ] AI 屬性判斷正常
- [ ] 技能查詢正常
- [ ] 房間創建正常
- [ ] WebSocket 連接正常
- [ ] 多人對戰功能正常

---

## 額外資源

- **Vercel 文檔**: https://vercel.com/docs
- **Railway 文檔**: https://docs.railway.app
- **Render 文檔**: https://render.com/docs
- **Supabase 文檔**: https://supabase.com/docs
- **FastAPI 部署**: https://fastapi.tiangolo.com/deployment/

---

**部署完成後，記得更新 README.md 中的線上 Demo 連結！** 🎉
