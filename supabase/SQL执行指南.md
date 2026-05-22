# 心斋 Supabase SQL 执行指南

## 打开 SQL 编辑器
1. 浏览器访问：https://supabase.com/dashboard/project/hcmjwmahnrfktxptkewx/sql
2. 登录你的 Supabase 账号

## 需要执行的SQL文件

### 1️⃣ 建表SQL（如果 tables-life-events-da-yun.sql 还没执行）
文件位置：`/Users/sunxiaolong/.qclaw/workspace/xinzhai/supabase/tables-life-events-da-yun.sql`

### 2️⃣ RLS 加固SQL
文件位置：`/Users/sunxiaolong/.qclaw/workspace/xinzhai/supabase/rls-hardening.sql`

## 一键复制所有SQL
在SQL编辑器中粘贴以下内容（合并了两文件）：

```sql
-- ============================================
-- life_events 表
-- ============================================
CREATE TABLE IF NOT EXISTS life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_year INTEGER NOT NULL,
  event_month INTEGER,
  description TEXT,
  intensity INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own life events" 
  ON life_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life events" 
  ON life_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- da_yun 表
-- ============================================
CREATE TABLE IF NOT EXISTS da_yun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gan TEXT NOT NULL,
  zhi TEXT NOT NULL,
  start_age INTEGER NOT NULL,
  end_age INTEGER NOT NULL,
  energy_main TEXT,
  energy_score INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE da_yun ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dayun" 
  ON da_yun FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dayun" 
  ON da_yun FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS 加固：user_profiles
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS 加固：matches
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own matches" ON matches;
CREATE POLICY "Users can view own matches" 
  ON matches FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

DROP POLICY IF EXISTS "Users can insert own matches" ON matches;
CREATE POLICY "Users can insert own matches" 
  ON matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own matches" ON matches;
CREATE POLICY "Users can update own matches" 
  ON matches FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS 加固：chat_messages
-- ============================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages" 
  ON chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
CREATE POLICY "Users can update own messages" 
  ON chat_messages FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 执行
粘贴上述SQL，点击 "Run" 按钮。

## 验证
执行后运行：
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
预期：5张表 rowsecurity = true