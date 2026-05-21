import { Lunar, Solar } from "lunar-javascript";

export interface Pillar {
  gan: string;
  zhi: string;
  wuxing_gan: string;
  wuxing_zhi: string;
}

export interface BaziResult {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour?: Pillar;
  dayGan: string;   // 日主天干（核心）
  dayZhi: string;
}

// 天干 → 五行
const GAN_WUXING: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

// 地支 → 五行
const ZHI_WUXING: Record<string, string> = {
  子: "水", 丑: "土",
  寅: "木", 卯: "木",
  辰: "土", 巳: "火",
  午: "火", 未: "土",
  申: "金", 酉: "金",
  戌: "土", 亥: "水",
};

function pillarFromGanZhi(gan: string, zhi: string): Pillar {
  return {
    gan,
    zhi,
    wuxing_gan: GAN_WUXING[gan] || "未知",
    wuxing_zhi: ZHI_WUXING[zhi] || "未知",
  };
}

/**
 * 使用 lunar-javascript 精准排八字
 * 支持公历/农历输入，自动处理真太阳时
 */
export function calculateBazi(
  year: number,
  month: number,
  day: number,
  hour?: number | null,
  minute?: number | null,
  isLunar: boolean = false
): BaziResult {
  // 1. 创建 Solar 或 Lunar 对象
  let solar: Solar;
  let lunar: Lunar;
  
  if (isLunar) {
    // 农历输入
    lunar = Lunar.fromYmd(year, month, day);
    solar = lunar.getSolar();
  } else {
    // 公历输入 — 必须传入时间，否则时柱永远是甲子
    if (hour !== null && hour !== undefined) {
      solar = Solar.fromYmdHms(year, month, day, hour, minute || 0, 0);
    } else {
      solar = Solar.fromYmd(year, month, day);
    }
    lunar = Lunar.fromSolar(solar);
  }

  // 年柱
  const yearGanZhi = lunar.getYearInGanZhi();
  const yearGan = yearGanZhi[0];
  const yearZhi = yearGanZhi[1];

  // 月柱
  const monthGanZhi = lunar.getMonthInGanZhi();
  const monthGan = monthGanZhi[0];
  const monthZhi = monthGanZhi[1];

  // 日柱
  const dayGanZhi = lunar.getDayInGanZhi();
  const dayGan = dayGanZhi[0];
  const dayZhi = dayGanZhi[1];

  const result: BaziResult = {
    year: pillarFromGanZhi(yearGan, yearZhi),
    month: pillarFromGanZhi(monthGan, monthZhi),
    day: pillarFromGanZhi(dayGan, dayZhi),
    dayGan,
    dayZhi,
  };

  // 时柱 — lunar-javascript 根据 Solar 创建时的时间自动计算
  if (hour !== null && hour !== undefined) {
    const hourGanZhi = lunar.getTimeInGanZhi();
    result.hour = pillarFromGanZhi(hourGanZhi[0], hourGanZhi[1]);
  }

  return result;
}

/**
 * 时辰字符串 → 索引（0=子时 23-1, 1=丑时 1-3 ... 11=亥时 21-23）
 * 支持多种格式："子"、"子时"、"子时 (23:00-01:00)"
 */
function parseHourToIndex(hourStr: string): number {
  // 清理格式：去掉括号内容及"时"字
  const cleaned = hourStr.replace(/\s*\(.*\)/, "").replace("时", "").trim();
  
  const map: Record<string, number> = {
    "子": 0, "丑": 1, "寅": 2, "卯": 3, "辰": 4, "巳": 5,
    "午": 6, "未": 7, "申": 8, "酉": 9, "戌": 10, "亥": 11,
  };
  
  if (map[cleaned] !== undefined) return map[cleaned];
  
  // 尝试解析数字小时（0-23）
  const h = parseInt(cleaned);
  if (!isNaN(h)) {
    if (h === 23 || h === 0) return 0;  // 子时
    return Math.floor((h + 1) / 2);
  }
  return -1;
}

/** 日主五行 */
export function getDayMasterWuxing(bazi: BaziResult): string {
  return bazi.day.wuxing_gan;
}

/** 日主天干 */
export function getDayMasterGan(bazi: BaziResult): string {
  return bazi.dayGan;
}

/**
 * 五行相生关系：木→火→土→金→水→木
 * 返回：生我、我生、克我、我克、同类
 */
export function analyzeWuxingRelations(bazi: BaziResult): {
  dayMaster: string;
  shengWo: string;   // 生我的五行
  woSheng: string;   // 我生的五行
  keWo: string;     // 克我的五行
  woKe: string;      // 我克的五行
  tongLei: string;    // 同类五行
} {
  const wx = getDayMasterWuxing(bazi);
  const cycle = ["木", "火", "土", "金", "水"];
  const idx = cycle.indexOf(wx);
  return {
    dayMaster: wx,
    shengWo: cycle[(idx + 4) % 5],   // 前一个 = 生我
    woSheng: cycle[(idx + 1) % 5],    // 后一个 = 我生
    keWo: cycle[(idx + 3) % 5],       // 克我（后3位）
    woKe: cycle[(idx + 2) % 5],       // 我克（后2位）
    tongLei: wx,
  };
}

/**
 * 根据八字四柱统计五行强弱，找出用神方向
 */
export function analyzeWuxingStrength(bazi: BaziResult): Record<string, number> {
  const counts: Record<string, number> = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 };
  const pillars = [bazi.year, bazi.month, bazi.day];
  if (bazi.hour) pillars.push(bazi.hour);

  for (const p of pillars) {
    counts[p.wuxing_gan]++;
    counts[p.wuxing_zhi]++;
  }
  return counts;
}

/** 五行 → 人格标签 */
export function wuxingToPersonality(wuxing: string, gan: string): string {
  const map: Record<string, Record<string, string>> = {
    "木": { "甲": "甲木", "乙": "乙木" },
    "火": { "丙": "丙火", "丁": "丁火" },
    "土": { "戊": "戊土", "己": "己土" },
    "金": { "庚": "庚金", "辛": "辛金" },
    "水": { "壬": "壬水", "癸": "癸水" },
  };
  return map[wuxing]?.[gan] || `${gan}${wuxing}`;
}

// ==================== 命理规则层 MVP ====================

/**
 * M2: 地支藏干表（核心数据）
 * 本气(1.0) / 中气(0.5) / 余气(0.3)
 */
export const HIDDEN_STEMS: Record<string, Array<{gan: string, type: string, weight: number}>> = {
  "子": [{gan: "癸", type: "本气", weight: 1.0}],
  "丑": [{gan: "己", type: "本气", weight: 1.0}, {gan: "癸", type: "中气", weight: 0.5}, {gan: "辛", type: "余气", weight: 0.3}],
  "寅": [{gan: "甲", type: "本气", weight: 1.0}, {gan: "丙", type: "中气", weight: 0.5}, {gan: "戊", type: "余气", weight: 0.3}],
  "卯": [{gan: "乙", type: "本气", weight: 1.0}],
  "辰": [{gan: "戊", type: "本气", weight: 1.0}, {gan: "乙", type: "中气", weight: 0.5}, {gan: "癸", type: "余气", weight: 0.3}],
  "巳": [{gan: "丙", type: "本气", weight: 1.0}, {gan: "戊", type: "中气", weight: 0.5}, {gan: "庚", type: "余气", weight: 0.3}],
  "午": [{gan: "丁", type: "本气", weight: 1.0}, {gan: "己", type: "中气", weight: 0.5}],
  "未": [{gan: "己", type: "本气", weight: 1.0}, {gan: "丁", type: "中气", weight: 0.5}, {gan: "乙", type: "余气", weight: 0.3}],
  "申": [{gan: "庚", type: "本气", weight: 1.0}, {gan: "壬", type: "中气", weight: 0.5}, {gan: "戊", type: "余气", weight: 0.3}],
  "酉": [{gan: "辛", type: "本气", weight: 1.0}],
  "戌": [{gan: "戊", type: "本气", weight: 1.0}, {gan: "辛", type: "中气", weight: 0.5}, {gan: "丁", type: "余气", weight: 0.3}],
  "亥": [{gan: "壬", type: "本气", weight: 1.0}, {gan: "甲", type: "中气", weight: 0.5}],
};

/**
 * M3: 旺相休囚死表（季节性系数）
 * 每个季节：旺×1.3 / 相×1.1 / 休×0.9 / 囚×0.7 / 死×0.5
 */
export const SEASON_STRENGTH: Record<string, Record<string, number>> = {
  // 春（寅卯月）：木旺火相水休金囚土死
  "寅": {"木": 1.3, "火": 1.1, "水": 0.9, "金": 0.7, "土": 0.5},
  "卯": {"木": 1.3, "火": 1.1, "水": 0.9, "金": 0.7, "土": 0.5},
  // 夏（巳午月）：火旺土相木休水囚金死
  "巳": {"火": 1.3, "土": 1.1, "木": 0.9, "水": 0.7, "金": 0.5},
  "午": {"火": 1.3, "土": 1.1, "木": 0.9, "水": 0.7, "金": 0.5},
  // 秋（申酉月）：金旺水相土休火囚木死
  "申": {"金": 1.3, "水": 1.1, "土": 0.9, "火": 0.7, "木": 0.5},
  "酉": {"金": 1.3, "水": 1.1, "土": 0.9, "火": 0.7, "木": 0.5},
  // 冬（亥子月）：水旺木相金休土囚火死
  "亥": {"水": 1.3, "木": 1.1, "金": 0.9, "土": 0.7, "火": 0.5},
  "子": {"水": 1.3, "木": 1.1, "金": 0.9, "土": 0.7, "火": 0.5},
  // 四季月（辰戌丑未）：土旺金相火休木囚水死
  "辰": {"土": 1.3, "金": 1.1, "火": 0.9, "木": 0.7, "水": 0.5},
  "戌": {"土": 1.3, "金": 1.1, "火": 0.9, "木": 0.7, "水": 0.5},
  "丑": {"土": 1.3, "金": 1.1, "火": 0.9, "木": 0.7, "水": 0.5},
  "未": {"土": 1.3, "金": 1.1, "火": 0.9, "木": 0.7, "水": 0.5},
};

/**
 * M3: 五行力量计算（核心算法）
 * 综合考虑：藏干权重 + 月令加权 + 季节系数
 */
export function calculateWuxingStrength(bazi: BaziResult): {
  wuxing: Record<string, number>;
  normalized: Record<string, number>;
  monthCommand: string;
  breakdown: Array<{source: string, wuxing: string, raw: number, weighted: number}>;
} {
  const counts: Record<string, number> = {"木": 0, "火": 0, "土": 0, "金": 0, "水": 0};
  const breakdown: Array<{source: string, wuxing: string, raw: number, weighted: number}> = [];
  
  // 获取季节系数（基于月支）
  const monthZhi = bazi.month.zhi;
  const seasonCoeff = SEASON_STRENGTH[monthZhi] || {"木": 1, "火": 1, "土": 1, "金": 1, "水": 1};
  
  // 月令五行（提纲）
  const monthCommand = ZHI_WUXING[monthZhi];
  
  // 位置系数（月令最大）
  const positionCoeff = {
    year: 0.8,
    month: 1.5,  // 月令加权
    day: 1.0,
    hour: 0.9
  };
  
  // 遍历四柱
  const pillars = [
    {key: "year", pillar: bazi.year},
    {key: "month", pillar: bazi.month},
    {key: "day", pillar: bazi.day},
    {key: "hour", pillar: bazi.hour},
  ];
  
  for (const {key, pillar} of pillars) {
    if (!pillar) continue;
    
    // 天干
    const ganWx = GAN_WUXING[pillar.gan];
    const ganWeight = 1.0 * (seasonCoeff[ganWx] || 1) * (positionCoeff[key as keyof typeof positionCoeff] || 1);
    counts[ganWx] += ganWeight;
    breakdown.push({source: `${key}干${pillar.gan}`, wuxing: ganWx, raw: 1.0, weighted: ganWeight});
    
    // 地支藏干
    const hidden = HIDDEN_STEMS[pillar.zhi] || [];
    for (const h of hidden) {
      const hWx = GAN_WUXING[h.gan];
      const hWeight = h.weight * (seasonCoeff[hWx] || 1) * (positionCoeff[key as keyof typeof positionCoeff] || 1);
      counts[hWx] += hWeight;
      breakdown.push({source: `${key}支${pillar.zhi}藏${h.gan}`, wuxing: hWx, raw: h.weight, weighted: hWeight});
    }
  }
  
  // 归一化
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const normalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    normalized[k] = Math.round((v / total) * 100) / 100;
  }
  
  return {wuxing: counts, normalized, monthCommand, breakdown};
}

/**
 * M4: 日主旺衰判断（5档 · 工单-03 v1.1）
 * 极旺 / 旺 / 中和 / 弱 / 极弱
 * 原偏旺并入旺，偏弱并入弱
 */
export function judgeStrength(bazi: BaziResult): {
  level: "极旺" | "旺" | "中和" | "弱" | "极弱";
  score: number;
  deLing: boolean;  // 得令
  deDi: boolean;    // 得地
  deSheng: boolean; // 得生
  deZhu: boolean;   // 得助
} {
  const dayMasterWx = bazi.day.wuxing_gan;
  const wxStrength = calculateWuxingStrength(bazi);
  
  // 五行循环
  const cycle = ["木", "火", "土", "金", "水"];
  const idx = cycle.indexOf(dayMasterWx);
  
  // 帮扶 = 同类(比劫) + 生我(印)
  const tongLei = dayMasterWx;
  const shengWo = cycle[(idx + 4) % 5];
  
  // 克泄耗 = 克我(官杀) + 我生(食伤) + 我克(财)
  const keWo = cycle[(idx + 3) % 5];
  const woSheng = cycle[(idx + 1) % 5];
  const woKe = cycle[(idx + 2) % 5];
  
  const help = wxStrength.wuxing[tongLei] + wxStrength.wuxing[shengWo];
  const exhaust = wxStrength.wuxing[keWo] + wxStrength.wuxing[woSheng] + wxStrength.wuxing[woKe];
  
  const ratio = help / (help + exhaust);
  
  // 得令：日主是否生在当令月份
  const deLing = wxStrength.monthCommand === dayMasterWx;
  
  // 得地：地支是否有本气根
  const deDi = [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.hour?.zhi]
    .filter(Boolean)
    .some(zhi => {
      if (!zhi) return false;
      const hidden = HIDDEN_STEMS[zhi] || [];
      return hidden.some(h => h.gan === bazi.dayGan && h.type === "本气");
    });
  
  // 得生：印星是否透干或有力
  const deSheng = wxStrength.wuxing[shengWo] > 1.5;
  
  // 得助：比劫是否透干或有力
  const deZhu = wxStrength.wuxing[tongLei] > 1.5;
  
  // 判断等级
  let level: "极旺" | "旺" | "中和" | "弱" | "极弱";
  if (ratio > 0.70) level = "极旺";
  else if (ratio > 0.52) level = "旺";      // 含旧偏旺
  else if (ratio > 0.48) level = "中和";
  else if (ratio > 0.30) level = "弱";       // 含旧偏弱
  else level = "极弱";
  
  return {level, score: Math.round(ratio * 100) / 100, deLing, deDi, deSheng, deZhu};
}

/**
 * M6: 用神喜忌（简化版）
 * 基于旺衰判断用神方向
 */
export function findYongShen(bazi: BaziResult): {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  reason: string;
} {
  const strength = judgeStrength(bazi);
  const dayMasterWx = bazi.day.wuxing_gan;
  const cycle = ["木", "火", "土", "金", "水"];
  const idx = cycle.indexOf(dayMasterWx);
  
  const tongLei = dayMasterWx;
  const shengWo = cycle[(idx + 4) % 5];
  const keWo = cycle[(idx + 3) % 5];
  const woSheng = cycle[(idx + 1) % 5];
  const woKe = cycle[(idx + 2) % 5];
  
  if (strength.level === "极弱" || strength.level === "弱") {
    // 身弱：用印比
    return {
      yongShen: [shengWo, tongLei],
      xiShen: [woSheng],  // 食伤泄秀
      jiShen: [keWo, woKe],
      reason: `日主${strength.level}，需${shengWo}生扶、${tongLei}帮身`
    };
  } else if (strength.level === "极旺" || strength.level === "旺") {
    // 身旺：用克泄耗
    return {
      yongShen: [keWo, woSheng, woKe],
      xiShen: [],
      jiShen: [shengWo, tongLei],
      reason: `日主${strength.level}，需${keWo}克制、${woSheng}泄秀、${woKe}消耗`
    };
  } else {
    // 中和：看趋势
    return {
      yongShen: [woSheng],
      xiShen: [shengWo, tongLei],
      jiShen: [keWo],
      reason: `日主${strength.level}，顺势而为，以${woSheng}泄秀为用`
    };
  }
}

/** 生成给 AI 用的 prompt */
export function baziToPrompt(bazi: BaziResult, gender: "male" | "female"): string {
  const hourStr = bazi.hour
    ? `时柱：${bazi.hour.gan}${bazi.hour.zhi}（${bazi.hour.wuxing_gan}）`
    : "时辰：未提供";
  const wxCounts = analyzeWuxingStrength(bazi);
  const wxStr = Object.entries(wxCounts).map(([k, v]) => `${k}×${v}`).join(" ");

  return `
你是专业的八字命理分析师。请根据以下精准八字信息，生成用户的「人格画像卡」。

八字四柱（由 lunar-javascript 精准排盘）：
年柱：${bazi.year.gan}${bazi.year.zhi}（${bazi.year.wuxing_gan}）
月柱：${bazi.month.gan}${bazi.month.zhi}（${bazi.month.wuxing_gan}）
日柱：${bazi.day.gan}${bazi.day.zhi}（${bazi.day.wuxing_gan}）← 日主
${hourStr}
性别：${gender === "male" ? "乾造（男）" : "坤造（女）"}
日主五行：${getDayMasterWuxing(bazi)}
五行统计（四柱天干+地支）：${wxStr}

请生成 JSON 格式的八字人格卡，包含以下字段：
- wuxing_personality: 五行人格标签（如「甲木」「庚金」）
- keywords: 性格关键词数组（3-5个，基于日主五行+强弱）
- emotion_pattern: 情绪模式描述（一句话，基于日主特性）
- relation_pattern: 关系模式描述（一句话，基于日主与其他柱的生克）
- social_tendency: 社交/恋爱倾向（一句话）
- summary: 一句话总结（如「甲木之人，外柔内刚，重精神连接，容易被秩序型人格吸引。」）
- bazi_display: 八字展示文本（如「甲子 丙寅 戊戌 庚申」）

只返回纯 JSON，不要加 markdown 代码块。
`.trim();
}
