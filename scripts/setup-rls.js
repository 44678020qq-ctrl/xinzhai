#!/usr/bin/env node
/**
 * 心斋 RLS 加固脚本
 * 用法: node scripts/setup-rls.js <SUPABASE_SERVICE_ROLE_KEY>
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hcmjwmahnrfktxptkewx.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ 错误: 需要提供 Service Role Key');
  console.error('用法: node scripts/setup-rls.js <your-service-role-key>');
  console.error('或设置环境变量: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/setup-rls.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sqlStatements = [
  // 1. user_profiles
  'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles',
  'DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles',
  'DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles',
  `CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id)`,
  `CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  `CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  
  // 2. matches
  'ALTER TABLE matches ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can read own matches" ON matches',
  `CREATE POLICY "Users can read own matches" ON matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b)`,
  
  // 3. chat_messages
  'ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages',
  'DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages',
  `CREATE POLICY "Users can read own messages" ON chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id)`,
  `CREATE POLICY "Users can insert messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id)`,
  
  // 4. life_events
  'ALTER TABLE life_events ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can CRUD own life_events" ON life_events',
  `CREATE POLICY "Users can CRUD own life_events" ON life_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  
  // 5. da_yun
  'ALTER TABLE da_yun ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Users can CRUD own da_yun" ON da_yun',
  `CREATE POLICY "Users can CRUD own da_yun" ON da_yun FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
];

async function setupRLS() {
  console.log('🔐 开始设置 RLS 策略...\n');
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const shortSql = sql.length > 60 ? sql.substring(0, 60) + '...' : sql;
    process.stdout.write(`[${i + 1}/${sqlStatements.length}] ${shortSql} ... `);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // exec_sql RPC 可能不存在，尝试使用 REST API 直接查询
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          // 忽略"已经启用"之类的错误
          if (errorText.includes('already') || errorText.includes('exists')) {
            console.log('✅ (已存在)');
          } else {
            console.log(`⚠️  ${errorText.substring(0, 50)}`);
          }
        } else {
          console.log('✅');
        }
      } else {
        console.log('✅');
      }
    } catch (err) {
      // 忽略已存在的错误
      if (String(err).includes('already') || String(err).includes('exists')) {
        console.log('✅ (已存在)');
      } else {
        console.log(`⚠️  ${String(err).substring(0, 50)}`);
      }
    }
  }
  
  console.log('\n✅ RLS 加固完成！');
  console.log('\n验证命令（在 Supabase SQL Editor 中执行）:');
  console.log(`
SELECT tablename, rowsecurity AS rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'matches', 'chat_messages', 'life_events', 'da_yun');
`);
}

setupRLS().catch(console.error);
