/**
 * 心斋「流」页数据层
 * 参考 lifekline chartPoints 结构，适配八字大运流年
 * 
 * 工单-05：重建「流」页数据层
 */

// ────────────────── 类型定义 ──────────────────

export interface FlowPoint {
  age: number;           // 年龄
  year: number;          // 公历年份
  daYun: string;         // 大运干支（如"庚申"、"辛酉"）
  ganZhi: string;        // 流年干支
  open: number;          // 年初运势（0-100）
  close: number;         // 年末运势
  high: number;          // 年中最高
  low: number;           // 年中最低
  score: number;         // 综合评分
  reason: string;        // 运势解读
}

export interface LifeEvent {
  age: number;
  year: number;
  type: 'career' | 'love' | 'health' | 'wealth' | 'family' | 'move';
  title: string;
  description: string;
}

export interface FlowData {
  bazi: string[];        // 四柱
  dayMaster: string;     // 日主
  chartPoints: FlowPoint[];
  events: LifeEvent[];
}

// ────────────────── 运势评分规则 ──────────────────

/**
 * 计算流年运势分数
 * 基于日主五行与流年干支的生克关系
 */
export function calculateFlowScore(
  dayMaster: string,
  liuNianGan: string,
  liuNianZhi: string,
  daYunGan: string,
  daYunZhi: string
): { score: number; reason: string } {
  
  const GAN_WUXING: Record<string, string> = {
    甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
    己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
  };
  
  const ZHI_WUXING: Record<string, string> = {
    子: "水", 丑: "土", 寅: "木", 卯: "木",
    辰: "土", 巳: "火", 午: "火", 未: "土",
    申: "金", 酉: "金", 戌: "土", 亥: "水",
  };
  
  const dayWuxing = GAN_WUXING[dayMaster] || "土";
  const yearGanWuxing = GAN_WUXING[liuNianGan] || "土";
  const yearZhiWuxing = ZHI_WUXING[liuNianZhi] || "土";
  
  // 五行生克关系评分
  const WUXING_RELATION: Record<string, Record<string, number>> = {
    木: { 木: 70, 火: 85, 土: 55, 金: 45, 水: 80 },
    火: { 木: 80, 火: 70, 土: 85, 金: 55, 水: 45 },
    土: { 木: 50, 火: 80, 土: 70, 金: 85, 水: 55 },
    金: { 木: 55, 火: 50, 土: 80, 金: 70, 水: 85 },
    水: { 木: 85, 火: 55, 土: 50, 金: 80, 水: 70 },
  };
  
  const ganScore = WUXING_RELATION[dayWuxing]?.[yearGanWuxing] || 60;
  const zhiScore = WUXING_RELATION[dayWuxing]?.[yearZhiWuxing] || 60;
  
  // 综合评分（天干占60%，地支占40%）
  const score = Math.round(ganScore * 0.6 + zhiScore * 0.4);
  
  // 生成解读文案
  const relationMap: Record<string, string> = {
    "生我": "印星护身",
    "我生": "食伤泄秀",
    "同我": "比劫助身",
    "克我": "官杀制身",
    "我克": "财星耗身",
  };
  
  const getRelation = (day: string, other: string): string => {
    const relations: Record<string, Record<string, string>> = {
      木: { 木: "同我", 火: "我生", 土: "我克", 金: "克我", 水: "生我" },
      火: { 木: "生我", 火: "同我", 土: "我生", 金: "我克", 水: "克我" },
      土: { 木: "克我", 火: "生我", 土: "同我", 金: "我生", 水: "我克" },
      金: { 木: "我克", 火: "克我", 土: "生我", 金: "同我", 水: "我生" },
      水: { 木: "我生", 火: "我克", 土: "克我", 金: "生我", 水: "同我" },
    };
    return relations[day]?.[other] || "同我";
  };
  
  const ganRel = getRelation(dayWuxing, yearGanWuxing);
  const zhiRel = getRelation(dayWuxing, yearZhiWuxing);
  
  let reason = `${liuNianGan}${liuNianZhi}年，`;
  
  if (score >= 80) {
    reason += `${relationMap[ganRel]}，运势旺盛。`;
  } else if (score >= 65) {
    reason += `${relationMap[ganRel]}，运势平稳向好。`;
  } else if (score >= 50) {
    reason += `${relationMap[ganRel]}，运势中平，宜守不宜攻。`;
  } else {
    reason += `${relationMap[ganRel]}，运势有阻，需谨慎行事。`;
  }
  
  return { score, reason };
}

// ────────────────── 示例数据 ──────────────────

/**
 * 生成示例「流」页数据
 * 实际应用中应该从后端API获取
 */
export function generateMockFlowData(birthYear: number, dayMaster: string): FlowData {
  const chartPoints: FlowPoint[] = [];
  const events: LifeEvent[] = [];
  
  // 生成1-80岁运势数据
  for (let age = 1; age <= 80; age++) {
    const year = birthYear + age;
    
    // 简化的大运计算（实际应该用 lunar-javascript）
    const daYunIndex = Math.floor((age - 1) / 10);
    const liuNianIndex = (year - 4) % 10;
    const liuNianZhiIndex = (year - 4) % 12;
    
    const GANS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const ZHIS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    
    const liuNianGan = GANS[liuNianIndex];
    const liuNianZhi = ZHIS[liuNianZhiIndex];
    
    // 简化的大运干支
    const daYunGan = GANS[(daYunIndex + 3) % 10];
    const daYunZhi = ZHIS[(daYunIndex + 2) % 12];
    
    const { score, reason } = calculateFlowScore(
      dayMaster,
      liuNianGan,
      liuNianZhi,
      daYunGan,
      daYunZhi
    );
    
    // 添加波动（模拟人生起伏）
    const volatility = Math.sin(age / 8) * 8 + Math.random() * 5 - 2.5;
    const adjustedScore = Math.max(35, Math.min(95, score + volatility));
    
    chartPoints.push({
      age,
      year,
      daYun: age < 8 ? "童限" : `${daYunGan}${daYunZhi}`,
      ganZhi: `${liuNianGan}${liuNianZhi}`,
      open: Math.round(adjustedScore - 3),
      close: Math.round(adjustedScore + 2),
      high: Math.round(adjustedScore + 8 + Math.random() * 5),
      low: Math.round(adjustedScore - 8 - Math.random() * 5),
      score: Math.round(adjustedScore),
      reason,
    });
  }
  
  // 添加关键人生事件示例
  const keyEvents = [
    { age: 6, type: 'family' as const, title: '入学', description: '开始接受教育' },
    { age: 18, type: 'career' as const, title: '成年', description: '步入社会或继续深造' },
    { age: 28, type: 'love' as const, title: '婚恋期', description: '感情运势活跃' },
    { age: 35, type: 'career' as const, title: '事业关键期', description: '事业发展的重要阶段' },
    { age: 50, type: 'health' as const, title: '知天命', description: '关注健康养生' },
  ];
  
  keyEvents.forEach(e => {
    events.push({
      age: e.age,
      year: birthYear + e.age,
      type: e.type,
      title: e.title,
      description: e.description,
    });
  });
  
  return {
    bazi: ["癸未", "壬戌", "丙子", "庚寅"], // 示例四柱
    dayMaster,
    chartPoints,
    events,
  };
}

// ────────────────── 导出 ──────────────────

export default {
  generateMockFlowData,
  calculateFlowScore,
};
