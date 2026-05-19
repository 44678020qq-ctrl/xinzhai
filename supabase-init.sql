-- 心斋数据库初始化 SQL
-- 在 Supabase SQL Editor 中执行

-- 用户档案表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 基本信息
  name TEXT,
  avatar_url TEXT,

  -- 八字信息
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_hour INTEGER,  -- 0-23，null 表示未知
  birth_minute INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  is_lunar BOOLEAN DEFAULT FALSE,

  -- 八字排盘结果（缓存）
  bazi_year_gan TEXT NOT NULL,
  bazi_year_zhi TEXT NOT NULL,
  bazi_month_gan TEXT NOT NULL,
  bazi_month_zhi TEXT NOT NULL,
  bazi_day_gan TEXT NOT NULL,
  bazi_day_zhi TEXT NOT NULL,
  bazi_hour_gan TEXT,
  bazi_hour_zhi TEXT,
  day_master_wuxing TEXT NOT NULL,

  -- 人格标签
  personality_tags TEXT[] DEFAULT '{}',
  personality_desc TEXT,

  -- 匹配设置
  looking_for_gender TEXT CHECK (looking_for_gender IN ('male', 'female', 'both')),
  min_age INTEGER,
  max_age INTEGER
);

-- 匹配记录表
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  match_type TEXT NOT NULL,
  is_mutual BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',

  UNIQUE(user_id, target_id)
);

-- 聊天消息表
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

-- 索引
CREATE INDEX idx_user_profiles_day_master ON user_profiles(day_master_wuxing);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_target_id ON matches(target_id);
CREATE INDEX idx_chat_messages_match_id ON chat_messages(match_id);

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的档案
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- 用户可以更新自己的档案
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 用户可以插入自己的档案
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- 匹配记录：用户可以查看与自己相关的匹配
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid()::text IN (user_id::text, target_id::text));

-- 用户可以创建匹配
CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 用户可以更新自己的匹配状态
CREATE POLICY "Users can update matches" ON matches
  FOR UPDATE USING (auth.uid()::text IN (user_id::text, target_id::text));

-- 聊天消息：用户可以查看自己参与的对话
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user_id::text = auth.uid()::text OR matches.target_id::text = auth.uid()::text)
    )
  );

-- 用户可以发送消息
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = chat_messages.match_id
      AND (matches.user_id::text = auth.uid()::text OR matches.target_id::text = auth.uid()::text)
    )
  );
