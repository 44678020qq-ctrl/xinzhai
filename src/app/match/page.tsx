"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";

/** 角色类型 */
type RoleType = "玩伴" | "恋人" | "老板" | "合伙人";

interface MockProfile {
  id: string;
  wuxing_personality: string;
  dayMaster: string;
  ganZhi: string;
  summary: string;
  keywords: string[];
  bazi_display: string;
  shishen: string;
}

/** 不同角色的匹配算法 */
function calcCompatibilityByRole(
  myWx: string, myYongshen: string, theirWx: string,
  theirGan: string, myGuiren: string[], role: RoleType
): number {
  const shengMap: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const keMap: Record<string, string> = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" };
  const tianGanHe: Record<string, string> = { "甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊" };
  const hasTianGanHe = tianGanHe[theirGan] === myYongshen?.charAt(0) || false;
  const buXiYong = theirWx === myYongshen;
  const shengXiYong = shengMap[theirWx] === myYongshen;
  const isGuiren = myGuiren.includes(theirGan);
  const tongPin = myWx === theirWx;
  const hasChongKe = keMap[theirWx] === myWx || keMap[myWx] === theirWx;
  let baseScore = 60;
  switch (role) {
    case "恋人":
      if (buXiYong) baseScore += 25;
      else if (shengXiYong) baseScore += 18;
      if (hasTianGanHe) baseScore += 12;
      if (tongPin) baseScore += 8;
      if (hasChongKe) baseScore -= 10;
      break;
    case "老板":
      if (isGuiren) baseScore += 30;
      else if (shengMap[theirWx] === myWx) baseScore += 20;
      else if (buXiYong) baseScore += 15;
      if (hasChongKe) baseScore -= 5;
      break;
    case "合伙人":
      if (buXiYong) baseScore += 28;
      else if (shengXiYong) baseScore += 15;
      if (tongPin) baseScore -= 5;
      break;
    case "玩伴":
      if (tongPin) baseScore += 22;
      else if (shengMap[theirWx] === myWx || shengMap[myWx] === theirWx) baseScore += 12;
      if (hasChongKe) baseScore -= 15;
      break;
  }
  return Math.min(99, Math.max(40, baseScore));
}

/** 平实的契合理由 */
function getPlainReason(
  myWx: string, myYongshen: string, theirWx: string,
  theirGan: string, myGuiren: string[], role: RoleType
): string {
  const shengMap: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const buXiYong = theirWx === myYongshen;
  const shengXiYong = shengMap[theirWx] === myYongshen;
  const isGuiren = myGuiren.includes(theirGan);
  const tongPin = myWx === theirWx;
  switch (role) {
    case "恋人":
      if (buXiYong) return `TA 是${theirWx}，正好补你缺的那块。跟这种人一起，你会松一点。`;
      if (shengXiYong) return `TA 的能量能滋养你，跟 TA 在一起，你会觉得被理解。`;
      if (tongPin) return `你们能量底色很像，容易聊到一块。`;
      return `TA 的能量和你有些张力，吸引力强，但得磨合。`;
    case "老板":
      if (isGuiren) return `TA 是你的贵人类型。在你上面能托得住你。`;
      if (shengMap[theirWx] === myWx) return `TA 的能量能撑着你，适合在你上面。`;
      if (buXiYong) return `TA 有你缺的那块能量，跟着 TA 能学到东西。`;
      return `能量关系一般，主要看实际能力和资源。`;
    case "合伙人":
      if (buXiYong) return `TA 恰好补你短板，能力互补，适合一起干事。`;
      if (shengXiYong) return `TA 能提供你需要的资源，合作会有正向流动。`;
      return `能量搭配还行，合作要靠业务互补。`;
    case "玩伴":
      if (tongPin) return `你们频率挺像的，玩到一块不费劲。`;
      if (shengMap[theirWx] === myWx) return `TA 让你觉得舒服，没什么压力。`;
      if (shengMap[myWx] === theirWx) return `你让 TA 舒服，相处轻松。`;
      return `有点冲，但架不住玩得来。`;
  }
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
  if (score >= 60) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

function generateMockPool(): MockProfile[] {
  return [
    { id: "m1", wuxing_personality: "甲木", dayMaster: "木", ganZhi: "甲", summary: "生长型理想人格，有方向感，带动周围一起向上。", keywords: ["理想", "方向感", "生长", "带动"], bazi_display: "甲子 丙寅 甲戌 庚午", shishen: "比肩" },
    { id: "m2", wuxing_personality: "乙木", dayMaster: "木", ganZhi: "乙", summary: "柔性适应型人格，如藤蔓般韧性，擅长迂回达成目标。", keywords: ["柔韧", "适应", "美学", "敏感"], bazi_display: "乙卯 己卯 乙亥 丙子", shishen: "比肩" },
    { id: "m3", wuxing_personality: "丙火", dayMaster: "火", ganZhi: "丙", summary: "热情型表达人格，感染力强，善于点燃他人。", keywords: ["热情", "表达", "感染力", "外向"], bazi_display: "丙午 甲午 丙寅 乙未", shishen: "劫财" },
    { id: "m4", wuxing_personality: "丁火", dayMaster: "火", ganZhi: "丁", summary: "烛光型细腻人格，温暖但内敛，照亮身边人而不自知。", keywords: ["细腻", "温暖", "内敛", "洞察"], bazi_display: "丁巳 乙巳 丁卯 壬寅", shishen: "劫财" },
    { id: "m5", wuxing_personality: "戊土", dayMaster: "土", ganZhi: "戊", summary: "沉稳型支撑人格，不喧哗但始终在场。", keywords: ["沉稳", "支撑", "低调", "持久"], bazi_display: "戊戌 己未 戊辰 壬子", shishen: "食神" },
    { id: "m6", wuxing_personality: "己土", dayMaster: "土", ganZhi: "己", summary: "包容型滋养人格，像大地一样接纳万物，适合做倾听者。", keywords: ["包容", "滋养", "务实", "耐心"], bazi_display: "己未 辛未 己丑 丙寅", shishen: "食神" },
    { id: "m7", wuxing_personality: "庚金", dayMaster: "金", ganZhi: "庚", summary: "结构型理性思维，外冷内稳，重承诺与秩序。", keywords: ["理性", "秩序感", "克制", "可靠"], bazi_display: "庚申 戊子 庚子 庚辰", shishen: "偏财" },
    { id: "m8", wuxing_personality: "辛金", dayMaster: "金", ganZhi: "辛", summary: "精致型审美人格，追求品质与完美，内在有强标准。", keywords: ["精致", "标准", "审美", "自律"], bazi_display: "辛酉 丁酉 辛巳 丙申", shishen: "偏财" },
    { id: "m9", wuxing_personality: "壬水", dayMaster: "水", ganZhi: "壬", summary: "流动型共情人格，善倾听，在关系中承担容器功能。", keywords: ["共情", "包容", "直觉", "柔性"], bazi_display: "壬寅 癸丑 壬戌 癸卯", shishen: "正官" },
    { id: "m10", wuxing_personality: "癸水", dayMaster: "水", ganZhi: "癸", summary: "智慧型内省人格，洞察力强，适合深度交流。", keywords: ["智慧", "内省", "洞察", "深度"], bazi_display: "癸亥 辛酉 癸未 己未", shishen: "正官" },
  ];
}

interface MatchResult {
  id: string; wuxing_personality: string; dayMaster: string; ganZhi: string;
  summary: string; keywords: string[]; bazi_display: string; shishen: string;
  compatibility: number; reason: string;
}

const ROLES: RoleType[] = ["玩伴", "恋人", "老板", "合伙人"];

export default function MatchPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType>("玩伴");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [myWx, setMyWx] = useState<string | null>(null);
  const [myGan, setMyGan] = useState<string | null>(null);
  const [myYongshen, setMyYongshen] = useState<string>("木");
  const [myGuiren, setMyGuiren] = useState<string[]>([]);
  const [pool, setPool] = useState<MockProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("xinzhai_birth");
    if (!raw) { router.push("/register"); return; }
    import("@/lib/bazi").then(async (mod) => {
      const form = JSON.parse(raw);
      const bazi = mod.calculateBazi(
        parseInt(form.birth_year), parseInt(form.birth_month), parseInt(form.birth_day),
        form.birth_hour ? parseInt(form.birth_hour) : undefined,
        form.birth_minute ? parseInt(form.birth_minute) : undefined,
        form.is_lunar || false
      );
      const wx = mod.getDayMasterWuxing(bazi);
      setMyWx(wx);
      setMyGan(bazi.dayGan);
      const shengMap: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
      setMyYongshen(shengMap[wx]);
      setMyGuiren([Object.entries(shengMap).find(([, v]) => v === wx)?.[0] || wx, shengMap[wx]]);
      let userPool: MockProfile[];
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { user } } = await supabase.auth.getUser();
        const { data: realUsers, error } = await supabase
          .from('user_profiles')
          .select('*')
          .not('day_master_wuxing', 'is', null)
          .neq('id', user?.id || '')
          .limit(50);
        if (error || !realUsers || realUsers.length === 0) {
          userPool = generateMockPool();
        } else {
          userPool = realUsers.map(u => ({
            id: u.id, wuxing_personality: `${u.bazi_day_gan || '?'}${u.day_master_wuxing || '?'}`,
            dayMaster: u.day_master_wuxing || '未知', ganZhi: u.bazi_day_gan || '?',
            summary: u.personality_tags?.join('、') || `在这里等你`,
            keywords: (u.personality_tags as string[]) || [u.day_master_wuxing || '神秘'],
            bazi_display: `${u.bazi_year_gan || '?'}${u.bazi_year_zhi || '?'} ${u.bazi_month_gan || '?'}${u.bazi_month_zhi || '?'} ${u.bazi_day_gan || '?'}${u.bazi_day_zhi || '?'}`,
            shishen: '',
          }));
        }
      } catch {
        userPool = generateMockPool();
      }
      setPool(userPool);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!myWx || pool.length === 0) return;
    const results: MatchResult[] = pool.map(p => ({
      id: p.id, wuxing_personality: p.wuxing_personality, dayMaster: p.dayMaster,
      ganZhi: p.ganZhi, summary: p.summary, keywords: p.keywords,
      bazi_display: p.bazi_display, shishen: p.shishen,
      compatibility: calcCompatibilityByRole(myWx, myYongshen, p.dayMaster, p.ganZhi, myGuiren, selectedRole),
      reason: getPlainReason(myWx, myYongshen, p.dayMaster, p.ganZhi, myGuiren, selectedRole),
    }));
    results.sort((a, b) => b.compatibility - a.compatibility);
    setMatches(results);
  }, [selectedRole, myWx, myYongshen, myGuiren, pool]);

  const handleSendResonance = (match: MatchResult) => {
    setSent(prev => [...prev, match.id]);
    sessionStorage.setItem("xinzhai_chat_target", JSON.stringify({
      id: match.id, name: match.wuxing_personality, wuxing: match.dayMaster, ganZhi: match.ganZhi,
    }));
    router.push("/chat");
  };

  if (loading || !myWx) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="animate-pulse text-sub text-sm">匹配中…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12 bg-bg">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-6">
        {/* 标题 */}
        <div className="text-center flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-xl font-semibold text-ink">遇合</h2>
          <p className="text-xs text-sub">选择角色，看看谁比较合</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-sub">你的类型</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getWuxingColor(myWx) + '20', color: getWuxingColor(myWx) }}>
              {myGan}{myWx}
            </span>
          </div>
        </div>

        {/* 角色选择器 - 轻感 pill 风格 */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                selectedRole === role
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-card border border-line text-sub hover:border-accent hover:text-accent'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* 匹配列表 - 白色卡片风格 */}
        <div className="flex flex-col gap-3">
          {matches.length === 0 ? (
            <div className="text-center py-10 text-sub text-sm">这个角色暂时还没遇到合适的，过两天再来看看</div>
          ) : (
            matches.slice(0, 5).map((match, index) => (
              <div key={match.id} className="hover-float bg-card rounded-2xl shadow-sm border border-line/50 p-4 flex flex-col gap-3 relative">
                {index < 3 && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                    {index + 1}
                  </div>
                )}
                {/* 头部：人格 + 分数 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: getWuxingColor(match.dayMaster) }}>
                      {match.wuxing_personality?.[0]}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-ink">{match.wuxing_personality}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getWuxingColor(match.dayMaster) }} />
                        <span className="text-[9px] text-sub">{match.dayMaster}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${getScoreColor(match.compatibility)}`}>
                    {match.compatibility}分
                  </div>
                </div>
                {/* 契合理由 */}
                <p className="text-xs text-sub leading-relaxed bg-bg/60 rounded-xl p-3">
                  {match.reason}
                </p>
                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  {match.keywords.slice(0, 3).map(kw => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent">{kw}</span>
                  ))}
                </div>
                {/* 发送共鸣 */}
                <button
                  onClick={() => handleSendResonance(match)}
                  disabled={sent.includes(match.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-white hover:bg-[#5A8D7A] shadow-sm"
                >
                  {sent.includes(match.id) ? '已发送共鸣' : '发送共鸣 →'}
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
