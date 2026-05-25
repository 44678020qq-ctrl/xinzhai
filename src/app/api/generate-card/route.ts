import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateBazi, baziToPrompt, getDayMasterWuxing, judgeStrength, findYongShen, calculateWuxingStrength, calculateLiuNian, judgeGeJu, calculateDaYun } from '@/lib/bazi'

// 基础神煞表（常用5种）
const SHEN_SHA_TABLE: Record<string, Array<{name: string; check: (bazi: any) => {position: string; description: string; warning?: string} | null}>> = {
  '驿马': [{
    name: '驿马',
    check: (b) => {
      const yimaZhi = ['寅', '申', '巳', '亥']
      const positions = ['year', 'month', 'day', 'hour'] as const
      for (const p of positions) {
        if (b[p]?.zhi && yimaZhi.includes(b[p].zhi)) return { position: p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱', description: '待不住，总想动', warning: '' }
      }
      return null
    }
  }],
  '桃花': [{
    name: '桃花',
    check: (b) => {
      const taohuaMap: Record<string, string> = { '子': '酉', '午': '卯', '卯': '子', '酉': '午' }
      const dayZhi = b.day?.zhi
      if (!dayZhi || !taohuaMap[dayZhi]) return null
      const target = taohuaMap[dayZhi]
      const positions = ['year', 'month', 'day', 'hour'] as const
      for (const p of positions) {
        if (b[p]?.zhi === target) return { position: p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱', description: '人缘不差——但有些缘分靠近时，先看清再伸手', warning: '' }
      }
      return null
    }
  }],
  '天乙贵人': [{
    name: '天乙贵人',
    check: (b) => {
      const guirenMap: Record<string, string[]> = {
        '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'],
        '丁': ['亥', '酉'], '戊': ['丑', '未'], '己': ['子', '申'],
        '庚': ['丑', '未'], '辛': ['子', '申'], '壬': ['卯', '巳'],
        '癸': ['卯', '巳']
      }
      const targets = guirenMap[b.day?.gan] || []
      const positions = ['year', 'month', 'day', 'hour'] as const
      for (const p of positions) {
        if (b[p]?.zhi && targets.includes(b[p].zhi)) return { position: p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱', description: '有时会遇到帮你的人，挺自然的', warning: '' }
      }
      return null
    }
  }],
  '华盖': [{
    name: '华盖',
    check: (b) => {
      const huagaiMap: Record<string, string> = { '子': '辰', '丑': '丑', '寅': '戌', '卯': '未', '辰': '辰', '巳': '丑', '午': '戌', '未': '未', '申': '辰', '酉': '丑', '戌': '戌', '亥': '未' }
      const dayZhi = b.day?.zhi
      if (!dayZhi || !huagaiMap[dayZhi]) return null
      const target = huagaiMap[dayZhi]
      const positions = ['year', 'month', 'day', 'hour'] as const
      for (const p of positions) {
        if (b[p]?.zhi === target) return { position: p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱', description: '喜欢独处，人多的时候反而有点收', warning: '' }
      }
      return null
    }
  }],
  '文昌': [{
    name: '文昌',
    check: (b) => {
      const wenchangMap: Record<string, string> = {
        '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
        '戊': '申', '己': '酉', '庚': '子', '辛': '丑',
        '壬': '寅', '癸': '卯'
      }
      const target = wenchangMap[b.day?.gan]
      if (!target) return null
      const positions = ['year', 'month', 'day', 'hour'] as const
      for (const p of positions) {
        if (b[p]?.zhi === target) return { position: p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱', description: '你有一条偏内走的思路——不追热闹，但自己想得深、说得清', warning: '' }
      }
      return null
    }
  }],
}

// 调候简表（10日主×12月令核心需求）
function getTiaoHou(dayGan: string, monthZhi: string): { coreNeed: string[]; reason: string; avoid: string[] } {
  // 简化版：只取月令地支判断季节
  const seasonMap: Record<string, string> = {
    '寅': '春', '卯': '春', '辰': '春',
    '巳': '夏', '午': '夏', '未': '夏',
    '申': '秋', '酉': '秋', '戌': '秋',
    '亥': '冬', '子': '冬', '丑': '冬',
  }
  const season = seasonMap[monthZhi] || ''
  
  const tiaoHouRules: Record<string, Record<string, { coreNeed: string[]; reason: string; avoid: string[] }>> = {
    '甲': {
      '春': { coreNeed: ['丙', '癸'], reason: '甲木生于春季，木旺需火泄秀、水润泽', avoid: ['金过旺'] },
      '夏': { coreNeed: ['癸', '壬'], reason: '甲木生于夏季，火旺木燥需水润', avoid: ['火过旺'] },
      '秋': { coreNeed: ['丁', '壬'], reason: '甲木生于秋季，金克木需火制金、水生木', avoid: ['金过旺'] },
      '冬': { coreNeed: ['丙', '丁'], reason: '甲木生于冬季，水寒木冻需火暖', avoid: ['水过旺'] },
    },
    '乙': {
      '春': { coreNeed: ['丙', '癸'], reason: '乙木生于春季，需火发荣、水滋润', avoid: ['土重'] },
      '夏': { coreNeed: ['癸', '壬'], reason: '乙木生于夏季，焦枯需水', avoid: ['火旺'] },
      '秋': { coreNeed: ['丙', '丁'], reason: '乙木生于秋季，凋零需火暖', avoid: ['金多'] },
      '冬': { coreNeed: ['丙', '丁'], reason: '乙木生于冬季，寒冷需火', avoid: ['水旺'] },
    },
    '丙': {
      '春': { coreNeed: ['甲', '壬'], reason: '丙火生于春季，木虚火弱需木生、水济', avoid: ['土晦'] },
      '夏': { coreNeed: ['壬', '癸'], reason: '丙火生于夏季，太烈需水制', avoid: ['火炎'] },
      '秋': { coreNeed: ['甲', '木'], reason: '丙火生于秋季，退气需木扶', avoid: ['金多'] },
      '冬': { coreNeed: ['甲', '木'], reason: '丙火生于冬季，衰微需木生', avoid: ['水克'] },
    },
    '丁': {
      '春': { coreNeed: ['甲', '庚'], reason: '丁火生于春季，柔弱需木生、金劈', avoid: ['水多'] },
      '夏': { coreNeed: ['甲', '庚'], reason: '丁火生于夏季，需木引火、金劈甲', avoid: ['火烈'] },
      '秋': { coreNeed: ['甲', '木'], reason: '丁火生于秋季，退行需木助', avoid: ['土泄'] },
      '冬': { coreNeed: ['甲', '木'], reason: '丁火生于冬季，熄灭需木生', avoid: ['水灭'] },
    },
    '戊': {
      '春': { coreNeed: ['丙', '甲'], reason: '戊土生于春季，土虚需火暖、木疏', avoid: ['木克'] },
      '夏': { coreNeed: ['壬', '癸'], reason: '戊土生于夏季，燥热需水润', avoid: ['火燥'] },
      '秋': { coreNeed: ['丙', '丁'], reason: '戊土生于秋季，土寒需火暖', avoid: ['金多'] },
      '冬': { coreNeed: ['丙', '甲'], reason: '戊土生于冬季，冰冻需火融', avoid: ['水寒'] },
    },
    '己': {
      '春': { coreNeed: ['丙', '火'], reason: '己土生于春季，湿寒需火暖', avoid: ['木克'] },
      '夏': { coreNeed: ['癸', '水'], reason: '己土生于夏季，燥热需水润', avoid: ['火烈'] },
      '秋': { coreNeed: ['丙', '火'], reason: '己土生于秋季，虚薄需火补', avoid: ['金耗'] },
      '冬': { coreNeed: ['丙', '火'], reason: '己土生于冬季，冰冷需火融', avoid: ['水寒'] },
    },
    '庚': {
      '春': { coreNeed: ['丁', '甲'], reason: '庚金生于春季，木坚金缺需火炼、木琢', avoid: ['木坚'] },
      '夏': { coreNeed: ['壬', '癸'], reason: '庚金生于夏季，火烈需水制', avoid: ['火烈'] },
      '秋': { coreNeed: ['丁', '火'], reason: '庚金生于秋季，金坚需火炼成器', avoid: ['水浊'] },
      '冬': { coreNeed: ['丁', '火'], reason: '庚金生于冬季，寒冷需火暖', avoid: ['水寒'] },
    },
    '辛': {
      '春': { coreNeed: ['壬', '庚'], reason: '辛金生于春季，软弱需金帮、水洗', avoid: ['土厚'] },
      '夏': { coreNeed: ['壬', '癸'], reason: '辛金生于夏季，熔化需水制', avoid: ['火烈'] },
      '秋': { coreNeed: ['壬', '水'], reason: '辛金生于秋季，璀璨需水淘', avoid: ['土埋'] },
      '冬': { coreNeed: ['丙', '火'], reason: '辛金生于冬季，冷冻需火暖', avoid: ['水寒'] },
    },
    '壬': {
      '春': { coreNeed: ['庚', '辛'], reason: '壬水生于春季，泛滥需金生、土制', avoid: ['木泄'] },
      '夏': { coreNeed: ['庚', '辛'], reason: '壬水生于夏季，蒸干需金生水源', avoid: ['火烈'] },
      '秋': { coreNeed: ['甲', '木'], reason: '壬水生于秋季，源清需木泄秀', avoid: ['金多'] },
      '冬': { coreNeed: ['丙', '丁'], reason: '壬水生于冬季，冰封需火暖', avoid: ['金寒'] },
    },
    '癸': {
      '春': { coreNeed: ['丙', '辛'], reason: '癸水生于春季，散漫需火照、金生', avoid: ['木泄'] },
      '夏': { coreNeed: ['庚', '辛'], reason: '癸水生于夏季，干涸需金生', avoid: ['土克'] },
      '秋': { coreNeed: ['丙', '丁'], reason: '癸水生于秋季，清冷需火暖', avoid: ['金多'] },
      '冬': { coreNeed: ['丙', '丁'], reason: '癸水生于冬季，结冰需火融', avoid: ['水寒'] },
    },
  }
  
  const rule = tiaoHouRules[dayGan]?.[season]
  return rule || { coreNeed: [], reason: '', avoid: [] }
}

// 计算神煞
function calcShenSha(bazi: any): Array<{name: string; position: string; description: string; warning?: string}> {
  const result: Array<{name: string; position: string; description: string; warning?: string}> = []
  for (const [, checks] of Object.entries(SHEN_SHA_TABLE)) {
    for (const c of checks) {
      const r = c.check(bazi)
      if (r) result.push({ name: c.name, ...r })
    }
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar } = body

    // 计算八字
    const hour = birth_hour ? parseInt(birth_hour) : null
    const minute = birth_minute ? parseInt(birth_minute) : null
    const bazi = calculateBazi(
      parseInt(birth_year),
      parseInt(birth_month),
      parseInt(birth_day),
      hour,
      minute,
      is_lunar || false
    )

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()

    // 从数据库读取用户档案
    let profile = null
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = data
    }

    // 生成人格卡片数据（使用命理规则层）
    const wuxing = getDayMasterWuxing(bazi)
    const strength = judgeStrength(bazi)
    const yongShen = findYongShen(bazi)
    const wxStrength = calculateWuxingStrength(bazi)
    
    const card = {
      wuxing_personality: `${bazi.dayGan}${wuxing}`,
      keywords: generateKeywords(wuxing, strength.level),
      emotion_pattern: getEmotionPattern(wuxing, strength.level),
      relation_pattern: getRelationPattern(wuxing),
      social_tendency: getSocialTendency(wuxing),
      summary: generatePlainSummary(bazi.dayGan, wuxing, strength.level),
      bazi_display: `${bazi.year.gan}${bazi.year.zhi} ${bazi.month.gan}${bazi.month.zhi} ${bazi.day.gan}${bazi.day.zhi} ${bazi.hour?.gan || '?'}${bazi.hour?.zhi || '?'}`,
      strength: {
        level: strength.level,
        score: strength.score,
        deLing: strength.deLing,
        deDi: strength.deDi,
        deSheng: strength.deSheng,
        deZhu: strength.deZhu
      },
      yongShen: yongShen,
      wuxingStrength: wxStrength.normalized,
      shenSha: calcShenSha(bazi),
      tiaoHou: getTiaoHou(bazi.dayGan, bazi.month.zhi),
      liuNian: calculateLiuNian(new Date().getFullYear()),
      geJu: judgeGeJu(bazi),
      daYun: calculateDaYun(bazi, gender),
    }

    return NextResponse.json({
      card,
      bazi: {
        year: { gan: bazi.year.gan, zhi: bazi.year.zhi, wuxing_gan: bazi.year.wuxing_gan },
        month: { gan: bazi.month.gan, zhi: bazi.month.zhi, wuxing_gan: bazi.month.wuxing_gan },
        day: { gan: bazi.day.gan, zhi: bazi.day.zhi, wuxing_gan: bazi.day.wuxing_gan },
        hour: bazi.hour ? { gan: bazi.hour.gan, zhi: bazi.hour.zhi, wuxing_gan: bazi.hour.wuxing_gan } : undefined
      }
    })
  } catch (error) {
    console.error('生成卡片失败:', error)
    return NextResponse.json({ error: '生成失败' }, { status: 500 })
  }
}

// 根据五行+旺衰生成关键词
function generateKeywords(wuxing: string, strength: string): string[] {
  const baseMap: Record<string, string[]> = {
    '木': ['正直', '仁慈', '坚韧', '向上', '温和'],
    '火': ['热情', '开朗', '活跃', '乐观', '冲动'],
    '土': ['稳重', '诚实', '包容', '踏实', '保守'],
    '金': ['刚毅', '果断', '义气', '锐利', '冷静'],
    '水': ['智慧', '灵活', '深沉', '敏感', '善变']
  };
  const base = baseMap[wuxing] || ['独特', '神秘'];
  
  // 根据旺衰调整
  if (strength.includes('旺')) {
    return base.map(k => k + '强');
  } else if (strength.includes('弱')) {
    return base.map(k => k + '柔');
  }
  return base;
}

function getEmotionPattern(wuxing: string, strength: string): string {
  const base: Record<string, string> = {
    '木': '情绪内敛，不善表达，但内心坚定',
    '火': '情绪外放，喜怒形于色，来得快去得快',
    '土': '情绪稳定，不易波动，重视安全感',
    '金': '情绪克制，理性占优，偶有固执',
    '水': '情绪丰富，敏感细腻，易受环境影响'
  };
  const baseStr = base[wuxing] || '情绪独特，难以捉摸';
  
  // 根据旺衰补充
  if (strength === '极旺' || strength === '偏旺' || strength === '旺') {
    return baseStr + '，能量充沛';
  } else if (strength === '极弱' || strength === '偏弱' || strength === '弱') {
    return baseStr + '，需外界支持';
  }
  return baseStr;
}

function getRelationPattern(wuxing: string): string {
  const map: Record<string, string> = {
    '木': '关系中追求精神共鸣，重视共同成长',
    '火': '关系中热情主动，喜欢表达与互动',
    '土': '关系中忠诚稳定，注重承诺与责任',
    '金': '关系中直率坦诚，重视原则与底线',
    '水': '关系中细腻体贴，善于察言观色'
  }
  return map[wuxing] || '关系模式独特'
}

function getSocialTendency(wuxing: string): string {
  const map: Record<string, string> = {
    '木': '社交中偏内向，喜欢深度交流胜过热闹',
    '火': '社交活跃，善于破冰，容易成为焦点',
    '土': '社交稳重，圈子稳定，不喜频繁变动',
    '金': '社交有选择性，重质不重量',
    '水': '社交灵活，能适应不同场合'
  }
  return map[wuxing] || '社交方式独特'
}

function getMatchType(wuxing: string): string {
  const map: Record<string, string> = {
    '木': '水（智慧）或火（热情）',
    '火': '木（稳重）或土（包容）',
    '土': '火（活力）或金（果断）',
    '金': '土（稳定）或水（灵活）',
    '水': '金（坚定）或木（正直）'
  }
  return map[wuxing] || '相似五行'
}

/** 平实文案生成（无算命腔）*/
function generatePlainSummary(dayGan: string, wuxing: string, strength: string): string {
  // 平实的日主描述
  const wxDesc: Record<string, string> = {
    '木': '有生长的方向感',
    '火': '容易被点燃、也容易点燃别人',
    '土': '比较稳、能撑住事',
    '金': '有标准、有边界',
    '水': '敏感、能感受到别人感受不到的',
  };
  
  // 平实的旺衰描述
  let strengthDesc = '';
  if (strength.includes('旺')) {
    strengthDesc = '能量偏旺，自己能撑得住，但有时候有点硬';
  } else if (strength.includes('弱')) {
    strengthDesc = '能量偏弱，心思细、容易被环境带着走，得有点外力撑着才稳';
  } else {
    strengthDesc = '能量比较中和，不算太硬也不太软';
  }
  
  const baseDesc = wxDesc[wuxing] || '有点特别';
  
  return `你是${dayGan}${wuxing}——${baseDesc}。${strengthDesc}。`;
}
