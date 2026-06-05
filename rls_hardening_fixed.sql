-- ============================================================
-- 心斋 · 工单-09 · RLS 加固 SQL（修正版）
-- 问题：user_profiles 没有 user_id 列，主键 id = auth.uid()
-- 执行方式：Supabase Dashboard SQL Editor（无痕模式）
-- ============================================================

-- 1. user_profiles 表（修正：id = auth.uid）
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 公开匹配视图：只暴露匹配所需字段，不暴露生日、时辰、性别等完整资料
-- 注意：视图用于 /match 的真实用户池；个人资料仍只能通过 user_profiles 读自己的完整记录
DROP VIEW IF EXISTS public_match_profiles;
CREATE VIEW public_match_profiles AS
SELECT
  id,
  COALESCE(NULLIF(name, ''), CONCAT(bazi_day_gan, day_master_wuxing)) AS display_name,
  bazi_year_gan,
  bazi_year_zhi,
  bazi_month_gan,
  bazi_month_zhi,
  bazi_day_gan,
  bazi_day_zhi,
  bazi_hour_gan,
  bazi_hour_zhi,
  day_master_wuxing,
  personality_tags,
  personality_desc,
  updated_at
FROM user_profiles
WHERE day_master_wuxing IS NOT NULL;

GRANT SELECT ON public_match_profiles TO authenticated;

-- 2. matches 表
-- ============================================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;

CREATE POLICY "Users can read own matches"
  ON matches
  FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can insert own matches"
  ON matches
  FOR INSERT
  WITH CHECK (auth.uid() = user_a);

CREATE POLICY "Users can update own matches"
  ON matches
  FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- 3. chat_messages 表
-- ============================================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can mark received messages read" ON chat_messages;

CREATE POLICY "Users can read own messages"
  ON chat_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages read"
  ON chat_messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

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

-- 验证：公开匹配视图是否可用
SELECT COUNT(*) AS discoverable_profiles FROM public_match_profiles;
