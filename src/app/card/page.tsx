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

const WX_COLOR: Record<string, string> = {
  '木': '#9CB89A', '火': '#D88A7A', '土': '#C9A86A', '金': '#B9AE92', '水': '#7AA0C4',
};

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

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
        let form;
        try { form = JSON.parse(raw); } catch (e) {
          console.error("sessionStorage 数据格式错误，清除缓存:", e);
          sessionStorage.removeItem("xinzhai_birth");
          sessionStorage.removeItem("xinzhai_bazi");
          router.push("/register");
          setLoading(false);
          return;
        }

        // 优先 Python 规则引擎
        try {
          const pyRes = await fetch("/api/rules/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              birth_year: form.birth_year, birth_month: form.birth_month,
              birth_day: form.birth_day, birth_hour: form.birth_hour,
              birth_minute: form.birth_minute, gender: form.gender,
            }),
          });
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            if (pyData.success && pyData.data) {
              const a = pyData.data;
              const bi = a.base_info;
              const wxMap: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
              const dayWx = wxMap[bi?.day_master_wuxing] || bi?.day_master_wuxing || '?';
              const reasons = a.strength_reason || [];
              const deLing = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得令') || r.conclusion.includes('+30'));
              const deDi = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得地') || r.conclusion.includes('+20'));
              const deSheng = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得势') || r.conclusion.includes('+10'));
              const totalScore = reasons.length > 0 ? parseInt(reasons[reasons.length - 1]?.evidence?.match(/总分\s*(-?\d+)/)?.[1] || '30') : 30;
              const scoreNorm = Math.max(0, Math.min(1, totalScore / 80));
              const yong = (a.yong_shen || []).filter((y: {priority: number}) => y.priority === 1);
              const yongEls = yong.map((y: {element: string}) => wxMap[y.element] || y.element);
              const xiEls = a.xi_shen?.map((e: string) => wxMap[e] || e) || [];
              const jiEls = a.ji_shen?.map((e: string) => wxMap[e] || e) || [];
              const yongReason = yong[0]?.primary_reason?.[0]?.conclusion || '';
              const wxRaw = a.wuxing_strength || {};
              const wxTotal = Object.values(wxRaw as Record<string, number>).reduce((s, v) => s + v, 0) || 1;
              const wxNorm: Record<string, number> = {};
              for (const [k, v] of Object.entries(wxRaw)) { wxNorm[wxMap[k] || k] = (v as number) / wxTotal; }
              const pStrs = [bi?.year, bi?.month, bi?.day, bi?.hour];
              const pillars = pStrs.map(s => s ? { gan: s[0] || '?', zhi: s[1] || '?', wuxing_gan: '' } : null);
              const cardData: CardData = {
                wuxing_personality: `${bi?.day_master || '?'}${dayWx}`,
                keywords: [],
                emotion_pattern: '',
                relation_pattern: '',
                social_tendency: '',
                summary: `${bi?.day_master || '?'}${dayWx}日主，${a.day_master_strength || '中和'}。${yongReason}`,
                bazi_display: `${bi?.year || ''} ${bi?.month || ''} ${bi?.day || ''} ${bi?.hour || ''}`,
                strength: { level: a.day_master_strength || '中和', score: scoreNorm, deLing, deDi, deSheng, deZhu: deSheng },
                yongShen: { yongShen: yongEls, xiShen: xiEls, jiShen: jiEls, reason: yongReason },
                wuxingStrength: wxNorm,
                shenSha: (a.shen_sha || []).map((s: {name: string; position: string; description: string; warning?: string}) => ({
                  name: s.name, position: s.position, description: s.description, warning: s.warning,
                })),
                tiaoHou: a.tiao_hou ? { coreNeed: a.tiao_hou.core_need || [], reason: a.tiao_hou.reason || '', avoid: a.tiao_hou.avoid || [] } : undefined,
              };
              const baziResult: BaziResult = {
                year: pillars[0] || { gan: '?', zhi: '?', wuxing_gan: '' },
                month: pillars[1] || { gan: '?', zhi: '?', wuxing_gan: '' },
                day: pillars[2] || { gan: '?', zhi: '?', wuxing_gan: '' },
                hour: pillars[3] || undefined,
              };
              setCard(cardData);
              setBazi(baziResult);
              setEngine("python");
              setLoading(false);
              return;
            }
          }
        } catch (e) { console.warn("Python 引擎不可用，降级到 TS 引擎:", e); }

        // Fallback: TS 引擎
        try {
          const res = await fetch("/api/generate-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.card && data.bazi) {
              setCard(data.card);
              setBazi(data.bazi);
              setEngine("ts");
              setLoading(false);
              return;
            }
          }
        } catch (e) { console.error("TS 引擎也失败:", e); }
      }

      // Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
          if (profile) {
            const form = {
              birth_year: profile.birth_year, birth_month: profile.birth_month,
              birth_day: profile.birth_day, birth_hour: profile.birth_hour,
              birth_minute: profile.birth_minute, gender: profile.gender,
            };
            const res = await fetch("/api/generate-card", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
            });
            const data = await res.json();
            setCard(data.card); setBazi(data.bazi); setEngine("ts"); setLoading(false); return;
          }
        }
      } catch {}
      setLoading(false);
      router.push("/register");
    };
    loadData().catch(err => { console.error(err); setLoading(false); });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse text-sub text-sm">正在生成能量名片…</div>
          <div className="w-4 h-4 border-t-2 border-accent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!card || !bazi) {
    return (
      <main className="min-h-screen flex items-center justify-center flex-col gap-4 bg-bg">
        <p className="text-sub text-sm">暂时无法生成，请重新填写信息</p>
        <button onClick={() => router.push("/register")} className="text-xs text-sub hover:text-accent transition-colors">
          重新输入 →
        </button>
      </main>
    );
  }

  // 五行分布
  const wxEntries = card.wuxingStrength ? Object.entries(card.wuxingStrength) : [];
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12 bg-bg">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-6">

        {/* 标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-xl font-semibold text-ink">我的能量名片</h2>
        </div>

        {/* 白色卡片主体 */}
        <div className="bg-card rounded-2xl shadow-sm border border-line/50 p-6 flex flex-col gap-5">

          {/* 日主大字 + 五行色点 */}
          <div className="text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
              <span className="text-2xl font-bold text-accent">{card.wuxing_personality?.[0]}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">{card.wuxing_personality}</h3>
            </div>

            {/* 五行分布色点 */}
            {wxEntries.length > 0 && (
              <div className="flex gap-2">
                {wxEntries.map(([wx, pct]) => (
                  <div key={wx} className="flex flex-col items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: WX_COLOR[wx] || '#ccc' }} />
                    <span className="text-[9px] text-sub">{wx}</span>
                    <span className="text-[9px] text-ink font-medium">{Math.round((pct as number) * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 四柱 */}
          <div>
            <p className="text-[10px] text-sub text-center mb-2 font-medium">八字</p>
            <div className="grid grid-cols-4 gap-2">
              {pillars.map((p, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-sub">{PILLAR_LABELS[i]}</span>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium ${
                    i === 2 ? 'bg-accent-soft text-accent' : 'bg-bg text-ink'
                  }`}>
                    {p ? `${p.gan}${p.zhi}` : '??'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 能量状态条 */}
          {card.strength && (
            <div className="bg-bg/60 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-sub font-medium">能量状态</span>
                <span className="text-xs font-semibold text-ink">{card.strength.level}</span>
              </div>
              <div className="w-full h-2 bg-line/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(95, (card.strength.score || 0.5) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* 用神 / 喜神 */}
          {card.yongShen && (
            <div className="flex flex-wrap gap-1.5">
              {card.yongShen.yongShen.map((el, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: WX_COLOR[el] || '#eee', color: '#fff' }}>{el}</span>
              ))}
              {card.yongShen.xiShen.map((el, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent">{el}</span>
              ))}
            </div>
          )}

          {/* 总结 */}
          {card.summary && (
            <p className="text-xs text-sub leading-relaxed text-center">{card.summary}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/match")}
            className="w-full py-3.5 rounded-2xl bg-accent text-white text-sm font-semibold tracking-wide hover:bg-[#5A8D7A] transition-colors shadow-sm"
          >
            看看谁能和你共鸣 →
          </button>
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 rounded-2xl bg-white text-accent text-sm font-medium tracking-wide border-2 border-accent hover:bg-accent-soft transition-colors"
          >
            晒命签
          </button>
          <button
            onClick={() => router.push("/register")}
            className="text-center text-xs text-line hover:text-sub transition-colors"
          >
            重新生成
          </button>
        </div>
      </div>
    </main>
  );
}
