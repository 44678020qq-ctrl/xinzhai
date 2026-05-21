-- ============================================
-- 心斋 · RLS加固SQL（工单-09）
-- 所有用户表上行级策略，按 user_id 隔离
-- ============================================

-- ==================== 1. user_profiles ====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 匿名用户按匿名id隔离，注册用户按auth.uid隔离
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 不允许用户删除自己的profile（安全）
-- CREATE POLICY "Users can delete own profile" ... -- 不创建

-- ==================== 2. matches ====================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己参与的匹配
CREATE POLICY "Users can view own matches" 
  ON matches FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can insert own matches" 
  ON matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches" 
  ON matches FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==================== 3. chat_messages ====================

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的聊天记录
CREATE POLICY "Users can view own messages" 
  ON chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" 
  ON chat_messages FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==================== 4. life_events（已在建表SQL中） ====================
-- 已有RLS，无需重复

-- ==================== 5. da_yun（已在建表SQL中） ====================
-- 已有RLS，无需重复

-- ==================== 验证 ====================
-- 执行后请验证：
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 所有5张表 rowsecurity = true

-- 跨表验证：
-- 用A账号登录 → SELECT * FROM user_profiles → 应只返回A的profile
-- 用A账号登录 → SELECT * FROM chat_messages → 应只返回A的消息