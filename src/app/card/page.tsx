"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { InkMark } from "@/components/InkMark";

interface CardData {
  wuxing_personality: string;
  keywords: string[];
  emotion_pattern: string;
  relation_pattern: string;
  social_tendency: string;
  summary: string;
  bazi_display: string;
  strength?: {
    level: string;
    score: number;
    deLing: boolean;
    deDi: boolean;
    deSheng: boolean;
    deZhu: boolean;
  };
  yongShen?: {
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    reason: string;
  };
  wuxingStrength?: Record<string, number>;
  shenSha?: Array<{name: string; position: string; description: string; warning?: string}>;
  tiaoHou?: { coreNeed: string[]; reason: string; avoid: string[] };
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
  const [engine, setEngine] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const raw = sessionStorage.getItem("xinzhai_birth");

      if (raw) {
        const form = JSON.parse(raw);

        // 优先尝试 Python 规则引擎
        try {
          const pyRes = await fetch("/api/rules/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              birth_year: form.birth_year,
              birth_month: form.birth_month,
              birth_day: form.birth_day,
              birth_hour: form.birth_hour,
              birth_minute: form.birth_minute,
              gender: form.gender,
            }),
          });
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            if (pyData.success && pyData.data) {
              const a = pyData.data;
              const bi = a.base_info;
              // 从 Python 引擎结果构建 card
              const wxMap: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
              const dayWx = wxMap[bi?.day_master_wuxing] || bi?.day_master_wuxing || '?';
              // 从 strength_reason 推导四得
              const reasons = a.strength_reason || [];
              const deLing = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得令') || r.conclusion.includes('+30'));
              const deDi = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得地') || r.conclusion.includes('+20'));
              const deSheng = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得势') || r.conclusion.includes('+10'));
              const totalScore = reasons.length > 0 ? parseInt(reasons[reasons.length - 1]?.evidence?.match(/总分\s*(-?\d+)/)?.[1] || '30') : 30;
              const scoreNorm = Math.max(0, Math.min(1, totalScore / 80));
              // 用神喜忌
              const yong = (a.yong_shen || []).filter((y: {priority: number}) => y.priority === 1);
              const yongEls = yong.map((y: {element: string}) => wxMap[y.element] || y.element);
              const xiEls = a.xi_shen?.map((e: string) => wxMap[e] || e) || [];
              const jiEls = a.ji_shen?.map((e: string) => wxMap[e] || e) || [];
              const yongReason = yong[0]?.primary_reason?.[0]?.conclusion || '';
              // 五行分布标准化
              const wxRaw = a.wuxing_strength || {};
              const wxTotal = Object.values(wxRaw as Record<string, number>).reduce((s, v) => s + v, 0) || 1;
              const wxNorm: Record<string, number> = {};
              for (const [k, v] of Object.entries(wxRaw)) { wxNorm[wxMap[k] || k] = (v as number) / wxTotal; }
              // 四柱解析
              const pStrs = [bi?.year, bi?.month, bi?.day, bi?.hour];
              const pillars = pStrs.map(s => {
                if (!s) return null;
                return { gan: s[0] || '?', zhi: s[1] || '?', wuxing_gan: '' };
              });
              const card: CardData = {
                wuxing_personality: `${bi?.day_master || '?'}${dayWx}`,
                keywords: [],
                emotion_pattern: '',
                relation_pattern: '',
                social_tendency: '',
                summary: `${bi?.day_master || '?'}${dayWx}日主，${a.day_master_strength || '中和'}。${yongReason}`,
                bazi_display: `${bi?.year || ''} ${bi?.month || ''} ${bi?.day || ''} ${bi?.hour || ''}`,
                strength: {
                  level: a.day_master_strength || '中和',
                  score: scoreNorm,
                  deLing, deDi, deSheng, deZhu: deSheng,
                },
                yongShen: {
                  yongShen: yongEls,
                  xiShen: xiEls,
                  jiShen: jiEls,
                  reason: yongReason,
                },
                wuxingStrength: wxNorm,
                shenSha: (a.shen_sha || []).map((s: {name: string; position: string; description: string; warning?: string}) => ({
                  name: s.name, position: s.position, description: s.description, warning: s.warning,
                })),
                tiaoHou: a.tiao_hou ? {
                  coreNeed: a.tiao_hou.core_need || [],
                  reason: a.tiao_hou.reason || '',
                  avoid: a.tiao_hou.avoid || [],
                } : undefined,
              };
              const baziResult: BaziResult = {
                year: pillars[0] || { gan: '?', zhi: '?', wuxing_gan: '' },
                month: pillars[1] || { gan: '?', zhi: '?', wuxing_gan: '' },
                day: pillars[2] || { gan: '?', zhi: '?', wuxing_gan: '' },
                hour: pillars[3] || undefined,
              };
              setCard(card);
              setBazi(baziResult);
              setEngine("python");
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Python 引擎不可用，降级到 TS 引擎:", e);
        }

        // Fallback: TS 引擎
        try {
          const res = await fetch("/api/generate-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          const data = await res.json();
          setCard(data.card);
          setBazi(data.bazi);
          setEngine("ts");
          setLoading(false);
          return;
        } catch (e) {
          console.error("TS 引擎也失败:", e);
        }
      }

      // Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (profile) {
            const form = {
              birth_year: profile.birth_year,
              birth_month: profile.birth_month,
              birth_day: profile.birth_day,
              birth_hour: profile.birth_hour,
              birth_minute: profile.birth_minute,
              gender: profile.gender,
            };
            const res = await fetch("/api/generate-card", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json();
            setCard(data.card);
            setBazi(data.bazi);
            setEngine("ts");
            setLoading(false);
            return;
          }
        }
      } catch {}

      router.push("/register");
    };

    loadData().catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse text-ink-400 text-sm tracking-wider font-light">
            正在生成命签…
          </div>
          <div className="w-4 h-4 border-t border-ink-300 border-r border-ink-200 rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-ink-400 text-sm font-light">生成失败</p>
        <button
          onClick={() => router.push("/register")}
          className="text-xs text-ink-400 hover:text-ink-700 transition-colors font-light"
        >
          重新输入 →
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">
        {/* 引擎标记 */}
        {engine === "python" && (
          <div className="self-end text-[9px] text-ink-300 font-light">
            规则引擎 v1
          </div>
        )}

        {/* 顶部标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-lg tracking-[0.2em] text-ink-800 font-light">
            命签
          </h2>
          <div className="w-8 h-[0.5px] bg-ink-300" />
        </div>

        {/* 八字四柱展示 */}
        <div className="text-center">
          <p className="text-[10px] text-ink-400 tracking-wider font-light mb-3">
            四柱八字
          </p>
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {[
              { label: "年柱", pillar: bazi?.year },
              { label: "月柱", pillar: bazi?.month },
              { label: "日柱", pillar: bazi?.day, isDay: true },
              { label: "时柱", pillar: bazi?.hour },
            ].map(({ label, pillar, isDay }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className={`text-[9px] font-light ${isDay ? "text-accent" : "text-ink-400"}`}>
                  {label}
                </span>
                <div className={`w-12 h-12 border rounded-sm flex items-center justify-center ${
                  isDay ? "border-ink-700 bg-ink-50" : pillar ? "border-ink-200" : "border-ink-100 opacity-40"
                }`}>
                  <span className={`text-sm font-light ${isDay ? "text-ink-900 font-medium" : "text-ink-800"}`}>
                    {pillar ? `${pillar.gan}${pillar.zhi}` : "??"}
                  </span>
                </div>
                <span className="text-[9px] text-ink-400 font-light">
                  {pillar?.wuxing_gan || (isDay ? "日主" : pillar ? "" : "未提供")}
                </span>
              </div>
            ))}
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
        {card.keywords.length > 0 && (
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
        )}

        {/* 人格描述 */}
        <div className="space-y-4 text-xs text-ink-600 font-light leading-relaxed">
          {card.emotion_pattern && (
            <div>
              <p className="text-[10px] text-ink-400 mb-1 font-light">情绪模式</p>
              <p>{card.emotion_pattern}</p>
            </div>
          )}
          {card.relation_pattern && (
            <div>
              <p className="text-[10px] text-ink-400 mb-1 font-light">关系模式</p>
              <p>{card.relation_pattern}</p>
            </div>
          )}
          {card.social_tendency && (
            <div>
              <p className="text-[10px] text-ink-400 mb-1 font-light">社交倾向</p>
              <p>{card.social_tendency}</p>
            </div>
          )}
        </div>

        {/* 命理规则层 */}
        {card.strength && (
          <div className="space-y-4 border-t border-ink-200 pt-6 mt-2">
            {/* 旺衰 */}
            <div className="bg-gradient-to-r from-ink-50 to-white rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-500 tracking-wider font-light">日主旺衰</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-medium ${
                    card.strength.level.includes("旺") ? "text-red-600" :
                    card.strength.level.includes("弱") ? "text-blue-600" :
                    "text-emerald-600"
                  }`}>
                    {card.strength.level}
                  </span>
                  <span className="text-[10px] text-ink-400 font-light">
                    {Math.round(card.strength.score * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    card.strength.score > 0.6 ? "bg-red-400" :
                    card.strength.score < 0.4 ? "bg-blue-400" :
                    "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.max(5, Math.min(95, card.strength.score * 100))}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {([
                  ["得令", card.strength.deLing],
                  ["得地", card.strength.deDi],
                  ["得生", card.strength.deSheng],
                  ["得助", card.strength.deZhu],
                ] as const).map(([label, val]) => (
                  <div key={label} className="text-center py-1.5 rounded-sm bg-white/60">
                    <span className={`text-[9px] font-medium ${val ? "text-ink-700" : "text-ink-300"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 用神喜忌 */}
            {card.yongShen && (
              <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/30 rounded-sm p-4 space-y-2">
                <p className="text-[10px] text-amber-700 tracking-wider font-light">⚡ 用神喜忌</p>
                <p className="text-xs text-amber-900/80 leading-relaxed font-light">{card.yongShen.reason}</p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-amber-600 font-light">喜：</span>
                    <span className="text-[10px] text-amber-800 font-medium">{card.yongShen.yongShen.join(" ")}</span>
                  </div>
                  {card.yongShen.xiShen.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-ink-500 font-light">辅：</span>
                      <span className="text-[10px] text-ink-600 font-light">{card.yongShen.xiShen.join(" ")}</span>
                    </div>
                  )}
                  {card.yongShen.jiShen.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-rose-400 font-light">忌：</span>
                      <span className="text-[10px] text-rose-600 font-light">{card.yongShen.jiShen.join(" ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 五行分布 */}
            {card.wuxingStrength && (
              <div className="rounded-sm p-4 space-y-2">
                <p className="text-[10px] text-ink-500 tracking-wider font-light">五行力量分布</p>
                <div className="space-y-1.5">
                  {Object.entries(card.wuxingStrength)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([wx, val]) => {
                      const pct = Math.round((val as number) * 100);
                      const colorMap: Record<string, string> = {
                        "木": "bg-emerald-400", "火": "bg-rose-400", "土": "bg-amber-400",
                        "金": "bg-slate-400", "水": "bg-blue-400",
                      };
                      return (
                        <div key={wx} className="flex items-center gap-2">
                          <span className="text-[9px] text-ink-500 w-3 font-light">{wx}</span>
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colorMap[wx] || "bg-ink-300"}`} style={{ width: `${Math.max(2, pct)}%` }} />
                          </div>
                          <span className="text-[9px] text-ink-400 w-7 text-right font-light">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 神煞 */}
            {card.shenSha && card.shenSha.length > 0 && (
              <div className="rounded-sm p-4 space-y-2">
                <p className="text-[10px] text-ink-500 tracking-wider font-light">神煞</p>
                <div className="space-y-2">
                  {card.shenSha.map((ss, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] text-ink-700 font-medium shrink-0">{ss.name}</span>
                      <span className="text-[10px] text-ink-400 font-light">{ss.position}</span>
                      <span className="text-[10px] text-ink-500 font-light flex-1">{ss.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 调候 */}
            {card.tiaoHou && card.tiaoHou.coreNeed.length > 0 && (
              <div className="bg-gradient-to-r from-sky-50/50 to-blue-50/30 rounded-sm p-4 space-y-2">
                <p className="text-[10px] text-sky-700 tracking-wider font-light">🌡 调候</p>
                <p className="text-xs text-sky-900/80 leading-relaxed font-light">{card.tiaoHou.reason}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] text-sky-700 font-light">需：</span>
                  {card.tiaoHou.coreNeed.map(n => (
                    <span key={n} className="text-[10px] text-sky-800 px-1.5 py-0.5 bg-sky-100/50 rounded-sm font-light">{n}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 总结 */}
        {card.summary && (
          <div className="text-center border-t border-ink-100 pt-6">
            <p className="text-sm text-ink-700 font-light italic">{card.summary}</p>
          </div>
        )}

        {/* 操作 */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => router.push("/match")}
            className="py-3 border border-ink-300 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light"
          >
            查看今日共鸣
          </button>
          <button
            onClick={() => router.push("/register")}
            className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-light"
          >
            重新生成
          </button>
        </div>
      </div>
    </main>
  );
}
