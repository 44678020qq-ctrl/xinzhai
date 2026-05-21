/**
 * 心斋 · 因果链扩展（工单-07 依赖）
 * 
 * 补充字段：
 * - DaYun: 大运数据结构
 * - LiuNian: 流年数据结构
 * - GeJu: 格局判断
 */

import { BaziResult, judgeStrength, calculateWuxingStrength } from './bazi';

// ==================== 接口定义 ====================

/**
 * 大运数据结构
 */
export interface DaYun {
  gan: string;              // 大运天干
  zhi: string;             // 大运地支
  start_age: number;       // 起运年龄
  end_age: number;         // 止运年龄
  energy_main: "帮扶" | "克泄耗";  // 大运能量主线
  wuxing_strength: Record<string, number>;  // 大运期间五行力量变化
  description?: string;    // 大运简述（如"中年事业运"）
}

/**
 * 流年数据结构
 */
export interface LiuNian {
  year: number;            // 公历年份
  age: number;             // 周岁
  gan: string;             // 流年天干
  zhi: string;             // 流年地支
  energy_score: number;    // 流年能量评分（0-100）
  yong_shen_match: boolean; // 流年是否帮扶用神
  da_yun_index: number;    // 所属大运索引
  description?: string;    // 流年简述
}

/**
 * 格局判断结构
 */
export interface GeJu {
  name: string;            // 格局名称（如"正官格"、"七杀格"）
  level: "成格" | "破格" | "待定";
  basis: string;           // 成格依据（如"月令正官透干"）
  source?: string;         // 古籍出处（如"《子平真诠》"）
  description?: string;    // 格局简述
}

/**
 * 完整因果链结构（转潮对接用）
 */
export interface YinGuoChain {
  // 基础信息
  bazi: BaziResult;
  
  // 旺衰判断
  strength: {
    level: "极旺" | "旺" | "中和" | "弱" | "极弱";
    score: number;
    deLing: boolean;
    deDi: boolean;
    deSheng: boolean;
    deZhu: boolean;
  };
  
  // 用神喜忌
  yong_shen: {
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    reason: string;
  };
  
  // 大运数据
  da_yun: DaYun[];
  
  // 流年数据（可选，按需生成）
  liu_nian?: LiuNian[];
  
  // 格局判断
  ge_ju: GeJu;
  
  // 五行分析
  wuxing_analysis: {
    wuxing: Record<string, number>;
    normalized: Record<string, number>;
    monthCommand: string;
  };
}

// ==================== 常量定义 ====================

const GAN_WUXING: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

const ZHI_WUXING: Record<string, string> = {
  子: "水", 丑: "土",
  寅: "木", 卯: "木",
  辰: "土", 巳: "火",
  午: "火", 未: "土",
  申: "金", 酉: "金",
  戌: "土", 亥: "水",
};

// 地支藏干表
const HIDDEN_STEMS: Record<string, Array<{gan: string, type: string, weight: number}>> = {
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

// ==================== 大运计算 ====================

/**
 * 计算大运序列
 */
export function calculateDaYun(
  bazi: BaziResult,
  gender: "male" | "female",
  birthYear: number
): DaYun[] {
  const startAge = calculateQiYunAge(bazi, gender);
  const daYunList: DaYun[] = [];
  
  let currentGan = bazi.month.gan;
  let currentZhi = bazi.month.zhi;
  
  const isForward = shouldGoForward(bazi, gender);
  
  for (let i = 0; i < 10; i++) {
    const nextPillar = getNextPillar(currentGan, currentZhi, isForward);
    
    const startAgeI = startAge + i * 10;
    const endAgeI = startAgeI + 9;
    
    const dayMasterWx = bazi.day.wuxing_gan;
    const daYunWx = GAN_WUXING[nextPillar.gan];
    const energyMain = getEnergyMain(dayMasterWx, daYunWx);
    
    const wuxingStrength = estimateDaYunWuxing(bazi, nextPillar);
    
    daYunList.push({
      gan: nextPillar.gan,
      zhi: nextPillar.zhi,
      start_age: startAgeI,
      end_age: endAgeI,
      energy_main: energyMain,
      wuxing_strength: wuxingStrength,
      description: getDaYunDescription(i, startAgeI, endAgeI)
    });
    
    currentGan = nextPillar.gan;
    currentZhi = nextPillar.zhi;
  }
  
  return daYunList;
}

function calculateQiYunAge(bazi: BaziResult, gender: "male" | "female"): number {
  return 8;
}

function shouldGoForward(bazi: BaziResult, gender: "male" | "female"): boolean {
  const yangGan = ["甲", "丙", "戊", "庚", "壬"];
  const isYangYear = yangGan.includes(bazi.year.gan);
  
  if (isYangYear && gender === "male") return true;
  if (!isYangYear && gender === "female") return true;
  return false;
}

function getNextPillar(gan: string, zhi: string, forward: boolean): {gan: string, zhi: string} {
  const ganList = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const zhiList = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  const ganIdx = ganList.indexOf(gan);
  const zhiIdx = zhiList.indexOf(zhi);
  
  if (forward) {
    return {
      gan: ganList[(ganIdx + 1) % 10],
      zhi: zhiList[(zhiIdx + 1) % 12]
    };
  } else {
    return {
      gan: ganList[(ganIdx + 9) % 10],
      zhi: zhiList[(zhiIdx + 11) % 12]
    };
  }
}

function getEnergyMain(dayMasterWx: string, daYunWx: string): "帮扶" | "克泄耗" {
  const cycle = ["木", "火", "土", "金", "水"];
  const idx = cycle.indexOf(dayMasterWx);
  
  const tongLei = dayMasterWx;
  const shengWo = cycle[(idx + 4) % 5];
  
  if (daYunWx === tongLei || daYunWx === shengWo) {
    return "帮扶";
  }
  return "克泄耗";
}

function estimateDaYunWuxing(bazi: BaziResult, daYun: {gan: string, zhi: string}): Record<string, number> {
  const baseStrength = calculateWuxingStrength(bazi);
  const adjusted = {...baseStrength.wuxing};
  
  const daYunGanWx = GAN_WUXING[daYun.gan];
  const daYunZhiWx = ZHI_WUXING[daYun.zhi];
  
  adjusted[daYunGanWx] = (adjusted[daYunGanWx] || 0) + 0.5;
  adjusted[daYunZhiWx] = (adjusted[daYunZhiWx] || 0) + 0.5;
  
  return adjusted;
}

function getDaYunDescription(index: number, startAge: number, endAge: number): string {
  if (startAge < 18) return "少年运";
  if (startAge < 28) return "青年运";
  if (startAge < 38) return "中年事业运";
  if (startAge < 48) return "中年巅峰运";
  if (startAge < 58) return "中晚年运";
  return "晚年运";
}

// ==================== 格局判断 ====================

/**
 * 判断格局（简化版）
 */
export function judgeGeJu(bazi: BaziResult): GeJu {
  const monthZhi = bazi.month.zhi;
  const hiddenStems = HIDDEN_STEMS[monthZhi] || [];
  
  if (hiddenStems.length === 0) {
    return {
      name: "待定",
      level: "待定",
      basis: "月令藏干为空"
    };
  }
  
  const benQi = hiddenStems.find(h => h.type === "本气");
  if (!benQi) {
    return {
      name: "待定",
      level: "待定",
      basis: "月令无本气"
    };
  }
  
  const benQiGan = benQi.gan;
  const isTouGan = [bazi.year.gan, bazi.month.gan, bazi.day.gan, bazi.hour?.gan]
    .filter(Boolean)
    .includes(benQiGan);
  
  const shiShenName = getShiShenName(bazi.dayGan, benQiGan);
  const geJuName = `${shiShenName}格`;
  
  if (isTouGan) {
    return {
      name: geJuName,
      level: "成格",
      basis: `月令${benQiGan}${shiShenName}透干`,
      source: "《子平真诠》",
      description: `${geJuName}成立，能量清透`
    };
  } else {
    return {
      name: geJuName,
      level: "待定",
      basis: `月令${benQiGan}${shiShenName}未透干`,
      description: "需看中气、余气透干情况"
    };
  }
}

function getShiShenName(dayGan: string, targetGan: string): string {
  const dayWx = GAN_WUXING[dayGan];
  const targetWx = GAN_WUXING[targetGan];
  
  const cycle = ["木", "火", "土", "金", "水"];
  const dayIdx = cycle.indexOf(dayWx);
  const targetIdx = cycle.indexOf(targetWx);
  
  const diff = (targetIdx - dayIdx + 5) % 5;
  
  const shiShenMap: Record<number, string> = {
    0: "比肩",
    1: "食神",
    2: "正财",
    3: "正官",
    4: "正印"
  };
  
  return shiShenMap[diff] || "未知";
}

// ==================== 完整因果链生成 ====================

/**
 * 生成完整因果链（转潮对接用）
 */
export function generateYinGuoChain(
  bazi: BaziResult,
  gender: "male" | "female",
  birthYear: number,
  includeLiuNian: boolean = false
): YinGuoChain {
  const strength = judgeStrength(bazi);
  const yongShen = findYongShen(bazi);
  const daYun = calculateDaYun(bazi, gender, birthYear);
  const geJu = judgeGeJu(bazi);
  const wuxingAnalysis = calculateWuxingStrength(bazi);
  
  const result: YinGuoChain = {
    bazi,
    strength,
    yong_shen: yongShen,
    da_yun: daYun,
    ge_ju: geJu,
    wuxing_analysis: wuxingAnalysis
  };
  
  if (includeLiuNian) {
    const currentYear = new Date().getFullYear();
    result.liu_nian = [];
    
    for (let year = birthYear; year <= currentYear + 10; year++) {
      result.liu_nian.push({
        year,
        age: year - birthYear,
        gan: "甲",
        zhi: "子",
        energy_score: 60,
        yong_shen_match: false,
        da_yun_index: 0
      });
    }
  }
  
  return result;
}

/**
 * 用神计算（简化版）
 */
function findYongShen(bazi: BaziResult): {
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
    return {
      yongShen: [shengWo, tongLei],
      xiShen: [woSheng],
      jiShen: [keWo, woKe],
      reason: `日主${strength.level}，需${shengWo}生扶、${tongLei}帮身`
    };
  } else if (strength.level === "极旺" || strength.level === "旺") {
    return {
      yongShen: [keWo, woSheng, woKe],
      xiShen: [],
      jiShen: [shengWo, tongLei],
      reason: `日主${strength.level}，需${keWo}克制、${woSheng}泄秀、${woKe}消耗`
    };
  } else {
    return {
      yongShen: [woSheng],
      xiShen: [shengWo, tongLei],
      jiShen: [keWo],
      reason: `日主${strength.level}，顺势而为，以${woSheng}泄秀为用`
    };
  }
}
