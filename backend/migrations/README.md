# 資料庫遷移腳本

## 如何執行

### 在 Supabase Dashboard 執行

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**
4. 創建新查詢
5. 複製 `001_initial_schema.sql` 的內容
6. 貼上並點擊 **Run** 執行

### 使用 Supabase CLI (可選)

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入
supabase login

# 連接到你的專案
supabase link --project-ref your-project-ref

# 應用遷移
supabase db push
```

## 遷移列表

- `001_initial_schema.sql` - 初始資料庫 Schema
  - pokemon 表
  - rooms 表
  - room_members 表
  - battles 表
  - upload_queue 表

## 驗證安裝

執行以下 SQL 來驗證表格是否正確創建:

```sql
-- 檢查所有表格
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 應該看到:
-- battles
-- pokemon
-- room_members
-- rooms
-- upload_queue
```

## 回滾 (如需要)

```sql
-- 刪除所有表格 (⚠️ 謹慎使用!)
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS pokemon CASCADE;
DROP TABLE IF EXISTS upload_queue CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## 注意事項

- 這些遷移腳本已經關閉了 RLS (Row Level Security)，適合 Game Jam 快速開發
- 生產環境建議啟用 RLS 並配置適當的安全策略
- 所有 ID 使用 UUID v4
- 時間戳記使用 `TIMESTAMP WITH TIME ZONE`
