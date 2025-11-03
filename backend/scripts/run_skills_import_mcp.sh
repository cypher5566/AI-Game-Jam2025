#!/bin/bash
# 透過 Supabase MCP 執行技能數據導入
# 使用方式: bash scripts/run_skills_import_mcp.sh

echo "開始導入 923 個技能到 Supabase..."
echo ""

# 注意：這個腳本需要你手動複製每個批次的 SQL 到 Supabase Dashboard

echo "選項 1: 使用 Supabase Dashboard (推薦)"
echo "  1. 打開 Supabase Dashboard → SQL Editor"
echo "  2. 複製 migrations/003_import_skills_data.sql 的內容"
echo "  3. 貼上並執行"
echo ""

echo "選項 2: 使用 psql (如果已安裝)"
echo "  psql 'postgresql://postgres.[YOUR-PROJECT-REF].supabase.co:5432/postgres' \\"
echo "    -f migrations/003_import_skills_data.sql"
echo ""

echo "完成後，可以驗證："
echo "  SELECT COUNT(*) FROM skills;"
echo ""
