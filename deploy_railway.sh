#!/bin/bash
# GenPoke 後端自動化部署腳本 - Railway

set -e

echo "🚀 GenPoke 後端部署到 Railway"
echo "================================"
echo ""

# 檢查是否在 backend 目錄
if [ ! -f "app/main.py" ]; then
    echo "❌ 錯誤：請在 backend/ 目錄下執行此腳本"
    exit 1
fi

# 檢查 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安裝"
    echo "請執行: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI 已安裝"
echo ""

# 登入檢查
echo "📝 步驟 1: 登入 Railway"
echo "請在瀏覽器中完成登入..."
railway login

echo ""
echo "📦 步驟 2: 創建或連接專案"
echo "請選擇："
echo "  1) 創建新專案（首次部署）"
echo "  2) 連接現有專案"
read -p "選擇 (1/2): " choice

if [ "$choice" = "1" ]; then
    railway init
else
    railway link
fi

echo ""
echo "⚙️ 步驟 3: 設定環境變數"
echo "正在設定環境變數..."

# 從 .env 讀取並設定
if [ -f ".env" ]; then
    SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
    SUPABASE_KEY=$(grep SUPABASE_KEY .env | cut -d '=' -f2)
    SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env | cut -d '=' -f2)
    GEMINI_API_KEY=$(grep GEMINI_API_KEY .env | cut -d '=' -f2)

    railway variables --set "SUPABASE_URL=$SUPABASE_URL"
    railway variables --set "SUPABASE_KEY=$SUPABASE_KEY"
    railway variables --set "SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY"
    railway variables --set "GEMINI_API_KEY=$GEMINI_API_KEY"
    railway variables --set "ENVIRONMENT=production"
    railway variables --set "HOST=0.0.0.0"
    railway variables --set "PORT=\$PORT"

    # 生成隨機 SECRET_KEY
    SECRET_KEY=$(openssl rand -base64 32)
    railway variables --set "SECRET_KEY=$SECRET_KEY"

    echo "✅ 環境變數設定完成"
else
    echo "⚠️  未找到 .env 文件，請手動設定環境變數"
fi

echo ""
echo "🚀 步驟 4: 部署到 Railway"
railway up

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 下一步："
echo "1. 執行: railway status"
echo "2. 執行: railway domain"
echo "3. 複製你的 Railway URL（如 https://xxx.up.railway.app）"
echo "4. 更新前端環境變數 EXPO_PUBLIC_API_URL"
echo ""
