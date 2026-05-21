# 心斋 · 建表操作指南（任务③）

## 需要执行的 SQL

文件路径：`supabase/tables-life-events-da-yun.sql`

## 操作步骤（2分钟）

1. 打开 Supabase Dashboard：
   https://supabase.com/dashboard/project/hcmjwmahnrfktxptkewx/sql

2. 点击左侧 **SQL Editor**

3. 复制粘贴 `supabase/tables-life-events-da-yun.sql` 的全部内容

4. 点击 **Run** 执行

5. 确认输出：
   - ✅ life_events 表已创建
   - ✅ da_yun 表已创建
   - ✅ RLS 策略已启用
   - ✅ 触发器已创建

## 执行后验证

在 SQL Editor 中运行：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('life_events', 'da_yun');
```

应返回两行：life_events, da_yun
