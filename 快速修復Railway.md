# 🔧 Railway 快速修復指南

## ⚠️ 問題

第一次部署失敗了（缺少環境變數）。

## ✅ 解決方案（5 分鐘）

### 步驟 1: 打開 Railway Dashboard

瀏覽器訪問：https://railway.com/project/850ac50e-3791-481e-a5fd-01d58bb4e2b6

### 步驟 2: 點擊你的 GenPoke service

應該能看到一個失敗的部署。

### 步驟 3: 添加環境變數

點擊上方的 **Variables** 標籤，然後點擊 **New Variable**，添加以下變數（一個一個添加）：

```
變數名: SUPABASE_URL
值: https://wppzmyspoxwpawtdffec.supabase.co

變數名: SUPABASE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTA2NjksImV4cCI6MjA3NzYyNjY2OX0.-GxtPskjoUYKASTEZXDk0N9NucFDgIBKcRcVBLWzUVk

變數名: SUPABASE_SERVICE_KEY
值: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1MDY2OSwiZXhwIjoyMDc3NjI2NjY5fQ.34w2I201JxvZCvalp1wAmEVGKJ4LYas4O9D6oJYXZjM

變數名: GEMINI_API_KEY
值: AIzaSyBmARFExSM4WUn1pakKxT9x8l0fNNSTMgM

變數名: ENVIRONMENT
值: production

變數名: HOST
值: 0.0.0.0

變數名: ALLOWED_ORIGINS
值: *

變數名: SECRET_KEY
值: （請在終端執行 `openssl rand -base64 32` 生成）
```

### 步驟 4: 重新部署

添加完所有環境變數後，回到 **Deployments** 標籤，點擊最新的失敗部署，然後點擊右上角的 **Redeploy** 按鈕。

### 步驟 5: 生成 Domain

部署成功後（Status 變成 SUCCESS），點擊 **Settings** 標籤：
1. 找到 **Networking** 區域
2. 點擊 **Generate Domain**
3. 複製生成的 URL（如 `genp oke-production.up.railway.app`）

### 步驟 6: 測試

訪問 `https://你的railway_url/health`，應該返回：
```json
{"status":"healthy","environment":"production","version":"1.0.0"}
```

## ✅ 完成！

複製你的 Railway URL，準備部署前端。

---

## 💡 小提示

- 添加環境變數時 Railway 會自動觸發重新部署
- 如果部署失敗，點擊 Deployments → View Logs 查看錯誤
- 確保所有 8 個環境變數都已添加
