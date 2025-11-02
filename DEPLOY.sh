#!/bin/bash
# GenPoke 一鍵部署腳本
# 自動化部署前後端到 Railway 和 Vercel

set -e

echo "🎮 GenPoke 一鍵部署腳本"
echo "========================"
echo ""
echo "此腳本將協助你部署："
echo "  1️⃣  後端 → Railway"
echo "  2️⃣  前端 → Vercel"
echo ""

read -p "按 Enter 開始部署..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 階段 1: 部署後端到 Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend
bash ../deploy_railway.sh

echo ""
echo "✅ 後端部署完成！"
echo ""

# 獲取 Railway URL
echo "正在獲取 Railway URL..."
RAILWAY_URL=$(railway domain)

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  無法自動獲取 Railway URL"
    read -p "請手動輸入你的 Railway URL: " RAILWAY_URL
else
    echo "✅ Railway URL: $RAILWAY_URL"
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 階段 2: 部署前端到 Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 自動設定 Railway URL
export RAILWAY_URL
bash deploy_vercel.sh

echo ""
echo "✅ 前端部署完成！"
echo ""

# 獲取 Vercel URL
echo "正在獲取 Vercel URL..."
cd frontend/pokemon-battle
VERCEL_URL=$(vercel ls | grep -o 'https://[^ ]*' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "⚠️  無法自動獲取 Vercel URL"
    read -p "請手動輸入你的 Vercel URL: " VERCEL_URL
else
    echo "✅ Vercel URL: $VERCEL_URL"
fi

cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 階段 3: 更新 CORS 設定"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend
echo "正在更新 Railway ALLOWED_ORIGINS..."
railway variables set ALLOWED_ORIGINS="$VERCEL_URL"

echo ""
echo "✅ CORS 設定更新完成！"
echo ""

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 你的應用 URL："
echo "   前端: $VERCEL_URL"
echo "   後端: $RAILWAY_URL"
echo ""
echo "🧪 測試清單："
echo "   1. 訪問前端 URL"
echo "   2. 測試圖片上傳功能"
echo "   3. 測試房間創建功能"
echo "   4. 測試多人對戰功能"
echo ""
echo "📚 文檔："
echo "   - 完整部署指南: DEPLOYMENT.md"
echo "   - 快速部署指南: QUICKSTART.md"
echo "   - API 文檔: $RAILWAY_URL/docs"
echo ""
echo "🎮 祝 Game Jam 順利！"
echo ""
