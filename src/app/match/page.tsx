"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";
import {
  MATCH_ROLES,
  type MatchProfile,
  type MatchRole,
  type MatchScore,
  parseBaziDisplay,
  profileFromBazi,
  profileFromPillars,
  scoreMatch,
} from "@/lib/matching";

const MOCK_POOL = [
  { id: "m1", name: "甲木", summary: "有方向感，能带动周围一起向上。", keywords: ["理想", "生长", "带动"], bazi: "甲子 丙寅 甲戌 庚午" },
  { id: "m2", name: "乙木", summary: "柔韧、敏感，擅长在关系里慢慢靠近。", keywords: ["柔韧", "适应", "美学"], bazi: "乙卯 己卯 乙亥 丙子" },
  { id: "m3", name: "丙火", summary: "表达直接，有感染力，容易把气氛点亮。", keywords: ["热情", "表达", "外向"], bazi: "丙午 甲午 丙寅 乙未" },
  { id: "m4", name: "丁火", summary: "温暖细腻，慢热但很能照顾细节。", keywords: ["细腻", "温暖", "洞察"], bazi: "丁巳 乙巳 丁卯 壬寅" },
  { id: "m5", name: "戊土", summary: "稳定、低调，适合做能承接事情的人。", keywords: ["沉稳", "支撑", "持久"], bazi: "戊戌 己未 戊辰 壬子" },
  { id: "m6", name: "己土", summary: "包容耐心，容易让对方放松下来。", keywords: ["包容", "务实", "耐心"], bazi: "己未 辛未 己丑 丙寅" },
  { id: "m7", name: "庚金", summary: "理性、克制，重承诺和秩序。", keywords: ["理性", "可靠", "边界"], bazi: "庚申 戊子 庚子 庚辰" },
  { id: "m8", name: "辛金", summary: "有审美和标准，适合慢慢建立信任。", keywords: ["精致", "标准", "自律"], bazi: "辛酉 丁酉 辛巳 丙申" },
  { id: "m9", name: "壬水", summary: "共情力强，能接住细微的情绪变化。", keywords: ["共情", "包容", "流动"], bazi: "壬寅 癸丑 壬戌 癸卯" },
  { id: "m10", name: "癸水", summary: "内省、敏锐，适合深度交流。", keywords: ["内省", "洞察", "深度"], bazi: "癸亥 辛酉 癸未 己未" },
];

interface MatchResult {
  profile: MatchProfile;
  match: MatchScore;
}

function getWuxingColor(wx: string): string {
  const map: Record<string, string> = {
    "木": "#9CB89A", "火": "#D88A7A", "土": "#C9A86A", "金": "#B9AE92", "水": "#7AA0C4",
  };
  return map[wx] || "#94a3b8";
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 bg-emerald-50";
  if (score >= 70) return "text-blue-600 bg-blue-50";
  if (score >= 55) return "text-amber-600 bg-amber-50";
  return "text-stone-500 bg-stone-100";
}

function mockProfiles(): MatchProfile[] {
  return MOCK_POOL
    .map((item) => parseBaziDisplay(item.id, item.bazi, {
      name: item.name,
      keywords: item.keywords,
      summary: item.summary,
      isMock: true,
    }))
    .filter(Boolean) as MatchProfile[];
}

export default function MatchPage() {
  const router = useRouter();
  const [role, setRole] = useState<MatchRole>("lover");
  const [me, setMe] = useState<MatchProfile | null>(null);
  const [pool, setPool] = useState<MatchProfile[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSamples, setUsingSamples] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const raw = sessionStorage.getItem("xinzhai_birth");
      if (!raw) {
        router.push("/register");
        return;
      }

      try {
        const [{ calculateBazi }, { supabase, isSupabaseConfigured }] = await Promise.all([
          import("@/lib/bazi"),
          import("@/lib/supabase"),
        ]);
        const form = JSON.parse(raw);
        const bazi = calculateBazi(
          Number(form.birth_year),
          Number(form.birth_month),
          Number(form.birth_day),
          form.birth_hour !== "" && form.birth_hour !== undefined ? Number(form.birth_hour) : undefined,
          form.birth_minute !== "" && form.birth_minute !== undefined ? Number(form.birth_minute) : undefined,
          form.is_lunar || false
        );
        const myProfile = profileFromBazi("me", `${bazi.day.gan}${bazi.day.wuxing_gan}`, bazi);

        let userPool: MatchProfile[] = [];
        try {
          if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
          const { data: { user } } = await supabase.auth.getUser();
          const { data, error } = await supabase
            .from("public_match_profiles")
            .select("*")
            .neq("id", user?.id || "")
            .limit(50);

          if (!error && data?.length) {
            userPool = data
              .map((u: any) => profileFromPillars({
                id: u.id,
                name: u.display_name,
                yearGan: u.bazi_year_gan,
                yearZhi: u.bazi_year_zhi,
                monthGan: u.bazi_month_gan,
                monthZhi: u.bazi_month_zhi,
                dayGan: u.bazi_day_gan,
                dayZhi: u.bazi_day_zhi,
                hourGan: u.bazi_hour_gan,
                hourZhi: u.bazi_hour_zhi,
                dayMaster: u.day_master_wuxing,
                keywords: u.personality_tags,
                summary: u.personality_desc,
              }))
              .filter(Boolean) as MatchProfile[];
          }
        } catch {
          userPool = [];
        }

        if (!userPool.length) {
          userPool = mockProfiles();
          setUsingSamples(true);
        } else {
          setUsingSamples(false);
        }

        if (!cancelled) {
          setMe(myProfile);
          setPool(userPool);
          setLoading(false);
        }
      } catch (error) {
        console.warn("匹配加载失败:", error);
        sessionStorage.removeItem("xinzhai_birth");
        router.push("/register");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  const matches: MatchResult[] = useMemo(() => {
    if (!me) return [];
    return pool
      .map((profile) => ({ profile, match: scoreMatch(me, profile, role) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [me, pool, role]);

  const handleStartChat = (result: MatchResult) => {
    setSent((prev) => [...prev, result.profile.id]);
    sessionStorage.setItem("xinzhai_chat_target", JSON.stringify({
      id: result.profile.id,
      name: result.profile.name,
      wuxing: result.profile.dayMaster,
      isMock: result.profile.isMock || false,
    }));
    router.push("/chat");
  };

  if (loading || !me) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="animate-pulse text-sub text-sm">匹配中…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12 bg-bg">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-xl font-semibold text-ink">遇合</h2>
          <p className="text-xs text-sub">按不同关系，看看谁和你更合拍</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-sub">你的类型</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getWuxingColor(me.dayMaster) + "20", color: getWuxingColor(me.dayMaster) }}>
              {me.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {MATCH_ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                role === item.id ? "bg-accent text-white shadow-sm" : "bg-card text-sub border border-line/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {usingSamples && (
          <p className="text-[11px] text-sub text-center bg-card border border-line/50 rounded-xl px-3 py-2">
            真实用户还不多，先用体验样本帮你感受匹配方式
          </p>
        )}

        <div className="flex flex-col gap-3">
          {matches.length === 0 ? (
            <div className="text-center py-10 text-sub text-sm">暂时还没遇到合适的人，过两天再来看看</div>
          ) : (
            matches.slice(0, 5).map((result, index) => (
              <div key={result.profile.id} className="hover-float bg-card rounded-2xl shadow-sm border border-line/50 p-4 flex flex-col gap-3 relative">
                {index < 3 && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                    {index + 1}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: getWuxingColor(result.profile.dayMaster) }}>
                      {result.profile.name[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-ink truncate block">{result.profile.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getWuxingColor(result.profile.dayMaster) }} />
                        <span className="text-[9px] text-sub">{result.match.tier}</span>
                        {result.match.special_fate && <span className="text-[9px] text-accent">· {result.match.special_fate}</span>}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${getScoreColor(result.match.score)}`}>
                    {result.match.score}分
                  </div>
                </div>

                <p className="text-xs text-sub leading-relaxed bg-bg/60 rounded-xl p-3">
                  {result.match.reason}
                </p>

                <div className="flex flex-wrap gap-1">
                  {result.profile.keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent">{kw}</span>
                  ))}
                </div>

                <button
                  onClick={() => handleStartChat(result)}
                  disabled={sent.includes(result.profile.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-white hover:bg-[#5A8D7A] shadow-sm"
                >
                  {sent.includes(result.profile.id) ? "已开启" : "开始对谈 →"}
                </button>
              </div>
            ))
          )}
        </div>

        <button onClick={() => router.push("/card")} className="text-center text-xs text-line hover:text-sub transition-colors pt-2">
          ← 返回能量名片
        </button>
      </div>
    </main>
  );
}
