import Link from "next/link";

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <article className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <header className="space-y-2">
          <Link href="/" className="text-xs text-sub hover:text-accent">← 返回心斋</Link>
          <h1 className="text-2xl font-semibold">数据删除说明</h1>
          <p className="text-xs text-sub">更新日期：2026-06-04</p>
        </header>

        <section className="space-y-3 text-sm leading-7 text-ink-2">
          <p>你可以在“我”页面点击“清除缓存”删除本机浏览器中的出生信息、八字结果和聊天对象缓存。</p>
          <p>清除本地缓存不会自动删除 Supabase 中的服务端资料。服务端资料可能包含你的匿名账号、个人资料、匹配记录和你发送过的消息。</p>
          <p>如需删除服务端数据，请通过产品提供的联系渠道提交请求，并附上你的账号标识或可验证信息。我们会在确认身份后处理删除。</p>
          <p>上线前如尚未配置正式客服邮箱，请先不要对外开放公测注册。</p>
        </section>
      </article>
    </main>
  );
}
