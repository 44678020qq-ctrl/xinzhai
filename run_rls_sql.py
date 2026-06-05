#!/usr/bin/env python3
"""Execute RLS hardening SQL against Supabase using a local access token."""
import json
import os
from pathlib import Path

import requests

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "hcmjwmahnrfktxptkewx")
MANAGEMENT_KEY = os.environ.get("SUPABASE_ACCESS_TOKEN")
SQL_FILE = Path(os.environ.get("RLS_SQL_FILE", "rls_hardening_fixed.sql"))

if not MANAGEMENT_KEY:
    raise SystemExit("SUPABASE_ACCESS_TOKEN is required")

sql_content = SQL_FILE.read_text(encoding="utf-8")
statements = [s.strip() for s in sql_content.split(";") if s.strip() and not s.strip().startswith("--")]

print(f"{len(statements)} SQL statements to execute\n")

headers = {
    "Authorization": f"Bearer {MANAGEMENT_KEY}",
    "Content-Type": "application/json",
}
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

for i, stmt in enumerate(statements, 1):
    payload = {"query": stmt + ";"}
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.ok:
            result = resp.json()
            print(f"OK [{i}/{len(statements)}]")
            if result:
                print(f"   result: {json.dumps(result, ensure_ascii=False)[:100]}")
        else:
            print(f"FAIL [{i}/{len(statements)}] ({resp.status_code})")
            print(f"   {resp.text[:200]}")
    except Exception as exc:
        print(f"ERROR [{i}/{len(statements)}]: {exc}")

print("\nDone")
