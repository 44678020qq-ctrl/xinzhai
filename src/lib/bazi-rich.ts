/**
 * 心斋 · 完整八字数据类型
 * 基于本地八字规则层生成专业盘展示数据
 */

export interface GanInfo {
  天干: string;
  五行: '木' | '火' | '土' | '金' | '水';
  阴阳: '阳' | '阴';
  十神?: string;
}

export interface CangGan {
  主气?: { 天干: string; 十神: string };
  中气?: { 天干: string; 十神: string };
  余气?: { 天干: string; 十神: string };
}

export interface ZhiInfo {
  地支: string;
  五行: '木' | '火' | '土' | '金' | '水';
  阴阳: '阳' | '阴';
  藏干?: CangGan;
}

export interface PillarDetail {
  天干: GanInfo;
  地支: ZhiInfo;
  纳音: string;
  旬: string;
  空亡: string;
  星运: string;
  自坐: string;
  神煞?: string[];
}

export interface DaYunItem {
  干支: string;
  开始年份: number;
  结束: number;
  天干十神: string;
  地支十神: string[];
  地支藏干: string[];
  开始年龄: number;
  结束年龄: number;
}

export interface RichBazi {
  性别: '男' | '女';
  阳历: string;
  农历: string;
  八字: string;
  生肖: string;
  日主: string;
  年柱: PillarDetail;
  月柱: PillarDetail;
  日柱: PillarDetail;
  时柱: PillarDetail;
  胎元: string;
  胎息: string;
  命宫: string;
  身宫: string;
  神煞: {
    年柱: string[];
    月柱: string[];
    日柱: string[];
    时柱: string[];
  };
  大运: DaYunItem[];
}

type SimplePillar = {
  gan: string;
  zhi: string;
  wuxing_gan?: string;
  wuxing_zhi?: string;
};

type SimpleBazi = {
  year: SimplePillar;
  month: SimplePillar;
  day: SimplePillar;
  hour?: SimplePillar;
  dayGan: string;
  dayZhi: string;
};

type ShenShaItem = {
  name: string;
  position: string | string[];
};

/** 五行颜色映射 */
export const WX_COLOR: Record<string, string> = {
  '木': '#5E9C6B',
  '火': '#D8744F',
  '土': '#C9A86A',
  '金': '#B9AE92',
  '水': '#7AA0C4',
};

export const GAN_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

export const ZHI_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  子: '水', 丑: '土',
  寅: '木', 卯: '木',
  辰: '土', 巳: '火',
  午: '火', 未: '土',
  申: '金', 酉: '金',
  戌: '土', 亥: '水',
};

const YIN_YANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  子: '阳', 寅: '阳', 辰: '阳', 午: '阳', 申: '阳', 戌: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
  丑: '阴', 卯: '阴', 巳: '阴', 未: '阴', 酉: '阴', 亥: '阴',
};

const HIDDEN_STEMS: Record<string, Array<{ gan: string; type: '主气' | '中气' | '余气' }>> = {
  子: [{ gan: '癸', type: '主气' }],
  丑: [{ gan: '己', type: '主气' }, { gan: '癸', type: '中气' }, { gan: '辛', type: '余气' }],
  寅: [{ gan: '甲', type: '主气' }, { gan: '丙', type: '中气' }, { gan: '戊', type: '余气' }],
  卯: [{ gan: '乙', type: '主气' }],
  辰: [{ gan: '戊', type: '主气' }, { gan: '乙', type: '中气' }, { gan: '癸', type: '余气' }],
  巳: [{ gan: '丙', type: '主气' }, { gan: '戊', type: '中气' }, { gan: '庚', type: '余气' }],
  午: [{ gan: '丁', type: '主气' }, { gan: '己', type: '中气' }],
  未: [{ gan: '己', type: '主气' }, { gan: '丁', type: '中气' }, { gan: '乙', type: '余气' }],
  申: [{ gan: '庚', type: '主气' }, { gan: '壬', type: '中气' }, { gan: '戊', type: '余气' }],
  酉: [{ gan: '辛', type: '主气' }],
  戌: [{ gan: '戊', type: '主气' }, { gan: '辛', type: '中气' }, { gan: '丁', type: '余气' }],
  亥: [{ gan: '壬', type: '主气' }, { gan: '甲', type: '中气' }],
};

const TEN_GODS: Record<string, Record<string, string>> = {
  甲: { 甲: '比肩', 乙: '劫财', 丙: '食神', 丁: '伤官', 戊: '偏财', 己: '正财', 庚: '七杀', 辛: '正官', 壬: '偏印', 癸: '正印' },
  乙: { 甲: '劫财', 乙: '比肩', 丙: '伤官', 丁: '食神', 戊: '正财', 己: '偏财', 庚: '正官', 辛: '七杀', 壬: '正印', 癸: '偏印' },
  丙: { 甲: '偏印', 乙: '正印', 丙: '比肩', 丁: '劫财', 戊: '食神', 己: '伤官', 庚: '偏财', 辛: '正财', 壬: '七杀', 癸: '正官' },
  丁: { 甲: '正印', 乙: '偏印', 丙: '劫财', 丁: '比肩', 戊: '伤官', 己: '食神', 庚: '正财', 辛: '偏财', 壬: '正官', 癸: '七杀' },
  戊: { 甲: '七杀', 乙: '正官', 丙: '偏印', 丁: '正印', 戊: '比肩', 己: '劫财', 庚: '食神', 辛: '伤官', 壬: '偏财', 癸: '正财' },
  己: { 甲: '正官', 乙: '七杀', 丙: '正印', 丁: '偏印', 戊: '劫财', 己: '比肩', 庚: '伤官', 辛: '食神', 壬: '正财', 癸: '偏财' },
  庚: { 甲: '偏财', 乙: '正财', 丙: '七杀', 丁: '正官', 戊: '偏印', 己: '正印', 庚: '比肩', 辛: '劫财', 壬: '食神', 癸: '伤官' },
  辛: { 甲: '正财', 乙: '偏财', 丙: '正官', 丁: '七杀', 戊: '正印', 己: '偏印', 庚: '劫财', 辛: '比肩', 壬: '伤官', 癸: '食神' },
  壬: { 甲: '食神', 乙: '伤官', 丙: '偏财', 丁: '正财', 戊: '七杀', 己: '正官', 庚: '偏印', 辛: '正印', 壬: '比肩', 癸: '劫财' },
  癸: { 甲: '伤官', 乙: '食神', 丙: '正财', 丁: '偏财', 戊: '正官', 己: '七杀', 庚: '正印', 辛: '偏印', 壬: '劫财', 癸: '比肩' },
};

const XUN_KONG: Record<string, string[]> = {
  甲子: ['戌', '亥'], 乙丑: ['戌', '亥'], 丙寅: ['戌', '亥'], 丁卯: ['戌', '亥'], 戊辰: ['戌', '亥'], 己巳: ['戌', '亥'], 庚午: ['戌', '亥'], 辛未: ['戌', '亥'], 壬申: ['戌', '亥'], 癸酉: ['戌', '亥'],
  甲戌: ['申', '酉'], 乙亥: ['申', '酉'], 丙子: ['申', '酉'], 丁丑: ['申', '酉'], 戊寅: ['申', '酉'], 己卯: ['申', '酉'], 庚辰: ['申', '酉'], 辛巳: ['申', '酉'], 壬午: ['申', '酉'], 癸未: ['申', '酉'],
  甲申: ['午', '未'], 乙酉: ['午', '未'], 丙戌: ['午', '未'], 丁亥: ['午', '未'], 戊子: ['午', '未'], 己丑: ['午', '未'], 庚寅: ['午', '未'], 辛卯: ['午', '未'], 壬辰: ['午', '未'], 癸巳: ['午', '未'],
  甲午: ['辰', '巳'], 乙未: ['辰', '巳'], 丙申: ['辰', '巳'], 丁酉: ['辰', '巳'], 戊戌: ['辰', '巳'], 己亥: ['辰', '巳'], 庚子: ['辰', '巳'], 辛丑: ['辰', '巳'], 壬寅: ['辰', '巳'], 癸卯: ['辰', '巳'],
  甲辰: ['寅', '卯'], 乙巳: ['寅', '卯'], 丙午: ['寅', '卯'], 丁未: ['寅', '卯'], 戊申: ['寅', '卯'], 己酉: ['寅', '卯'], 庚戌: ['寅', '卯'], 辛亥: ['寅', '卯'], 壬子: ['寅', '卯'], 癸丑: ['寅', '卯'],
  甲寅: ['子', '丑'], 乙卯: ['子', '丑'], 丙辰: ['子', '丑'], 丁巳: ['子', '丑'], 戊午: ['子', '丑'], 己未: ['子', '丑'], 庚申: ['子', '丑'], 辛酉: ['子', '丑'], 壬戌: ['子', '丑'], 癸亥: ['子', '丑'],
};

const NAYIN: Record<string, string> = {
  甲子: '海中金', 乙丑: '海中金', 丙寅: '炉中火', 丁卯: '炉中火', 戊辰: '大林木', 己巳: '大林木',
  庚午: '路旁土', 辛未: '路旁土', 壬申: '剑锋金', 癸酉: '剑锋金', 甲戌: '山头火', 乙亥: '山头火',
  丙子: '涧下水', 丁丑: '涧下水', 戊寅: '城头土', 己卯: '城头土', 庚辰: '白蜡金', 辛巳: '白蜡金',
  壬午: '杨柳木', 癸未: '杨柳木', 甲申: '泉中水', 乙酉: '泉中水', 丙戌: '屋上土', 丁亥: '屋上土',
  戊子: '霹雳火', 己丑: '霹雳火', 庚寅: '松柏木', 辛卯: '松柏木', 壬辰: '长流水', 癸巳: '长流水',
  甲午: '砂中金', 乙未: '砂中金', 丙申: '山下火', 丁酉: '山下火', 戊戌: '平地木', 己亥: '平地木',
  庚子: '壁上土', 辛丑: '壁上土', 壬寅: '金箔金', 癸卯: '金箔金', 甲辰: '覆灯火', 乙巳: '覆灯火',
  丙午: '天河水', 丁未: '天河水', 戊申: '大驿土', 己酉: '大驿土', 庚戌: '钗钏金', 辛亥: '钗钏金',
  壬子: '桑柘木', 癸丑: '桑柘木', 甲寅: '大溪水', 乙卯: '大溪水', 丙辰: '沙中土', 丁巳: '沙中土',
  戊午: '天上火', 己未: '天上火', 庚申: '石榴木', 辛酉: '石榴木', 壬戌: '大海水', 癸亥: '大海水',
};

const CHANG_SHENG: Record<string, Record<string, string>> = {
  甲: { 亥: '长生', 子: '沐浴', 丑: '冠带', 寅: '临官', 卯: '帝旺', 辰: '衰', 巳: '病', 午: '死', 未: '墓', 申: '绝', 酉: '胎', 戌: '养' },
  乙: { 午: '长生', 巳: '沐浴', 辰: '冠带', 卯: '临官', 寅: '帝旺', 丑: '衰', 子: '病', 亥: '死', 戌: '墓', 酉: '绝', 申: '胎', 未: '养' },
  丙: { 寅: '长生', 卯: '沐浴', 辰: '冠带', 巳: '临官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '绝', 子: '胎', 丑: '养' },
  丁: { 酉: '长生', 申: '沐浴', 未: '冠带', 午: '临官', 巳: '帝旺', 辰: '衰', 卯: '病', 寅: '死', 丑: '墓', 子: '绝', 亥: '胎', 戌: '养' },
  戊: { 寅: '长生', 卯: '沐浴', 辰: '冠带', 巳: '临官', 午: '帝旺', 未: '衰', 申: '病', 酉: '死', 戌: '墓', 亥: '绝', 子: '胎', 丑: '养' },
  己: { 酉: '长生', 申: '沐浴', 未: '冠带', 午: '临官', 巳: '帝旺', 辰: '衰', 卯: '病', 寅: '死', 丑: '墓', 子: '绝', 亥: '胎', 戌: '养' },
  庚: { 巳: '长生', 午: '沐浴', 未: '冠带', 申: '临官', 酉: '帝旺', 戌: '衰', 亥: '病', 子: '死', 丑: '墓', 寅: '绝', 卯: '胎', 辰: '养' },
  辛: { 子: '长生', 亥: '沐浴', 戌: '冠带', 酉: '临官', 申: '帝旺', 未: '衰', 午: '病', 巳: '死', 辰: '墓', 卯: '绝', 寅: '胎', 丑: '养' },
  壬: { 申: '长生', 酉: '沐浴', 戌: '冠带', 亥: '临官', 子: '帝旺', 丑: '衰', 寅: '病', 卯: '死', 辰: '墓', 巳: '绝', 午: '胎', 未: '养' },
  癸: { 卯: '长生', 寅: '沐浴', 丑: '冠带', 子: '临官', 亥: '帝旺', 戌: '衰', 酉: '病', 申: '死', 未: '墓', 午: '绝', 巳: '胎', 辰: '养' },
};

/** 十神标签翻译 */
export const TEN_GOD_LABEL: Record<string, string> = {
  '比肩': '比', '劫财': '劫', '食神': '食', '伤官': '伤',
  '偏财': '偏', '正财': '财', '七杀': '杀', '正官': '官',
  '偏印': '枭', '正印': '印',
};

/** 十神主星（用于专业盘显示） */
export function getMainStar(_gan: string, _isMonthPillar: boolean): string | null {
  // 月令主星逻辑简化版
  // 实际应用中应基于日主和月令综合判断
  return null; // 暂不实现，使用十神
}

export function getGanWuxing(gan: string): string {
  return GAN_WUXING[gan] || '';
}

function getTenGod(dayGan: string, otherGan: string): string {
  return TEN_GODS[dayGan]?.[otherGan] || '';
}

function getPillarKongWang(dayGan: string, dayZhi: string, pillarZhi: string): string {
  const kong = XUN_KONG[`${dayGan}${dayZhi}`] || [];
  return kong.includes(pillarZhi) ? kong.join('') : '';
}

function getXun(dayGan: string, dayZhi: string): string {
  const kong = XUN_KONG[`${dayGan}${dayZhi}`];
  return kong ? `空${kong.join('')}` : '';
}

function getChangSheng(gan: string, zhi: string): string {
  return CHANG_SHENG[gan]?.[zhi] || '';
}

function normalizePosition(position: string | string[]): string[] {
  return Array.isArray(position) ? position : [position];
}

function shenShaByPillar(shenSha: ShenShaItem[] = []): RichBazi['神煞'] {
  const result: RichBazi['神煞'] = { 年柱: [], 月柱: [], 日柱: [], 时柱: [] };
  for (const item of shenSha) {
    for (const pos of normalizePosition(item.position)) {
      if (pos === '年柱' || pos === '月柱' || pos === '日柱' || pos === '时柱') {
        result[pos].push(item.name);
      }
    }
  }
  return result;
}

function buildPillarDetail(pillar: SimplePillar | undefined, dayGan: string, dayZhi: string): PillarDetail {
  const gan = pillar?.gan || '?';
  const zhi = pillar?.zhi || '?';
  const hidden = HIDDEN_STEMS[zhi] || [];
  const cangGan: CangGan = {};

  for (const item of hidden) {
    cangGan[item.type] = {
      天干: item.gan,
      十神: getTenGod(dayGan, item.gan),
    };
  }

  const mainHiddenGan = hidden[0]?.gan;

  return {
    天干: {
      天干: gan,
      五行: GAN_WUXING[gan] || '土',
      阴阳: YIN_YANG[gan] || '阳',
      十神: gan === dayGan ? '日主' : getTenGod(dayGan, gan),
    },
    地支: {
      地支: zhi,
      五行: ZHI_WUXING[zhi] || '土',
      阴阳: YIN_YANG[zhi] || '阳',
      藏干: cangGan,
    },
    纳音: NAYIN[`${gan}${zhi}`] || '',
    旬: getXun(gan, zhi),
    空亡: zhi === '?' ? '' : getPillarKongWang(dayGan, dayZhi, zhi),
    星运: getChangSheng(gan, zhi),
    自坐: getChangSheng(dayGan, zhi) || (mainHiddenGan ? `坐${getTenGod(dayGan, mainHiddenGan)}` : ''),
  };
}

export function buildRichBaziFromSimple(
  bazi: SimpleBazi,
  options: {
    gender?: number;
    solarText?: string;
    lunarText?: string;
    shenSha?: ShenShaItem[];
  } = {}
): RichBazi {
  const shenSha = shenShaByPillar(options.shenSha);

  return {
    性别: options.gender === 0 ? '女' : '男',
    阳历: options.solarText || '',
    农历: options.lunarText || '',
    八字: `${bazi.year.gan}${bazi.year.zhi} ${bazi.month.gan}${bazi.month.zhi} ${bazi.day.gan}${bazi.day.zhi} ${bazi.hour ? `${bazi.hour.gan}${bazi.hour.zhi}` : '未知'}`,
    生肖: '',
    日主: bazi.dayGan,
    年柱: buildPillarDetail(bazi.year, bazi.dayGan, bazi.dayZhi),
    月柱: buildPillarDetail(bazi.month, bazi.dayGan, bazi.dayZhi),
    日柱: buildPillarDetail(bazi.day, bazi.dayGan, bazi.dayZhi),
    时柱: buildPillarDetail(bazi.hour, bazi.dayGan, bazi.dayZhi),
    胎元: '',
    胎息: '',
    命宫: '',
    身宫: '',
    神煞: shenSha,
    大运: [],
  };
}

/** 藏干提取 */
export function extractCangGan(pillar: PillarDetail): string[] {
  const result: string[] = [];
  if (pillar.地支?.藏干) {
    if (pillar.地支.藏干.主气) result.push(pillar.地支.藏干.主气.天干);
    if (pillar.地支.藏干.中气) result.push(pillar.地支.藏干.中气.天干);
    if (pillar.地支.藏干.余气) result.push(pillar.地支.藏干.余气.天干);
  }
  return result;
}

/** 获取某柱的神煞列表 */
export function getPillarShenSha(pillarKey: '年柱' | '月柱' | '日柱' | '时柱', bazi: RichBazi): string[] {
  const keyMap: Record<string, keyof RichBazi['神煞']> = {
    '年柱': '年柱',
    '月柱': '月柱',
    '日柱': '日柱',
    '时柱': '时柱',
  };
  return bazi.神煞[keyMap[pillarKey]] || [];
}
