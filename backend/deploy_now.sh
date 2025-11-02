#!/bin/bash
# 快速設定環境變數並部署（專案已創建）

set -e

echo "⚙️ 正在設定環境變數..."

# 從 .env 讀取
SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_KEY .env | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env | cut -d '=' -f2)
GEMINI_API_KEY=$(grep GEMINI_API_KEY .env | cut -d '=' -f2)

# 設定環境變數
railway variables --set "SUPABASE_URL=$SUPABASE_URL"
railway variables --set "SUPABASE_KEY=$SUPABASE_KEY"
railway variables --set "SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY"
railway variables --set "GEMINI_API_KEY=$GEMINI_API_KEY"
railway variables --set "ENVIRONMENT=production"
railway variables --set "HOST=0.0.0.0"

# 生成隨機 SECRET_KEY
SECRET_KEY=$(openssl rand -base64 32)
railway variables --set "SECRET_KEY=$SECRET_KEY"

# ALLOWED_ORIGINS 先設定為空，部署後更新
railway variables --set "ALLOWED_ORIGINS=*"

echo "✅ 環境變數設定完成"
echo ""

echo "🚀 開始部署..."
railway up

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 獲取你的 Railway URL:"
railway domain

echo ""
echo "💡 複製上面的 URL，稍後配置前端時需要使用"
