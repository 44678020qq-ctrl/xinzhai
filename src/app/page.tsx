import Link from "next/link";
import { InkMark } from "@/components/InkMark";

const STEPS = [
  { title: "入斋", text: "填写出生信息，生成只属于你的能量名片。" },
  { title: "遇合", text: "按恋人、老板、合伙人、玩伴四种关系看匹配。" },
  { title: "对谈", text: "用克制的语言聊真实感受，不做命运判词。" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="min-h-[92vh] px-6 py-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-4">
            <InkMark />
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-normal">心斋</h1>
              <p className="text-sm leading-7 text-sub">
                基于八字人格的轻社交系统。先看见自己，再慢慢遇见别人。
              </p>
            </div>
          </div>

          <div className="rounded-[8px] border border-line/60 bg-card p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {["木", "火", "水"].map((item, index) => (
                <div key={item} className="flex flex-col items-center gap-2">
                  <div
                    className="h-14 w-full rounded-[6px]"
                    style={{
                      backgroundColor: ["#9CB89A", "#D88A7A", "#7AA0C4"][index],
                      opacity: 0.86,
                    }}
                  />
                  <span className="text-xs text-sub">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="w-full rounded-2xl bg-accent px-5 py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5A8D7A]"
            >
              开始入斋
            </Link>
            <div className="flex justify-center gap-4 text-[11px] text-sub">
              <Link href="/privacy" className="hover:text-accent">隐私政策</Link>
              <Link href="/terms" className="hover:text-accent">用户协议</Link>
              <Link href="/data-deletion" className="hover:text-accent">数据删除</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex gap-3 border-t border-line/60 py-4">
              <span className="text-xs text-sub">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-sm font-semibold text-ink">{step.title}</h2>
                <p className="mt-1 text-xs leading-6 text-sub">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
