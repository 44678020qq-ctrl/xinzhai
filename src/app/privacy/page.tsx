import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <article className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <header className="space-y-2">
          <Link href="/" className="text-xs text-sub hover:text-accent">← 返回心斋</Link>
          <h1 className="text-2xl font-semibold">隐私政策</h1>
          <p className="text-xs text-sub">更新日期：2026-06-04</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-ink-2">
          <p>心斋会收集你主动填写的出生日期、出生时辰、性别、昵称，以及系统据此生成的八字人格信息，用于生成能量名片、匹配结果和对谈体验。</p>
          <p>你的完整出生资料只用于个人资料与计算，不会在匹配列表中直接公开。匹配页只读取公开匹配视图中的有限字段，例如显示名、八字干支、日主五行和人格标签。</p>
          <p>如果你开启对谈，系统会保存你发出的真人消息，用于展示会话与维护关系上下文。AI 回复不会被写成对方真人消息。</p>
          <p>我们不会出售你的个人信息。服务可能使用 Supabase、Vercel 和大模型 API 供应商完成认证、存储、部署和回复生成。</p>
          <p>你可以在“我”页面清除本地缓存；如需删除服务端数据，请查看数据删除说明。</p>
        </section>
      </article>
    </main>
  );
}
