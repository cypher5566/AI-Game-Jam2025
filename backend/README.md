# GenPoke 後端系統

AI Game Jam 2025 - GenPoke 專案後端

## 🚀 快速開始

### 1. 安裝依賴

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

### 2. 配置環境變數

```bash
# 複製範例檔案
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

### 3. 設置資料庫

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 進入 SQL Editor
3. 執行 `migrations/001_initial_schema.sql` 中的 SQL

### 4. 啟動服務器

```bash
# 開發模式（自動重載）
python -m app.main

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 訪問 API 文檔

服務器啟動後，訪問：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康檢查**: http://localhost:8000/health

---

## 📡 API 端點

### 基礎端點

- `GET /` - API 資訊
- `GET /health` - 健康檢查
- `GET /api/v1/types` - 獲取寶可夢屬性列表

### Pokemon 圖片處理

- `POST /api/v1/pokemon/upload` - 上傳圖片
- `GET /api/v1/pokemon/process/{upload_id}` - 獲取處理結果
- `POST /api/v1/pokemon/create` - 創建寶可夢記錄
- `GET /api/v1/pokemon/{pokemon_id}` - 獲取寶可夢資料

### 測試流程

```bash
# 1. 上傳圖片
curl -X POST http://localhost:8000/api/v1/pokemon/upload \
  -F "file=@test_image.png"

# 返回: {"success": true, "upload_id": "xxx-xxx-xxx"}

# 2. 查詢處理狀態
curl http://localhost:8000/api/v1/pokemon/process/xxx-xxx-xxx

# 3. 創建寶可夢
curl -X POST http://localhost:8000/api/v1/pokemon/create \
  -H "Content-Type": application/json" \
  -d '{
    "name": "小火龍",
    "type": "fire",
    "front_image": "data:image/png;base64,...",
    "back_image": "data:image/png;base64,..."
  }'
```

---

## 📁 專案結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 主應用
│   ├── config.py            # 配置管理
│   ├── database.py          # Supabase 連接
│   ├── models/              # 資料模型
│   │   ├── pokemon.py
│   │   ├── room.py
│   │   └── battle.py
│   ├── routers/             # API 路由
│   │   └── pokemon.py       # ✅ 已實作
│   ├── services/            # 業務邏輯
│   │   ├── image_processor.py  # ✅ 像素化處理
│   │   └── gemini_service.py   # ✅ AI 服務
│   └── utils/               # 工具函數
├── migrations/              # 資料庫遷移
│   └── 001_initial_schema.sql
├── requirements.txt
├── .env.example
├── .gitignore
├── ARCHITECTURE.md          # 系統架構文檔
└── README.md
```

---

## ✅ 已完成功能

### Phase 1: 基礎建設 ✅
- [x] FastAPI 專案結構
- [x] Supabase 資料庫連接
- [x] 環境變數管理
- [x] 資料庫 Schema 設計
- [x] 基礎 API 端點
- [x] 系統架構文檔

### Phase 2: 圖片處理 ✅
- [x] 圖片上傳 API
- [x] 像素化處理 (32x32)
- [x] AI 屬性判斷 (Gemini Vision)
- [x] 背面圖片生成 (含 fallback 鏡像)

### Phase 3: 技能系統 🚧
- [ ] Google Sheets 整合
- [ ] 技能獲取 API

### Phase 4: 戰鬥系統 🚧
- [ ] 傷害計算 API
- [ ] 屬性相剋表 API

### Phase 5: 多人連線 ⏳
- [ ] WebSocket 基礎架構
- [ ] 房間系統
- [ ] Boss 戰邏輯

---

## 🔧 開發建議

### 測試圖片上傳

建議使用一張簡單的測試圖片，例如：
- 紅色/橙色的圖片 → AI 可能判斷為 fire
- 藍色的圖片 → AI 可能判斷為 water
- 綠色的圖片 → AI 可能判斷為 grass

### Fallback 機制

- **AI 屬性判斷失敗** → 返回 "normal"
- **背面生成失敗** → 使用鏡像圖片
- **圖片處理失敗** → 返回友善錯誤訊息

### 日誌查看

所有操作都有詳細的日誌輸出，方便除錯：
```bash
# 啟動時會看到:
# ✅ Supabase 連接成功
# ✅ Gemini API 初始化成功
# ✅ 圖片上傳成功: xxx-xxx-xxx
# ✅ 圖片像素化成功: 32x32
# ✅ AI 判斷屬性成功: fire
```

---

## 📚 詳細文檔

- [系統架構文檔](./ARCHITECTURE.md) - 完整的系統設計和 API 規範
- [資料庫遷移](./migrations/README.md) - 資料庫設置指南

---

## 🐛 常見問題

### Q: Gemini API 報錯？
A: 檢查 `GEMINI_API_KEY` 是否正確設置，並確保有足夠的配額。

### Q: Supabase 連接失敗？
A: 確認 `.env` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 正確。

### Q: 圖片處理很慢？
A: 處理是異步的，可以通過 `GET /api/v1/pokemon/process/{upload_id}` 查詢狀態。

### Q: 上傳的圖片儲存在哪？
A: `./uploads/` 目錄。處理完成後會自動清理。

---

## 🎯 接下來的開發

1. **Phase 3**: 整合 Google Sheets 技能資料
2. **Phase 4**: 實作戰鬥計算邏輯
3. **Phase 5**: 建立 WebSocket 多人系統

---

## 👨‍💻 開發者

- **負責人**: cypher5566
- **專案**: GenPoke Backend
- **版本**: 1.0.0
- **最後更新**: 2025-11-02
