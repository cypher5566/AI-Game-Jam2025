#!/bin/bash

# GenPoke Frontend - 正確的 Vercel 部署腳本
# 解決根目錄重複問題

set -e

echo "🚀 開始部署 GenPoke 前端到 Vercel..."

# 確保在正確的目錄
cd "$(dirname "$0")"

# 構建項目
echo "📦 構建項目..."
npm run build:web

# 部署到 Vercel（生產環境）
echo "🌐 部署到 Vercel..."
vercel --prod --yes

echo "✅ 部署完成！"
echo "🌍 訪問: https://pokemon-battle-zeta.vercel.app"
