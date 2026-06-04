# 心斋上线检查清单

## P0 必做

- [ ] 在 Supabase Dashboard SQL Editor 执行根目录 `rls_hardening_fixed.sql`。
- [ ] 执行 SQL 后，在 Supabase API 设置里 regenerate 曾泄露过的 `service_role` key。
- [ ] 确认 Vercel 环境变量只保留当前有效密钥：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DEEPSEEK_API_KEY`
- [ ] 确认客户端代码和 Vercel 环境变量中没有 `service_role` key。
- [ ] 跑通主流程：`/register` -> `/card` -> `/match` -> `/chat` -> `/me`。
- [ ] 确认 `/match` 真实用户池来自 `public_match_profiles`，完整出生资料只允许本人读取。
- [ ] 确认 `chat_messages` 写入字段为 `sender_id`、`receiver_id`、`content`、`is_read`。

## P1 公测前

- [ ] 准备至少 10 个真实种子用户，否则 `/match` 会显示体验样本。
- [ ] 恢复或重做 `/` 入斋页，不要直接跳注册。
- [ ] 补隐私政策、用户协议、数据删除说明。
- [ ] 加 Playwright 主流程回归，覆盖移动端视口。
- [ ] 接入 Sentry，记录前端异常、API 异常、LLM fallback。
- [ ] 如果面向国内用户，确定域名、备案、CDN 或容器部署方案。

## 验收口径

- `npm run lint` 通过。
- `npm run build` 通过。
- 未登录或无缓存访问 `/match`、`/chat`、`/me` 不崩溃。
- `/match` 不出现命理恐吓、判命、吉凶类文案。
- Hard List 命中时不进入 LLM。
- Supabase anon 用户不能读取其他用户的完整 `user_profiles` 记录。
