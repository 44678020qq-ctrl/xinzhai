/**
 * 心斋「流」页数据层 v3
 * 参考 lifekline K线结构，用真实八字规则引擎驱动
 *
 * v3 关键修正：
 * - 评分根据旺衰翻转十神好坏（身旺喜克泄耗/身弱喜帮扶）
 * - 真太阳时需出生地经纬度才有意义（Register需收集出生城市）
 * - 大运帮扶/克泄耗的评价也根据旺衰翻转
 */

import {
  calculateDaYun,
  calculateWuxingStrength,
  judgeStrength,
  findYongShen,
  HIDDEN_STEMS,
  SEASON_STRENGTH,
  type BaziResult,
  type DaYun,
} from "./bazi";

// ────────────────── 类型定义 ──────────────────

export interface FlowPoint {
  age: number;
  year: number;
  daYun: string;
  daYunEnergy: "帮扶" | "克泄耗";
  ganZhi: string;
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string;
}

export interface LifeEvent {
  age: number;
  year: number;
  type: 'career' | 'love' | 'health' | 'wealth' | 'family' | 'turn';
  title: string;
  description: string;
  ganZhi: string;
  energy: "喜" | "忌" | "中性";  // 改为喜/忌，更符合命理语言
}

export interface FlowData {
  bazi: string[];
  dayMaster: string;
  dayMasterWuxing: string;
  strengthLevel: string;     // 极旺/旺/中和/弱/极弱
  yongShen: string[];        // 用神五行
  xiShen: string[];          // 喜神五行
  jiShen: string[];          // 忌神五行
  isStrong: boolean;         // 身旺还是身弱（评分核心依据）
  daYunList: DaYun[];
  chartPoints: FlowPoint[];
  events: LifeEvent[];
}

// ────────────────── 十神映射 ──────────────────

const TEN_GODS: Record<string, Record<string, string>> = {
  "甲": {"甲":"比肩","乙":"劫财","丙":"食神","丁":"伤官","戊":"偏财","己":"正财","庚":"七杀","辛":"正官","壬":"偏印","癸":"正印"},
  "乙": {"甲":"劫财","乙":"比肩","丙":"伤官","丁":"食神","戊":"正财","己":"偏财","庚":"正官","辛":"七杀","壬":"正印","癸":"偏印"},
  "丙": {"甲":"偏印","乙":"正印","丙":"比肩","丁":"劫财","戊":"食神","己":"伤官","庚":"偏财","辛":"正财","壬":"七杀","癸":"正官"},
  "丁": {"甲":"正印","乙":"偏印","丙":"劫财","丁":"比肩","戊":"伤官","己":"食神","庚":"正财","辛":"偏财","壬":"正官","癸":"七杀"},
  "戊": {"甲":"七杀","乙":"正官","丙":"偏印","丁":"正印","戊":"比肩","己":"劫财","庚":"食神","辛":"伤官","壬":"偏财","癸":"正财"},
  "己": {"甲":"正官","乙":"七杀","丙":"正印","丁":"偏印","戊":"劫财","己":"比肩","庚":"伤官","辛":"食神","壬":"正财","癸":"偏财"},
  "庚": {"甲":"偏财","乙":"正财","丙":"七杀","丁":"正官","戊":"偏印","己":"正印","庚":"比肩","辛":"劫财","壬":"食神","癸":"伤官"},
  "辛": {"甲":"正财","乙":"偏财","丙":"正官","丁":"七杀","戊":"正印","己":"偏印","庚":"劫财","辛":"比肩","壬":"伤官","癸":"食神"},
  "壬": {"甲":"食神","乙":"伤官","丙":"偏财","丁":"正财","戊":"七杀","己":"正官","庚":"偏印","辛":"正印","壬":"比肩","癸":"劫财"},
  "癸": {"甲":"伤官","乙":"食神","丙":"正财","丁":"偏财","戊":"正官","己":"七杀","庚":"正印","辛":"偏印","壬":"劫财","癸":"比肩"},
};

function getShiShen(dayGan: string, otherGan: string): string {
  return TEN_GODS[dayGan]?.[otherGan] || "未知";
}

/**
 * 十神分类：帮扶类 vs 克泄耗类
 * 帮扶 = 生我(印) + 同我(比劫)
 * 克泄耗 = 克我(官杀) + 我生(食伤) + 我克(财)
 */
function classifyShiShen(ss: string): "帮扶" | "克泄耗" {
  if (["正印", "偏印", "比肩", "劫财"].includes(ss)) return "帮扶";
  if (["正官", "七杀", "食神", "伤官", "正财", "偏财"].includes(ss)) return "克泄耗";
  return "帮扶"; // fallback
}

// ────────────────── 运势评分引擎 v3 ──────────────────

/**
 * 根据旺衰翻转十神评分
 * 
 * 命理核心逻辑：
 * 身旺 → 喜克泄耗（官杀食伤财是好事），忌帮扶（印比劫是坏事）
 * 身弱 → 喜帮扶（印比劫是好事），忌克泄耗（官杀食伤财是坏事）
 * 中和 → 两面都可，看程度
 * 
 * 评分结构：
 * 1. 十神基础分（根据旺衰翻转）
 * 2. 藏干加权（同样根据旺衰翻转方向）
 * 3. 大运背景（身旺遇帮扶=减分，身弱遇帮扶=加分）
 * 4. 月令微调
 */
export function calculateFlowScore(
  bazi: BaziResult,
  strength: { level: string; score: number; deLing?: boolean; deDi?: boolean; deSheng?: boolean; deZhu?: boolean },
  liuNianGan: string,
  liuNianZhi: string,
  daYun: DaYun | null,
): { score: number; open: number; close: number; high: number; low: number; reason: string } {
  
  const dayGan = bazi.dayGan;
  const dayWx = bazi.day.wuxing_gan;
  const isStrong = strength.level === "极旺" || strength.level === "旺";
  const isWeak = strength.level === "极弱" || strength.level === "弱";
  
  // ── 十神 → 基础分（根据旺衰翻转）──
  const shiShen = getShiShen(dayGan, liuNianGan);
  const ssType = classifyShiShen(shiShen);
  
  // 身旺：克泄耗类高分，帮扶类低分
  // 身弱：帮扶类高分，克泄耗类低分
  // 中和：都中等，略有偏好
  
  const STRONG_SCORES: Record<string, number> = {
    // 身旺喜克泄耗
    "七杀": 82, "正官": 78,   // 克我 → 制身有功
    "食神": 85, "伤官": 75,   // 我生 → 泄秀顺畅
    "偏财": 80, "正财": 76,   // 我克 → 财星得用
    // 身旺忌帮扶
    "比肩": 45, "劫财": 38,   // 同我 → 争财夺利
    "偏印": 42, "正印": 48,   // 生我 → 印绶太过
  };
  
  const WEAK_SCORES: Record<string, number> = {
    // 身弱喜帮扶
    "正印": 88, "偏印": 82,   // 生我 → 印绶护身
    "比肩": 80, "劫财": 72,   // 同我 → 劫财帮身
    // 身弱忌克泄耗
    "七杀": 35, "正官": 42,   // 克我 → 官杀攻身
    "食神": 55, "伤官": 40,   // 我生 → 泄身太过
    "偏财": 48, "正财": 52,   // 我克 → 财星耗身
  };
  
  const NEUTRAL_SCORES: Record<string, number> = {
    "比肩": 68, "劫财": 60,
    "食神": 72, "伤官": 62,
    "偏财": 65, "正财": 68,
    "七杀": 55, "正官": 62,
    "偏印": 68, "正印": 72,
  };
  
  let baseScore: number;
  if (isStrong) {
    baseScore = STRONG_SCORES[shiShen] || 60;
  } else if (isWeak) {
    baseScore = WEAK_SCORES[shiShen] || 60;
  } else {
    baseScore = NEUTRAL_SCORES[shiShen] || 60;
  }
  
  // ── 藏干加权（同样根据旺衰翻转）──
  const hidden = HIDDEN_STEMS[liuNianZhi] || [];
  let zhiBonus = 0;
  for (const h of hidden) {
    const ss = getShiShen(dayGan, h.gan);
    const ssClass = classifyShiShen(ss);
    if (isStrong) {
      // 身旺：克泄耗藏干加分，帮扶藏干减分
      if (ssClass === "克泄耗") zhiBonus += h.weight * 5;
      else zhiBonus -= h.weight * 5;
    } else if (isWeak) {
      // 身弱：帮扶藏干加分，克泄耗藏干减分
      if (ssClass === "帮扶") zhiBonus += h.weight * 5;
      else zhiBonus -= h.weight * 5;
    } else {
      // 中和：轻微偏好
      if (ssClass === "帮扶") zhiBonus += h.weight * 2;
      else zhiBonus += h.weight * 2;
    }
  }
  
  // ── 大运背景（根据旺衰翻转）──
  let daYunBonus = 0;
  if (daYun) {
    if (isStrong) {
      // 身旺遇帮扶运 = 减分（太过）
      // 身旺遇克泄耗运 = 加分（制身有功）
      if (daYun.energyMain === "帮扶") daYunBonus = -8;
      else daYunBonus = 10;
    } else if (isWeak) {
      // 身弱遇帮扶运 = 加分（帮身有力）
      // 身弱遇克泄耗运 = 减分（克泄太过）
      if (daYun.energyMain === "帮扶") daYunBonus = 10;
      else daYunBonus = -8;
    } else {
      // 中和：帮扶略加分
      if (daYun.energyMain === "帮扶") daYunBonus = 4;
      else daYunBonus = 2;
    }
  }
  
  // ── 月令微调 ──
  const monthZhi = bazi.month.zhi;
  const seasonCoeff = SEASON_STRENGTH[monthZhi]?.[dayWx] || 1;
  const seasonBonus = (seasonCoeff - 1) * 3; // 微调±3
  
  // ── 综合评分 ──
  const rawScore = baseScore + zhiBonus + daYunBonus + seasonBonus;
  const score = Math.round(Math.max(30, Math.min(95, rawScore)));
  
  // ── 波动 ──
  const wuxingStr = calculateWuxingStrength(bazi);
  const helpRatio = wuxingStr.normalized[dayWx];
  // 越偏离平衡，波动越大
  const volatility = Math.abs(helpRatio - 0.25) * 20;
  
  const open = Math.round(Math.max(30, score - volatility * 0.5));
  const close = Math.round(Math.min(95, score + volatility * 0.3));
  const high = Math.round(Math.min(95, score + volatility));
  const low = Math.round(Math.max(30, score - volatility));
  
  // ── 四段式解读 ──
  const isXi = (isStrong && ssType === "克泄耗") || (isWeak && ssType === "帮扶");
  const energyLabel = isXi ? "喜神到位" : "忌神当令";
  const advice = isXi 
    ? "顺势可为，把握机遇" 
    : score >= 50 ? "宜守不宜攻，稳中求进" : "需谨慎行事，积蓄力量";
  
  const reason = `${liuNianGan}${liuNianZhi}年，${shiShen}主事。${isStrong ? "身旺" : isWeak ? "身弱" : "中和"}日主遇${ssType}类十神，${energyLabel}。${isXi ? `${shiShen}为喜，能量顺势流动` : `${shiShen}为忌，需克制冲动`}。大运${daYun ? `${daYun.gan}${daYun.zhi}(${isStrong ? (daYun.energyMain === "帮扶" ? "忌运" : "喜运") : isWeak ? (daYun.energyMain === "帮扶" ? "喜运" : "忌运") : daYun.energyMain})` : "童限"}，${advice}。`;
  
  return { score, open, close, high, low, reason };
}

// ────────────────── 人生事件推算 ──────────────────

function deduceLifeEvents(
  bazi: BaziResult,
  strength: { level: string; score: number },
  yongShenResult: { yongShen: string[]; xiShen: string[]; jiShen: string[]; reason: string },
  daYunList: DaYun[],
  birthYear: number,
): LifeEvent[] {
  const events: LifeEvent[] = [];
  const dayGan = bazi.dayGan;
  const isStrong = strength.level === "极旺" || strength.level === "旺";
  
  // ── 大运转潮点 ──
  for (const dy of daYunList) {
    const daYunShiShen = getShiShen(dayGan, dy.gan);
    // 根据旺衰判断大运是喜还是忌
    const isXiDy = isStrong ? (dy.energyMain === "克泄耗") : (!isStrong && dy.energyMain === "帮扶");
    
    if (isXiDy) {
      events.push({
        age: dy.startAge, year: birthYear + dy.startAge,
        type: "turn", title: `${dy.gan}${dy.zhi}运·势起`,
        description: `进入${daYunShiShen}主事的喜运，${dy.startAge}-${dy.endAge}岁间${isStrong ? "克泄耗制身有功" : "帮扶得力"}，宜顺势发力`,
        ganZhi: `${dy.gan}${dy.zhi}`, energy: "喜",
      });
    } else {
      events.push({
        age: dy.startAge, year: birthYear + dy.startAge,
        type: "turn", title: `${dy.gan}${dy.zhi}运·守成`,
        description: `进入${daYunShiShen}主事的忌运，${dy.startAge}-${dy.endAge}岁间需稳中求进`,
        ganZhi: `${dy.gan}${dy.zhi}`, energy: "忌",
      });
    }
  }
  
  // ── 婚恋推算 ──
  const dayZhiHidden = HIDDEN_STEMS[bazi.day.zhi] || [];
  const dayZhiMain = dayZhiHidden.find(h => h.type === "本气")?.gan;
  if (dayZhiMain) {
    const dayZhiSS = getShiShen(dayGan, dayZhiMain);
    // 身旺日支财官 = 婚恋有利且较早
    // 身弱日支财官 = 婚恋压力大
    if (["正财", "偏财", "正官", "七杀"].includes(dayZhiSS)) {
      events.push({
        age: isStrong ? 24 : 28, year: birthYear + (isStrong ? 24 : 28), type: "love",
        title: isStrong ? "姻缘早动" : "姻缘渐进",
        description: `日支${dayZhiSS}，${isStrong ? "身旺能担财官，感情运较早启动" : "身弱需积力方能担财官，感情运稍迟"}`,
        ganZhi: "", energy: isStrong ? "喜" : "中性",
      });
    } else {
      events.push({
        age: 30, year: birthYear + 30, type: "love",
        title: "姻缘待时",
        description: `日支${dayZhiSS}，感情需耐心等待`,
        ganZhi: "", energy: "中性",
      });
    }
  }
  
  // ── 事业高峰推算 ──
  // 身旺：克泄耗运中期是事业高峰
  // 身弱：帮扶运中期是事业高峰
  const peakDy = isStrong
    ? daYunList.find(dy => dy.energyMain === "克泄耗" && dy.startAge >= 25 && dy.startAge <= 45)
    : daYunList.find(dy => dy.energyMain === "帮扶" && dy.startAge >= 25 && dy.startAge <= 45);
  if (peakDy) {
    events.push({
      age: peakDy.startAge + 3, year: birthYear + peakDy.startAge + 3,
      type: "career", title: "事业攀升",
      description: `${peakDy.gan}${peakDy.zhi}${isStrong ? "克泄耗" : "帮扶"}运中期，事业能量集中释放`,
      ganZhi: `${peakDy.gan}${peakDy.zhi}`, energy: "喜",
    });
  }
  
  // ── 通用节点 ──
  const universal: Array<{age: number, type: LifeEvent['type'], title: string, desc: string}> = [
    { age: 6, type: "family", title: "启蒙", desc: "入学启蒙" },
    { age: 18, type: "career", title: "立门", desc: "成年之始" },
    { age: 22, type: "career", title: "初入", desc: "初入职场" },
  ];
  for (const ue of universal) {
    if (!events.find(e => e.age === ue.age)) {
      events.push({ age: ue.age, year: birthYear + ue.age, type: ue.type, title: ue.title, description: ue.desc, ganZhi: "", energy: "中性" });
    }
  }
  
  return events.sort((a, b) => a.age - b.age);
}

// ────────────────── 主函数 ──────────────────

export function generateFlowData(
  bazi: BaziResult,
  gender: "male" | "female",
  birthYear: number,
): FlowData {
  
  const strength = judgeStrength(bazi);
  const yongShen = findYongShen(bazi);
  const daYunList = calculateDaYun(bazi, gender);
  const isStrong = strength.level === "极旺" || strength.level === "旺";
  
  const GANS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const ZHIS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  const chartPoints: FlowPoint[] = [];
  const currentYear = new Date().getFullYear();
  const maxAge = Math.min(80, currentYear - birthYear + 30);
  
  for (let age = 1; age <= maxAge; age++) {
    const year = birthYear + age;
    const ganIdx = ((year - 4) % 10 + 10) % 10;
    const zhiIdx = ((year - 4) % 12 + 12) % 12;
    const liuNianGan = GANS[ganIdx];
    const liuNianZhi = ZHIS[zhiIdx];
    
    const currentDaYun = daYunList.find(dy => age >= dy.startAge && age <= dy.endAge) || null;
    
    const { score, open, close, high, low, reason } = calculateFlowScore(
      bazi, strength, liuNianGan, liuNianZhi, currentDaYun
    );
    
    chartPoints.push({
      age, year,
      daYun: currentDaYun ? `${currentDaYun.gan}${currentDaYun.zhi}运` : "童限",
      daYunEnergy: currentDaYun?.energyMain || "帮扶",
      ganZhi: `${liuNianGan}${liuNianZhi}`,
      open, close, high, low, score, reason,
    });
  }
  
  const events = deduceLifeEvents(bazi, strength, yongShen, daYunList, birthYear);
  
  const baziStr = [
    `${bazi.year.gan}${bazi.year.zhi}`,
    `${bazi.month.gan}${bazi.month.zhi}`,
    `${bazi.day.gan}${bazi.day.zhi}`,
    bazi.hour ? `${bazi.hour.gan}${bazi.hour.zhi}` : "--",
  ];
  
  return {
    bazi: baziStr,
    dayMaster: bazi.dayGan,
    dayMasterWuxing: bazi.day.wuxing_gan,
    strengthLevel: strength.level,
    yongShen: yongShen.yongShen,
    xiShen: yongShen.xiShen,
    jiShen: yongShen.jiShen,
    isStrong,
    daYunList,
    chartPoints,
    events,
  };
}