/**
 * 心斋用神解读知识库
 * 参考 ziwei-doushu STAR_DB 四段式结构
 * 
 * 四段式结构：
 * 1. 一句话定调：快速判断用神方向
 * 2. 核心论断：用神决策的完整因果链
 * 3. 命盘依据：支撑判断的五行力量分析
 * 4. 经典出处：《穷通宝鉴》原文引用
 */

// ────────────────── 类型定义 ──────────────────

export type Strength = '极旺' | '偏旺' | '旺' | '中和' | '弱' | '偏弱' | '极弱';
export type MonthBranch = '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥' | '子' | '丑';
export type DayMaster = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

export interface YongShenProfile {
  /** 一句话定调：快速判断方向 */
  summary: string;
  /** 核心论断：用神决策的因果链 */
  reasoning: string;
  /** 命盘依据：五行力量支撑 */
  basis: string;
  /** 经典出处：《穷通宝鉴》原文 */
  source: string;
  /** 用神建议（简版） */
  yongShen: string;
  /** 喜神建议 */
  xiShen: string;
  /** 忌神警示 */
  jiShen: string;
}

// ────────────────── 调候表（穷通宝鉴核心）──────────────────

/**
 * 调候用神表
 * 结构：日主 → 月令 → 调候信息
 * 
 * 数据来源：《穷通宝鉴》清·余春台
 */
export const TIAO_HOU_TABLE: Record<DayMaster, Record<MonthBranch, {
  need: string[];      // 核心需求
  reason: string;      // 调候原理
  avoid: string[];     // 避讳
  source?: string;     // 古籍原文（待补充）
}>> = {
  // ─── 甲木（参天之木）────────────────────────────────────────
  甲: {
    寅: { need: ['丙', '癸'], reason: '初春寒气未消，需丙暖局、癸润木', avoid: ['庚'], source: '甲生寅月，丙癸并透，名为"春木向阳"《穷通宝鉴》' },
    卯: { need: ['庚', '丙'], reason: '仲春木旺，需庚金修剪、丙火泄秀', avoid: ['辛'] },
    辰: { need: ['庚', '壬'], reason: '季春土旺木弱，需庚克、壬生', avoid: ['己'] },
    巳: { need: ['癸', '庚'], reason: '初夏火旺木焦，需癸水解热、庚生水', avoid: ['丙'] },
    午: { need: ['癸', '庚'], reason: '仲夏火炎木焚，急需癸水救局', avoid: ['丁'] },
    未: { need: ['癸', '庚'], reason: '季夏土燥木枯，需癸润庚生', avoid: ['戊'] },
    申: { need: ['丙', '壬'], reason: '初秋金旺克木，需丙制金、壬生木', avoid: ['辛'] },
    酉: { need: ['丙', '癸'], reason: '仲秋金旺，需丙制金、癸润木', avoid: ['庚'] },
    戌: { need: ['壬', '甲'], reason: '季秋土旺木弱，需壬生、甲助', avoid: ['戊'] },
    亥: { need: ['丙', '戊'], reason: '初冬水旺木漂，需丙暖、戊止水', avoid: ['壬'] },
    子: { need: ['丙', '丁'], reason: '仲冬水寒木冻，需丙丁暖局', avoid: ['癸'] },
    丑: { need: ['丙', '丁'], reason: '季冬土冻木寒，需丙丁解冻', avoid: ['壬'] },
  },
  
  // ─── 乙木（花草之木）────────────────────────────────────────
  乙: {
    寅: { need: ['丙', '癸'], reason: '初春寒气未消，需丙暖癸润', avoid: ['庚'] },
    卯: { need: ['丙', '癸'], reason: '仲春木旺，需丙泄秀、癸滋养', avoid: ['辛'] },
    辰: { need: ['癸', '丙'], reason: '季春土旺，需癸润、丙暖', avoid: ['戊'] },
    巳: { need: ['癸'], reason: '初夏火旺，急需癸水润局', avoid: ['丙'] },
    午: { need: ['癸', '庚'], reason: '仲夏火炎，需癸救、庚生水', avoid: ['丁'] },
    未: { need: ['癸'], reason: '季夏土燥，需癸润', avoid: ['己'] },
    申: { need: ['丙', '癸'], reason: '初秋金旺，需丙制、癸润', avoid: ['辛'] },
    酉: { need: ['丙', '癸'], reason: '仲秋金寒，需丙暖、癸润', avoid: ['庚'] },
    戌: { need: ['癸', '甲'], reason: '季秋土旺，需癸润甲助', avoid: ['戊'] },
    亥: { need: ['丙'], reason: '初冬水旺，需丙暖局', avoid: ['壬'] },
    子: { need: ['丙'], reason: '仲冬水寒，需丙暖', avoid: ['癸'] },
    丑: { need: ['丙'], reason: '季冬土冻，需丙暖', avoid: ['壬'] },
  },
  
  // ─── 丙火（太阳之火）────────────────────────────────────────
  丙: {
    寅: { need: ['壬', '庚'], reason: '初春木旺火相，需壬水映照、庚生水', avoid: ['癸'] },
    卯: { need: ['壬', '庚'], reason: '仲春木旺，需壬映、庚生', avoid: ['己'] },
    辰: { need: ['壬', '甲'], reason: '季春土泄火气，需壬映、甲生火', avoid: ['癸'] },
    巳: { need: ['壬', '庚'], reason: '初夏火旺，需壬调候、庚生水', avoid: ['癸'] },
    午: { need: ['壬', '庚'], reason: '仲夏火炎，需壬解热、庚生水', avoid: ['癸'] },
    未: { need: ['壬', '甲'], reason: '季夏土燥，需壬润、甲生火', avoid: ['丁'] },
    申: { need: ['壬', '甲'], reason: '初秋金旺耗火，需壬映、甲生', avoid: ['癸'] },
    酉: { need: ['壬', '甲'], reason: '仲秋金旺，需壬映、甲生火', avoid: ['癸'] },
    戌: { need: ['甲', '壬'], reason: '季秋土旺泄火，需甲生、壬映', avoid: ['癸'] },
    亥: { need: ['甲', '戊'], reason: '初冬水旺克火，需甲生、戊止水', avoid: ['壬'] },
    子: { need: ['甲', '戊'], reason: '仲冬水寒，需甲生、戊止水', avoid: ['壬'] },
    丑: { need: ['甲', '戊'], reason: '季冬土冻，需甲生、戊止水', avoid: ['壬'] },
  },
  
  // ─── 丁火（灯烛之火）────────────────────────────────────────
  丁: {
    寅: { need: ['甲', '庚'], reason: '初春木旺，需甲生、庚劈甲', avoid: ['癸'] },
    卯: { need: ['甲', '庚'], reason: '仲春木旺，需甲生、庚劈', avoid: ['壬'] },
    辰: { need: ['甲', '庚'], reason: '季春土泄，需甲生、庚劈甲', avoid: ['癸'] },
    巳: { need: ['甲', '壬'], reason: '初夏火旺，需甲生、壬映', avoid: ['癸'] },
    午: { need: ['甲', '壬'], reason: '仲夏火炎，需甲生、壬调', avoid: ['癸'] },
    未: { need: ['甲', '壬'], reason: '季夏土燥，需甲生、壬润', avoid: ['癸'] },
    申: { need: ['甲', '庚'], reason: '初秋金旺耗火，需甲生、庚劈', avoid: ['壬'] },
    酉: { need: ['甲', '庚'], reason: '仲秋金旺，需甲生、庚劈', avoid: ['壬'] },
    戌: { need: ['甲', '庚'], reason: '季秋土旺，需甲生、庚劈', avoid: ['癸'] },
    亥: { need: ['甲', '庚'], reason: '初冬水旺，需甲生、庚劈甲', avoid: ['壬'] },
    子: { need: ['甲', '庚'], reason: '仲冬水寒，需甲生、庚劈', avoid: ['壬'] },
    丑: { need: ['甲', '庚'], reason: '季冬土冻，需甲生、庚劈', avoid: ['壬'] },
  },
  
  // ─── 戊土（堤岸之土）────────────────────────────────────────
  戊: {
    寅: { need: ['丙', '甲', '癸'], reason: '初春木旺克土，需丙暖、甲疏、癸润', avoid: ['壬'] },
    卯: { need: ['丙', '甲', '癸'], reason: '仲春木旺，需丙暖、甲疏、癸润', avoid: ['壬'] },
    辰: { need: ['丙', '甲', '癸'], reason: '季春土旺，需丙暖、甲疏、癸润', avoid: ['壬'] },
    巳: { need: ['甲', '癸'], reason: '初夏火炎土燥，需甲疏土、癸润局', avoid: ['丙'] },
    午: { need: ['甲', '癸'], reason: '仲夏火炎，需甲疏、癸润', avoid: ['丙'] },
    未: { need: ['甲', '癸'], reason: '季夏土燥，需甲疏、癸润', avoid: ['丙'] },
    申: { need: ['丙', '癸'], reason: '初秋金旺泄土，需丙暖、癸润', avoid: ['甲'] },
    酉: { need: ['丙', '癸'], reason: '仲秋金旺，需丙暖、癸润', avoid: ['甲'] },
    戌: { need: ['丙', '癸'], reason: '季秋土弱，需丙暖、癸润', avoid: ['甲'] },
    亥: { need: ['丙', '甲'], reason: '初冬水旺，需丙暖、甲止水', avoid: ['壬'] },
    子: { need: ['丙', '甲'], reason: '仲冬水寒，需丙暖、甲止水', avoid: ['壬'] },
    丑: { need: ['丙', '甲'], reason: '季冬土冻，需丙暖、甲止水', avoid: ['壬'] },
  },
  
  // ─── 己土（田园之土）────────────────────────────────────────
  己: {
    寅: { need: ['丙', '甲', '癸'], reason: '初春木旺克土，需丙暖、甲疏、癸润', avoid: ['壬'] },
    卯: { need: ['丙', '甲', '癸'], reason: '仲春木旺，需丙暖、甲疏、癸润', avoid: ['壬'] },
    辰: { need: ['丙', '癸'], reason: '季春土旺，需丙暖、癸润', avoid: ['甲'] },
    巳: { need: ['癸', '丙'], reason: '初夏火炎，需癸润、丙暖', avoid: ['壬'] },
    午: { need: ['癸', '丙'], reason: '仲夏火炎，需癸润、丙暖', avoid: ['壬'] },
    未: { need: ['癸', '丙'], reason: '季夏土燥，需癸润、丙暖', avoid: ['壬'] },
    申: { need: ['丙', '癸'], reason: '初秋金旺泄土，需丙暖、癸润', avoid: ['甲'] },
    酉: { need: ['丙', '癸'], reason: '仲秋金旺，需丙暖、癸润', avoid: ['甲'] },
    戌: { need: ['丙', '癸'], reason: '季秋土弱，需丙暖、癸润', avoid: ['甲'] },
    亥: { need: ['丙', '甲'], reason: '初冬水旺，需丙暖、甲止水', avoid: ['壬'] },
    子: { need: ['丙', '甲'], reason: '仲冬水寒，需丙暖、甲止水', avoid: ['壬'] },
    丑: { need: ['丙', '甲'], reason: '季冬土冻，需丙暖、甲止水', avoid: ['壬'] },
  },
  
  // ─── 庚金（斧钺之金）────────────────────────────────────────
  庚: {
    寅: { need: ['戊', '甲'], reason: '初春木旺金囚，需戊生、甲劈甲', avoid: ['癸'] },
    卯: { need: ['戊', '甲'], reason: '仲春木旺，需戊生、甲劈', avoid: ['癸'] },
    辰: { need: ['甲', '壬'], reason: '季春土生金，需甲疏、壬洗', avoid: ['戊'] },
    巳: { need: ['壬', '戊'], reason: '初夏火旺克金，需壬解热、戊生金', avoid: ['丙'] },
    午: { need: ['壬', '戊'], reason: '仲夏火炎，需壬解、戊生', avoid: ['丙'] },
    未: { need: ['壬', '戊'], reason: '季夏土燥，需壬洗、戊生', avoid: ['丙'] },
    申: { need: ['丁', '甲'], reason: '初秋金旺，需丁锻、甲生火', avoid: ['壬'] },
    酉: { need: ['丁', '甲'], reason: '仲秋金旺，需丁锻、甲生火', avoid: ['壬'] },
    戌: { need: ['甲', '壬'], reason: '季秋土旺，需甲疏、壬洗', avoid: ['戊'] },
    亥: { need: ['丙', '戊'], reason: '初冬水旺泄金，需丙暖、戊止水', avoid: ['壬'] },
    子: { need: ['丙', '戊'], reason: '仲冬水寒，需丙暖、戊止水', avoid: ['壬'] },
    丑: { need: ['丙', '丁'], reason: '季冬土冻金寒，需丙丁暖局', avoid: ['壬'] },
  },
  
  // ─── 辛金（珠玉之金）────────────────────────────────────────
  辛: {
    寅: { need: ['己', '壬'], reason: '初春木旺金弱，需己生、壬洗', avoid: ['丙'] },
    卯: { need: ['己', '壬'], reason: '仲春木旺，需己生、壬洗', avoid: ['丙'] },
    辰: { need: ['壬', '甲'], reason: '季春土生金，需壬洗、甲疏', avoid: ['戊'] },
    巳: { need: ['壬', '癸'], reason: '初夏火旺克金，需壬癸解热', avoid: ['丙'] },
    午: { need: ['壬', '癸'], reason: '仲夏火炎，需壬癸救', avoid: ['丙'] },
    未: { need: ['壬', '癸'], reason: '季夏土燥，需壬癸润', avoid: ['丙'] },
    申: { need: ['壬', '甲'], reason: '初秋金旺，需壬洗、甲生火', avoid: ['戊'] },
    酉: { need: ['壬', '甲'], reason: '仲秋金旺，需壬洗、甲生火', avoid: ['戊'] },
    戌: { need: ['壬', '甲'], reason: '季秋土旺，需壬洗、甲疏', avoid: ['戊'] },
    亥: { need: ['丙', '戊'], reason: '初冬水旺，需丙暖、戊止水', avoid: ['壬'] },
    子: { need: ['丙', '戊'], reason: '仲冬水寒，需丙暖、戊止水', avoid: ['壬'] },
    丑: { need: ['丙'], reason: '季冬土冻金寒，需丙暖局', avoid: ['壬'] },
  },
  
  // ─── 壬水（江河之水）────────────────────────────────────────
  壬: {
    寅: { need: ['庚', '丙'], reason: '初春木旺泄水，需庚生、丙暖', avoid: ['戊'] },
    卯: { need: ['庚', '丙'], reason: '仲春木旺，需庚生、丙暖', avoid: ['戊'] },
    辰: { need: ['甲', '庚'], reason: '季春土克水，需甲疏土、庚生水', avoid: ['戊'] },
    巳: { need: ['癸', '庚'], reason: '初夏火旺耗水，需癸助、庚生', avoid: ['丙'] },
    午: { need: ['癸', '庚'], reason: '仲夏火炎水涸，需癸救、庚生', avoid: ['丙'] },
    未: { need: ['癸', '庚'], reason: '季夏土燥水弱，需癸助、庚生', avoid: ['丙'] },
    申: { need: ['甲', '戊'], reason: '初秋金生水旺，需甲泄、戊止', avoid: ['庚'] },
    酉: { need: ['甲', '戊'], reason: '仲秋金旺，需甲泄、戊止水', avoid: ['庚'] },
    戌: { need: ['甲', '丙'], reason: '季秋土旺，需甲疏、丙暖', avoid: ['戊'] },
    亥: { need: ['戊', '丙'], reason: '初冬水旺，需戊止、丙暖', avoid: ['庚'] },
    子: { need: ['戊', '丙'], reason: '仲冬水寒，需戊止、丙暖', avoid: ['庚'] },
    丑: { need: ['丙', '甲'], reason: '季冬土冻水寒，需丙暖、甲疏', avoid: ['庚'] },
  },
  
  // ─── 癸水（雨露之水）────────────────────────────────────────
  癸: {
    寅: { need: ['辛', '丙'], reason: '初春木旺泄水，需辛生、丙暖', avoid: ['戊'] },
    卯: { need: ['辛', '丙'], reason: '仲春木旺，需辛生、丙暖', avoid: ['戊'] },
    辰: { need: ['辛', '甲'], reason: '季春土克水，需辛生、甲疏', avoid: ['戊'] },
    巳: { need: ['癸', '辛'], reason: '初夏火旺耗水，需癸助、辛生', avoid: ['丙'] },
    午: { need: ['癸', '辛'], reason: '仲夏火炎，需癸救、辛生', avoid: ['丙'] },
    未: { need: ['癸', '辛'], reason: '季夏土燥，需癸助、辛生', avoid: ['丙'] },
    申: { need: ['甲', '丙'], reason: '初秋金生水旺，需甲泄、丙暖', avoid: ['庚'] },
    酉: { need: ['甲', '丙'], reason: '仲秋金旺，需甲泄、丙暖', avoid: ['庚'] },
    戌: { need: ['甲', '丙'], reason: '季秋土旺，需甲疏、丙暖', avoid: ['戊'] },
    亥: { need: ['丙', '戊'], reason: '初冬水旺，需丙暖、戊止水', avoid: ['庚'] },
    子: { need: ['丙', '戊'], reason: '仲冬水寒，需丙暖、戊止', avoid: ['庚'] },
    丑: { need: ['丙'], reason: '季冬土冻水寒，需丙暖局', avoid: ['庚'] },
  },
};

// ────────────────── 用神解读生成器 ──────────────────

/**
 * 根据日主和月令生成用神解读
 */
export function generateYongShenProfile(
  dayMaster: DayMaster,
  monthBranch: MonthBranch,
  strength: Strength
): YongShenProfile {
  const tiaoHou = TIAO_HOU_TABLE[dayMaster]?.[monthBranch];
  
  if (!tiaoHou) {
    return {
      summary: `${dayMaster}日主生于${monthBranch}月，需综合判断`,
      reasoning: '缺乏明确的调候指引，建议结合整体命盘分析',
      basis: '调候表中暂无此组合数据',
      source: '《穷通宝鉴》',
      yongShen: '待定',
      xiShen: '待定',
      jiShen: '待定',
    };
  }
  
  // 生成一句话定调
  const summary = `${dayMaster}日主生于${monthBranch}月，${tiaoHou.reason}。`;
  
  // 生成核心论断（因果链）
  const reasoning = `按《穷通宝鉴》调候法，${dayMaster}木生于${monthBranch}月，${tiaoHou.need.length > 0 ? `首取${tiaoHou.need.join('、')}为用` : '需综合判断'}。${strength === '极旺' || strength === '偏旺' ? '日主过旺，宜泄宜克' : strength === '极弱' || strength === '偏弱' ? '日主过弱，宜生宜扶' : '日主中和，顺势而为'}。`;
  
  // 生成命盘依据
  const basis = `调候表显示：需${tiaoHou.need.join('、')}，忌${tiaoHou.avoid.join('、')}。原理：${tiaoHou.reason}。`;
  
  return {
    summary,
    reasoning,
    basis,
    source: tiaoHou.source || '《穷通宝鉴》',
    yongShen: tiaoHou.need[0] || '待定',
    xiShen: tiaoHou.need.slice(1).join('、') || '待定',
    jiShen: tiaoHou.avoid.join('、') || '无明确忌神',
  };
}

// ────────────────── 导出 ──────────────────

export default {
  TIAO_HOU_TABLE,
  generateYongShenProfile,
};
