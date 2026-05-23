"use client";

import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-bg">
      {/* 装饰性墨点 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-ink opacity-[0.15]" />
        <div className="absolute top-[35%] right-[12%] w-1 h-1 rounded-full bg-ink opacity-[0.10]" />
        <div className="absolute bottom-[30%] left-[25%] w-2 h-2 rounded-full bg-ink opacity-[0.20]" />
      </div>

      <div className="animate-fade-in-up flex flex-col items-center gap-8 max-w-sm">
        {/* 心斋标题 */}
        <div className="flex flex-col items-center gap-3">
          <InkMark />
          <h1 className="text-4xl tracking-[0.3em] text-ink font-light">
            心斋
          </h1>
          <div className="w-12 h-[0.5px] bg-line" />
          <p className="text-sm text-sub tracking-wider font-light">
            八字人格 · 共鸣连接
          </p>
        </div>

        {/* 世界观描述 */}
        <p className="text-xs text-sub leading-relaxed font-light">
          不是滑动与擦肩
          <br />
          是命理里早已写好的共鸣
        </p>

        <button
          onClick={() => router.push("/register")}
          className="mt-4 px-10 py-3.5 rounded-2xl bg-accent text-white text-sm tracking-wide font-medium hover:bg-[#5A8D7A] transition-colors shadow-sm"
        >
          入斋
        </button>

        <p className="text-[10px] text-sub mt-4 font-light">
          填写出生信息，生成你的能量名片
        </p>
      </div>
    </main>
  );
}