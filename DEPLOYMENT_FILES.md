# 部署配置文件清單

> Claude 為你創建的所有部署相關文件

## 📦 新增文件總覽

### 前端配置文件

#### `/frontend/pokemon-battle/vercel.json` ✅ 已修復
**修改內容**:
```json
{
  "config": {
    "distDir": "dist"  // ← 修復：原為 "web-build"
  }
}
```
**作用**: Vercel 構建配置，指定輸出目錄為 Expo 54+ 的 `dist/`

---

#### `/frontend/pokemon-battle/.vercelignore` ✨ 新建
**作用**: 排除不必要的文件，加速 Vercel 部署
**內容**: node_modules, .expo, dist, .env 等

---

#### `/frontend/pokemon-battle/.env.example` ✨ 新建
**作用**: 前端環境變數模板
**必填變數**:
- `EXPO_PUBLIC_API_URL` - 後端 API URL
- `EXPO_PUBLIC_WS_URL` - WebSocket URL

---

### 後端配置文件

#### `/backend/railway.json` ✨ 新建
**作用**: Railway 平台部署配置（推薦）
**內容**:
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

#### `/backend/render.yaml` ✨ 新建
**作用**: Render 平台部署配置（替代方案）
**特點**: 包含環境變數模板、自動 SSL、免費層配置

---

#### `/backend/.env.example` ✅ 已更新
**更新內容**:
- 添加詳細註釋
- 分類組織（Supabase、Gemini、Server、CORS）
- 添加獲取 API Key 的連結
- 本地/生產環境配置範例

---

### 文檔文件

#### `/DEPLOYMENT.md` ✨ 新建 (主文檔)
**完整內容**:
- ✅ 前端部署（Vercel）詳細步驟
- ✅ 後端部署兩種方案：
  - 方案 A: Railway（推薦）
  - 方案 B: Render
- ✅ 環境變數完整說明
- ✅ 數據庫遷移指南
- ✅ 故障排除清單
- ✅ 部署檢查清單

**字數**: ~2500 字（超詳細）

---

#### `/QUICKSTART.md` ✨ 新建 (快速指南)
**15 分鐘快速部署**:
1. 後端部署（Railway）- 5 分鐘
2. 前端配置（Vercel）- 3 分鐘
3. 更新 CORS - 1 分鐘
4. 數據庫設置 - 3 分鐘
5. 測試 - 2 分鐘

**適合**: 趕時間、需要快速上線

---

#### `/DEPLOYMENT_FILES.md` ✨ 新建 (本文件)
**作用**: 所有部署文件的索引和說明

---

## 🎯 使用指南

### 如果你想...

#### 📱 部署到 Vercel (前端)
**查看**:
1. `QUICKSTART.md` 的「前端配置」章節（簡版）
2. `DEPLOYMENT.md` 的「前端部署（Vercel）」章節（詳版）

**需要的文件**:
- `frontend/pokemon-battle/vercel.json` ✅
- `frontend/pokemon-battle/.vercelignore` ✅
- `frontend/pokemon-battle/.env.example` ✅

---

#### 🚂 部署到 Railway (後端)
**查看**:
1. `QUICKSTART.md` 的「後端部署」章節（簡版）
2. `DEPLOYMENT.md` 的「方案 A: Railway」章節（詳版）

**需要的文件**:
- `backend/railway.json` ✅
- `backend/.env.example` ✅

---

#### 🎨 部署到 Render (後端)
**查看**: `DEPLOYMENT.md` 的「方案 B: Render」章節

**需要的文件**:
- `backend/render.yaml` ✅
- `backend/.env.example` ✅

---

## 📝 環境變數設定

### 前端（Vercel Dashboard）
```bash
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
EXPO_PUBLIC_WS_URL=wss://your-backend.railway.app
```

### 後端（Railway/Render Dashboard）
```bash
# 必填
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
GEMINI_API_KEY=AIza...
SECRET_KEY=random-32-chars-min
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-app.vercel.app
```

詳見 `backend/.env.example`

---

## 🔧 配置文件說明

| 文件 | 必需性 | 用途 | 平台 |
|------|--------|------|------|
| `vercel.json` | 必需 | Vercel 構建配置 | Vercel |
| `.vercelignore` | 推薦 | 排除不必要文件 | Vercel |
| `railway.json` | 可選 | Railway 配置（會自動偵測） | Railway |
| `render.yaml` | 推薦 | Render 配置 | Render |

---

## 🎉 部署成功後

1. ✅ 更新 `README.md` 添加 Demo 連結
2. ✅ 測試完整流程
3. ✅ 分享給團隊成員

---

## 📚 相關文檔

- **完整部署指南**: `DEPLOYMENT.md`
- **快速部署指南**: `QUICKSTART.md`
- **後端文檔**: `backend/CLAUDE.md`
- **前端文檔**: `frontend/README.md`

---

**所有文件都已準備就緒，現在可以開始部署了！** 🚀
