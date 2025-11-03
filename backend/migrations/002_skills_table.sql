-- 技能表 Schema
-- 儲存所有寶可夢技能資料

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    skill_number INTEGER UNIQUE NOT NULL,  -- 編號
    name_zh TEXT NOT NULL,                 -- 中文名
    name_ja TEXT,                          -- 日文名
    name_en TEXT,                          -- 英文名
    type TEXT NOT NULL,                    -- 屬性 (英文: fire, water, etc.)
    type_zh TEXT,                          -- 屬性 (中文: 火, 水, etc.)
    category TEXT,                         -- 分類 (物理/特殊/變化)
    power INTEGER DEFAULT 0,               -- 威力
    accuracy INTEGER DEFAULT 100,          -- 命中率
    pp INTEGER DEFAULT 0,                  -- PP
    description TEXT,                      -- 說明
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type);
CREATE INDEX IF NOT EXISTS idx_skills_power ON skills(power);
CREATE INDEX IF NOT EXISTS idx_skills_number ON skills(skill_number);

-- RLS
ALTER TABLE skills DISABLE ROW LEVEL SECURITY;

-- 自動更新 updated_at
CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ Skills 表格創建完成！';
    RAISE NOTICE '📊 接下來請執行匯入腳本將 CSV 資料匯入資料庫';
END $$;
