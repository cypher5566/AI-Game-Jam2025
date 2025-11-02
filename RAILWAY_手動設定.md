# Railway 手動設定指南

由於 Railway CLI 的 service 連接問題，請手動完成以下步驟：

## 📍 步驟 1: 訪問 Railway Dashboard

已經為你打開：https://railway.com/project/850ac50e-3791-481e-a5fd-01d58bb4e2b6

## 📍 步驟 2: 檢查部署狀態

在 Dashboard 中應該能看到一個 service 正在構建中。

## 📍 步驟 3: 設定環境變數

點擊你的 service → Variables 標籤 → 添加以下環境變數：

```
SUPABASE_URL=https://wppzmyspoxwpawtdffec.supabase.co

SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTA2NjksImV4cCI6MjA3NzYyNjY2OX0.-GxtPskjoUYKASTEZXDk0N9NucFDgIBKcRcVBLWzUVk

SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1MDY2OSwiZXhwIjoyMDc3NjI2NjY5fQ.34w2I201JxvZCvalp1wAmEVGKJ4LYas4O9D6oJYXZjM

GEMINI_API_KEY=AIzaSyBmARFExSM4WUn1pakKxT9x8l0fNNSTMgM

ENVIRONMENT=production

HOST=0.0.0.0

ALLOWED_ORIGINS=*

SECRET_KEY=（請用以下命令生成一個隨機值）
```

### 生成 SECRET_KEY

在終端執行：
```bash
openssl rand -base64 32
```

複製輸出的值作為 `SECRET_KEY`

## 📍 步驟 4: 觸發重新部署

設定完環境變數後，點擊 "Redeploy" 按鈕

## 📍 步驟 5: 獲取 Railway URL

部署完成後：
1. 點擊 Settings 標籤
2. 找到 "Domains" 區域
3. 點擊 "Generate Domain"
4. 複製生成的 URL（如 `https://xxx.up.railway.app`）

## 📍 步驟 6: 測試後端

訪問以下 URL 測試：
- 健康檢查：`https://你的railway_url/health`
- API 文檔：`https://你的railway_url/docs`

## ✅ 完成！

獲得 Railway URL 後，繼續部署前端。
