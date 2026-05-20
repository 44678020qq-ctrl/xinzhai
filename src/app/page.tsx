"use client";

import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* 装饰性墨点 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-ink-300 opacity-40" />
        <div className="absolute top-[35%] right-[12%] w-1 h-1 rounded-full bg-ink-400 opacity-30" />
        <div className="absolute bottom-[30%] left-[25%] w-2 h-2 rounded-full bg-ink-200 opacity-50" />
      </div>

      <div className="animate-ink-spread flex flex-col items-center gap-8 max-w-sm">
        {/* 心斋标题 */}
        <div className="flex flex-col items-center gap-3">
          <InkMark />
          <h1 className="text-4xl tracking-[0.3em] text-ink-900 font-light">
            心斋
          </h1>
          <div className="w-12 h-[0.5px] bg-ink-300" />
          <p className="text-sm text-ink-500 tracking-wider font-light">
            八字人格 · 共鸣连接
          </p>
        </div>

        {/* 世界观描述 */}
        <p className="text-xs text-ink-400 leading-relaxed font-light">
          不是滑动与擦肩
          <br />
          是命理里早已写好的共鸣
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => router.push("/register")}
            className="px-10 py-3 border border-ink-300 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light"
          >
            开始
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-10 py-3 bg-ink-800 text-white text-sm tracking-widest hover:bg-ink-700 transition-colors duration-500 font-light"
          >
            注册
          </button>
        </div>

        <p className="text-[10px] text-ink-300 mt-8 font-light">
          基于八字命理的人格匹配系统
        </p>
      </div>
    </main>
  );
}
