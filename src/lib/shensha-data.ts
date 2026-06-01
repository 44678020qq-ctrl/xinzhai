// 神煞分享卡数据 - 心斋口径
// 与「八字常见神煞图鉴」保持同一套 40 个神煞。

export interface ShenshaShareData {
  name: string;
  category: string;
  tint: string;
  tintColor: string;
  description: string;
  miniLabel: string;
  image: string;
}

const TINTS: Record<string, { tint: string; tintColor: string }> = {
  guiRen: { tint: 'var(--accent)', tintColor: '#6FA292' },
  qiTa: { tint: 'var(--wood)', tintColor: '#9CB89A' },
  dongBian: { tint: 'var(--metal)', tintColor: '#B9AE92' },
  qingYuan: { tint: 'var(--fire)', tintColor: '#D88A7A' },
  neiXiang: { tint: 'var(--water)', tintColor: '#7AA0C4' },
  fengMang: { tint: 'var(--danger)', tintColor: '#C97A5D' },
};

const RAW_SHENSHA: Array<[string, string, string, string]> = [
  ['福星贵人', 'guiRen', '善缘 · 助力', '福气相随，一生顺遂。'],
  ['天乙贵人', 'guiRen', '善缘 · 助力', '贵人扶持，逢难呈祥。'],
  ['天德贵人', 'guiRen', '善缘 · 助力', '贵人眷助，逢凶化吉。'],
  ['月德贵人', 'guiRen', '善缘 · 助力', '柔和包容，化解冲突。'],
  ['太极贵人', 'guiRen', '悟性 · 助力', '悟性超群，近道而行。'],
  ['国印贵人', 'guiRen', '信用 · 名望', '信用权柄，名望加持。'],
  ['学堂', 'qiTa', '学习 · 记忆', '好学敏思，博闻强记。'],
  ['词馆', 'qiTa', '表达 · 才华', '言辞出众，才华横溢。'],
  ['文昌贵人', 'qiTa', '思考 · 学业', '文思敏捷，学业有成。'],
  ['华盖', 'neiXiang', '精神 · 独处', '孤高寡淡，精神世界。'],
  ['将星', 'dongBian', '决断 · 承担', '领导才能，果断有为。'],
  ['驿马', 'dongBian', '动 · 远行', '奔波变动，远行机遇。'],
  ['禄神', 'guiRen', '衣禄 · 稳定', '衣禄丰足，生活安稳。'],
  ['金舆', 'guiRen', '福禄 · 享受', '福禄随身，衣食无忧。'],
  ['红鸾', 'qingYuan', '情缘 · 喜庆', '良缘将至，婚姻喜庆。'],
  ['桃花', 'qingYuan', '人缘 · 吸引', '人缘吸引力，情感感知力。'],
  ['天喜', 'qingYuan', '喜庆 · 情缘', '喜庆临门，良缘将至。'],
  ['红艳', 'qingYuan', '魅力 · 瞩目', '魅力天成，引人瞩目。'],
  ['孤辰', 'neiXiang', '独立 · 思考', '孤立人格，深度思考。'],
  ['寡宿', 'neiXiang', '慢热 · 情感', '内向慢热，情感淡泊。'],
  ['羊刃', 'fengMang', '锋芒 · 果决', '锋芒毕露，刚强果决。'],
  ['劫煞', 'fengMang', '波折 · 成长', '波折挑战，磨砺成长。'],
  ['灾煞', 'fengMang', '波折 · 历练', '历经波折，方见成长。'],
  ['天赦贵人', 'guiRen', '化解 · 转机', '逢凶化解，转危为安。'],
  ['咸池', 'qingYuan', '情感 · 魅力', '情感丰富，魅力迷人。'],
  ['孤鸾', 'neiXiang', '情感 · 波折', '情感波折，晚婚倾向。'],
  ['天医', 'guiRen', '健康 · 医缘', '健康福寿，医缘善缘。'],
  ['金神', 'fengMang', '刚烈 · 威严', '刚烈果断，威严自持。'],
  ['天罗地网', 'fengMang', '受限 · 守法', '环境受限，谨慎守法。'],
  ['元辰', 'guiRen', '福泽 · 内藏', '先天福泽，贵气内藏。'],
  ['阴差阳错', 'fengMang', '错位 · 慎行', '因缘错位，谨言慎行。'],
  ['飞刃', 'fengMang', '意外 · 谨慎', '意外伤害，谨慎行事。'],
  ['十恶大败', 'fengMang', '起落 · 财耗', '大起大落，克财耗禄。'],
  ['六秀', 'qiTa', '气质 · 才华', '秀外慧中，气质出众。'],
  ['六厄', 'fengMang', '阻滞 · 坚韧', '多遇阻滞，坚韧度过。'],
  ['流霞', 'fengMang', '情绪 · 是非', '情绪流动，谨防是非。'],
  ['童子煞', 'neiXiang', '纯净 · 缘薄', '心性纯净，六亲缘薄。'],
  ['文曲', 'qiTa', '才艺 · 文采', '才艺出众，文采斐然。'],
  ['华盖煞', 'neiXiang', '孤高 · 超脱', '孤高清冷，超凡脱俗。'],
  ['天魁天钺', 'guiRen', '贵人 · 声名', '贵人提携，声名远播。'],
];

const SHENSHA_IMAGES: Record<string, string> = {
  福星贵人: '/shensha-icons/fuxing-guiren.png',
  天乙贵人: '/shensha-icons/tianyi-guiren.png',
  天德贵人: '/shensha-icons/tiande-guiren.png',
  月德贵人: '/shensha-icons/yuede-guiren.png',
  太极贵人: '/shensha-icons/taiji-guiren.png',
  国印贵人: '/shensha-icons/guoyin-guiren.png',
  学堂: '/shensha-icons/xuetang.png',
  词馆: '/shensha-icons/ciguan.png',
  文昌贵人: '/shensha-icons/wenchang-guiren.png',
  华盖: '/shensha-icons/huagai.png',
  将星: '/shensha-icons/jiangxing.png',
  驿马: '/shensha-icons/yima.png',
  禄神: '/shensha-icons/lushen.png',
  金舆: '/shensha-icons/jinyu.png',
  红鸾: '/shensha-icons/hongluan.png',
  桃花: '/shensha-icons/taohua.png',
  天喜: '/shensha-icons/tianxi.png',
  红艳: '/shensha-icons/hongyan.png',
  孤辰: '/shensha-icons/guchen.png',
  寡宿: '/shensha-icons/guasu.png',
  羊刃: '/shensha-icons/yangren.png',
  劫煞: '/shensha-icons/jiesha.png',
  灾煞: '/shensha-icons/zaisha.png',
  天赦贵人: '/shensha-icons/tianshe-guiren.png',
  咸池: '/shensha-icons/xianchi.png',
  孤鸾: '/shensha-icons/guluan.png',
  天医: '/shensha-icons/tianyi.png',
  金神: '/shensha-icons/jinshen.png',
  天罗地网: '/shensha-icons/tianluo-diwang.png',
  元辰: '/shensha-icons/yuanchen.png',
  阴差阳错: '/shensha-icons/yincha-yangcuo.png',
  飞刃: '/shensha-icons/feiren.png',
  十恶大败: '/shensha-icons/shie-dabai.png',
  六秀: '/shensha-icons/liuxiu.png',
  六厄: '/shensha-icons/liue.png',
  流霞: '/shensha-icons/liuxia.png',
  童子煞: '/shensha-icons/tongzi-sha.png',
  文曲: '/shensha-icons/wenqu.png',
  华盖煞: '/shensha-icons/huagai-sha.png',
  天魁天钺: '/shensha-icons/tiankui-tianyue.png',
};

export const SHENSHA_SHARE_DATA: Record<string, ShenshaShareData> = Object.fromEntries(
  RAW_SHENSHA.map(([name, tintKey, category, description]) => {
    const tint = TINTS[tintKey] || TINTS.qiTa;
    return [name, { name, category, description, miniLabel: '我的神煞', image: SHENSHA_IMAGES[name], ...tint }];
  })
);

const SHENSHA_ALIAS: Record<string, string> = {
  文昌: '文昌贵人',
  孤鸾煞: '孤鸾',
  童子: '童子煞',
  血刃: '飞刃',
};

export const KNOWN_SHENSHA = Object.keys(SHENSHA_SHARE_DATA);

export function isShareableShensha(name: string): boolean {
  return KNOWN_SHENSHA.includes(SHENSHA_ALIAS[name] || name);
}

export function resolveShareableShensha(name: string): ShenshaShareData | null {
  return SHENSHA_SHARE_DATA[SHENSHA_ALIAS[name] || name] || null;
}
