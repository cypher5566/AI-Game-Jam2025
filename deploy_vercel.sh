#!/bin/bash
# GenPoke 前端自動化部署腳本 - Vercel

set -e

echo "🚀 GenPoke 前端部署到 Vercel"
echo "================================"
echo ""

# 檢查是否在專案根目錄
if [ ! -d "frontend/pokemon-battle" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    exit 1
fi

# 檢查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安裝"
    echo "請執行: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 已安裝"
echo ""

# 登入檢查
echo "📝 步驟 1: 登入 Vercel"
echo "請在瀏覽器中完成登入..."
vercel login

echo ""
echo "⚠️  重要提示："
echo "在部署前，請確保你已經："
echo "1. ✅ 部署了後端到 Railway"
echo "2. ✅ 獲得了 Railway URL（如 https://xxx.up.railway.app）"
echo ""

read -p "請輸入你的 Railway 後端 URL: " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ 錯誤：Railway URL 不能為空"
    exit 1
fi

# 移除末尾的斜線
RAILWAY_URL=${RAILWAY_URL%/}

# 構建 WebSocket URL (將 https 改為 wss)
WS_URL=${RAILWAY_URL/https/wss}

echo ""
echo "✅ 將使用以下 URL："
echo "   API URL: $RAILWAY_URL"
echo "   WebSocket URL: $WS_URL"
echo ""

# 進入前端目錄
cd frontend/pokemon-battle

echo "📦 步驟 2: 部署到 Vercel"
echo "正在部署..."

# 使用 vercel deploy 並設定環境變數
vercel --prod \
  --build-env EXPO_PUBLIC_API_URL="$RAILWAY_URL" \
  --build-env EXPO_PUBLIC_WS_URL="$WS_URL"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 下一步："
echo "1. 複製 Vercel 給你的 URL（如 https://xxx.vercel.app）"
echo "2. 回到 Railway 更新 ALLOWED_ORIGINS 環境變數"
echo "3. 執行以下命令更新 Railway CORS："
echo ""
echo "   railway variables set ALLOWED_ORIGINS=你的_Vercel_URL"
echo ""
echo "4. 測試你的應用："
echo "   - 訪問 Vercel URL"
echo "   - 測試圖片上傳"
echo "   - 測試房間創建"
echo ""
