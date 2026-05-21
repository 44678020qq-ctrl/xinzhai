/**
 * 心斋 · 转潮判断逻辑（工单-07）
 * 
 * 转潮 = 大运换柱当月 → 触发仪式
 * 
 * 核心逻辑：
 * 1. 判断当前是否处于"换柱当月"（大运起运年龄所在月份）
 * 2. 命中 → 推一条召唤（只推一次）
 * 3. 非换柱 → 不触发（守稀缺）
 * 
 * 转潮句文案：等创始人写，先留占位
 */

import type { DaYun } from "./bazi";

export interface TurnTideResult {
  isTurning: boolean;           // 是否正在转潮
  daYun: DaYun | null;          // 即将进入的大运
  previousDaYun: DaYun | null;  // 即将离开的大运
  turnType: "进入喜运" | "进入忌运" | "换柱";  // 转潮类型
  turnSentence: string;         // 转潮句（占位，等创始人写）
  hasTriggered: boolean;        // 是否已触发过（localStorage标记）
}

/**
 * 判断是否处于换柱当月
 * 
 * 换柱 = 大运起始年龄 = 用户当前年龄 的月份
 * 精确到月：需知道起运月份（简化为起运年龄对应的生日月份）
 * 
 * @param currentAge 当前年龄
 * @param currentMonth 当前月份(1-12)
 * @param birthMonth 出生月份
 * @param daYunList 大运列表
 * @param isStrong 身旺还是身弱
 * @param triggeredKeys 已触发的转潮key（localStorage）
 */
export function checkTurnTide(
  currentAge: number,
  currentMonth: number,
  birthMonth: number,
  daYunList: DaYun[],
  isStrong: boolean,
  triggeredKeys: string[] = [],
): TurnTideResult {
  
  // 找到当前大运和下一个大运
  let currentDaYun: DaYun | null = null;
  let nextDaYun: DaYun | null = null;
  
  for (let i = 0; i < daYunList.length; i++) {
    if (currentAge >= daYunList[i].startAge && currentAge <= daYunList[i].endAge) {
      currentDaYun = daYunList[i];
      nextDaYun = daYunList[i + 1] || null;
      break;
    }
  }
  
  // 判断是否在换柱当月
  // 换柱点：下一个大运的 startAge = 当前年龄，且当前月 = 出生月份（生日月）
  // 简化：startAge = 当前年龄 时即视为换柱年，生日月为换柱当月
  let isTurningMonth = false;
  let turningDaYun: DaYun | null = null;
  
  for (const dy of daYunList) {
    if (dy.startAge === currentAge && currentMonth === birthMonth) {
      isTurningMonth = true;
      turningDaYun = dy;
      break;
    }
  }
  
  if (!isTurningMonth || !turningDaYun) {
    return {
      isTurning: false,
      daYun: null,
      previousDaYun: currentDaYun,
      turnType: "换柱",
      turnSentence: "",
      hasTriggered: false,
    };
  }
  
  // 生成唯一key（防止重复触发）
  const turnKey = `turn_${turningDaYun.gan}${turningDaYun.zhi}_${turningDaYun.startAge}`;
  const alreadyTriggered = triggeredKeys.includes(turnKey);
  
  // 判断喜忌
  const isXiDaYun = isStrong 
    ? turningDaYun.energyMain === "克泄耗" 
    : turningDaYun.energyMain === "帮扶";
  
  const turnType = isXiDaYun ? "进入喜运" : "进入忌运";
  
  // 转潮句占位（等创始人写，先留结构）
  const PLACEHOLDER_SENTENCES: Record<string, string> = {
    "进入喜运": "「转潮句·喜运占位」——等创始人写",
    "进入忌运": "「转潮句·忌运占位」——等创始人写",
  };
  
  return {
    isTurning: true,
    daYun: turningDaYun,
    previousDaYun: currentDaYun,
    turnType,
    turnSentence: PLACEHOLDER_SENTENCES[turnType],
    hasTriggered: alreadyTriggered,
  };
}

/**
 * 标记转潮已触发（存localStorage）
 */
export function markTurnTideTriggered(turnKey: string): string[] {
  const existing = JSON.parse(localStorage.getItem("xinzhai_turn_triggered") || "[]");
  if (!existing.includes(turnKey)) {
    existing.push(turnKey);
    localStorage.setItem("xinzhai_turn_triggered", JSON.stringify(existing));
  }
  return existing;
}

/**
 * 获取已触发的转潮key列表
 */
export function getTriggeredTurnKeys(): string[] {
  return JSON.parse(localStorage.getItem("xinzhai_turn_triggered") || "[]");
}
