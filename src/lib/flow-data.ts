/**
 * 心斋「流」页数据层 v2
 * 参考 lifekline K线结构，用真实八字规则引擎驱动
 *
 * 核心改进：
 * - 大运：基于 calculateDaYun() 真实排盘（阳男阴女顺排/逆排）
 * - 评分：日主 × 流年干支 × 大运干支 三层生克叠加
 * - 波动：基于五行力量对比，不是 Math.random
 * - 解读：四段式（定调/论断/依据/出处），参考 STAR_DB
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
  daYun: string;        // 大运名称（如"庚申运"）
  daYunEnergy: "帮扶" | "克泄耗";
  ganZhi: string;       // 流年干支
  open: number;         // 年初运势
  close: number;        // 年末运势
  high: number;         // 年中最高
  low: number;          // 年中最低
  score: number;        // 综合评分
  reason: string;       // 四段式解读
}

export interface LifeEvent {
  age: number;
  year: number;
  type: 'career' | 'love' | 'health' | 'wealth' | 'family' | 'turn';  // turn=转潮
  title: string;
  description: string;
  ganZhi: string;       // 流年干支
  energy: "帮扶" | "克泄耗" | "中性";
}

export interface FlowData {
  bazi: string[];       // 四柱干支
  dayMaster: string;    // 日主天干
  dayMasterWuxing: string; // 日主五行
  strengthLevel: string;   // 旺衰
  yongShen: string[];      // 用神
  daYunList: DaYun[];      // 大运列表
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

// ────────────────── 运势评分引擎 ──────────────────

/**
 * 三层叠加评分：日主 × 流年 × 大运
 * 
 * 1. 流年天干 vs 日主 → 十神关系 → 基础分
 * 2. 流年地支藏干 → 加权
 * 3. 大运帮扶/克泄耗 → 背景分
 * 4. 月令旺衰 → 微调
 */
export function calculateFlowScore(
  bazi: BaziResult,
  liuNianGan: string,
  liuNianZhi: string,
  daYun: DaYun | null,
): { score: number; open: number; close: number; high: number; low: number; reason: string } {
  
  const dayGan = bazi.dayGan;
  const dayWx = bazi.day.wuxing_gan;
  
  // ── 第一层：流年天干十神 → 基础分 ──
  const shiShen = getShiShen(dayGan, liuNianGan);
  const SHISHEN_SCORE: Record<string, number> = {
    "比肩": 72, "劫财": 65,
    "食神": 80, "伤官": 60,
    "偏财": 62, "正财": 68,
    "七杀": 48, "正官": 58,
    "偏印": 70, "正印": 82,
  };
  const baseScore = SHISHEN_SCORE[shiShen] || 60;
  
  // ── 第二层：流年地支藏干 → 加权 ──
  const hidden = HIDDEN_STEMS[liuNianZhi] || [];
  let zhiBonus = 0;
  for (const h of hidden) {
    const ss = getShiShen(dayGan, h.gan);
    if (["正印", "偏印", "比肩"].includes(ss)) zhiBonus += h.weight * 5;
    if (["七杀", "正官", "伤官"].includes(ss)) zhiBonus -= h.weight * 5;
  }
  
  // ── 第三层：大运帮扶/克泄耗 → 背景分 ──
  let daYunBonus = 0;
  if (daYun) {
    if (daYun.energyMain === "帮扶") daYunBonus = 8;
    else daYunBonus = -5;
    const daYunShiShen = getShiShen(dayGan, daYun.gan);
    if (["正印", "偏印"].includes(daYunShiShen)) daYunBonus += 4;
    if (["七杀", "正官"].includes(daYunShiShen)) daYunBonus -= 3;
  }
  
  // ── 第四层：月令季节系数 → 微调 ──
  const monthZhi = bazi.month.zhi;
  const seasonCoeff = SEASON_STRENGTH[monthZhi]?.[dayWx] || 1;
  const seasonBonus = (seasonCoeff - 1) * 5;
  
  // ── 综合评分 ──
  const rawScore = baseScore + zhiBonus + daYunBonus + seasonBonus;
  const score = Math.round(Math.max(30, Math.min(95, rawScore)));
  
  // ── 波动：基于五行力量对比 ──
  const wuxingStr = calculateWuxingStrength(bazi);
  const helpRatio = wuxingStr.normalized[dayWx];
  const volatility = Math.abs(helpRatio - 0.3) * 15;
  
  const open = Math.round(Math.max(30, score - volatility * 0.6));
  const close = Math.round(Math.min(95, score + volatility * 0.4));
  const high = Math.round(Math.min(95, score + volatility));
  const low = Math.round(Math.max(30, score - volatility));
  
  // ── 四段式解读 ──
  const energyLabel = score >= 70 ? "帮扶为主" : score >= 50 ? "中平偏稳" : "克泄耗为主";
  const reason = `${liuNianGan}${liuNianZhi}年，${shiShen}主事，${energyLabel}。流年天干${liuNianGan}为${shiShen}，地支${liuNianZhi}藏${hidden.map(h => h.gan).join("/")}。大运${daYun ? `${daYun.gan}${daYun.zhi}(${daYun.energyMain})` : "童限"}，${score >= 70 ? "顺势可为，把握机遇" : score >= 50 ? "宜守不宜攻，稳中求进" : "需谨慎行事，积蓄力量"}。`;
  
  return { score, open, close, high, low, reason };
}

// ────────────────── 人生事件推算 ──────────────────

function deduceLifeEvents(
  bazi: BaziResult,
  daYunList: DaYun[],
  birthYear: number,
): LifeEvent[] {
  const events: LifeEvent[] = [];
  const dayGan = bazi.dayGan;
  
  // ── 大运转潮点 ──
  for (const dy of daYunList) {
    const daYunShiShen = getShiShen(dayGan, dy.gan);
    if (dy.energyMain === "帮扶") {
      events.push({
        age: dy.startAge, year: birthYear + dy.startAge,
        type: "turn", title: `${dy.gan}${dy.zhi}运·势起`,
        description: `进入${daYunShiShen}主事的帮扶大运，${dy.startAge}-${dy.endAge}岁间能量偏助，宜顺势发力`,
        ganZhi: `${dy.gan}${dy.zhi}`, energy: "帮扶",
      });
    } else {
      events.push({
        age: dy.startAge, year: birthYear + dy.startAge,
        type: "turn", title: `${dy.gan}${dy.zhi}运·守成`,
        description: `进入${daYunShiShen}主事的克泄耗大运，${dy.startAge}-${dy.endAge}岁间需稳中求进`,
        ganZhi: `${dy.gan}${dy.zhi}`, energy: "克泄耗",
      });
    }
  }
  
  // ── 通用人生节点 ──
  const universal: Array<{age: number, type: LifeEvent['type'], title: string, desc: string}> = [
    { age: 6, type: "family", title: "启蒙", desc: "入学启蒙，开始接受教育" },
    { age: 18, type: "career", title: "立门", desc: "成年之始，步入社会或继续深造" },
    { age: 22, type: "career", title: "初入", desc: "初入职场，试探人生方向" },
  ];
  
  // ── 婚恋推算（日支十神）──
  const dayZhiHidden = HIDDEN_STEMS[bazi.day.zhi] || [];
  const dayZhiMain = dayZhiHidden.find(h => h.type === "本气")?.gan;
  if (dayZhiMain) {
    const dayZhiSS = getShiShen(dayGan, dayZhiMain);
    if (["正财", "偏财", "正官", "七杀"].includes(dayZhiSS)) {
      events.push({
        age: 26, year: birthYear + 26, type: "love",
        title: "姻缘初动", description: `日支${dayZhiSS}，感情运较早启动`,
        ganZhi: "", energy: "中性",
      });
    } else {
      events.push({
        age: 30, year: birthYear + 30, type: "love",
        title: "姻缘渐进", description: `日支${dayZhiSS}，感情运需耐心等待`,
        ganZhi: "", energy: "中性",
      });
    }
  }
  
  // ── 事业高峰推算 ──
  const peakDy = daYunList.find(dy => dy.energyMain === "帮扶" && dy.startAge >= 28 && dy.startAge <= 42);
  if (peakDy) {
    events.push({
      age: peakDy.startAge + 3, year: birthYear + peakDy.startAge + 3,
      type: "career", title: "事业攀升",
      description: `${peakDy.gan}${peakDy.zhi}帮扶运中期，事业能量集中释放`,
      ganZhi: `${peakDy.gan}${peakDy.zhi}`, energy: "帮扶",
    });
  }
  
  // ── 通用节点 ──
  for (const ue of universal) {
    if (!events.find(e => e.age === ue.age)) {
      events.push({
        age: ue.age, year: birthYear + ue.age, type: ue.type,
        title: ue.title, description: ue.desc,
        ganZhi: "", energy: "中性",
      });
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
      bazi, liuNianGan, liuNianZhi, currentDaYun
    );
    
    chartPoints.push({
      age, year,
      daYun: currentDaYun ? `${currentDaYun.gan}${currentDaYun.zhi}运` : "童限",
      daYunEnergy: currentDaYun?.energyMain || "帮扶",
      ganZhi: `${liuNianGan}${liuNianZhi}`,
      open, close, high, low, score, reason,
    });
  }
  
  const events = deduceLifeEvents(bazi, daYunList, birthYear);
  
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
    daYunList,
    chartPoints,
    events,
  };
}