/**
 * 心斋 · 种子钉子库
 * 创始人手写的语言指纹，用于 AI 生成层的 few-shot
 * 
 * 钉子结构：
 * - id: 唯一标识
 * - tags: 命局类型标签（用于检索）
 * - content: 钉子正文（100-150字）
 * - scene: 场景标签
 */

export interface JiaoZi {
  id: string;
  tags: string[];
  content: string;
  scene: string;
  dayMaster?: string;  // 日主五行
  strength?: string;   // 旺衰
}

/**
 * 种子钉子库（创始人手写）
 * 基于产品宪法 v0.3 的声音范本
 */
export const SEED_JIAOZI: JiaoZi[] = [
  {
    id: "D-002",
    tags: ["金", "七杀", "身弱", "压力"],
    dayMaster: "金",
    strength: "弱",
    scene: "觉醒",
    content: "你身上有把刀，但你一直没拔出来。不是不敢，是不知道该砍向哪里。七杀格的人，一生都在找那个值得全力一击的东西。没找到之前，你不会真动。"
  },
  {
    id: "D-003",
    tags: ["金", "水", "印", "沉淀"],
    dayMaster: "金",
    strength: "弱",
    scene: "应验",
    content: "今天金水极盛 —— 庚申压着你，壬子又在底下托着你。你会感觉被夹在中间：一边是收不住的压力，一边是化不开的沉。这不是你出问题了，是这一天的能量本来就重。"
  },
  {
    id: "D-004",
    tags: ["木", "食神", "身旺", "表达"],
    dayMaster: "木",
    strength: "旺",
    scene: "流动",
    content: "木旺的人，今天那股想做事的劲会自己长出来。不用推，不用催，它自己就在动。但别让它散 —— 找一个方向，让所有枝桠往一处长。"
  },
  {
    id: "D-007",
    tags: ["火", "身旺", "热情", "冲动"],
    dayMaster: "火",
    strength: "旺",
    scene: "觉察",
    content: "火旺的日子，你会觉得全世界都在等你说话。但先等三秒 —— 不是让你憋着，是让那团火先烧完最猛的那一截。烧完了，剩下的才是真话。"
  },
  {
    id: "D-008",
    tags: ["土", "身弱", "稳定", "支持"],
    dayMaster: "土",
    strength: "弱",
    scene: "承接",
    content: "土弱的人，今天脚下有点虚。不是你站不稳，是这一天的能量不给你根。别硬撑，找个能托住你的人或事，靠着做，比站着做更稳。"
  },
  {
    id: "D-009",
    tags: ["水", "身旺", "智慧", "流动"],
    dayMaster: "水",
    strength: "旺",
    scene: "通透",
    content: "水旺的日子，什么都看得清。但看得清不代表要说出来。水最厉害的不是看透，是流过去 —— 带着看见的东西，但不被它卡住。"
  },
  {
    id: "D-010",
    tags: ["木", "身弱", "生长", "需要支持"],
    dayMaster: "木",
    strength: "弱",
    scene: "等待",
    content: "木弱的人，今天那股向上的劲不太够。不是你不想长，是根还没扎稳。先别急着往上冲，先把根养好 —— 找点能让你安心的事，做深一点。"
  },
  {
    id: "D-011",
    tags: ["火", "身弱", "温暖", "需要点燃"],
    dayMaster: "火",
    strength: "弱",
    scene: "引燃",
    content: "火弱的日子，你那团火有点暗。不是灭了，是没东西烧。找点让你有感觉的事 —— 不用大，一点火星就够了。先点起来，再让它自己烧。"
  },
  {
    id: "D-012",
    tags: ["金", "身旺", "果断", "切割"],
    dayMaster: "金",
    strength: "旺",
    scene: "决断",
    content: "金旺的日子，你那把刀特别利。有些事你早就想断，今天能断。但断之前想清楚 —— 这一刀下去，是解了结，还是结了新结。"
  },
  {
    id: "D-013",
    tags: ["土", "身旺", "厚重", "承载"],
    dayMaster: "土",
    strength: "旺",
    scene: "承载",
    content: "土旺的日子，你能扛住很多东西。但别什么都扛 —— 土太重会压死自己。挑值得的扛，剩下的让它落地，不是每件事都需要你托着。"
  }
];

/**
 * 检索匹配的钉子（简化版 RAG）
 * MVP: 基于标签匹配，后续接入向量检索
 */
export function retrieveJiaoZi(
  dayMaster: string,
  strength: string,
  tags: string[] = []
): JiaoZi[] {
  // 硬过滤：日主五行 + 旺衰匹配
  let candidates = SEED_JIAOZI.filter(j => 
    j.dayMaster === dayMaster && j.strength === strength
  );
  
  // 如果没找到精确匹配，放宽到只匹配日主
  if (candidates.length === 0) {
    candidates = SEED_JIAOZI.filter(j => j.dayMaster === dayMaster);
  }
  
  // 如果还是没找到，返回通用钉子
  if (candidates.length === 0) {
    candidates = SEED_JIAOZI.slice(0, 3);
  }
  
  // 按标签匹配度排序
  candidates.sort((a, b) => {
    const aMatch = a.tags.filter(t => tags.includes(t)).length;
    const bMatch = b.tags.filter(t => tags.includes(t)).length;
    return bMatch - aMatch;
  });
  
  return candidates.slice(0, 3);
}

/**
 * 生成今日钉子（基于规则层判断 + 种子钉子 few-shot）
 */
export function generateTodayJiaoZi(params: {
  dayMaster: string;
  dayMasterGan: string;
  strength: string | { level: string; score: number };
  yongShen: string[];
  wuxingStrength: Record<string, number>;
  effects?: string[];
}): string {
  const { dayMaster, dayMasterGan, strength: strengthInput, yongShen, wuxingStrength, effects } = params;
  
  // 兼容 strength 对象和字符串
  const strength = typeof strengthInput === 'string' 
    ? strengthInput 
    : (strengthInput?.level || '中和');
  
  // 检索匹配的种子钉子
  const matched = retrieveJiaoZi(dayMaster, strength, yongShen);
  
  // 简化版生成：基于规则层判断 + 种子钉子风格
  // MVP 阶段先用模板，后续接入 LLM
  
  const strengthDesc: Record<string, string> = {
    "极旺": "能量极盛",
    "旺": "能量充沛",
    "偏旺": "能量偏强",
    "中和": "能量平衡",
    "偏弱": "能量偏弱",
    "弱": "能量不足",
    "极弱": "能量匮乏"
  };
  
  const action = strength.includes("旺") 
    ? "顺势而为，让能量自己流动" 
    : strength.includes("弱")
    ? `需要${yongShen[0]}的支持，先稳住根基`
    : "保持节奏，不急不缓";
  
  // 基于种子钉子的风格生成
  const jiaoZi = `${dayMasterGan}${dayMaster}之人，今日${strengthDesc[strength] || "能量平稳"}。${action}。${matched[0]?.content.slice(0, 50) || ""}`;
  
  return jiaoZi.slice(0, 150);  // 限制在150字
}
