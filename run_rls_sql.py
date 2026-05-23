#!/usr/bin/env python3
"""执行 RLS 加固 SQL 到 Supabase"""
import json
import os
import requests

PROJECT_REF = "hcmjwmahnrfktxptkewx"
MANAGEMENT_KEY = "sbp_76bc0abf4c7a4b3c8e4f9d2a1b5c3e7f0d8e2a"

# 读取 SQL 文件
with open('/Users/sunxiaolong/.qclaw/workspace/xinzhai/rls_hardening.sql', 'r') as f:
    sql_content = f.read()

# 分批执行 SQL（每条语句单独执行）
# 按分号分割，过滤空语句
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"共 {len(statements)} 条语句待执行\n")

headers = {
    "Authorization": f"Bearer {MANAGEMENT_KEY}",
    "Content-Type": "application/json"
}

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

for i, stmt in enumerate(statements, 1):
    # 跳过纯注释行
    if stmt.startswith('--'):
        continue
    
    payload = {"query": stmt + ";"}
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            result = resp.json()
            print(f"✅ [{i}/{len(statements)}] 成功")
            if result:
                print(f"   结果: {json.dumps(result, ensure_ascii=False)[:100]}")
        else:
            print(f"❌ [{i}/{len(statements)}] 失败 ({resp.status_code})")
            print(f"   {resp.text[:200]}")
    except Exception as e:
        print(f"❌ [{i}/{len(statements)}] 异常: {e}")

print("\n执行完成！")
