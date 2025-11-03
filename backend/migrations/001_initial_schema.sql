-- GenPoke 資料庫初始化 Schema
-- 在 Supabase SQL Editor 中執行此腳本

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 1. pokemon 表 =====
-- 儲存用戶生成的寶可夢
CREATE TABLE IF NOT EXISTS pokemon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,  -- 可選，未來可以連接認證系統
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- fire, water, grass, electric, etc. (18 種)
    front_image_url TEXT NOT NULL,
    back_image_url TEXT NOT NULL,
    stats JSONB DEFAULT '{
        "hp": 100,
        "attack": 50,
        "defense": 50,
        "speed": 50,
        "level": 5
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pokemon_user_id ON pokemon(user_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_type ON pokemon(type);
CREATE INDEX IF NOT EXISTS idx_pokemon_created ON pokemon(created_at DESC);

-- RLS (Row Level Security) - 暫時關閉，Game Jam 期間為了快速開發
ALTER TABLE pokemon DISABLE ROW LEVEL SECURITY;

-- ===== 2. rooms 表 =====
-- 儲存多人對戰房間
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,  -- 6位數房間代碼，例如: ABC123
    status TEXT NOT NULL DEFAULT 'waiting',  -- waiting, ready, battle, finished
    boss_hp INTEGER NOT NULL,
    boss_max_hp INTEGER NOT NULL,
    current_turn INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 檢查約束
    CONSTRAINT check_status CHECK (status IN ('waiting', 'ready', 'battle', 'finished')),
    CONSTRAINT check_max_players CHECK (max_players BETWEEN 2 AND 4),
    CONSTRAINT check_boss_hp CHECK (boss_hp >= 0)
);

-- 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created ON rooms(created_at DESC);

-- RLS
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== 3. room_members 表 =====
-- 儲存房間成員
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    pokemon_id UUID NOT NULL REFERENCES pokemon(id),
    user_id TEXT,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 確保同一房間內不會有重複的 pokemon
    UNIQUE(room_id, pokemon_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_pokemon ON room_members(pokemon_id);

-- RLS
ALTER TABLE room_members DISABLE ROW LEVEL SECURITY;

-- ===== 4. battles 表 =====
-- 儲存戰鬥記錄
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id),
    battle_log JSONB DEFAULT '[]'::jsonb,  -- 戰鬥日誌 JSON 陣列
    result TEXT,  -- 'win', 'lose'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,

    -- 檢查約束
    CONSTRAINT check_result CHECK (result IS NULL OR result IN ('win', 'lose'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_battles_room ON battles(room_id);
CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_result ON battles(result);

-- RLS
ALTER TABLE battles DISABLE ROW LEVEL SECURITY;

-- ===== 5. upload_queue 表 (可選) =====
-- 儲存圖片上傳處理狀態
CREATE TABLE IF NOT EXISTS upload_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id TEXT UNIQUE NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
    processed_data JSONB,  -- 處理結果：front_image, back_image, type 等
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT check_upload_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_upload_queue_id ON upload_queue(upload_id);
CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON upload_queue(status);

-- RLS
ALTER TABLE upload_queue DISABLE ROW LEVEL SECURITY;

-- 自動更新 updated_at
CREATE TRIGGER update_upload_queue_updated_at
    BEFORE UPDATE ON upload_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== 完成訊息 =====
DO $$
BEGIN
    RAISE NOTICE '✅ GenPoke 資料庫 Schema 創建完成！';
    RAISE NOTICE '📊 已創建表格:';
    RAISE NOTICE '  - pokemon (寶可夢)';
    RAISE NOTICE '  - rooms (房間)';
    RAISE NOTICE '  - room_members (房間成員)';
    RAISE NOTICE '  - battles (戰鬥記錄)';
    RAISE NOTICE '  - upload_queue (上傳佇列)';
END $$;
