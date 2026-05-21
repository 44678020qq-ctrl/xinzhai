-- ============================================
-- 心斋 · Supabase 建表SQL（任务③）
-- ============================================
-- 创建时间：2026-05-21
-- 依赖：已有 user_profiles, matches, chat_messages 表
-- 新增：life_events, da_yun
-- RLS：行级安全策略（按 user_id 隔离）
-- ============================================

-- ==================== 1. life_events 表 ====================
-- 用途：记录用户人生重大事件（供流页展示）
-- 字段：事件类型、发生年份、事件描述、关联命理因素

CREATE TABLE IF NOT EXISTS life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- 事件基本信息
  event_year INTEGER NOT NULL,          -- 发生年份
  event_type VARCHAR(50) NOT NULL,      -- 事件类型：学业/事业/感情/健康/其他
  
  -- 事件描述
  title VARCHAR(100) NOT NULL,          -- 事件标题（如"考上大学"）
  description TEXT,                     -- 详细描述
  
  -- 命理关联（可选）
  liu_nian_gan VARCHAR(10),             -- 流年天干（可选）
  liu_nian_zhi VARCHAR(10),             -- 流年地支（可选）
  da_yun_index INTEGER,                 -- 所属大运索引
  energy_impact VARCHAR(50),            -- 能量影响：帮扶/克泄耗/中性
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_year CHECK (event_year >= 1900 AND event_year <= 2100)
);

-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_life_events_user_id ON life_events(user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_year ON life_events(user_id, event_year);

-- ==================== 2. da_yun 表 ====================
-- 用途：存储用户大运数据（供流页和转潮使用）
-- 字段：起止年龄、干支、能量主线

CREATE TABLE IF NOT EXISTS da_yun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- 大运基本信息
  da_yun_index INTEGER NOT NULL,        -- 大运序号（0-9）
  
  gan VARCHAR(10) NOT NULL,             -- 大运天干
  zhi VARCHAR(10) NOT NULL,             -- 大运地支
  
  start_age INTEGER NOT NULL,           -- 起运年龄
  end_age INTEGER NOT NULL,             -- 止运年龄
  
  -- 能量分析
  energy_main VARCHAR(20) NOT NULL,     -- 能量主线：帮扶/克泄耗
  wuxing_strength JSONB,                -- 五行力量变化（JSON）
  
  -- 描述
  description TEXT,                     -- 大运简述（如"中年事业运"）
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_da_yun_index CHECK (da_yun_index >= 0 AND da_yun_index <= 9),
  CONSTRAINT valid_age_range CHECK (start_age >= 0 AND end_age > start_age),
  CONSTRAINT unique_user_da_yun UNIQUE (user_id, da_yun_index)
);

-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_da_yun_user_id ON da_yun(user_id);
CREATE INDEX IF NOT EXISTS idx_da_yun_age ON da_yun(user_id, start_age, end_age);

-- ==================== 3. RLS 策略 ====================
-- 安全原则：用户只能访问自己的数据（按 user_id 隔离）

-- 3.1 启用 RLS
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE da_yun ENABLE ROW LEVEL SECURITY;

-- 3.2 life_events 策略
-- 用户只能查看自己的事件
CREATE POLICY "Users can view own life_events" 
  ON life_events FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能插入自己的事件
CREATE POLICY "Users can insert own life_events" 
  ON life_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的事件
CREATE POLICY "Users can update own life_events" 
  ON life_events FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的事件
CREATE POLICY "Users can delete own life_events" 
  ON life_events FOR DELETE 
  USING (auth.uid() = user_id);

-- 3.3 da_yun 策略
-- 用户只能查看自己的大运
CREATE POLICY "Users can view own da_yun" 
  ON da_yun FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能插入自己的大运
CREATE POLICY "Users can insert own da_yun" 
  ON da_yun FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的大运
CREATE POLICY "Users can update own da_yun" 
  ON da_yun FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的大运
CREATE POLICY "Users can delete own da_yun" 
  ON da_yun FOR DELETE 
  USING (auth.uid() = user_id);

-- ==================== 4. 触发器：自动更新 updated_at ====================

-- 4.1 创建更新时间函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 life_events 触发器
DROP TRIGGER IF EXISTS update_life_events_updated_at ON life_events;
CREATE TRIGGER update_life_events_updated_at
  BEFORE UPDATE ON life_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4.3 da_yun 触发器
DROP TRIGGER IF EXISTS update_da_yun_updated_at ON da_yun;
CREATE TRIGGER update_da_yun_updated_at
  BEFORE UPDATE ON da_yun
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== 5. 数据约束检查 ====================

-- 5.1 确保 energy_main 只能是 '帮扶' 或 '克泄耗'
ALTER TABLE da_yun DROP CONSTRAINT IF EXISTS valid_energy_main;
ALTER TABLE da_yun ADD CONSTRAINT valid_energy_main 
  CHECK (energy_main IN ('帮扶', '克泄耗'));

-- 5.2 确保 event_type 有效
ALTER TABLE life_events DROP CONSTRAINT IF EXISTS valid_event_type;
ALTER TABLE life_events ADD CONSTRAINT valid_event_type 
  CHECK (event_type IN ('学业', '事业', '感情', '健康', '家庭', '其他'));

-- ==================== 6. 注释 ====================

COMMENT ON TABLE life_events IS '用户人生重大事件表 - 供流页展示和转潮分析使用';
COMMENT ON TABLE da_yun IS '用户大运数据表 - 存储十步大运信息';

COMMENT ON COLUMN life_events.event_year IS '事件发生的公历年份';
COMMENT ON COLUMN life_events.event_type IS '事件分类：学业/事业/感情/健康/家庭/其他';
COMMENT ON COLUMN life_events.energy_impact IS '事件对命局能量影响：帮扶/克泄耗/中性';

COMMENT ON COLUMN da_yun.da_yun_index IS '大运序号（0-9），对应十步大运';
COMMENT ON COLUMN da_yun.energy_main IS '大运能量主线：帮扶（印比）/克泄耗（官杀食伤财）';
COMMENT ON COLUMN da_yun.wuxing_strength IS '大运期间五行力量变化（JSON格式）';

-- ==================== 完成标记 ====================
-- 执行完成后，请确认：
-- ✅ life_events 表已创建
-- ✅ da_yun 表已创建
-- ✅ RLS 策略已启用
-- ✅ 触发器已创建
-- ✅ 数据约束已生效
