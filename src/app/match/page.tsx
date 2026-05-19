"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";
import { getDayMasterWuxing } from "@/lib/bazi";

interface MockProfile {
  id: string;
  wuxing_personality: string;
  dayMaster: string;
  summary: string;
  keywords: string[];
  bazi_display: string;
}

/** 五行相生评分 */
function calcCompatibility(myWx: string, theirWx: string): number {
  const shengMap: Record<string, string> = {
    "木": "火", "火": "土", "土": "金", "金": "水", "水": "木",
  };
  const keMap: Record<string, string> = {
    "木": "土", "火": "金", "土": "水", "金": "木", "水": "火",
  };

  if (shengMap[theirWx] === myWx) return 88 + Math.floor(Math.random() * 8);
  if (shengMap[myWx] === theirWx) return 78 + Math.floor(Math.random() * 8);
  if (myWx === theirWx) return 68 + Math.floor(Math.random() * 10);
  if (keMap[theirWx] === myWx) return 58 + Math.floor(Math.random() * 10);
  if (keMap[myWx] === theirWx) return 50 + Math.floor(Math.random() * 10);
  return 65 + Math.floor(Math.random() * 15);
}

/** 匹配理由 */
function getCompatibilityReason(myWx: string, theirWx: string, theirLabel: string): string {
  const shengMap: Record<string, string> = {
    "木": "火", "火": "土", "土": "金", "金": "水", "水": "木",
  };

  if (shengMap[theirWx] === myWx) {
    return `对方${theirLabel}生你的${myWx}，天然滋养，在一起会感到被理解和接纳。`;
  }
  if (shengMap[myWx] === theirWx) {
    return `你的${myWx}生对方${theirLabel}，你会在关系中自然付出，形成能量流动。`;
  }
  if (myWx === theirWx) {
    return `同类${myWx}，你们有相似的能量底色，容易产生共鸣，但可能缺乏互补。`;
  }
  return `${theirLabel}与你的${myWx}形成张力关系，吸引力强烈但需注意磨合。`;
}

/** 分数颜色 */
function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-rose-600 bg-rose-50 border-rose-200";
}

/** 五行颜色 */
function getWuxingColor(wx: string): string {
  const map: Record<string, string> = {
    "木": "text-emerald-700 bg-emerald-50",
    "火": "text-rose-700 bg-rose-50",
    "土": "text-amber-700 bg-amber-50",
    "金": "text-slate-700 bg-slate-50",
    "水": "text-blue-700 bg-blue-50",
  };
  return map[wx] || "text-ink-700 bg-ink-50";
}

/** Mock 推荐池 */
function generateMockPool() {
  return [
    {
      id: "m1", wuxing_personality: "庚金", dayMaster: "金",
      summary: "结构型理性思维，外冷内稳，重承诺与秩序。",
      keywords: ["理性", "秩序感", "克制", "可靠"],
      bazi_display: "庚申 戊子 庚子 庚辰",
    },
    {
      id: "m2", wuxing_personality: "壬水", dayMaster: "水",
      summary: "流动型共情人格，善倾听，在关系中承担容器功能。",
      keywords: ["共情", "包容", "直觉", "柔性"],
      bazi_display: "壬寅 癸丑 壬戌 癸卯",
    },
    {
      id: "m3", wuxing_personality: "戊土", dayMaster: "土",
      summary: "沉稳型支撑人格，不喧哗，但始终在场。",
      keywords: ["沉稳", "支撑", "低调", "持久"],
      bazi_display: "戊戌 己未 戊辰 壬子",
    },
    {
      id: "m4", wuxing_personality: "丙火", dayMaster: "火",
      summary: "热情型表达人格，感染力强，善于点燃他人。",
      keywords: ["热情", "表达", "感染力", "外向"],
      bazi_display: "丙午 甲午 丙寅 乙未",
    },
    {
      id: "m5", wuxing_personality: "甲木", dayMaster: "木",
      summary: "生长型理想人格，有方向感，带动周围一起向上。",
      keywords: ["理想", "方向感", "生长", "带动"],
      bazi_display: "甲子 丙寅 甲戌 庚午",
    },
  ];
}

interface MatchResult {
  id: string;
  wuxing_personality: string;
  summary: string;
  keywords: string[];
  bazi_display: string;
  dayMaster: string;
  compatibility: number;
  reason: string;
}

export default function MatchPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [myWx, setMyWx] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("xinzhai_birth");
    if (!raw) { router.push("/input"); return; }

    import("@/lib/bazi").then((mod) => {
      const form = JSON.parse(raw);
      const bazi = mod.calculateBazi(
        parseInt(form.birth_year),
        parseInt(form.birth_month),
        parseInt(form.birth_day),
        form.birth_hour ? parseInt(form.birth_hour) : undefined,
        form.birth_minute ? parseInt(form.birth_minute) : undefined,
        form.is_lunar || false
      );
      const wx = mod.getDayMasterWuxing(bazi);
      setMyWx(wx);

      const pool = generateMockPool();
      const results: MatchResult[] = pool.map((p) => ({
        id: p.id,
        wuxing_personality: p.wuxing_personality,
        summary: p.summary,
        keywords: p.keywords,
        bazi_display: p.bazi_display,
        dayMaster: p.dayMaster,
        compatibility: calcCompatibility(wx, p.dayMaster),
        reason: getCompatibilityReason(wx, p.dayMaster, p.wuxing_personality),
      }));

      results.sort((a, b) => b.compatibility - a.compatibility);
      setMatches(results);
      setLoading(false);
    });
  }, [router]);

  const handleSendResonance = (match: MatchResult) => {
    setSent((prev) => [...prev, match.id]);
    sessionStorage.setItem("xinzhai_match", JSON.stringify(match));
    router.push("/resonance");
  };

  if (loading || !myWx) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-ink-400 text-sm tracking-wider font-light">
          正在匹配…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">
        {/* 标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-base tracking-[0.2em] text-ink-800 font-light">今日共鸣</h2>
          <div className="w-8 h-[0.5px] bg-ink-300" />
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] text-ink-400 font-light">你的日主</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-light ${getWuxingColor(myWx)}`}>
              {myWx}
            </span>
          </div>
        </div>

        {/* 匹配列表 */}
        <div className="flex flex-col gap-4">
          {matches.map((match, index) => (
            <div key={match.id} className="border border-ink-100 rounded-sm p-4 flex flex-col gap-3 relative">
              {index < 3 && (
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-ink-800 text-white text-[9px] flex items-center justify-center font-light">
                  {index + 1}
                </div>
              )}

              {/* 头部 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-800 tracking-wider font-light">
                    {match.wuxing_personality}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-light ${getWuxingColor(match.dayMaster)}`}>
                    {match.dayMaster}
                  </span>
                </div>
                <div className={`text-[11px] px-2 py-0.5 rounded-full font-light border ${getScoreColor(match.compatibility)}`}>
                  共鸣 {match.compatibility}%
                </div>
              </div>

              {/* 八字 */}
              <p className="text-[10px] text-ink-400 tracking-wider font-light font-mono">
                {match.bazi_display}
              </p>

              <p className="text-xs text-ink-500 leading-relaxed font-light">
                {match.summary}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {match.keywords.map((kw) => (
                  <span key={kw} className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full font-light">
                    {kw}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-ink-500 bg-ink-50/50 p-3 rounded-sm leading-relaxed font-light border-l-2 border-ink-200">
                <span className="text-[10px] text-ink-400">匹配理由：</span>
                {match.reason}
              </div>

              <button
                onClick={() => handleSendResonance(match)}
                disabled={sent.includes(match.id)}
                className="mt-1 py-2 border border-ink-200 text-ink-600 text-xs tracking-wider hover:bg-ink-50 transition-colors duration-500 font-light disabled:opacity-30"
              >
                {sent.includes(match.id) ? "已发送共鸣卡" : "发送共鸣卡"}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/card")}
          className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-light text-center"
        >
          ← 返回人格卡
        </button>
      </div>
    </main>
  );
}
