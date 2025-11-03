#!/bin/bash
# 最簡單的部署方式 - 先部署再設定環境變數

set -e

echo "🚀 開始部署後端..."

# 直接部署（會自動創建 service）
railway up --detach

echo ""
echo "⚙️ 設定環境變數..."

# 從 .env 讀取
SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_KEY=$(grep SUPABASE_KEY .env | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env | cut -d '=' -f2)
GEMINI_API_KEY=$(grep GEMINI_API_KEY .env | cut -d '=' -f2)
SECRET_KEY=$(openssl rand -base64 32)

# 設定環境變數
railway variables --set "SUPABASE_URL=$SUPABASE_URL" \
  --set "SUPABASE_KEY=$SUPABASE_KEY" \
  --set "SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY" \
  --set "GEMINI_API_KEY=$GEMINI_API_KEY" \
  --set "ENVIRONMENT=production" \
  --set "HOST=0.0.0.0" \
  --set "SECRET_KEY=$SECRET_KEY" \
  --set "ALLOWED_ORIGINS=*"

echo ""
echo "✅ 環境變數設定完成，正在觸發重新部署..."

# 觸發重新部署以使用新的環境變數
railway redeploy --yes

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 獲取你的 Railway URL:"
railway domain

echo ""
echo "💡 完成！複製上面的 URL 用於前端配置"
