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
  hourStr?: string
): BaziResult {
  // 1. 先创建 Solar 对象（lunar-javascript 正确用法）
  const solar = Solar.fromYmd(year, month, day);
  // 2. 再转换为 Lunar 对象
  const lunar = Lunar.fromSolar(solar);

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

  // 时柱（如果提供了时辰）
  if (hourStr) {
    const hourIndex = parseHourToIndex(hourStr);
    if (hourIndex >= 0) {
      const hourGanZhi = lunar.getTimeInGanZhi(hourIndex);
      result.hour = pillarFromGanZhi(hourGanZhi[0], hourGanZhi[1]);
    }
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
