# 心斋（XinZhai）— 项目全貌

> 最后更新：2026-05-25 10:28
> 目的：Agent 与人类对齐项目进度和认知

---

## 一、项目定位

**八字人格匹配轻社交应用**。核心路径：看清自己 → 按角色找人 → 聊。

不是算命工具，不是玄学社区。是"内观+照己"定位的轻社交——八字只是底层引擎，用户看到的都是人话。

---

## 二、线上状态

| 环境 | 地址 | 状态 |
|------|------|------|
| **Vercel（主站）** | https://xinzhai-delta.vercel.app | ✅ 可访问 |
| 腾讯云 CloudBase | https://xinzhai-d1gs8m03va830e89e-1353471444.tcloudbaseapp.com | ❌ 418（静态托管不支持 SSR） |

**国内访问问题**：Vercel 在国内可能慢/不稳定，待选择部署方案（A:静态导出 / B:Vercel+CDN / C:云托管容器）。

---

## 三、技术栈

| 层 | 技术 | 备注 |
|----|------|------|
| 前端 | Next.js 16 + TypeScript + Tailwind CSS v4 + Turbopack | output: standalone |
| 八字计算 | lunar-javascript | npm 包，纯 TS |
| 后端/数据库 | Supabase（新加坡区域 ref: hcmjwmahnrfktxptkewx） | 匿名登录 + RLS |
| AI | DeepSeek API（硅基流动代理） | SSE 流式输出 |
| 部署 | Vercel Serverless | Python 不可用，TS 引擎降级 |
| PWA | manifest.json + sw.js | 可添加到主屏幕 |

---

## 四、数据库（Supabase 5表）

| 表 | 用途 | RLS |
|----|------|-----|
| **user_profiles** | 用户基本信息+八字缓存+人格标签 | ✅ auth.uid()=id |
| **matches** | 匹配记录（评分/角色/状态） | 待加固 |
| **chat_messages** | 聊天消息 | 待加固 |
| **life_events** | 人生事件 | ✅ auth.uid()=user_id |
| **da_yun** | 大运数据 | ✅ auth.uid()=user_id |

**真实用户**：至少1条 user_profiles 记录（id: e611303d-9bbd-4ac3-a682-5d33f62ac896）

**⚠️ 安全问题**：
- service_role key 曾在聊天中泄露，需 Regenerate
- RLS 加固 SQL（rls_hardening_fixed.sql）已备，待执行

---

## 五、5屏用户流程

```
① 入斋（/）       — 极简landing，单按钮"开始"
② 注册（/register）— 姓名+生日+时辰+性别，提交生成命签
③ 命签（/card）    — 能量名片：四柱+旺衰条+平实分析+轻标签(≤3)
④ 遇合（/match）   — 4角色匹配(恋人/老板/合伙人/玩伴)，真实用户池降级mock
⑤ 对谈（/chat）    — 真人聊天，AI仅给开场白
⑥ 我（/me）        — 个人信息页
```

**隐藏页面**（代码保留，导航不显示）：
- /flow — 流年运势（蜡烛图风格，数据未对接真实大运）
- 转潮仪式 — 大运换柱触发（代码在 turn-tide.ts）

**导航**：4Tab底部导航 — 命签·遇合·消息·我

---

## 六、代码结构

```
xinzhai/
├── CONTEXT.md                    ← 共享语言表（2026-05-25 新增）
├── docs/adr/                     ← 架构决策记录
│   └── 0001-adopt-mattpocock.md
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing（50行）
│   │   ├── register/page.tsx     ← 注册（367行）含 adjustToSolarTime
│   │   ├── card/page.tsx         ← 命签/能量名片（317行）4级降级链
│   │   ├── match/page.tsx        ← 遇合（313行）4角色匹配算法
│   │   ├── chat/page.tsx         ← 对谈（152行）SSE流式
│   │   ├── flow/page.tsx         ← 流年（263行）硬编码数据待对接
│   │   ├── me/page.tsx           ← 我（118行）
│   │   └── api/
│   │       ├── generate-card/route.ts  ← TS引擎（345行）
│   │       ├── chat/route.ts           ← AI对话（260行）
│   │       └── rules/analyze/route.ts  ← Python引擎（503降级）
│   ├── components/
│   │   ├── Navigation.tsx        ← 4Tab导航
│   │   ├── InkMark.tsx           ← 水墨印记
│   │   └── SolarTimeTrace.tsx    ← 真太阳时trace
│   └── lib/
│       ├── bazi.ts               ← 八字核心（637行）排盘+旺衰+用神+神煞+大运
│       ├── bazi-extension.ts     ← 扩展（405行）
│       ├── flow-data.ts          ← 流年数据层v3（392行）
│       ├── hardlist.ts           ← 红线拦截器（131行）6类
│       ├── jiaozi.ts             ← 种子钉子库（186行）10条
│       ├── llm.ts                ← DeepSeek客户端（162行）
│       ├── supabase.ts           ← 数据库客户端+类型（66行）
│       ├── turn-tide.ts          ← 转潮逻辑（128行）
│       └── yongshen-knowledge.ts ← 用神知识库（259行）
├── public/
│   ├── manifest.json             ← PWA
│   └── sw.js                     ← Service Worker
├── Dockerfile                    ← standalone容器构建
├── cloudbaserc.json              ← 腾讯云配置
└── rules/                        ← Python规则引擎（参考架构，生产不可用）
```

**代码总量**：约3800行 TS/TSX

---

## 七、核心算法

### 八字引擎（bazi.ts）
- 排盘：lunar-javascript → 四柱+五行
- 旺衰4步：得令/得地/得生/得助 → 5档评分
- 用神：旺则克泄耗，弱则帮扶
- 神煞5种：驿马/桃花/天乙贵人/华盖/文昌
- 调候：穷通宝鉴120条
- 大运：按性别+年柱阴阳推顺逆

### 匹配算法（match/page.tsx）
- 恋人：互补补喜用 + 天干五合加分
- 老板：贵人/生扶方向
- 合伙人：补弱五行
- 玩伴：同频/无冲克
- 评分：60基础 ± 因子 + 随机±8，clamp 40-99

### 降级链（card/page.tsx）
```
sessionStorage → Python引擎(503) → TS引擎 → Supabase profile → /register
```

---

## 八、UI 设计系统（v2.0 暖白轻社交风）

| Token | 色值 | 用途 |
|-------|------|------|
| bg | #F6F3EE | 暖米白底 |
| card | #FFFFFF | 白卡 |
| ink | #33312E | 主文字 |
| accent | #6FA292 | 青瓷绿主色 |
| accent-soft | #E6F0EC | 主色淡 |

圆角三级：主体2xl/xl，chat气泡保留非对称。无衬线字体。
动画：fadeInUp / msgIn / hoverFloat / pageIn

---

## 九、完成度评估：**55-60%**

### ✅ 已完成
- [x] 八字引擎核心（排盘+旺衰+用神+神煞+调候+大运）
- [x] 真太阳时两级降级（L1北京时间/L2城市经纬度）
- [x] AI对话（DeepSeek SSE流式）
- [x] 5屏核心流程走通（注册→命签→遇合→对谈→我）
- [x] 4角色匹配算法 + 真实用户池
- [x] 命签减负为能量名片
- [x] 文案audit（禁算命术语）
- [x] UI v2.0 暖白轻社交风
- [x] Hard List 红线拦截
- [x] 种子钉子库10条
- [x] PWA支持
- [x] Vercel部署上线
- [x] CONTEXT.md + ADR + diagnose 工程实践

### ❌ 未完成（P0 阻塞上线）
1. **国内访问方案未定** — Vercel 国内慢/不稳定，3方案待选
2. **RLS 加固 SQL 未执行** — rls_hardening_fixed.sql 已备，需在 Dashboard 无痕模式执行
3. **service_role key 泄露** — 执行 RLS 后必须 Regenerate

### ⚠️ 未完成（P1 功能缺陷）
4. **flow/page.tsx 硬编码数据** — 流年评分未对接真实大运
5. **旺衰评分仅3档**（缺极旺/偏旺偏弱，当前：极旺/旺/中和/弱/极弱 但实际只分3档打分）
6. **日柱/月柱显示 bug**（未排查）
7. **chat greeting bug**（chatTarget null 时显示"和 ?? 的对话"）
8. **register 无日期合法性校验**（2月30日等不拦截）

### 📋 未完成（P2 后续迭代）
9. 真实用户匹配池（当前仅1个真实用户）
10. 微信登录
11. 大运流年十神
12. 向量数据库语义匹配
13. 合规付费
14. /me 页隐私政策/关于我们
15. 调候表11条存疑数据校对

---

## 十、关键决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 匹配算法 | 五行相生相克评分 | 简单可解释，不依赖十神复杂度 |
| AI 角色 | 翻译规则引擎输出，不生成论断 | 因果链原则，AI 不凭空判断 |
| 真太阳时 | 两级降级（北京→城市经纬） | L1零成本，L2可选 |
| UI 风格 | 暖白轻社交，非水墨庙堂 | 产品定位是社交不是玄学 |
| Python引擎 | 参考架构，TS引擎降级 | Vercel Serverless 无 Python |
| 文案 | 用户可见禁算命术语 | 降低心理门槛，扩大用户群 |

---

## 十一、已知的坑

1. **globals.css @media print** — 必须与注释分行写，否则 PostCSS 崩溃致全站500
2. **parseInt("")** → NaN → lunar-javascript 崩溃 → 需用 `Number()` 或 null check
3. **真太阳时 hour 越界** → 均时差可把 hour 推到 -1 或 24 → 需边界保护
4. **sessionStorage 旧缓存** → JSON.parse 报错 → try-catch 自动清除
5. **Vercel 不自动部署** → 需 `vercel --prod --yes` 手动触发
6. **Supabase Dashboard** — 翻译插件冲突，需无痕模式操作

---

## 十二、Git 历史（近15次提交）

```
ede837d docs: CONTEXT.md + ADR-0001
e942fff fix: 真太阳时hour越界保护
0e01cec feat: PWA支持
e11eb2a remove: 流年运势入口移除
c0b837c fix: 注册页日期校验+card无限loading+chat greeting
f4d732d fix: v2.0视觉统一
72fec52 fix: globals.css打印样式+批次04-06 UI改版
d1ec090 fix: sessionStorage JSON解析错误
304ddbd fix: Python引擎JSON解析
446d342 feat: 去掉城市选择，统一北京时间
5883f01 feat: 批次02工单
7f29cf7 fix: 流年评分v3旺衰翻转
687187b feat: 流年页v2真实八字引擎
d13d936 feat: 真太阳时trace+Register集成
899f67b feat: 因果链补充da_yun/liu_nian/ge_ju
```

---

## 十三、下一步建议（优先级排序）

1. 🔴 **选择国内部署方案** — 决定 A/B/C
2. 🔴 **执行 RLS 加固 + Regenerate key** — 安全底线
3. 🟡 **修复 chat greeting bug** — 影响用户体验
4. 🟡 **flow 页对接真实数据** — 功能完整性
5. 🟢 **注册页日期校验** — 防错体验
6. 🟢 **真实用户池增长** — 产品价值验证
