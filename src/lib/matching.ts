import type { BaziResult } from "./bazi";
import { calculateWuxingStrength, findYongShen } from "./bazi";

export type MatchRole = "lover" | "boss" | "partner" | "playmate";
export type MatchTier = "很合" | "合" | "还行" | "不强求";

export interface MatchProfile {
  id: string;
  name: string;
  dayMaster: string;
  dayGan: string;
  dayZhi: string;
  stems: string[];
  branches: string[];
  wuxingPower: Record<string, number>;
  keywords: string[];
  summary: string;
  baziDisplay: string;
  isMock?: boolean;
}

export interface MatchAtoms {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface MatchScore {
  score: number;
  tier: MatchTier;
  special_fate: string;
  reason: string;
  atoms: MatchAtoms;
}

const WUXING = ["木", "火", "土", "金", "水"];
const SHENG: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
const KE: Record<string, string> = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" };
const STEM_WUXING: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
  "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水",
};
const BRANCH_WUXING: Record<string, string> = {
  "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
  "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水",
};
const STEM_COMBINE: Record<string, string> = {
  "甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛",
  "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊",
};
const BRANCH_CLASH: Record<string, string> = {
  "子": "午", "午": "子", "丑": "未", "未": "丑", "寅": "申", "申": "寅",
  "卯": "酉", "酉": "卯", "辰": "戌", "戌": "辰", "巳": "亥", "亥": "巳",
};
const BRANCH_PUNISH = new Set(["子卯", "卯子", "寅巳", "巳申", "申寅", "丑戌", "戌未", "未丑", "辰辰", "午午", "酉酉", "亥亥"]);

export const MATCH_ROLES: Array<{ id: MatchRole; label: string }> = [
  { id: "lover", label: "恋人" },
  { id: "boss", label: "老板" },
  { id: "partner", label: "合伙人" },
  { id: "playmate", label: "玩伴" },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizePower(power: Record<string, number>): Record<string, number> {
  const total = WUXING.reduce((sum, wx) => sum + (power[wx] || 0), 0) || 1;
  return Object.fromEntries(WUXING.map((wx) => [wx, (power[wx] || 0) / total]));
}

function profileNeeds(profile: MatchProfile): string[] {
  const entries = WUXING.map((wx) => [wx, profile.wuxingPower[wx] || 0] as const)
    .sort((a, b) => a[1] - b[1]);
  return entries.slice(0, 2).map(([wx]) => wx);
}

function avgPower(profile: MatchProfile, elements: string[]): number {
  if (elements.length === 0) return 0;
  return elements.reduce((sum, wx) => sum + (profile.wuxingPower[wx] || 0), 0) / elements.length;
}

function countStemHarmony(a: MatchProfile, b: MatchProfile): number {
  let count = 0;
  for (const stem of a.stems) {
    count += b.stems.filter((candidate) => STEM_COMBINE[stem] === candidate).length;
  }
  return count;
}

function countConflict(a: MatchProfile, b: MatchProfile): number {
  let count = 0;
  for (const wx of WUXING) {
    if (KE[wx] && a.wuxingPower[wx] > 0.22 && b.wuxingPower[KE[wx]] > 0.22) count += 1;
  }
  for (const branch of a.branches) {
    count += b.branches.filter((candidate) => BRANCH_CLASH[branch] === candidate || BRANCH_PUNISH.has(`${branch}${candidate}`)).length;
  }
  return count;
}

function calcAtoms(me: MatchProfile, candidate: MatchProfile): MatchAtoms {
  const needs = profileNeeds(me);
  const candidateNeeds = profileNeeds(candidate);
  const harmonyCount = countStemHarmony(me, candidate);
  const distance = WUXING.reduce((sum, wx) => sum + Math.abs((me.wuxingPower[wx] || 0) - (candidate.wuxingPower[wx] || 0)), 0);
  const supportElements = WUXING.filter((wx) => SHENG[wx] === me.dayMaster || wx === me.dayMaster);
  const coverWeak = avgPower(candidate, needs);
  const mutualCover = (coverWeak + avgPower(me, candidateNeeds)) / 2;

  return {
    A: clamp01(mutualCover * 2.2),
    B: clamp01(harmonyCount / 2),
    C: clamp01(avgPower(candidate, supportElements) * 2.1),
    D: clamp01(1 - distance / 2),
    E: clamp01(countConflict(me, candidate) / 4),
  };
}

function tierFromScore(score: number): MatchTier {
  if (score >= 85) return "很合";
  if (score >= 70) return "合";
  if (score >= 55) return "还行";
  return "不强求";
}

function roleRawScore(role: MatchRole, atoms: MatchAtoms): number {
  const bonusB = atoms.B * 0.12;
  if (role === "lover") return 0.7 * atoms.A + 0.3 * atoms.D + bonusB;
  if (role === "boss") return 0.8 * atoms.C + 0.2 * atoms.D;
  if (role === "partner") return 0.65 * atoms.A + 0.35 * atoms.C;
  return 0.75 * atoms.D + 0.25 * atoms.A;
}

function specialFate(atoms: MatchAtoms, score: number): string {
  if (score < 55) return "";
  if (atoms.B >= 1) return "自然有牵引";
  if (atoms.A >= 0.8 && atoms.D >= 0.65) return "互补又好聊";
  if (atoms.D >= 0.82) return "节奏很接近";
  if (atoms.C >= 0.78) return "容易被托住";
  return "";
}

function reasonFor(role: MatchRole, atoms: MatchAtoms, tier: MatchTier): string {
  if (tier === "不强求") {
    return "你们的节奏差异比较明显，适合先轻轻接触，不用急着给关系定方向。";
  }
  if (atoms.E >= 0.55) {
    return "你们有能互相补上的地方，但节奏上也容易顶住，聊起来要给彼此一点空间。";
  }
  if (role === "lover") {
    if (atoms.A >= 0.72 && atoms.B > 0) return "对方能补上你容易缺的部分，也有自然靠近的感觉，适合从轻松的话题开始。";
    if (atoms.A >= 0.7) return "对方身上有你容易被托住的部分，相处会比单独用力更省劲。";
  }
  if (role === "playmate" && atoms.D >= 0.72) {
    return "你们的节奏比较接近，开始聊天不需要太多铺垫，适合一起做轻松的事。";
  }
  if (role === "boss" && atoms.C >= 0.7) {
    return "对方给你的支撑感更明显，适合在有目标、有反馈的关系里互相看见。";
  }
  if (role === "partner" && atoms.A >= 0.65) {
    return "你们能补到彼此的短板，适合把边界和分工说清楚后再一起推进。";
  }
  return "你们有一定的相处空间，适合慢慢聊，看真实互动里是不是舒服。";
}

export function scoreMatch(me: MatchProfile, candidate: MatchProfile, role: MatchRole): MatchScore {
  const atoms = calcAtoms(me, candidate);
  const weighted = roleRawScore(role, atoms) - atoms.E * 0.16;
  const score = Math.round(Math.max(35, Math.min(96, 42 + weighted * 58)));
  const tier = tierFromScore(score);
  return {
    score,
    tier,
    special_fate: specialFate(atoms, score),
    reason: reasonFor(role, atoms, tier),
    atoms,
  };
}

export function profileFromBazi(id: string, name: string, bazi: BaziResult, keywords: string[] = [], summary = ""): MatchProfile {
  const power = normalizePower(calculateWuxingStrength(bazi).normalized);
  const yongShen = findYongShen(bazi).yongShen;
  return {
    id,
    name,
    dayMaster: bazi.day.wuxing_gan,
    dayGan: bazi.day.gan,
    dayZhi: bazi.day.zhi,
    stems: [bazi.year.gan, bazi.month.gan, bazi.day.gan, bazi.hour?.gan].filter(Boolean) as string[],
    branches: [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.hour?.zhi].filter(Boolean) as string[],
    wuxingPower: power,
    keywords: keywords.length > 0 ? keywords : yongShen.map((wx) => `${wx}感`),
    summary,
    baziDisplay: [bazi.year, bazi.month, bazi.day, bazi.hour].filter(Boolean).map((p) => `${p?.gan}${p?.zhi}`).join(" "),
  };
}

export function profileFromPillars(input: {
  id: string;
  name?: string | null;
  yearGan?: string | null;
  yearZhi?: string | null;
  monthGan?: string | null;
  monthZhi?: string | null;
  dayGan?: string | null;
  dayZhi?: string | null;
  hourGan?: string | null;
  hourZhi?: string | null;
  dayMaster?: string | null;
  keywords?: string[] | null;
  summary?: string | null;
  isMock?: boolean;
}): MatchProfile | null {
  const stems = [input.yearGan, input.monthGan, input.dayGan, input.hourGan].filter(Boolean) as string[];
  const branches = [input.yearZhi, input.monthZhi, input.dayZhi, input.hourZhi].filter(Boolean) as string[];
  const dayGan = input.dayGan || stems[2] || stems[0];
  const dayZhi = input.dayZhi || branches[2] || branches[0];
  const dayMaster = input.dayMaster || (dayGan ? STEM_WUXING[dayGan] : "");
  if (!dayGan || !dayZhi || !dayMaster) return null;

  const counts = Object.fromEntries(WUXING.map((wx) => [wx, 0])) as Record<string, number>;
  for (const stem of stems) counts[STEM_WUXING[stem]] = (counts[STEM_WUXING[stem]] || 0) + 1;
  for (const branch of branches) counts[BRANCH_WUXING[branch]] = (counts[BRANCH_WUXING[branch]] || 0) + 1;

  return {
    id: input.id,
    name: input.name || `${dayGan}${dayMaster}`,
    dayMaster,
    dayGan,
    dayZhi,
    stems,
    branches,
    wuxingPower: normalizePower(counts),
    keywords: input.keywords?.length ? input.keywords : [dayMaster, "慢慢聊"],
    summary: input.summary || "在这里等你",
    baziDisplay: stems.map((stem, index) => `${stem}${branches[index] || ""}`).join(" "),
    isMock: input.isMock,
  };
}

export function parseBaziDisplay(id: string, display: string, fallback: Omit<Parameters<typeof profileFromPillars>[0], "id">): MatchProfile | null {
  const pillars = display.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  return profileFromPillars({
    id,
    ...fallback,
    yearGan: pillars[0]?.[0],
    yearZhi: pillars[0]?.[1],
    monthGan: pillars[1]?.[0],
    monthZhi: pillars[1]?.[1],
    dayGan: pillars[2]?.[0] || fallback.dayGan,
    dayZhi: pillars[2]?.[1],
    hourGan: pillars[3]?.[0],
    hourZhi: pillars[3]?.[1],
  });
}
