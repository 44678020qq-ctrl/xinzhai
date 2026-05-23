-- ============================================================
-- 心斋 · 工单-09 · RLS 加固 SQL
-- 目标：堵住出生数据，用户只能读写自己的行
-- 执行方式：Supabase SQL Editor 或 Management API
-- ============================================================

-- 1. user_profiles 表
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如有）
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- 用户只能读写自己的 profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. matches 表
-- ============================================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own matches" ON matches;

CREATE POLICY "Users can read own matches"
  ON matches
  FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 3. chat_messages 表
-- ============================================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;

CREATE POLICY "Users can read own messages"
  ON chat_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 4. life_events 表
-- ============================================================
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own life_events" ON life_events;

CREATE POLICY "Users can CRUD own life_events"
  ON life_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. da_yun 表
-- ============================================================
ALTER TABLE da_yun ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own da_yun" ON da_yun;

CREATE POLICY "Users can CRUD own da_yun"
  ON da_yun
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 验证：查一下 RLS 是否全部启用
-- ============================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'matches', 'chat_messages', 'life_events', 'da_yun')
ORDER BY tablename;
