import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateBazi, baziToPrompt, getDayMasterWuxing, judgeStrength, findYongShen, calculateWuxingStrength } from '@/lib/bazi'

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
      summary: `${bazi.dayGan}${wuxing}之人，${strength.level}，${yongShen.reason}。性格${generateKeywords(wuxing, strength.level).slice(0, 2).join('、')}，适合与${getMatchType(wuxing)}型人格相处。`,
      bazi_display: `${bazi.year.gan}${bazi.year.zhi} ${bazi.month.gan}${bazi.month.zhi} ${bazi.day.gan}${bazi.day.zhi} ${bazi.hour?.gan || '?'}${bazi.hour?.zhi || '?'}`,
      // 新增命理规则层输出
      strength: {
        level: strength.level,
        score: strength.score,
        deLing: strength.deLing,
        deDi: strength.deDi,
        deSheng: strength.deSheng,
        deZhu: strength.deZhu
      },
      yongShen: yongShen,
      wuxingStrength: wxStrength.normalized
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
  if (strength === '极旺' || strength === '旺') {
    return baseStr + '，能量充沛';
  } else if (strength === '极弱' || strength === '弱') {
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
