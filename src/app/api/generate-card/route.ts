import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateBazi, baziToPrompt, getDayMasterWuxing, judgeStrength, findYongShen, calculateWuxingStrength, calculateLiuNian, judgeGeJu, calculateDaYun } from '@/lib/bazi'

// 位置标签辅助函数
function posLabel(p: string): string {
  const map: Record<string, string> = {
    'year': '年柱',
    'month': '月柱',
    'day': '日柱',
    'hour': '时柱',
  };
  return map[p] || p;
}

// 三合局辅助函数：返回地支所属的三合局名
function getSanHeGroup(zhi: string): string | null {
  const sanHeGroups: Record<string, string> = {
    '申': 'shui', '子': 'shui', '辰': 'shui',
    '寅': 'huo', '午': 'huo', '戌': 'huo',
    '巳': 'jin', '酉': 'jin', '丑': 'jin',
    '亥': 'mu', '卯': 'mu', '未': 'mu'
  };
  return sanHeGroups[zhi] || null;
}

// 旬空辅助函数：根据日柱干支返回空亡二支
function getXunKong(dayGan: string, dayZhi: string): string[] {
  // 六十甲子旬空表
  const xunKongMap: Record<string, string[]> = {
    // 甲子旬（甲子到癸酉）空戌亥
    '甲子': ['戌', '亥'], '乙丑': ['戌', '亥'], '丙寅': ['戌', '亥'], '丁卯': ['戌', '亥'], '戊辰': ['戌', '亥'],
    '己巳': ['戌', '亥'], '庚午': ['戌', '亥'], '辛未': ['戌', '亥'], '壬申': ['戌', '亥'], '癸酉': ['戌', '亥'],
    // 甲戌旬（甲戌到癸未）空申酉
    '甲戌': ['申', '酉'], '乙亥': ['申', '酉'], '丙子': ['申', '酉'], '丁丑': ['申', '酉'], '戊寅': ['申', '酉'],
    '己卯': ['申', '酉'], '庚辰': ['申', '酉'], '辛巳': ['申', '酉'], '壬午': ['申', '酉'], '癸未': ['申', '酉'],
    // 甲申旬（甲申到癸巳）空午未
    '甲申': ['午', '未'], '乙酉': ['午', '未'], '丙戌': ['午', '未'], '丁亥': ['午', '未'], '戊子': ['午', '未'],
    '己丑': ['午', '未'], '庚寅': ['午', '未'], '辛卯': ['午', '未'], '壬辰': ['午', '未'], '癸巳': ['午', '未'],
    // 甲午旬（甲午到癸卯）空辰巳
    '甲午': ['辰', '巳'], '乙未': ['辰', '巳'], '丙申': ['辰', '巳'], '丁酉': ['辰', '巳'], '戊戌': ['辰', '巳'],
    '己亥': ['辰', '巳'], '庚子': ['辰', '巳'], '辛丑': ['辰', '巳'], '壬寅': ['辰', '巳'], '癸卯': ['辰', '巳'],
    // 甲辰旬（甲辰到癸丑）空寅卯
    '甲辰': ['寅', '卯'], '乙巳': ['寅', '卯'], '丙午': ['寅', '卯'], '丁未': ['寅', '卯'], '戊申': ['寅', '卯'],
    '己酉': ['寅', '卯'], '庚戌': ['寅', '卯'], '辛亥': ['寅', '卯'], '壬子': ['寅', '卯'], '癸丑': ['寅', '卯'],
    // 甲寅旬（甲寅到癸亥）空子丑
    '甲寅': ['子', '丑'], '乙卯': ['子', '丑'], '丙辰': ['子', '丑'], '丁巳': ['子', '丑'], '戊午': ['子', '丑'],
    '己未': ['子', '丑'], '庚申': ['子', '丑'], '辛酉': ['子', '丑'], '壬戌': ['子', '丑'], '癸亥': ['子', '丑']
  };
  const key = `${dayGan}${dayZhi}`;
  return xunKongMap[key] || [];
}

// check 返回类型：单个对象、数组（支持多柱命中）或 null
type CheckResult = {position: string; description: string; warning?: string} | Array<{position: string; description: string; warning?: string}> | null;

// 基础神煞表（完整版 29 种）
const SHEN_SHA_TABLE: Record<string, Array<{name: string; check: (bazi: any) => CheckResult}>> = {
  // ============ 贵人星系 ============
  '天乙贵人': [{
    name: '天乙贵人',
    check: (b) => {
      const guirenMap: Record<string, string[]> = {
        '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'],
        '丁': ['亥', '酉'], '戊': ['丑', '未'], '己': ['子', '申'],
        '庚': ['丑', '未'], '辛': ['子', '申'], '壬': ['卯', '巳'],
        '癸': ['卯', '巳']
      };
      const targets = guirenMap[b.day?.gan] || [];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi && targets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '有时会遇到帮你的人，挺自然的', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '太极贵人': [{
    name: '太极贵人',
    check: (b) => {
      const rules: Array<{gan: string[], zhi: string}> = [
        { gan: ['甲', '乙'], zhi: '子' },
        { gan: ['甲', '乙'], zhi: '午' },
        { gan: ['丙', '丁'], zhi: '酉' },
        { gan: ['丙', '丁'], zhi: '卯' },
        { gan: ['戊', '己'], zhi: '辰' },
        { gan: ['戊', '己'], zhi: '戌' },
        { gan: ['戊', '己'], zhi: '丑' },
        { gan: ['戊', '己'], zhi: '未' },
        { gan: ['庚', '辛'], zhi: '寅' },
        { gan: ['庚', '辛'], zhi: '亥' },
        { gan: ['壬', '癸'], zhi: '巳' },
        { gan: ['壬', '癸'], zhi: '申' },
      ];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const rule of rules) {
        if (!rule.gan.includes(b.day?.gan)) continue;
        for (const p of positions) {
          if (b[p]?.zhi === rule.zhi) {
            results.push({ position: posLabel(p), description: '对抽象的事有兴趣，喜欢琢磨道理', warning: '' });
          }
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '福星贵人': [{
    name: '福星贵人',
    check: (b) => {
      const rules: Array<{gan: string, zhi: string}> = [
        { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '子' },
        { gan: '丙', zhi: '寅' }, { gan: '丙', zhi: '子' },
        { gan: '戊', zhi: '申' }, { gan: '戊', zhi: '子' },
        { gan: '己', zhi: '未' }, { gan: '己', zhi: '亥' },
        { gan: '丁', zhi: '亥' },
        { gan: '乙', zhi: '丑' }, { gan: '乙', zhi: '卯' },
        { gan: '庚', zhi: '午' }, { gan: '庚', zhi: '寅' },
        { gan: '辛', zhi: '巳' },
        { gan: '壬', zhi: '辰' }, { gan: '壬', zhi: '寅' },
        { gan: '癸', zhi: '卯' }, { gan: '癸', zhi: '寅' },
      ];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const rule of rules) {
        if (b.day?.gan !== rule.gan) continue;
        for (const p of positions) {
          if (b[p]?.zhi === rule.zhi) {
            results.push({ position: posLabel(p), description: '底子不差，平时有人照应', warning: '' });
          }
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '文昌': [{
    name: '文昌',
    check: (b) => {
      const wenchangMap: Record<string, string> = {
        '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
        '戊': '申', '己': '酉', '庚': '子', '辛': '丑',
        '壬': '寅', '癸': '卯'
      };
      const target = wenchangMap[b.day?.gan];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '你有一条偏内走的思路——不追热闹，但自己想得深、说得清', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '天德贵人': [{
    name: '天德贵人',
    check: (b) => {
      const monthZhi = b.month?.zhi;
      if (!monthZhi) return null;
      const map: Record<string, string> = {
        '寅': '丁', '卯': '申', '辰': '壬',
        '巳': '辛', '午': '亥', '未': '甲',
        '申': '癸', '酉': '寅', '戌': '丙',
        '亥': '乙', '子': '巳', '丑': '庚',
      };
      const target = map[monthZhi];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.gan === target) {
          results.push({ position: posLabel(p), description: '关键时刻容易有转机，不顺的时候也有人拉一把', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '月德贵人': [{
    name: '月德贵人',
    check: (b) => {
      const monthZhi = b.month?.zhi;
      if (!monthZhi) return null;
      const map: Record<string, string> = {
        '寅': '丙', '午': '丙', '戌': '丙',
        '亥': '甲', '卯': '甲', '未': '甲',
        '申': '壬', '子': '壬', '辰': '壬',
        '巳': '庚', '酉': '庚', '丑': '庚',
      };
      const target = map[monthZhi];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.gan === target) {
          results.push({ position: posLabel(p), description: '平时运气不算差，遇事有人帮衬', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],

  // ============ 桃花系 ============
  '桃花': [{
    name: '桃花',
    check: (b) => {
      // B类：年支/日支属某三合局→桃花在该三合局的桃花位
      // 亥卯未→子，寅午戌→卯，申子辰→酉，巳酉丑→午
      const yearZhi = b.year?.zhi;
      const dayZhi = b.day?.zhi;
      const targets: string[] = [];
      
      // 年支属某三合局→桃花在该三合局的桃花位
      if (yearZhi) {
        if (['亥', '卯', '未'].includes(yearZhi)) targets.push('子');
        if (['寅', '午', '戌'].includes(yearZhi)) targets.push('卯');
        if (['申', '子', '辰'].includes(yearZhi)) targets.push('酉');
        if (['巳', '酉', '丑'].includes(yearZhi)) targets.push('午');
      }
      
      // 日支同理
        const results: Array<{position: string; description: string; warning?: string}> = [];
      if (dayZhi) {
        if (['亥', '卯', '未'].includes(dayZhi)) targets.push('子');
        if (['寅', '午', '戌'].includes(dayZhi)) targets.push('卯');
        if (['申', '子', '辰'].includes(dayZhi)) targets.push('酉');
        if (['巳', '酉', '丑'].includes(dayZhi)) targets.push('午');
      }
      
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) return null;
      
      // 检查四柱地支是否有桃花位置
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi && uniqueTargets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '人缘不差——但有些缘分靠近时，先看清再伸手', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '红鸾': [{
    name: '红鸾',
    check: (b) => {
      const map: Record<string, string> = {
        '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
        '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
        '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
      };
      const dayZhi = b.day?.zhi;
      if (!dayZhi || !map[dayZhi]) return null;
      const target = map[dayZhi];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '感情上容易遇到合拍的人，相处起来不累', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '天喜': [{
    name: '天喜',
    check: (b) => {
      const map: Record<string, string> = {
        '子': '酉', '丑': '申', '寅': '未', '卯': '午',
        '辰': '巳', '巳': '辰', '午': '卯', '未': '寅',
        '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
      };
      const dayZhi = b.day?.zhi;
      if (!dayZhi || !map[dayZhi]) return null;
      const target = map[dayZhi];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '喜庆的事容易赶上，比如聚会、婚礼、好消息', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '咸池': [{
    name: '咸池',
    check: (b) => {
      // D类变体项：按现有实现（月支查）
      const map: Record<string, string> = { '寅': '卯', '午': '酉', '戌': '卯', '巳': '申', '酉': '寅', '丑': '申', '申': '卯', '子': '酉', '辰': '卯', '亥': '寅' };
      const monthZhi = b.month?.zhi;
      if (!monthZhi || !map[monthZhi]) return null;
      const target = map[monthZhi];
        const results: Array<{position: string; description: string; warning?: string}> = [];
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '对人有吸引力，但也容易陷进去，要留神', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],

  // ============ 动态星 ============
  '驿马': [{
    name: '驿马',
    check: (b) => {
      // 亥卯未→巳，寅午戌→申，申子辰→寅，巳酉丑→亥
      const yearZhi = b.year?.zhi;
      const dayZhi = b.day?.zhi;
      const targets: string[] = [];
      
      if (yearZhi) {
        if (['亥', '卯', '未'].includes(yearZhi)) targets.push('巳');
        if (['寅', '午', '戌'].includes(yearZhi)) targets.push('申');
        if (['申', '子', '辰'].includes(yearZhi)) targets.push('寅');
        if (['巳', '酉', '丑'].includes(yearZhi)) targets.push('亥');
      }
      
      if (dayZhi) {
        if (['亥', '卯', '未'].includes(dayZhi)) targets.push('巳');
        if (['寅', '午', '戌'].includes(dayZhi)) targets.push('申');
        if (['申', '子', '辰'].includes(dayZhi)) targets.push('寅');
        if (['巳', '酉', '丑'].includes(dayZhi)) targets.push('亥');
      }
      
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) return null;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi && uniqueTargets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '待不住，总想动', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '将星': [{
    name: '将星',
    check: (b) => {
      // 亥卯未→卯，寅午戌→午，申子辰→子，巳酉丑→酉
      const yearZhi = b.year?.zhi;
      const dayZhi = b.day?.zhi;
      const targets: string[] = [];
      
      if (yearZhi) {
        if (['亥', '卯', '未'].includes(yearZhi)) targets.push('卯');
        if (['寅', '午', '戌'].includes(yearZhi)) targets.push('午');
        if (['申', '子', '辰'].includes(yearZhi)) targets.push('子');
        if (['巳', '酉', '丑'].includes(yearZhi)) targets.push('酉');
      }
      
      if (dayZhi) {
        if (['亥', '卯', '未'].includes(dayZhi)) targets.push('卯');
        if (['寅', '午', '戌'].includes(dayZhi)) targets.push('午');
        if (['申', '子', '辰'].includes(dayZhi)) targets.push('子');
        if (['巳', '酉', '丑'].includes(dayZhi)) targets.push('酉');
      }
      
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) return null;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi && uniqueTargets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '做事有章法，能扛事，别人容易信你', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '禄神': [{
    name: '禄神',
    check: (b) => {
      const map: Record<string, string> = {
        '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
        '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
        '壬': '亥', '癸': '子'
      };
      const target = map[b.day?.gan];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '有稳定的收入来源，不至于太慌', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],

  // ============ 性格星 ============
  '华盖': [{
    name: '华盖',
    check: (b) => {
      // B类：年支/日支属某三合局→华盖在该三合局的墓支（重合）
      // 亥卯未→未，寅午戌→戌，申子辰→辰，巳酉丑→丑
      const yearZhi = b.year?.zhi;
      const dayZhi = b.day?.zhi;
      const targets: string[] = [];
      
      // 年支/日支属亥卯未局→华盖在未
      if (yearZhi && ['亥', '卯', '未'].includes(yearZhi)) targets.push('未');
      if (dayZhi && ['亥', '卯', '未'].includes(dayZhi)) targets.push('未');
      // 年支/日支属寅午戌局→华盖在戌
      if (yearZhi && ['寅', '午', '戌'].includes(yearZhi)) targets.push('戌');
      if (dayZhi && ['寅', '午', '戌'].includes(dayZhi)) targets.push('戌');
      // 年支/日支属申子辰局→华盖在辰
      if (yearZhi && ['申', '子', '辰'].includes(yearZhi)) targets.push('辰');
      if (dayZhi && ['申', '子', '辰'].includes(dayZhi)) targets.push('辰');
        const results: Array<{position: string; description: string; warning?: string}> = [];
      // 年支/日支属巳酉丑局→华盖在丑
      if (yearZhi && ['巳', '酉', '丑'].includes(yearZhi)) targets.push('丑');
      if (dayZhi && ['巳', '酉', '丑'].includes(dayZhi)) targets.push('丑');
      
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) return null;
      
      // 检查四柱地支是否有华盖位置
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi && uniqueTargets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '喜欢独处，人多的时候反而有点收', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '魁罡': [{
    name: '魁罡',
    check: (b) => {
      const dayCombo = `${b.day?.gan}${b.day?.zhi}`;
      const kuiGang = ['戊戌', '庚辰', '庚戌', '壬辰'];
      if (kuiGang.includes(dayCombo)) {
        return { position: '日柱', description: '性子直，说话不绕，做事有股狠劲', warning: '' };
      }
      return null;
    }
  }],
  '孤鸾煞': [{
    name: '孤鸾煞',
    check: (b) => {
      const dayCombo = `${b.day?.gan}${b.day?.zhi}`;
      const guLuan = ['乙巳', '丁巳', '辛亥', '戊申'];
      if (guLuan.includes(dayCombo)) {
        return { position: '日柱', description: '感情上容易挑剔，合拍的人不太好找', warning: '⚠️' };
      }
      return null;
    }
  }],
  '金舆': [{
    name: '金舆',
    check: (b) => {
      const map: Record<string, string> = {
        '甲': '辰', '乙': '巳', '丙': '未', '丁': '申',
        '戊': '未', '己': '申', '庚': '戌', '辛': '亥',
        '壬': '丑', '癸': '寅'
      };
      const target = map[b.day?.gan];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '出行运气不差，坐车坐船少折腾', warning: '' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '八专': [{
    name: '八专',
    check: (b) => {
      const dayCombo = `${b.day?.gan}${b.day?.zhi}`;
      const baZhuan = ['甲寅', '乙卯', '丁未', '戊戌', '己未', '庚申', '辛酉', '癸丑'];
      if (baZhuan.includes(dayCombo)) {
        return { position: '日柱', description: '精力旺，做事有韧劲，但有时候有点一根筋', warning: '' };
      }
      return null;
    }
  }],

  // ============ 凶煞 ============
  '空亡': [{
    name: '空亡',
    check: (b) => {
      // C类：按日柱所在六十甲子旬定空亡二支
      const dayGan = b.day?.gan;
      const dayZhi = b.day?.zhi;
      if (!dayGan || !dayZhi) return null;
      const kongWangZhi = getXunKong(dayGan, dayZhi);
      if (kongWangZhi.length === 0) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
      const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi && kongWangZhi.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '有些事看着近，实际上落不到实处，别太较真', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '羊刃': [{
    name: '羊刃',
    check: (b) => {
      // A类：按日干查（仅阳干有羊刃）
      const map: Record<string, string> = {
        '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子'
      };
      const target = map[b.day?.gan];
      if (!target) return null;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '脾气上来的时候有点猛，说完容易后悔', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '十恶大败': [{
    name: '十恶大败',
    check: (b) => {
      const dayCombo = `${b.day?.gan}${b.day?.zhi}`;
      const shiE = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
      if (shiE.includes(dayCombo)) {
        return { position: '日柱', description: '财运上容易有漏洞，钱到手就走，留不住', warning: '⚠️' };
      }
      return null;
    }
  }],
  '亡神': [{
    name: '亡神',
    check: (b) => {
      // D类变体项：按现有实现（月支三合局查）
      const map: Record<string, string> = { '寅': '巳', '午': '巳', '戌': '巳', '亥': '寅', '卯': '寅', '未': '寅', '申': '亥', '子': '亥', '辰': '亥', '巳': '申', '酉': '申', '丑': '申' };
      const monthZhi = b.month?.zhi;
      if (!monthZhi || !map[monthZhi]) return null;
      const target = map[monthZhi];
        const results: Array<{position: string; description: string; warning?: string}> = [];
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '心思深，有些事不想让人看透', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '劫煞': [{
    name: '劫煞',
    check: (b) => {
      // 亥卯未→申，寅午戌→亥，申子辰→巳，巳酉丑→寅
      const yearZhi = b.year?.zhi;
      const dayZhi = b.day?.zhi;
      const targets: string[] = [];
      
      if (yearZhi) {
        if (['亥', '卯', '未'].includes(yearZhi)) targets.push('申');
        if (['寅', '午', '戌'].includes(yearZhi)) targets.push('亥');
        if (['申', '子', '辰'].includes(yearZhi)) targets.push('巳');
        if (['巳', '酉', '丑'].includes(yearZhi)) targets.push('寅');
      }
      
      if (dayZhi) {
        if (['亥', '卯', '未'].includes(dayZhi)) targets.push('申');
        if (['寅', '午', '戌'].includes(dayZhi)) targets.push('亥');
        if (['申', '子', '辰'].includes(dayZhi)) targets.push('巳');
        if (['巳', '酉', '丑'].includes(dayZhi)) targets.push('寅');
      }
      
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 0) return null;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      
      const positions = ['year', 'month', 'day', 'hour'] as const;
      for (const p of positions) {
        if (b[p]?.zhi && uniqueTargets.includes(b[p].zhi)) {
          results.push({ position: posLabel(p), description: '做事容易起急，有时候会被人截胡', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '吊客': [{
    name: '吊客',
    check: (b) => {
      const map: Record<string, string> = { '子': '戌', '丑': '亥', '寅': '子', '卯': '丑', '辰': '寅', '巳': '卯', '午': '辰', '未': '巳', '申': '午', '戌': '未', '亥': '申', '酉': '酉' };
      const yearZhi = b.year?.zhi;
      if (!yearZhi || !map[yearZhi]) return null;
      const target = map[yearZhi];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '那段时间心情容易低落，少去丧气的地方', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '病符': [{
    name: '病符',
    check: (b) => {
      const map: Record<string, string> = { '子': '卯', '丑': '辰', '寅': '巳', '卯': '午', '辰': '未', '巳': '申', '午': '酉', '未': '戌', '申': '亥', '酉': '子', '戌': '丑', '亥': '寅' };
      const yearZhi = b.year?.zhi;
      if (!yearZhi || !map[yearZhi]) return null;
      const target = map[yearZhi];
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ position: posLabel(p), description: '那阵子身体容易出小毛病，多休息，别硬撑', warning: '⚠️' });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
  '四废': [{
    name: '四废',
    check: (b) => {
      const dayCombo = `${b.day?.gan}${b.day?.zhi}`;
      const seasonMap: Record<string, string> = { '寅': '春', '卯': '春', '辰': '春', '巳': '夏', '午': '夏', '未': '夏', '申': '秋', '酉': '秋', '戌': '秋', '亥': '冬', '子': '冬', '丑': '冬' };
      const monthZhi = b.month?.zhi;
      const season = seasonMap[monthZhi] || '';
      const siFei: Record<string, string[]> = {
        '春': ['庚申', '辛酉'],
        '夏': ['壬子', '癸亥'],
        '秋': ['甲寅', '乙卯'],
        '冬': ['丙午', '丁巳'],
      };
      if (siFei[season]?.includes(dayCombo)) {
        return { position: '日柱', description: '那段时间做事费力，计划容易卡住，缓一缓再说', warning: '⚠️' };
      }
      return null;
    }
  }],

  // ============ 其他 ============
  '童子': [{
    name: '童子',
    check: (b) => {
      const dayZhi = b.day?.zhi;
      const seasonMap: Record<string, string> = { '寅': '春', '卯': '春', '辰': '春', '巳': '夏', '午': '夏', '未': '夏', '申': '秋', '酉': '秋', '戌': '秋', '亥': '冬', '子': '冬', '丑': '冬' };
      const monthSeason = seasonMap[b.month?.zhi] || '';
      if (!dayZhi) return null;
      let isTongZi = false;
      if ((monthSeason === '春' || monthSeason === '秋') && (dayZhi === '寅' || dayZhi === '子')) isTongZi = true;
      if ((monthSeason === '夏' || monthSeason === '冬') && (dayZhi === '卯' || dayZhi === '未' || dayZhi === '辰')) isTongZi = true;
      if (isTongZi) {
        return { position: '日柱', description: '心思细，感受力强，有时候会比别人多想一层', warning: '' };
      }
      return null;
    }
  }],

  // ============ 新增神煞 ============
  '德秀贵人': [{
    name: '德秀贵人',
    check: (b) => {
      const dayGan = b.day?.gan;
      if (!dayGan) return null;
      
      const deMap: Record<string, string[]> = {
        '甲': ['丑'], '乙': ['子'], '丙': ['辰'], '丁': ['未'],
        '戊': ['丑'], '己': ['子'], '庚': ['申'], '辛': ['酉'],
        '壬': ['亥'], '癸': ['申']
      };
      const xiuMap: Record<string, string[]> = {
        '甲': ['子'], '乙': ['丑'], '丙': ['寅'], '丁': ['卯'],
        '戊': ['丑'], '己': ['子'], '庚': ['午'], '辛': ['巳'],
        '壬': ['辰'], '癸': ['未']
      };
      
      const deTargets = deMap[dayGan] || [];
      const xiuTargets = xiuMap[dayGan] || [];
      
      const results: Array<{position: string; description: string; warning?: string}> = [];
      const positions = ['year', 'month', 'day', 'hour'] as const;
      
      for (const p of positions) {
        if (b[p]?.zhi && (deTargets.includes(b[p].zhi) || xiuTargets.includes(b[p].zhi))) {
          results.push({ 
            position: posLabel(p), 
            description: '你自带一种被偏爱的底色——不是运气好，是你让人想对你好。', 
            warning: '' 
          });
        }
      }
      
      return results.length > 0 ? results : null;
    }
  }],
  '血刃': [{
    name: '血刃',
    check: (b) => {
      const xueRenMap: Record<string, string> = {
        '甲': '卯', '乙': '辰', '丙': '午', '丁': '未',
        '戊': '午', '己': '未', '庚': '酉', '辛': '戌',
        '壬': '子', '癸': '丑'
      };
      const target = xueRenMap[b.day?.gan];
      if (!target) return null;
      const positions = ['year', 'month', 'day', 'hour'] as const;
        const results: Array<{position: string; description: string; warning?: string}> = [];
      for (const p of positions) {
        if (b[p]?.zhi === target) {
          results.push({ 
                        position: posLabel(p), 
                        description: '你骨子里有股不服输的劲——关键时刻能爆发出超乎寻常的能量。', 
                        warning: '⚠️' 
                      });
        }
      }
      return results.length > 0 ? results : null;
    }
  }],
};

// 调候简表（10日主×12月令核心需求）
function getTiaoHou(dayGan: string, monthZhi: string): { coreNeed: string[]; reason: string; avoid: string[] } {
  // 简化版：只取月令地支判断季节
  const seasonMap: Record<string, string> = {
    '寅': '春', '卯': '春', '辰': '春',
    '巳': '夏', '午': '夏', '未': '夏',
    '申': '秋', '酉': '秋', '戌': '秋',
    '亥': '冬', '子': '冬', '丑': '冬',
  };
  const season = seasonMap[monthZhi] || '';
  
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
  };
  
  const rule = tiaoHouRules[dayGan]?.[season];
  return rule || { coreNeed: [], reason: '', avoid: [] };
}

// 计算神煞
// check 可以返回单个对象或数组（数组支持多柱命中，如德秀贵人）
function calcShenSha(bazi: any): Array<{name: string; position: string | string[]; description: string; warning?: string}> {
  const result: Array<{name: string; position: string | string[]; description: string; warning?: string}> = [];
  for (const [, checks] of Object.entries(SHEN_SHA_TABLE)) {
    for (const c of checks) {
      const r = c.check(bazi);
      if (!r) continue;
      if (!r) continue;
      if (Array.isArray(r)) {
        for (const item of r) {
          result.push({ name: c.name, ...item });
        }
      } else {
        result.push({ name: c.name, ...r });
      }
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar } = body;

    // 计算八字
    const hour = birth_hour ? parseInt(birth_hour) : null;
    const minute = birth_minute ? parseInt(birth_minute) : null;
    const bazi = calculateBazi(
      parseInt(birth_year),
      parseInt(birth_month),
      parseInt(birth_day),
      hour,
      minute,
      is_lunar || false
    );

    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();

    // 从数据库读取用户档案
    let profile = null;
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = data;
    }

    // 生成人格卡片数据（使用命理规则层）
    const wuxing = getDayMasterWuxing(bazi);
    const strength = judgeStrength(bazi);
    const yongShen = findYongShen(bazi);
    const wxStrength = calculateWuxingStrength(bazi);
    
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
    };

    return NextResponse.json({
      card,
      bazi: {
        year: { gan: bazi.year.gan, zhi: bazi.year.zhi, wuxing_gan: bazi.year.wuxing_gan },
        month: { gan: bazi.month.gan, zhi: bazi.month.zhi, wuxing_gan: bazi.month.wuxing_gan },
        day: { gan: bazi.day.gan, zhi: bazi.day.zhi, wuxing_gan: bazi.day.wuxing_gan },
        hour: bazi.hour ? { gan: bazi.hour.gan, zhi: bazi.hour.zhi, wuxing_gan: bazi.hour.wuxing_gan } : undefined
      }
    });
  } catch (error) {
    console.error('生成卡片失败:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
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
  };
  return map[wuxing] || '关系模式独特';
}

function getSocialTendency(wuxing: string): string {
  const map: Record<string, string> = {
    '木': '社交中偏内向，喜欢深度交流胜过热闹',
    '火': '社交活跃，善于破冰，容易成为焦点',
    '土': '社交稳重，圈子稳定，不喜频繁变动',
    '金': '社交有选择性，重质不重量',
    '水': '社交灵活，能适应不同场合'
  };
  return map[wuxing] || '社交方式独特';
}

function getMatchType(wuxing: string): string {
  const map: Record<string, string> = {
    '木': '水（智慧）或火（热情）',
    '火': '木（稳重）或土（包容）',
    '土': '火（活力）或金（果断）',
    '金': '土（稳定）或水（灵活）',
    '水': '金（坚定）或木（正直）'
  };
  return map[wuxing] || '相似五行';
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
