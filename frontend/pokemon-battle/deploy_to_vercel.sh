#!/bin/bash
# 前端自動部署到 Vercel
# 使用方式: ./deploy_to_vercel.sh <RAILWAY_URL>

set -e

if [ -z "$1" ]; then
    echo "❌ 請提供 Railway URL"
    echo "使用方式: ./deploy_to_vercel.sh https://your-railway-url.up.railway.app"
    exit 1
fi

RAILWAY_URL="$1"
# 移除末尾的斜線
RAILWAY_URL=${RAILWAY_URL%/}

# 構建 WebSocket URL
WS_URL=${RAILWAY_URL/https/wss}

echo "🚀 開始部署前端到 Vercel"
echo "================================"
echo ""
echo "📍 後端 URL: $RAILWAY_URL"
echo "📍 WebSocket URL: $WS_URL"
echo ""

# 檢查是否已登入 Vercel
if ! vercel whoami &>/dev/null; then
    echo "📝 登入 Vercel..."
    vercel login
fi

echo "🔧 設定環境變數並部署..."

# 部署到 Vercel 生產環境
vercel \
  --prod \
  --build-env EXPO_PUBLIC_API_URL="$RAILWAY_URL" \
  --build-env EXPO_PUBLIC_WS_URL="$WS_URL" \
  --yes

echo ""
echo "✅ 前端部署完成！"
echo ""
echo "📋 下一步："
echo "1. 複製上面的 Vercel URL"
echo "2. 更新 Railway 的 ALLOWED_ORIGINS"
echo ""
