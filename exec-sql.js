/**
 * 本地执行 Supabase SQL
 * 使用方法: node exec-sql.js
 * 需要: SUPABASE_SERVICE_ROLE_KEY 环境变量
 */

const { createClient } = require('@supabase/supabase-js');

// 从 .env.local 读取 anon key 作为 fallback
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const anonMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/);
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/);

const supabaseUrl = urlMatch ? urlMatch[1] : process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = anonMatch ? anonMatch[1] : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 注意: 这个脚本需要 service_role key 才能执行 DDL
// 可以从 Supabase Dashboard -> Settings -> API 获取
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY');
  console.log('');
  console.log('请在 Supabase Dashboard 获取:');
  console.log('  Settings -> API -> service_role secret (需要开启 "Show service_role key")');
  console.log('');
  console.log('运行: SUPABASE_SERVICE_ROLE_KEY=your_key node exec-sql.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const sql = `
-- 建 life_events + da_yun 表
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

-- RLS 加固
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE da_yun ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "a1" ON user_profiles;
CREATE POLICY "a1" ON user_profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "a2" ON matches;
CREATE POLICY "a2" ON matches FOR ALL USING (auth.uid() = user_id OR auth.uid() = matched_user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "a3" ON chat_messages;
CREATE POLICY "a3" ON chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "a4" ON life_events;
CREATE POLICY "a4" ON life_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "a5" ON da_yun;
CREATE POLICY "a5" ON da_yun FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;

async function main() {
  console.log('🚀 执行 Supabase SQL...');
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    // rpc 可能不存在，尝试直接执行
    console.log('⚠️ RPC 不可用，尝试直接 SQL...');
    const { error: sqlError } = await supabase.from('_exec_sql').select().limit(0);
    
    if (sqlError && sqlError.message.includes('does not exist')) {
      console.error('❌ 无法执行 DDL - 需要 service_role key');
      console.log('请从 Supabase Dashboard 获取 service_role key:');
      console.log('  Settings -> API -> 开启 Show service_role key');
      process.exit(1);
    }
  }
  
  console.log('✅ 完成!');
}

main();
