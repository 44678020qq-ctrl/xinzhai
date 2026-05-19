# 心斋项目 Supabase 配置指南

## 第一步：创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 用 GitHub 账号登录
4. 创建新组织（如果没有）
5. 创建新项目：
   - 名称：xinzhai
   - 数据库密码：（自动生成或自定义）
   - 区域：选择 Singapore 或 Tokyo（离中国近）
6. 等待项目初始化（约 2 分钟）

## 第二步：获取 API 密钥

1. 进入项目后，点击左侧 "Settings"（齿轮图标）
2. 点击 "API"
3. 复制以下信息：
   - **Project URL**：`https://xxx.supabase.co`
   - **anon public key**：`eyJhbGciOiJIUzI1NiIsInR5cCI6...`

4. 在本地创建 `.env.local` 文件：

```bash
cd /Users/sunxiaolong/.qclaw/workspace/xinzhai
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

## 第三步：初始化数据库

1. 在 Supabase 控制台，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-init.sql` 文件的内容并粘贴
4. 点击 "Run" 执行

## 第四步：配置认证

1. 点击左侧 "Authentication" → "Providers"
2. 启用 "Email" 提供商（已默认启用）
3. 如需微信登录：
   - 点击 "Email" 旁边的 "Add provider"
   - 选择 "WeChat"
   - 输入微信开放平台的 App ID 和 App Secret

## 第五步：测试

```bash
cd /Users/sunxiaolong/.qclaw/workspace/xinzhai
npm run dev
```

访问 http://localhost:3000，点击"注册"按钮测试。

---

## 当前状态

✅ 已安装 `@supabase/supabase-js`
✅ 已创建数据库类型定义
✅ 已创建注册页面 `/register`
✅ 已修改首页添加注册入口
⏳ 等待：创建 Supabase 项目并配置 `.env.local`
