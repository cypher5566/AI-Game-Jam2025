# 🚀 GenPoke 自動化部署指南

> 3 分鐘完成前後端部署！

---

## ✅ 準備工作

你已經完成了：
- ✅ 本地後端測試通過（所有 API 正常）
- ✅ Railway CLI 已安裝
- ✅ Vercel CLI 已安裝
- ✅ 環境變數已配置（`.env` 文件）

---

## 🎯 快速部署（推薦）

### **方案 A: 一鍵部署（最簡單）**

```bash
cd /Users/cypher/Desktop/1101_Game_Jam
./DEPLOY.sh
```

這個腳本會自動：
1. 部署後端到 Railway
2. 部署前端到 Vercel
3. 自動配置 CORS
4. 顯示你的應用 URL

**預計時間**: 5-10 分鐘（包含登入）

---

### **方案 B: 分步部署**

#### 步驟 1: 部署後端

```bash
cd backend
../deploy_railway.sh
```

完成後你會得到 Railway URL（如 `https://xxx.up.railway.app`）

#### 步驟 2: 部署前端

```bash
cd ..
./deploy_vercel.sh
```

輸入剛才獲得的 Railway URL，腳本會自動配置前端。

#### 步驟 3: 更新 CORS（在 Railway 中）

```bash
cd backend
railway variables set ALLOWED_ORIGINS=你的_Vercel_URL
```

---

## 📋 部署步驟詳解

### 1️⃣ **Railway 登入** (首次)

當腳本執行 `railway login` 時：
- 瀏覽器會自動打開
- 登入你的 Railway 帳號
- 授權完成後，終端會繼續執行

### 2️⃣ **建立專案** (首次)

選擇「創建新專案」：
- 腳本會自動初始化 Railway 專案
- 環境變數會從你的 `.env` 自動設定
- 自動生成安全的 `SECRET_KEY`

### 3️⃣ **Vercel 登入** (首次)

當腳本執行 `vercel login` 時：
- 選擇登入方式（GitHub/GitLab/Email）
- 授權完成後，繼續部署

### 4️⃣ **前端部署**

- 腳本會自動設定 `EXPO_PUBLIC_API_URL` 和 `EXPO_PUBLIC_WS_URL`
- 使用 `--prod` 標誌部署到生產環境
- 部署完成後顯示你的前端 URL

---

## 🧪 部署後測試

### 測試後端

```bash
# 健康檢查
curl https://你的railway_url/health

# API 文檔
open https://你的railway_url/docs
```

### 測試前端

1. 訪問你的 Vercel URL
2. 測試圖片上傳功能
3. 測試房間創建功能
4. 測試 WebSocket 連接

---

## 🔧 常見問題

### Q: Railway/Vercel CLI 需要登入？
**A:** 是的，首次使用需要登入。之後會保存認證資訊，不需要每次登入。

### Q: 如何更新部署？
**A:** 只需再次執行對應的腳本即可。Railway 和 Vercel 會自動更新。

### Q: 環境變數錯誤怎麼辦？
**A:** 可以手動更新：
```bash
# Railway
cd backend
railway variables set KEY=VALUE

# Vercel
cd frontend/pokemon-battle
vercel env add
```

### Q: CORS 錯誤？
**A:** 確保 Railway 的 `ALLOWED_ORIGINS` 包含你的 Vercel URL：
```bash
railway variables set ALLOWED_ORIGINS=https://xxx.vercel.app
```

### Q: WebSocket 連接失敗？
**A:** 檢查前端環境變數 `EXPO_PUBLIC_WS_URL` 使用 `wss://`（不是 `ws://`）

---

## 📂 部署腳本說明

| 腳本 | 用途 | 執行位置 |
|------|------|----------|
| `DEPLOY.sh` | 一鍵完整部署 | 專案根目錄 |
| `deploy_railway.sh` | 只部署後端 | backend/ 目錄 |
| `deploy_vercel.sh` | 只部署前端 | 專案根目錄 |

---

## 📚 其他資源

- **完整部署指南**: `DEPLOYMENT.md`
- **快速部署指南**: `QUICKSTART.md`
- **部署文件說明**: `DEPLOYMENT_FILES.md`
- **後端文檔**: `backend/CLAUDE.md`

---

## 🎮 現在開始部署！

```bash
# 在專案根目錄執行
./DEPLOY.sh
```

**預祝 Game Jam 順利！** 🚀

---

## 💡 小提示

- 部署過程中保持終端開啟
- 瀏覽器可能會跳出多個授權頁面，請耐心完成
- 記下你的 Railway 和 Vercel URL，之後會用到
- 部署完成後記得測試所有功能
