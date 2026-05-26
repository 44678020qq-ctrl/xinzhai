// 神煞分享卡数据 - 心斋口径
// 完整版：27 种神煞

export interface ShenshaShareData {
  name: string;          // 神煞名
  category: string;      // 类别标签
  tint: string;          // 主题色（CSS 变量名）
  tintColor: string;     // 实际颜色值（用于 inline style）
  description: string;   // 心斋口径描述（平实、不吹捧、不下吉凶）
  miniLabel: string;     // 顶部小字标签（默认"我的神煞"）
}

export const SHENSHA_SHARE_DATA: Record<string, ShenshaShareData> = {
  // ============ 贵人星系 ============
  '天乙贵人': {
    name: '天乙贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你的盘里留了一处暗接的善缘——最紧的关头，常有人从旁边伸手。',
    miniLabel: '我的神煞',
  },
  '太极贵人': {
    name: '太极贵人',
    category: '思考 · 助力',
    tint: 'var(--wood)',
    tintColor: '#9CB89A',
    description: '你和道理、规律之间有种亲近感——学东西喜欢往根上问。',
    miniLabel: '我的神煞',
  },
  '福星贵人': {
    name: '福星贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你底子不薄——平时有人照应，难的时候也不至于孤立无援。',
    miniLabel: '我的神煞',
  },
  '文昌': {
    name: '文昌',
    category: '思考 · 助力',
    tint: 'var(--wood)',
    tintColor: '#9CB89A',
    description: '你和文字、思考之间有条顺路——读、写、想的时候，你最像你自己。',
    miniLabel: '我的神煞',
  },
  '天德贵人': {
    name: '天德贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你有关口——最紧的时候，常有人从旁边伸手，或者事自己转过来。',
    miniLabel: '我的神煞',
  },
  '月德贵人': {
    name: '月德贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你平时运气不算差，遇事有人帮衬，少走很多弯路。',
    miniLabel: '我的神煞',
  },

  // ============ 桃花系 ============
  '桃花': {
    name: '桃花',
    category: '情 · 缘',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '你身上有一种把人吸过来的气——容易被喜欢，也容易被喜欢扰动。',
    miniLabel: '我的神煞',
  },
  '红鸾': {
    name: '红鸾',
    category: '情 · 缘',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '你容易遇到合拍的人——相处起来不累，愿意多聊几句。',
    miniLabel: '我的神煞',
  },
  '天喜': {
    name: '天喜',
    category: '情 · 缘',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '你容易赶上喜庆的事——聚会、婚礼、好消息，常常落在你附近。',
    miniLabel: '我的神煞',
  },
  '咸池': {
    name: '咸池',
    category: '情 · 缘',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '⚠️ 你对人有吸引力，但也容易陷进去——靠近之前，先看清再伸手。',
    miniLabel: '我的神煞',
  },

  // ============ 动态星 ============
  '驿马': {
    name: '驿马',
    category: '动 · 变',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '你的能量待不住一处——在路上、在变动里，它才流得开。',
    miniLabel: '我的神煞',
  },
  '将星': {
    name: '将星',
    category: '性格 · 特质',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '你做事有章法，能扛事——别人容易信你，把事交给你。',
    miniLabel: '我的神煞',
  },
  '禄神': {
    name: '禄神',
    category: '善缘 · 助力',
    tint: 'var(--earth)',
    tintColor: '#C9A86A',
    description: '你有稳定的收入来源——不至于太慌，手头总有一点余裕。',
    miniLabel: '我的神煞',
  },

  // ============ 性格星 ============
  '华盖': {
    name: '华盖',
    category: '内向 · 独处',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '你有一片朝内的天地——人多时你收着，独处时才真正亮起来。',
    miniLabel: '我的神煞',
  },
  '魁罡': {
    name: '魁罡',
    category: '性格 · 特质',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '你性子直，说话不绕——做事有股狠劲，认准了就往前冲。',
    miniLabel: '我的神煞',
  },
  '孤鸾煞': {
    name: '孤鸾煞',
    category: '性格 · 特质',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '⚠️ 你感情上容易挑剔——合拍的人不太好找，需要多一点耐心。',
    miniLabel: '我的神煞',
  },
  '金舆': {
    name: '金舆',
    category: '动 · 变',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '你出行运气不差——坐车坐船少折腾，路上容易遇到好事。',
    miniLabel: '我的神煞',
  },
  '八专': {
    name: '八专',
    category: '性格 · 特质',
    tint: 'var(--wood)',
    tintColor: '#9CB89A',
    description: '你精力旺，做事有韧劲——但有时候有点一根筋，转不过弯。',
    miniLabel: '我的神煞',
  },

  // ============ 凶煞 ============
  '空亡': {
    name: '空亡',
    category: '凶 · 警示',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '⚠️ 有些事看着近，实际上落不到实处——别太较真，缓一缓再说。',
    miniLabel: '我的神煞',
  },
  '羊刃': {
    name: '羊刃',
    category: '凶 · 警示',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '⚠️ 你脾气上来的时候有点猛——说完容易后悔，先停三秒再说。',
    miniLabel: '我的神煞',
  },
  '十恶大败': {
    name: '十恶大败',
    category: '凶 · 警示',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '⚠️ 你财运上容易有漏洞——钱到手就走，留不住，需要刻意存一点。',
    miniLabel: '我的神煞',
  },
  '亡神': {
    name: '亡神',
    category: '凶 · 警示',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '⚠️ 你心思深，有些事不想让人看透——但别让自己绕太远。',
    miniLabel: '我的神煞',
  },
  '劫煞': {
    name: '劫煞',
    category: '凶 · 警示',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '⚠️ 你做事容易起急——有时候会被人截胡，稳住比快更重要。',
    miniLabel: '我的神煞',
  },
  '吊客': {
    name: '吊客',
    category: '凶 · 警示',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '⚠️ 那段时间你心情容易低落，少去丧气的地方，多晒晒太阳。',
    miniLabel: '我的神煞',
  },
  '病符': {
    name: '病符',
    category: '凶 · 警示',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '⚠️ 那阵子你身体容易出小毛病——多休息，别硬撑，及时看医生。',
    miniLabel: '我的神煞',
  },
  '四废': {
    name: '四废',
    category: '凶 · 警示',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '⚠️ 那段时间你做事费力——计划容易卡住，缓一缓再说，别硬推。',
    miniLabel: '我的神煞',
  },

  // ============ 其他 ============
  '童子': {
    name: '童子',
    category: '性格 · 特质',
    tint: 'var(--wood)',
    tintColor: '#9CB89A',
    description: '你心思细，感受力强——有时候会比别人多想一层，敏感不是坏事。',
    miniLabel: '我的神煞',
  },

  // ============ 新增神煞 ============
  '德秀贵人': {
    name: '德秀贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你自带一种被偏爱的底色——不是运气好，是你让人想对你好。',
    miniLabel: '我的神煞',
  },
  '血刃': {
    name: '血刃',
    category: '锋芒 · 急流',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '⚠️ 你骨子里有股不服输的劲——关键时刻能爆发出超乎寻常的能量。',
    miniLabel: '我的神煞',
  },
};

// 导出神煞名列表（用于校验）
export const KNOWN_SHENSHA = Object.keys(SHENSHA_SHARE_DATA);

// 校验神煞是否可分享
export function isShareableShensha(name: string): boolean {
  return KNOWN_SHENSHA.includes(name);
}
