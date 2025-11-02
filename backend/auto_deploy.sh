#!/bin/bash
# 完全自動化部署腳本

set -e

# 生成 SECRET_KEY
SECRET_KEY=$(openssl rand -base64 32)

# 一次性設定所有環境變數並部署
railway variables \
  --set "SUPABASE_URL=https://wppzmyspoxwpawtdffec.supabase.co" \
  --set "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTA2NjksImV4cCI6MjA3NzYyNjY2OX0.-GxtPskjoUYKASTEZXDk0N9NucFDgIBKcRcVBLWzUVk" \
  --set "SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcHpteXNwb3h3cGF3dGRmZmVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1MDY2OSwiZXhwIjoyMDc3NjI2NjY5fQ.34w2I201JxvZCvalp1wAmEVGKJ4LYas4O9D6oJYXZjM" \
  --set "GEMINI_API_KEY=AIzaSyBmARFExSM4WUn1pakKxT9x8l0fNNSTMgM" \
  --set "ENVIRONMENT=production" \
  --set "HOST=0.0.0.0" \
  --set "ALLOWED_ORIGINS=*" \
  --set "SECRET_KEY=$SECRET_KEY"

echo "✅ 環境變數設定完成！"
echo ""
echo "等待 30 秒讓 Railway 觸發重新部署..."
sleep 30

echo ""
echo "📋 檢查部署狀態:"
railway status

echo ""
echo "🌐 獲取你的 Railway URL:"
railway domain || echo "URL 可能還在生成中，請稍後執行: railway domain"

echo ""
echo "✅ 完成！"
