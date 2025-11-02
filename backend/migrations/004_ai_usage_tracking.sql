-- AI 用量追蹤表
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    ai_generations_count INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date)  -- 每天只有一筆記錄
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_tracking(date DESC);

-- 插入今天的記錄（如果不存在）
INSERT INTO ai_usage_tracking (date, ai_generations_count, estimated_cost_usd)
VALUES (CURRENT_DATE, 0, 0.0)
ON CONFLICT (date) DO NOTHING;
