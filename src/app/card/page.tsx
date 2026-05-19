"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";

interface CardData {
  wuxing_personality: string;
  keywords: string[];
  emotion_pattern: string;
  relation_pattern: string;
  social_tendency: string;
  summary: string;
  bazi_display: string;
}

interface BaziResult {
  year: { gan: string; zhi: string; wuxing_gan: string };
  month: { gan: string; zhi: string; wuxing_gan: string };
  day: { gan: string; zhi: string; wuxing_gan: string };
  hour?: { gan: string; zhi: string; wuxing_gan: string };
}

export default function CardPage() {
  const router = useRouter();
  const [card, setCard] = useState<CardData | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("xinzhai_birth");
    if (!raw) {
      router.push("/input");
      return;
    }
    const form = JSON.parse(raw);

    fetch("/api/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        setCard(data.card);
        setBazi(data.bazi);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-ink-400 text-sm tracking-wider font-light">
          正在生成人格画像…
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-ink-400 text-sm font-light">生成失败，请重试</p>
        <button
          onClick={() => router.push("/input")}
          className="text-xs text-ink-400 hover:text-ink-700 transition-colors font-light"
        >
          返回重新输入 →
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">
        {/* 顶部标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-lg tracking-[0.2em] text-ink-800 font-light">
            八字人格卡
          </h2>
          <div className="w-8 h-[0.5px] bg-ink-300" />
        </div>

        {/* 八字四柱展示 */}
        <div className="text-center">
          <p className="text-[10px] text-ink-400 tracking-wider font-light mb-3">
            四柱八字
          </p>
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {/* 年柱 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-ink-400 font-light">年柱</span>
              <div className="w-12 h-12 border border-ink-200 rounded-sm flex items-center justify-center">
                <span className="text-sm text-ink-800 font-light">
                  {bazi?.year ? `${bazi.year.gan}${bazi.year.zhi}` : '??'}
                </span>
              </div>
              <span className="text-[9px] text-ink-400 font-light">
                {bazi?.year ? bazi.year.wuxing_gan : ''}
              </span>
            </div>

            {/* 月柱 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-ink-400 font-light">月柱</span>
              <div className="w-12 h-12 border border-ink-200 rounded-sm flex items-center justify-center">
                <span className="text-sm text-ink-800 font-light">
                  {bazi?.month ? `${bazi.month.gan}${bazi.month.zhi}` : '??'}
                </span>
              </div>
              <span className="text-[9px] text-ink-400 font-light">
                {bazi?.month ? bazi.month.wuxing_gan : ''}
              </span>
            </div>

            {/* 日柱（日主） */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-accent font-light">日柱</span>
              <div className="w-12 h-12 border-2 border-ink-700 rounded-sm flex items-center justify-center bg-ink-50">
                <span className="text-sm text-ink-900 font-medium">
                  {bazi?.day ? `${bazi.day.gan}${bazi.day.zhi}` : '??'}
                </span>
              </div>
              <span className="text-[9px] text-ink-700 font-light">日主</span>
            </div>

            {/* 时柱 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-ink-400 font-light">时柱</span>
              <div className={`w-12 h-12 border rounded-sm flex items-center justify-center ${bazi?.hour ? 'border-ink-200' : 'border-ink-100 opacity-40'}`}>
                <span className="text-sm text-ink-800 font-light">
                  {bazi?.hour ? `${bazi.hour.gan}${bazi.hour.zhi}` : '??'}
                </span>
              </div>
              <span className="text-[9px] text-ink-400 font-light">
                {bazi?.hour ? bazi.hour.wuxing_gan : '未提供'}
              </span>
            </div>
          </div>
        </div>

        {/* 人格标签 */}
        <div className="text-center">
          <div className="inline-block px-5 py-2 border border-ink-200 rounded-sm">
            <span className="text-xl text-ink-900 tracking-wider font-light">
              {card.wuxing_personality}
            </span>
          </div>
        </div>

        {/* 性格关键词 */}
        <div className="flex flex-wrap justify-center gap-2">
          {card.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[11px] text-ink-600 bg-ink-50 px-3 py-1 rounded-full font-light"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* 人格描述 */}
        <div className="space-y-4 text-xs text-ink-600 font-light leading-relaxed">
          <div>
            <p className="text-[10px] text-ink-400 mb-1 font-light">情绪模式</p>
            <p>{card.emotion_pattern}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-400 mb-1 font-light">关系模式</p>
            <p>{card.relation_pattern}</p>
          </div>
          <div>
            <p className="text-[10px] text-ink-400 mb-1 font-light">社交倾向</p>
            <p>{card.social_tendency}</p>
          </div>
        </div>

        {/* 一句话总结 */}
        <div className="text-center border-t border-ink-100 pt-6">
          <p className="text-sm text-ink-700 font-light italic">
            {card.summary}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => router.push("/match")}
            className="py-3 border border-ink-300 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light"
          >
            查看今日共鸣
          </button>
          <button
            onClick={() => router.push("/input")}
            className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-light"
          >
            重新生成
          </button>
        </div>
      </div>
    </main>
  );
}
