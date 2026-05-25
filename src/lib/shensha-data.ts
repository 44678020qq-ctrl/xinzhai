// 神煞分享卡数据 - 心斋口径
// 仅包含5种经典神煞（德秀为草案，暂不启用）

export interface ShenshaShareData {
  name: string;          // 神煞名
  category: string;      // 类别标签（善缘·助力 / 动·变 / 内向·独处 / 情·缘 / 思考·助力）
  tint: string;          // 主题色（CSS 变量名）
  tintColor: string;     // 实际颜色值（用于 inline style）
  description: string;   // 心斋口径描述（平实、不吹捧、不下吉凶）
  miniLabel: string;     // 顶部小字标签（默认"我的神煞"）
}

export const SHENSHA_SHARE_DATA: Record<string, ShenshaShareData> = {
  '天乙贵人': {
    name: '天乙贵人',
    category: '善缘 · 助力',
    tint: 'var(--accent)',
    tintColor: '#6FA292',
    description: '你的盘里留了一处暗接的善缘——最紧的关头，常有人从旁边伸手。',
    miniLabel: '我的神煞',
  },
  '驿马': {
    name: '驿马',
    category: '动 · 变',
    tint: 'var(--metal)',
    tintColor: '#B9AE92',
    description: '你的能量待不住一处——在路上、在变动里，它才流得开。',
    miniLabel: '我的神煞',
  },
  '华盖': {
    name: '华盖',
    category: '内向 · 独处',
    tint: 'var(--water)',
    tintColor: '#7AA0C4',
    description: '你有一片朝内的天地——人多时你收着，独处时才真正亮起来。',
    miniLabel: '我的神煞',
  },
  '桃花': {
    name: '桃花',
    category: '情 · 缘',
    tint: 'var(--fire)',
    tintColor: '#D88A7A',
    description: '你身上有一种把人吸过来的水气——容易被喜欢，也容易被喜欢扰动。',
    miniLabel: '我的神煞',
  },
  '文昌贵人': {
    name: '文昌贵人',
    category: '思考 · 助力',
    tint: 'var(--wood)',
    tintColor: '#9CB89A',
    description: '你和文字、思考之间有条顺路——读、写、想的时候，你最像你自己。',
    miniLabel: '我的神煞',
  },
};

// 导出神煞名列表（用于校验）
export const KNOWN_SHENSHA = Object.keys(SHENSHA_SHARE_DATA);

// 校验神煞是否可分享
export function isShareableShensha(name: string): boolean {
  return KNOWN_SHENSHA.includes(name);
}
