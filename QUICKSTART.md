# GenPoke 快速部署指南 🚀

> 15 分鐘內完成前後端部署

## ⏱️ 快速流程

```
後端部署 (5 min) → 前端配置 (3 min) → 前端部署 (5 min) → 測試 (2 min)
```

---

## 1️⃣ 後端部署（Railway）- 5 分鐘

### 1.1 創建 Railway 專案
1. 訪問 https://railway.app/ 並登入
2. 點擊 **"New Project"** → **"Deploy from GitHub repo"**
3. 選擇倉庫: `1101_Game_Jam`

### 1.2 配置專案
- **Root Directory**: `backend`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 1.3 設定環境變數（必填）

點擊 **Variables** 標籤，添加：

```bash
SUPABASE_URL=https://wppzmyspoxwpawtdffec.supabase.co
SUPABASE_KEY=你的anon_key
SUPABASE_SERVICE_KEY=你的service_role_key
GEMINI_API_KEY=你的gemini_key
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-app.vercel.app
SECRET_KEY=隨機生成一個32字元密鑰
```

### 1.4 部署並獲取 URL

- 點擊 **Deploy** 等待 5-8 分鐘
- 部署完成後，複製 Railway 給你的 URL（如 `https://xxx.up.railway.app`）

### 1.5 測試後端

訪問 `https://你的railway_url/health`，應該返回：
```json
{"status": "healthy"}
```

---

## 2️⃣ 前端配置（Vercel 環境變數）- 3 分鐘

### 2.1 登入 Vercel
訪問 https://vercel.com/ 並登入

### 2.2 創建新專案
1. **"Add New Project"**
2. 選擇倉庫: `1101_Game_Jam`
3. **Root Directory**: `frontend/pokemon-battle`

### 2.3 配置環境變數

在 **Environment Variables** 添加：

| 變數名 | 值 |
|--------|-----|
| `EXPO_PUBLIC_API_URL` | `https://你的railway_url` |
| `EXPO_PUBLIC_WS_URL` | `wss://你的railway_url` |

⚠️ 注意: WebSocket 用 `wss://` 而非 `https://`

### 2.4 部署

點擊 **Deploy** - Vercel 會自動構建。

---

## 3️⃣ 回頭更新後端 CORS - 1 分鐘

### 3.1 獲取前端 URL

Vercel 部署完成後，複製你的前端 URL（如 `https://your-app.vercel.app`）

### 3.2 更新 Railway 環境變數

回到 Railway → Variables：

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app
```

點擊 **Save** - Railway 會自動重啟服務。

---

## 4️⃣ 數據庫設置 - 3 分鐘

### 4.1 執行 SQL 遷移

1. 登入 Supabase → SQL Editor
2. 複製並執行 `backend/migrations/001_initial_schema.sql`
3. 複製並執行 `backend/migrations/002_skills_table.sql`

### 4.2 匯入技能資料

```bash
cd backend
python scripts/import_skills.py
```

應該看到: `✅ 已匯入 923/923 個技能`

---

## 5️⃣ 測試部署 - 2 分鐘

### 5.1 測試前端

訪問你的 Vercel URL，應該能看到遊戲畫面。

### 5.2 測試 API 連接

打開瀏覽器 Console (F12)，檢查是否有 CORS 或連接錯誤。

### 5.3 測試完整流程

1. 上傳圖片 → 應該能看到處理中的狀態
2. 創建房間 → 應該能獲得房間代碼
3. 加入房間 → WebSocket 應該能連接

---

## ✅ 部署完成檢查清單

- [ ] 後端 `/health` 可訪問
- [ ] 後端 `/docs` 可訪問（Swagger UI）
- [ ] 前端網頁可正常載入
- [ ] 瀏覽器 Console 無 CORS 錯誤
- [ ] 圖片上傳功能正常
- [ ] 房間創建功能正常
- [ ] WebSocket 連接正常

---

## 🐛 常見問題快速修復

### 問題: 前端顯示 "Network Error"

**檢查順序**:
1. ✅ Railway 後端是否在運行？（訪問 /health）
2. ✅ Vercel 環境變數 `EXPO_PUBLIC_API_URL` 是否正確？
3. ✅ Railway 的 `ALLOWED_ORIGINS` 是否包含 Vercel URL？

### 問題: WebSocket 連接失敗

**檢查**:
- ✅ 使用 `wss://` 而非 `ws://`
- ✅ Railway URL 後面不要有斜線（`wss://xxx.railway.app` ✅ 而非 `wss://xxx.railway.app/` ❌）

### 問題: 圖片上傳失敗

**檢查**:
- ✅ Gemini API Key 是否正確？
- ✅ Supabase 連線是否正常？
- ✅ 查看 Railway Logs 有無錯誤訊息

---

## 📚 詳細文檔

如需更詳細的部署說明，請參閱:
- **完整部署指南**: `DEPLOYMENT.md`
- **後端文檔**: `backend/CLAUDE.md`
- **環境變數模板**:
  - 前端: `frontend/pokemon-battle/.env.example`
  - 後端: `backend/.env.example`

---

## 🎉 部署成功！

現在你可以：
- 分享你的 Vercel URL 給測試者
- 在 README.md 添加 Demo 連結
- 開始測試多人對戰功能

**預祝 Game Jam 順利！** 🎮
