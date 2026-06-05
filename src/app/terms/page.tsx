import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <article className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <header className="space-y-2">
          <Link href="/" className="text-xs text-sub hover:text-accent">← 返回心斋</Link>
          <h1 className="text-2xl font-semibold">用户协议</h1>
          <p className="text-xs text-sub">更新日期：2026-06-04</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-ink-2">
          <p>心斋提供的是人格理解、关系匹配和轻社交体验，不提供医疗、法律、金融、婚恋承诺或命运预测服务。</p>
          <p>你需要保证提交的信息来自本人或已获得授权，并对你在对谈中发送的内容负责。请不要发送违法、骚扰、歧视、暴力、色情或泄露他人隐私的内容。</p>
          <p>匹配分数和文案只表示系统基于规则计算出的相处倾向，不构成对任何关系结果的保证。</p>
          <p>平台可以为了安全、合规、反滥用和服务维护，限制、删除或拒绝处理明显违规内容。</p>
          <p>继续使用心斋，即表示你理解并接受以上条款。</p>
        </section>
      </article>
    </main>
  );
}
