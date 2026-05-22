#!/bin/bash
# 让用户在本地 terminal 运行这一行，获取 service_role key
# 运行后在终端输出 key，我们就能自动执行 SQL

echo "打开 https://supabase.com/dashboard/project/hcmjwmahnrfktxptkewx/settings/api"
echo ""
echo "找到 'Service Role' (需要点 eye icon 显示)"
echo ""
echo "复制那个 key，发送给我"
echo ""
echo "或者直接在这里运行（如果你能看到的话）:"
echo "  SUPABASE_SERVICE_ROLE_KEY=you_key node -e \"console.log('OK')\""