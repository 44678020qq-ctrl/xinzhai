"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { PillarDetail, RichBazi } from "@/lib/bazi-rich";
import { WX_COLOR, getPillarShenSha, TEN_GOD_LABEL } from "@/lib/bazi-rich";
import { useRouter } from "next/navigation";
import { InkMark } from "@/components/InkMark";
import WuxingRadarChart from "@/components/WuxingRadarChart";
import { calcShenSha as calcShenShaLocal } from "@/lib/shensha";

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];
const MAJOR_AUSPICIOUS = ['天乙贵人', '太极贵人', '福星贵人', '文昌', '天德贵人', '月德贵人', '驿马', '将星', '禄神', '华盖', '金舆', '红鸾', '天喜'];

// ============ 神煞辅助 ============
const SHENSHA_CATEGORY: Record<string, string> = {
  '天乙贵人': 'guiRen', '太极贵人': 'guiRen', '福星贵人': 'guiRen',
  '德秀贵人': 'guiRen', '天德贵人': 'guiRen', '月德贵人': 'guiRen',
  '驿马': 'dongBian', '将星': 'dongBian',
  '桃花': 'qingYuan', '红鸾': 'qingYuan', '天喜': 'qingYuan', '咸池': 'qingYuan',
  '华盖': 'neiXiang', '孤鸾煞': 'neiXiang',
  '羊刃': 'fengMang', '血刃': 'fengMang', '空亡': 'fengMang',
  '劫煞': 'fengMang', '童子': 'fengMang', '吊客': 'fengMang',
  '文昌': 'qiTa', '禄神': 'qiTa', '金舆': 'qiTa', '魁罡': 'qiTa',
  '八专': 'qiTa', '亡神': 'qiTa', '病符': 'qiTa', '四废': 'qiTa', '十恶大败': 'qiTa',
};
const CATEGORY_GRADIENT: Record<string, string> = {
  'guiRen': 'bg-gradient-to-br from-[#E8DFD0] to-[#D4C4A8]',
  'dongBian': 'bg-gradient-to-br from-[#E0E8E4] to-[#C8D4CC]',
  'qingYuan': 'bg-gradient-to-br from-[#F5E0DC] to-[#E8C4BC]',
  'neiXiang': 'bg-gradient-to-br from-[#E0E8F0] to-[#C4D4E4]',
  'fengMang': 'bg-gradient-to-br from-[#F0E8E0] to-[#E0D4CC]',
  'qiTa': 'bg-gradient-to-br from-[#F0F0EC] to-[#E0E0D8]',
};
// ============ 印章单字图标 ============
// 中心放该神煞的单字印，外圈颜色由稀有度决定（渲染层处理）
// 风格：方形印章边框 + 中心单字，中式极简
const SHENSHA_SEAL_CHAR: Record<string, string> = {
  '天乙贵人': '贵', '太极贵人': '极', '福星贵人': '福', '德秀贵人': '德',
  '天德贵人': '天', '月德贵人': '月', '文昌': '文', '金舆': '舆',
  '将星': '将', '学堂词馆': '学', '天厨': '厨',
  '禄神': '禄', '红鸾': '鸾', '天喜': '喜', '华盖': '盖',
  '驿马': '驿', '桃花': '桃', '八专': '八', '魁罡': '罡',
  '孤鸾煞': '孤', '咸池': '池', '空亡': '空', '羊刃': '刃',
  '血刃': '血', '十恶大败': '败', '亡神': '亡', '劫煞': '劫',
  '吊客': '吊', '病符': '病', '四废': '废', '童子': '童',
};

// 生成印章SVG：方框 + 单字
function makeSealSvg(char: string): string {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="76" height="76" rx="4" fill="none" stroke="#333" stroke-width="3" opacity="0.7"/><text x="50" y="68" text-anchor="middle" font-size="48" fill="#333" font-family="serif" font-weight="bold" opacity="0.85">${char}</text></svg>`;
}

const SHENSHA_SVG: Record<string, string> = {
  '天乙贵人': makeSealSvg('贵'),
  '太极贵人': makeSealSvg('极'),
  '福星贵人': makeSealSvg('福'),
  '德秀贵人': makeSealSvg('德'),
  '天德贵人': makeSealSvg('天'),
  '月德贵人': makeSealSvg('月'),
  '驿马': makeSealSvg('驿'),
  '将星': makeSealSvg('将'),
  '桃花': makeSealSvg('桃'),
  '红鸾': makeSealSvg('鸾'),
  '天喜': makeSealSvg('喜'),
  '咸池': makeSealSvg('池'),
  '华盖': makeSealSvg('盖'),
  '孤鸾煞': makeSealSvg('孤'),
  '金舆': makeSealSvg('舆'),
  '八专': makeSealSvg('八'),
  '魁罡': makeSealSvg('罡'),
  '空亡': makeSealSvg('空'),
  '羊刃': makeSealSvg('刃'),
  '血刃': makeSealSvg('血'),
  '十恶大败': makeSealSvg('败'),
  '亡神': makeSealSvg('亡'),
  '劫煞': makeSealSvg('劫'),
  '吊客': makeSealSvg('吊'),
  '病符': makeSealSvg('病'),
  '四废': makeSealSvg('废'),
  '童子': makeSealSvg('童'),
  '文昌': makeSealSvg('文'),
  '禄神': makeSealSvg('禄'),
};

const ALL_SHENSHA_NAMES = [
  '天乙贵人', '太极贵人', '福星贵人', '文昌', '天德贵人', '月德贵人',
  '桃花', '红鸾', '天喜', '咸池',
  '驿马', '将星', '禄神',
  '华盖', '魁罡', '孤鸾煞', '金舆', '八专',
  '空亡', '羊刃', '十恶大败', '亡神', '劫煞', '吊客', '病符', '四废',
  '童子', '德秀贵人', '血刃',
];

// ============ 稀有度系统 ============
type RarityTier = 'legendary4' | 'legendary3' | 'epic' | 'rare' | 'common' | 'normal' | 'tidal';

interface RarityConfig {
  label: string;
  labelColor: string;
  borderColor: string;
  glowColor: string;
  bgClass: string;
  burstColor: string;
  tier: number; // 1-6, 用于动画强度
}

const RARITY: Record<RarityTier, RarityConfig> = {
  legendary4: {
    label: '金色传说', labelColor: '#92400E',
    borderColor: '#F59E0B', glowColor: '#F59E0B',
    bgClass: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50',
    burstColor: '#FFD700', tier: 6,
  },
  legendary3: {
    label: '传说', labelColor: '#C2410C',
    borderColor: '#F97316', glowColor: '#F97316',
    bgClass: 'bg-gradient-to-br from-orange-100 to-amber-50',
    burstColor: '#FF8C00', tier: 5,
  },
  epic: {
    label: '史诗', labelColor: '#7C3AED',
    borderColor: '#A78BFA', glowColor: '#8B5CF6',
    bgClass: 'bg-gradient-to-br from-violet-100 to-purple-50',
    burstColor: '#A855F7', tier: 4,
  },
  rare: {
    label: '稀有', labelColor: '#1D4ED8',
    borderColor: '#60A5FA', glowColor: '#3B82F6',
    bgClass: 'bg-gradient-to-br from-blue-100 to-sky-50',
    burstColor: '#3B82F6', tier: 3,
  },
  common: {
    label: '普通', labelColor: '#6B7280',
    borderColor: '#9CA3AF', glowColor: '#9CA3AF',
    bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50',
    burstColor: '#9CA3AF', tier: 2,
  },
  normal: {
    label: '普通', labelColor: '#6B7280',
    borderColor: '#9CA3AF', glowColor: '#9CA3AF',
    bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50',
    burstColor: '#9CA3AF', tier: 2,
  },
  tidal: {
    label: '潮汐', labelColor: '#0E7490',
    borderColor: '#22D3EE', glowColor: '#06B6D4',
    bgClass: 'bg-gradient-to-br from-cyan-100 to-slate-50',
    burstColor: '#22D3EE', tier: 1,
  },
};

// 神煞固定稀有度映射（v0.1 指挥草案）
// 稀有度 = 神煞自带属性，与出现柱数无关；柱数只做 ·N柱 角标
const SHENSHA_RARITY: Record<string, RarityTier> = {
  // golden — 最尊贵·罕见吉神
  '天乙贵人': 'legendary4',
  '天德贵人': 'legendary4',
  '月德贵人': 'legendary4',
  '三奇贵人': 'legendary4',
  // legend
  '德秀贵人': 'legendary3',
  '太极贵人': 'legendary3',
  '福星贵人': 'legendary3',
  '天德合': 'legendary3',
  '月德合': 'legendary3',
  '国印贵人': 'legendary3',
  '国印': 'legendary3',
  // epic
  '文昌贵人': 'epic',
  '天厨贵人': 'epic',
  '金舆': 'epic',
  '将星': 'epic',
  '学堂': 'epic',
  '词馆': 'epic',
  '天医': 'epic',
  '六秀日': 'epic',
  '十灵日': 'epic',
  '拱禄': 'epic',
  // rare
  '禄神': 'rare',
  '红鸾': 'rare',
  '天喜': 'rare',
  '红艳煞': 'rare',
  '华盖': 'rare',
  // normal
  '驿马': 'normal',
  '桃花': 'normal',
  '咸池': 'normal',
  '八专': 'normal',
  // tide — 凶/中性
  '空亡': 'tidal',
  '孤鸾煞': 'tidal',
  '孤辰': 'tidal',
  '寡宿': 'tidal',
  '童子煞': 'tidal',
  '吊客': 'tidal',
  '丧门': 'tidal',
  '披麻': 'tidal',
  '羊刃': 'tidal',
  '血刃': 'tidal',
  '飞刃': 'tidal',
  '劫煞': 'tidal',
  '灾煞': 'tidal',
  '亡神': 'tidal',
  '勾绞煞': 'tidal',
  '阴差阳错': 'tidal',
  '九丑': 'tidal',
  '元辰': 'tidal',
  '天罗地网': 'tidal',
};

function getRarity(
  name: string, _count: number, isWarning: boolean
): RarityTier {
  if (isWarning) return 'tidal';
  return SHENSHA_RARITY[name] || 'normal';
}

// ============ 人话翻译函数 ============
type EnergyTone = 'strong' | 'balanced' | 'soft';

function getEnergyTone(level?: string): EnergyTone {
  if (!level) return 'balanced';
  if (level.includes('旺')) return 'strong';
  if (level.includes('弱')) return 'soft';
  return 'balanced';
}

function getEnergyToneLabel(level?: string): string {
  const tone = getEnergyTone(level);
  if (tone === 'strong') return '偏盛';
  if (tone === 'soft') return '偏柔';
  return '平衡';
}

function getEnergyToneColor(level?: string): string {
  const tone = getEnergyTone(level);
  if (tone === 'strong') return 'var(--warn)';
  if (tone === 'soft') return 'var(--danger)';
  return 'var(--sub)';
}

function getAiBannerText(level?: string): string {
  const tone = getEnergyTone(level);
  if (tone === 'strong') return '你今天适合把节奏放慢一点，先听完，再决定要不要往前推。';
  if (tone === 'soft') return '你今天需要一个稳定的场域，先把自己安顿好，再去回应外界。';
  return '你今天的状态比较平稳，适合把注意力放在真正重要的人和事上。';
}

function getPersonaText(dayType?: string, level?: string): string {
  const wx = dayType?.slice(-1) || '';
  const base: Record<string, string> = {
    木: '有生长感，重视方向和关系里的自然延展。',
    火: '反应快，容易被真诚和热度点亮。',
    土: '稳定、有承接力，做事看重长期和安全感。',
    金: '有标准、有边界，判断里带着清醒和克制。',
    水: '感受细，适应力强，能读到细微的气氛变化。',
  };
  const tone = getEnergyTone(level);
  const suffix = tone === 'strong'
    ? '当下能量外放，适合留一点余地。'
    : tone === 'soft'
      ? '当下更需要被托住，别急着消耗自己。'
      : '当下比较均衡，适合稳稳推进。';
  return `${base[wx] || '有自己的节奏和感受方式。'}${suffix}`;
}

function getNeedText(elements: string[] = []): string {
  const unique = Array.from(new Set(elements)).filter(Boolean);
  if (unique.length === 0) return '靠近让你更安静、更稳定的人和环境。';
  const map: Record<string, string> = {
    木: '能让你伸展开、一起成长的人和环境',
    火: '有热度、有回应、能把气氛点亮的人和环境',
    土: '稳定、可靠、让事情落地的人和环境',
    金: '有边界、有标准、说话清楚的人和环境',
    水: '松弛、流动、允许你慢慢感受的人和环境',
  };
  return `更适合靠近${unique.map((el) => map[el] || el).join('、')}。`;
}

// 旺衰翻人话
function translateStrength(strength: string): string {
  const map: Record<string, string> = {
    '极旺': '状态很满，适合把速度降一点，给判断留出空间',
    '偏旺': '状态偏主动，适合先稳住节奏，再向外推进',
    '中和': '状态比较平稳，适合做长期但不急迫的决定',
    '偏弱': '状态偏敏感，适合减少消耗，先找回稳定感',
    '极弱': '状态需要被托住，适合先休整，再处理外界关系',
    '旺': '状态偏主动，适合先稳住节奏，再向外推进',
    '相': '状态在回升，适合小步推进',
    '休': '状态平缓，适合观察和整理',
    '囚': '状态有点受限，适合先把环境调顺',
    '死': '状态偏低，适合减少消耗',
  };
  return map[strength] || strength;
}

// ============ 分组神煞 ============
// 支持 position 为 string 或 string[]（多柱位命中）
function groupShenSha(shenSha: Array<{name: string; position: string | string[]; description: string; warning?: string}>) {
  const grouped: Record<string, {name: string; positions: string[]; description: string; warning?: string}> = {};
  for (const s of shenSha) {
    if (!grouped[s.name]) {
      grouped[s.name] = { name: s.name, positions: [], description: s.description, warning: s.warning };
    }
    // 统一处理单柱或多柱
    const positions = Array.isArray(s.position) ? s.position : [s.position];
    for (const pos of positions) {
      if (!grouped[s.name].positions.includes(pos)) {
        grouped[s.name].positions.push(pos);
      }
    }
  }
  return Object.values(grouped);
}

// ============ 粒子组件 ============
function ParticleBurst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 16 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
      {particles.map((_, i) => {
        const angle = (i / 16) * 360;
        const distance = 40 + Math.random() * 30;
        const size = 4 + Math.random() * 4;
        const delay = Math.random() * 0.3;
        const key = `p-${i}`;
        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              opacity: 0,
              animation: `burst-${i} 0.6s ease-out ${delay}s forwards`,
              transform: `translate(-50%, -50%)`,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}
      <style>{`
        ${particles.map((_, i) => {
          const angle = (i / 16) * 360;
          return `@keyframes burst-${i} { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(calc(-50% + ${Math.cos(angle * Math.PI / 180) * 60}px), calc(-50% + ${Math.sin(angle * Math.PI / 180) * 60}px)) scale(0.3)} }`;
        }).join('\n')}
      `}</style>
    </div>
  );
}

// ============ 开卡揭示组件 ============
type RevealPhase = 'idle' | 'charging' | 'flipping' | 'revealed';

function CardReveal({
  rarity,
  svgIcon,
  name,
  position,
  description,
  warning,
  onClose,
}: {
  rarity: RarityTier;
  svgIcon: string;
  name: string;
  position: string;
  description: string;
  warning?: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<RevealPhase>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = RARITY[rarity];
  const cardRef = useRef<HTMLDivElement>(null);

  const startReveal = useCallback(() => {
    setPhase('charging');
    const chargeMs = 800 + cfg.tier * 120;
    timerRef.current = setTimeout(() => {
      setPhase('flipping');
      timerRef.current = setTimeout(() => {
        setPhase('revealed');
      }, 350);
    }, chargeMs);
  }, [cfg.tier]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const isWarning = rarity === 'tidal';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }}
      onClick={phase === 'revealed' ? onClose : undefined}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes breathe { 0%,100%{box-shadow:0 0 20px ${cfg.glowColor}44} 50%{box-shadow:0 0 45px ${cfg.glowColor}88} }
        @keyframes chargeShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px) rotate(-1deg)} 40%{transform:translateX(3px) rotate(1deg)} 60%{transform:translateX(-2px) rotate(-0.5deg)} 80%{transform:translateX(2px) rotate(0.5deg)} }
        @keyframes flipCard { 0%{transform:perspective(800px) rotateY(0deg) scale(1)} 50%{transform:perspective(800px) rotateY(90deg) scale(0.9)} 100%{transform:perspective(800px) rotateY(180deg) scale(1)} }
        @keyframes popIn { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes floatUp { 0%{opacity:0;transform:translateY(20px) scale(0.8)} 40%{opacity:1} 100%{opacity:0;transform:translateY(-60px) scale(1.2)} }
      `}</style>

      {/* 粒子迸发 */}
      <ParticleBurst color={cfg.burstColor} active={phase === 'revealed'} />

      {/* 关闭按钮 */}
      {phase === 'revealed' && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 text-white text-sm flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          ✕
        </button>
      )}

      {/* 卡片容器 */}
      <div className="relative flex flex-col items-center gap-4 w-full max-w-xs">

        {/* 阶段指示 */}
        {phase === 'idle' && (
          <div className="text-center flex flex-col items-center gap-4">
            <p className="text-white/60 text-xs tracking-widest">点击卡背开始揭示</p>
            {/* 卡背 */}
            <div
              className="w-52 h-64 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 select-none"
              style={{
                background: `linear-gradient(135deg, #1C1917 0%, #292524 50%, #1C1917 100%)`,
                border: `2px solid ${cfg.borderColor}`,
                boxShadow: `0 0 30px ${cfg.glowColor}33, 0 20px 60px rgba(0,0,0,0.5)`,
                animation: 'breathe 2.4s ease-in-out infinite',
              }}
              onClick={startReveal}
            >
              {/* 斋印 */}
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-2xl text-white/80">斋</span>
              </div>
              {/* 装饰线条 */}
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <p className="text-white/30 text-xs tracking-[3px] font-light">SHEN SHA</p>
            </div>
          </div>
        )}

        {/* 蓄力中 */}
        {phase === 'charging' && (
          <div className="text-center flex flex-col items-center gap-4">
            <p className="text-white/80 text-sm font-medium tracking-wide" style={{ animation: 'chargeShake 0.1s infinite' }}>
              能量汇聚中…
            </p>
            <div
              className="w-52 h-64 rounded-3xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, #1C1917, #292524)`,
                border: `2px solid ${cfg.borderColor}`,
                boxShadow: `0 0 60px ${cfg.glowColor}66, 0 20px 60px rgba(0,0,0,0.5)`,
                animation: `chargeShake 0.08s infinite, breathe 1s ease-in-out infinite`,
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-2xl text-white/80">斋</span>
              </div>
            </div>
          </div>
        )}

        {/* 翻牌 */}
        {phase === 'flipping' && (
          <div
            className="w-52 h-64 rounded-3xl"
            style={{
              animation: 'flipCard 0.35s ease-in forwards',
              transformStyle: 'preserve-3d',
              perspective: '800px',
            }}
          >
            <div className="w-full h-full rounded-3xl flex items-center justify-center"
              style={{ background: '#1C1917', border: `2px solid ${cfg.borderColor}` }} />
          </div>
        )}

        {/* 揭示结果 */}
        {phase === 'revealed' && (
          <div
            className="w-full flex flex-col items-center gap-5"
            style={{ animation: 'popIn 0.45s cubic-bezier(.34,1.56,.64,1) forwards' }}
          >
            {/* 稀有度标签 */}
            <div
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider"
              style={{ background: `${cfg.borderColor}22`, color: cfg.labelColor, border: `1px solid ${cfg.borderColor}44` }}
            >
              {cfg.label}
            </div>

            {/* 神煞徽章 */}
            <div
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 ${cfg.bgClass}`}
              style={{
                border: `3px solid ${cfg.borderColor}`,
                boxShadow: `0 0 40px ${cfg.glowColor}55, 0 0 80px ${cfg.glowColor}22`,
              }}
            >
              <span className="text-5xl w-16 h-16" dangerouslySetInnerHTML={{ __html: svgIcon }} />
              {rarity === 'legendary4' && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                  }}
                />
              )}
            </div>

            {/* 神煞名称 */}
            <div className="text-center flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-white tracking-widest">{name}</h3>
              <p className="text-white/40 text-xs">{position}</p>
            </div>

            {/* 描述 */}
            <div className="w-full bg-white/8 rounded-2xl p-4">
              <p className="text-white/80 text-sm leading-relaxed text-center">{description}</p>
              {warning && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className="text-amber-400 text-xs">⚠️ {warning}</span>
                </div>
              )}
            </div>

            {/* 分享入口 */}
            {MAJOR_AUSPICIOUS.includes(name) && (
              <button
                onClick={(e) => { e.stopPropagation(); window.location.href = `/share?name=${encodeURIComponent(name)}`; }}
                className="px-5 py-2 rounded-xl text-white text-xs font-medium transition-all hover:scale-105"
                style={{ background: `${cfg.borderColor}33`, border: `1px solid ${cfg.borderColor}66` }}
              >
                分享这张神煞 →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 主页面 ============
interface CardData {
  wuxing_personality: string;
  keywords: string[];
  emotion_pattern: string;
  relation_pattern: string;
  social_tendency: string;
  summary: string;
  bazi_display: string;
  strength?: {
    level: string;
    score: number;
    deLing: boolean;
    deDi: boolean;
    deSheng: boolean;
    deZhu: boolean;
  };
  yongShen?: {
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    reason: string;
  };
  wuxingStrength?: Record<string, number>;
  shenSha?: Array<{name: string; position: string | string[]; description: string; warning?: string}>;
  tiaoHou?: { coreNeed: string[]; reason: string; avoid: string[] };
}
interface BaziResult {
  year: { gan: string; zhi: string; wuxing_gan: string };
  month: { gan: string; zhi: string; wuxing_gan: string };
  day: { gan: string; zhi: string; wuxing_gan: string };
  hour?: { gan: string; zhi: string; wuxing_gan: string };
}

export default function CardPage() {
  const router = useRouter();
  const [card, setCard] = useState<CardData | null>(null);
  const [bazi, setBazi] = useState<BaziResult | null>(null);
  const [richBazi, setRichBazi] = useState<RichBazi | null>(null);
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState<string>("");
  const [revealTarget, setRevealTarget] = useState<{name: string; svgIcon: string; rarity: RarityTier; position: string; description: string; warning?: string} | null>(null);
  const [viewMode, setViewMode] = useState<'energy' | 'professional'>('energy');

  useEffect(() => {
    const loadData = async () => {
      let raw: string | null = null;
      try {
        raw = window.sessionStorage?.getItem("xinzhai_birth") || null;
      } catch {
        raw = null;
      }
      let form: {
        birth_year: string;
        birth_month: string;
        birth_day: string;
        birth_hour?: string;
        birth_minute?: string;
        gender?: string;
        is_lunar?: boolean;
      } | null = null;
      if (raw) {
        try { form = JSON.parse(raw); } catch (e) {
          try {
            window.sessionStorage?.removeItem("xinzhai_birth");
            window.sessionStorage?.removeItem("xinzhai_bazi");
          } catch {}
          router.push("/register");
          setLoading(false); return;
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('birth_year') && params.get('birth_month') && params.get('birth_day')) {
          form = {
            birth_year: params.get('birth_year') || '',
            birth_month: params.get('birth_month') || '',
            birth_day: params.get('birth_day') || '',
            birth_hour: params.get('birth_hour') || '',
            birth_minute: params.get('birth_minute') || '',
            gender: params.get('gender') || 'male',
            is_lunar: params.get('is_lunar') === 'true',
          };
        }
      }
      if (form) {
        // 优先使用 TS 引擎：它会返回完整 richBazi，专业盘和能量视图同源。
        try {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 8000);
          const res = await fetch("/api/generate-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
            signal: controller.signal,
          });
          window.clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data.card && data.bazi) {
              setCard(data.card);
              setBazi(data.bazi);
              if (data.richBazi) setRichBazi(data.richBazi);
              setEngine("ts");
              setLoading(false);
              return;
            }
          }
        } catch {}

        // Python 引擎仅作为降级，避免缺字段导致专业盘出现问号。
        try {
          const pyRes = await fetch("/api/rules/analyze", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              birth_year: form.birth_year, birth_month: form.birth_month,
              birth_day: form.birth_day, birth_hour: form.birth_hour,
              birth_minute: form.birth_minute, gender: form.gender,
            }),
          });
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            if (pyData.success && pyData.data) {
              const a = pyData.data;
              const bi = a.base_info;
              const wxMap: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
              const dayWx = wxMap[bi?.day_master_wuxing] || bi?.day_master_wuxing || '?';
              const reasons = a.strength_reason || [];
              const deLing = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得令') || r.conclusion.includes('+30'));
              const deDi = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得地') || r.conclusion.includes('+20'));
              const deSheng = reasons.some((r: {conclusion: string}) => r.conclusion.includes('得势') || r.conclusion.includes('+10'));
              const totalScore = reasons.length > 0 ? parseInt(reasons[reasons.length - 1]?.evidence?.match(/总分\s*(-?\d+)/)?.[1] || '30') : 30;
              const scoreNorm = Math.max(0, Math.min(1, totalScore / 80));
              const yong = (a.yong_shen || []).filter((y: {priority: number}) => y.priority === 1);
              const yongEls = yong.map((y: {element: string}) => wxMap[y.element] || y.element);
              const xiEls = a.xi_shen?.map((e: string) => wxMap[e] || e) || [];
              const jiEls = a.ji_shen?.map((e: string) => wxMap[e] || e) || [];
              const yongReason = yong[0]?.primary_reason?.[0]?.conclusion || '';
              const wxRaw = a.wuxing_strength || {};
              const wxTotal = Object.values(wxRaw as Record<string, number>).reduce((s, v) => s + v, 0) || 1;
              const wxNorm: Record<string, number> = {};
              for (const [k, v] of Object.entries(wxRaw)) { wxNorm[wxMap[k] || k] = (v as number) / wxTotal; }
              const pStrs = [bi?.year, bi?.month, bi?.day, bi?.hour];
              const pillars = pStrs.map(s => s ? { gan: s[0] || '?', zhi: s[1] || '?', wuxing_gan: '' } : null);
              const cardData: CardData = {
                wuxing_personality: `${bi?.day_master || '?'}${dayWx}`,
                keywords: [], emotion_pattern: '', relation_pattern: '', social_tendency: '',
                summary: `${bi?.day_master || '?'}${dayWx}日主，${a.day_master_strength || '中和'}。${yongReason}`,
                bazi_display: `${bi?.year || ''} ${bi?.month || ''} ${bi?.day || ''} ${bi?.hour || ''}`,
                strength: { level: a.day_master_strength || '中和', score: scoreNorm, deLing, deDi, deSheng, deZhu: deSheng },
                yongShen: { yongShen: yongEls, xiShen: xiEls, jiShen: jiEls, reason: yongReason },
                wuxingStrength: wxNorm,
                shenSha: calcShenShaLocal({ year: { gan: pillars[0]?.gan || '?', zhi: pillars[0]?.zhi || '?' }, month: { gan: pillars[1]?.gan || '?', zhi: pillars[1]?.zhi || '?' }, day: { gan: pillars[2]?.gan || '?', zhi: pillars[2]?.zhi || '?' }, hour: pillars[3] ? { gan: pillars[3].gan, zhi: pillars[3].zhi } : undefined }),
                tiaoHou: a.tiao_hou ? { coreNeed: a.tiao_hou.core_need || [], reason: a.tiao_hou.reason || '', avoid: a.tiao_hou.avoid || [] } : undefined,
              };
              const baziResult: BaziResult = {
                year: pillars[0] || { gan: '?', zhi: '?', wuxing_gan: '' },
                month: pillars[1] || { gan: '?', zhi: '?', wuxing_gan: '' },
                day: pillars[2] || { gan: '?', zhi: '?', wuxing_gan: '' },
                hour: pillars[3] || undefined,
              };
              // 神煞已由本地 calcShenSha 计算，无需 TS 引擎补充
              setCard(cardData); setBazi(baziResult);
              // 尝试从 Python 引擎获取 richBazi（如果 API 已扩展）
              if (pyData.richBazi) setRichBazi(pyData.richBazi);
              setEngine("python"); setLoading(false); return;
            }
          }
        } catch (e) { /* silent */ }
      }
      setLoading(false);
    };
    loadData().catch(err => { console.error('card loadData fatal:', err); setLoading(false); });
  }, [router]);

  // 渲染阶段防御：如果 card 或 bazi 缺失关键字段，不崩溃
  if (!card || !bazi) {
    if (!loading) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
          <p className="text-sub mb-4">命签数据加载异常</p>
          <button onClick={() => { try { window.sessionStorage?.removeItem('xinzhai_birth'); } catch {} router.push('/register'); }} className="px-4 py-2 rounded-xl bg-accent text-white">
            重新注册
          </button>
        </main>
      );
    }
  }

  // 神煞数据：本地计算，单一来源
  const rawShenSha = card?.shenSha;
  const groupedShenSha = rawShenSha && rawShenSha.length > 0 ? groupShenSha(rawShenSha) : [];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse text-sub text-sm">正在生成能量名片…</div>
          <div className="w-4 h-4 border-t-2 border-accent rounded-full animate-spin" />
        </div>
      </main>
    );
  }
  if (!card || !bazi) {
    return (
      <main className="min-h-screen flex items-center justify-center flex-col gap-4 bg-bg">
        <p className="text-sub text-sm">暂时无法生成，请重新填写信息</p>
        <button onClick={() => router.push("/register")} className="text-xs text-sub hover:text-accent transition-colors">重新输入 →</button>
      </main>
    );
  }

  const wxEntries = card.wuxingStrength ? Object.entries(card.wuxingStrength) : [];
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];
  const richPillars: Array<{ key: '年柱' | '月柱' | '日柱' | '时柱'; title: string; pillar: PillarDetail }> = richBazi
    ? [
        { key: '年柱', title: '年柱', pillar: richBazi.年柱 },
        { key: '月柱', title: '月柱', pillar: richBazi.月柱 },
        { key: '日柱', title: '日柱', pillar: richBazi.日柱 },
        { key: '时柱', title: '时柱', pillar: richBazi.时柱 },
      ]
    : [];
  const formatCangGan = (pillar: PillarDetail): string[] => {
    const c = pillar.地支.藏干;
    return [
      c?.主气 ? `${c.主气.天干}${c.主气.十神}` : '',
      c?.中气 ? `${c.中气.天干}${c.中气.十神}` : '',
      c?.余气 ? `${c.余气.天干}${c.余气.十神}` : '',
    ].filter(Boolean);
  };
  const professionalRows = richPillars.length > 0
    ? [
        { label: '藏干', values: richPillars.map(p => formatCangGan(p.pillar)) },
        { label: '星运', values: richPillars.map(p => p.pillar.星运 || '—') },
        { label: '自坐', values: richPillars.map(p => p.pillar.自坐 || '—') },
        { label: '空亡', values: richPillars.map(p => p.pillar.空亡 || '—') },
        { label: '纳音', values: richPillars.map(p => p.pillar.纳音 || '—') },
        { label: '神煞', values: richPillars.map(p => getPillarShenSha(p.key, richBazi!).length > 0 ? getPillarShenSha(p.key, richBazi!) : ['—']) },
      ]
    : [];
  const needElements = [...(card.yongShen?.yongShen || []), ...(card.yongShen?.xiShen || [])];
  const energyToneColor = getEnergyToneColor(card.strength?.level);

  return (
    <>
      {/* 开卡揭示浮层 */}
      {revealTarget && (
        <CardReveal
          {...revealTarget}
          onClose={() => setRevealTarget(null)}
        />
      )}

      <main className="min-h-screen flex flex-col items-center px-6 py-12 bg-bg">
        <div className="animate-fade-in-up w-full max-w-md flex flex-col gap-6">

          {/* 标题 */}
          <div className="text-center flex flex-col items-center gap-2">
            <InkMark />
            <h2 className="text-xl font-semibold text-ink">我的能量名片</h2>
          </div>

          {/* 视图切换 */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-2xl bg-bg/80 border border-line/50 p-1">
              <button
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all focus:outline-none ${viewMode === 'energy' ? 'bg-accent text-white shadow-sm' : 'text-sub hover:text-ink'}`}
                onClick={() => setViewMode('energy')}
              >
                能量
              </button>
              <button
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all focus:outline-none ${viewMode === 'professional' ? 'bg-accent text-white shadow-sm' : 'text-sub hover:text-ink'}`}
                onClick={() => setViewMode('professional')}
              >
                专业盘
              </button>
            </div>
          </div>

          {/* 白色卡片主体 - 能量视图 */}
          {viewMode === 'energy' && (
          <div className="bg-card rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-line p-5 flex flex-col gap-6">

            {/* AI 轻读 */}
            <button
              onClick={() => router.push("/match")}
              className="w-full rounded-[var(--radius-lg)] border border-[#9FE1CB] px-4 py-3 text-left transition-all active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg,#EAF3DE 0%,#E1F5EE 100%)' }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent animate-soft-pulse" />
                <span className="min-w-0 flex-1 text-[13.5px] leading-6 text-ink-2">{getAiBannerText(card.strength?.level)}</span>
                <span className="shrink-0 text-[11px] font-medium text-accent-dark pt-0.5">看看适合你的人 →</span>
              </div>
            </button>

            {/* 1. Hero */}
            <div className="flex flex-col items-center text-center gap-3 pt-1">
              <p className="text-[10.5px] tracking-[3px] text-sub">命签 · 你的能量</p>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="text-[38px] leading-none font-semibold text-ink font-serif-bazi"
                  style={{ color: WX_COLOR[card.wuxing_personality?.slice(-1)] || 'var(--ink)' }}
                >
                  {card.wuxing_personality || '待定'}
                </span>
              </div>
              <p className="text-[13.5px] text-sub leading-7 max-w-[300px]">
                {getPersonaText(card.wuxing_personality, card.strength?.level)}
              </p>
            </div>

            {/* 2. 五行能量形状图 */}
            {wxEntries.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-ink">能量形状</p>
                  <p className="text-[10.5px] tracking-[2px] text-sub">木 火 土 金 水</p>
                </div>
                <div className="flex justify-center rounded-[var(--radius-lg)] bg-[var(--gray-50)] py-4">
                  <WuxingRadarChart
                    wuxingStrength={Object.fromEntries(wxEntries.map(([wx, pct]) => [wx, pct as number]))}
                    size={210}
                  />
                </div>
              </div>
            )}

            {/* 3. 此刻状态 */}
            {card.strength && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-ink">此刻状态</span>
                  <span className="text-[11px] font-medium" style={{ color: energyToneColor }}>
                    {getEnergyToneLabel(card.strength.level)}
                  </span>
                </div>
                <div className="w-full h-[5px] bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.max(8, Math.min(95, (card.strength.score || 0.5) * 100))}%`,
                      background: energyToneColor,
                    }}
                  />
                </div>
                <p className="text-[13.5px] leading-7 text-sub">{translateStrength(card.strength.level)}</p>
              </div>
            )}

            {/* 4. 你的能量需要 */}
            <div className="rounded-[var(--radius-lg)] bg-accent-soft px-4 py-3 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-accent-dark">你的能量需要</span>
              <p className="text-[13.5px] leading-7 text-ink-2">{getNeedText(needElements)}</p>
            </div>

            {/* 5. 神煞图鉴 */}
            {groupedShenSha.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-ink font-medium">神煞图鉴</p>
                  <p className="num text-[11px] text-sub">{groupedShenSha.length} / {ALL_SHENSHA_NAMES.length}</p>
                </div>

                {/* 徽章网格 */}
                <div className="flex flex-wrap gap-x-3 gap-y-4">
                  {groupedShenSha.map((s, i) => {
                    const category = SHENSHA_CATEGORY[s.name] || 'qiTa';
                    const gradient = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT['qiTa'];
                    const svgIcon = SHENSHA_SVG[s.name] || SHENSHA_SVG['文昌'];
                    const count = s.positions.length;
                    const isWarning = !!s.warning;
                    const rarity = getRarity(s.name, count, isWarning);
                    const cfg = RARITY[rarity];
                    const showShare = MAJOR_AUSPICIOUS.includes(s.name);

                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        {/* 徽章 */}
                        <button
                          className="relative rounded-full flex items-center justify-center text-xl transition-all duration-200 active:scale-90 select-none"
                          style={{
                            width: '64px', height: '64px',
                            border: `2px solid ${cfg.borderColor}`,
                            background: `linear-gradient(135deg, ${gradient.replace('bg-gradient-to-br from-[', '').replace('] to-[', ' ')})`,
                            boxShadow: `0 4px 20px ${cfg.glowColor}33`,
                          }}
                          onClick={() => {
                            setRevealTarget({
                              name: s.name, svgIcon, rarity, position: s.positions.join('·'),
                              description: s.description, warning: s.warning,
                            });
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 30px ${cfg.glowColor}55, 0 0 8px ${cfg.glowColor}33`;
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${cfg.glowColor}33`;
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                          }}
                        >
                          {/* 金传说流光 */}
                          {rarity === 'legendary4' && (
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.25) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s linear infinite',
                              }}
                            />
                          )}
                          {/* 凶煞警示 */}
                          {isWarning && (
                            <div className="absolute -inset-1 rounded-full pointer-events-none" style={{ border: '1.5px dashed #22D3EE44' }} />
                          )}
                          <span className="relative z-10 w-6 h-6" dangerouslySetInnerHTML={{ __html: svgIcon }} />
                          {/* 多柱角标 */}
                          {count > 1 && (
                            <div
                              className="absolute -top-1.5 -right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                              style={{ background: cfg.borderColor, boxShadow: `0 2px 8px ${cfg.glowColor}66` }}
                            >
                              ·{count}柱
                            </div>
                          )}
                          {/* 分享小箭头 */}
                          {showShare && (
                            <div
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] text-white px-1.5 py-0.5 rounded-full"
                              style={{ background: '#6FA29288' }}
                            >
                              ↗
                            </div>
                          )}
                        </button>
                        {/* 名称 */}
                        <span className="text-[10.5px] font-medium text-ink text-center leading-tight max-w-[72px]">{s.name}</span>
                        {/* 星级指示 */}
                        {cfg.tier >= 4 && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: cfg.tier - 3 }).map((_, si) => (
                              <span key={si} className="text-[7px]" style={{ color: cfg.borderColor }}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {/* 专业盘视图 */}
          {viewMode === 'professional' && (
          <div className="bg-card rounded-[var(--radius-lg)] shadow-[var(--shadow)] border border-line p-5 flex flex-col gap-5">
            {/* 顶部一行：我是什么 */}
            <div className="text-center flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="text-[28px] leading-none font-semibold tracking-normal font-serif-bazi" style={{ color: WX_COLOR[card.wuxing_personality?.slice(-1)] }}>{card.wuxing_personality}</span>
                <span className="text-sm text-sub">·</span>
                <span className="text-sm text-ink font-medium">{card.strength?.level || '旺衰待定'}</span>
                <span className="text-sm text-sub">·</span>
                <span className="num text-[11px] text-sub">五行 {wxEntries.map(([wx]) => wx).join(' ')}</span>
              </div>
            </div>

            {/* 四柱领域卡 — richBazi 同源渲染 */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* 构建 richPillars 列表（兼容降级） */}
              {(richBazi
                ? [
                    { key: '年柱' as const, pillar: richBazi.年柱 },
                    { key: '月柱' as const, pillar: richBazi.月柱 },
                    { key: '日柱' as const, pillar: richBazi.日柱 },
                    { key: '时柱' as const, pillar: richBazi.时柱 },
                  ]
                : pillars.map((p, i) => ({
                    key: PILLAR_LABELS[i],
                    pillar: null,
                    simpleP: p,
                  }))
              ).map((item, i) => {
                const pillarNames = ['年·根', '月·业', '日·己', '时·嗣'];
                const pillarKeys = ['年柱', '月柱', '日柱', '时柱'] as const;
                const isDayPillar = i === 2;
                const rich = item.pillar;

                // 获取本柱神煞
                const pillarShenShaNames = richBazi
                  ? getPillarShenSha(pillarKeys[i], richBazi)
                  : [];

                // 获取本柱十神（天干）
                const ganShishen = rich?.天干?.十神 || '';

                // 地支五行颜色
                const zhiWx = rich?.地支?.五行 || '';
                const zhiColor = WX_COLOR[zhiWx] || '#44403c';
                // 天干五行颜色
                const ganWx = rich?.天干?.五行 || '';
                const ganColor = WX_COLOR[ganWx] || '#44403c';

                return (
                  <div
                    key={i}
                    className="rounded-[var(--radius-lg)] px-2.5 py-4 flex flex-col gap-3 transition-all min-w-0"
                    style={{
                      background: isDayPillar ? 'var(--accent-light)' : 'var(--gray-50)',
                      border: isDayPillar ? '1px solid var(--accent)' : '1px solid var(--line)',
                      boxShadow: isDayPillar ? 'var(--shadow)' : 'none',
                    }}
                  >
                    {/* 柱名+领域 */}
                    <div className="text-center">
                      <div className="text-[10px] text-sub font-medium whitespace-nowrap">{pillarNames[i]}</div>
                      <div className="text-[9px] text-sub/60 mt-0.5">{pillarKeys[i]}</div>
                    </div>

                    {/* 天干/地支大字（五行上色）+ 主星 */}
                    {rich ? (
                      <>
                        <div className="flex flex-col items-center gap-1.5">
                          {/* 天干 */}
                          <div className="text-center">
                            <div
                              className="text-[34px] leading-none font-semibold"
                              style={{ color: ganColor }}
                            >
                              {rich.天干.天干}
                            </div>
                            <div className="text-[9px] text-sub mt-0.5">{ganWx}</div>
                          </div>

                          {/* 主星标签 */}
                          {ganShishen && (
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                                style={{ background: `${ganColor}22`, color: ganColor }}
                              >
                                {TEN_GOD_LABEL[ganShishen] || ganShishen}
                              </span>
                            </div>
                          )}

                          <div className="w-8 h-[1px] bg-line/30" />

                          {/* 地支 */}
                          <div className="text-center">
                            <div
                              className="text-[34px] leading-none font-semibold"
                              style={{ color: zhiColor }}
                            >
                              {rich.地支.地支}
                            </div>
                            <div className="text-[9px] text-sub mt-0.5">{zhiWx}</div>
                          </div>
                        </div>

                        {/* 神煞印章墙（本柱） */}
                        {pillarShenShaNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center max-h-14 overflow-hidden">
                            {pillarShenShaNames.map((name, si) => {
                              const rarity = getRarity(name, 1, SHENSHA_RARITY[name] === 'tidal');
                              const cfg = RARITY[rarity];
                              const sealChar = SHENSHA_SEAL_CHAR[name] || '神';
                              return (
                                <span
                                  key={si}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[9px] font-semibold text-white"
                                  style={{ background: cfg.borderColor }}
                                  title={name}
                                >
                                  {sealChar}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      // 降级：使用简单数据
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-center">
                          <div className="text-3xl font-bold" style={{ color: WX_COLOR[item.simpleP?.wuxing_gan || ''] || '#333' }}>{item.simpleP?.gan || '?'}</div>
                          <div className="text-[9px] text-sub mt-0.5">{item.simpleP?.wuxing_gan || ''}</div>
                        </div>
                        <div className="w-8 h-[1px] bg-line/30" />
                        <div className="text-center">
                          <div className="text-3xl font-bold">{item.simpleP?.zhi || '?'}</div>
                          <div className="text-[9px] text-sub mt-0.5">地支</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 展开：保留完整专业元素，默认收起 */}
            {professionalRows.length > 0 && (
              <details className="group rounded-[var(--radius-lg)] border border-line overflow-hidden bg-card">
                <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between transition-all hover:bg-[var(--gray-50)]">
                  <span className="text-[12px] font-medium text-ink">
                    <span className="group-open:hidden">展开</span>
                    <span className="hidden group-open:inline">收起</span>
                  </span>
                  <span className="text-[11px] text-sub transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="overflow-x-auto border-t border-line">
                  <div className="min-w-[420px]">
                    <div className="grid grid-cols-[72px_repeat(4,minmax(0,1fr))] bg-[var(--gray-50)]">
                      <div className="px-[14px] py-1.5 text-[11px] text-sub">项目</div>
                      {richPillars.map(p => (
                        <div key={p.key} className="px-[14px] py-1.5 text-center text-[11px] text-sub">{p.title}</div>
                      ))}
                    </div>

                    {professionalRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[72px_repeat(4,minmax(0,1fr))] border-b border-line last:border-b-0 hover:bg-[var(--gray-50)] transition-all"
                      >
                        <div className="px-[14px] py-[9px] text-[12px] text-sub font-medium">{row.label}</div>
                        {row.values.map((value, colIndex) => {
                          const list = Array.isArray(value) ? value : [value];
                          const isShenSha = row.label === '神煞';
                          return (
                            <div key={`${row.label}-${colIndex}`} className="min-w-0 px-[14px] py-[9px] text-center">
                              <div className="flex flex-col items-center gap-1">
                                {list.map((item, itemIndex) => (
                                  <span
                                    key={`${item}-${itemIndex}`}
                                    className={`${isShenSha ? 'text-[11px] text-[var(--tier-normal)]' : 'text-[12px] text-ink'} leading-tight break-keep`}
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {/* 神煞总览：专业盘采用紧凑信息列表 */}
            {groupedShenSha.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-ink font-semibold">神煞总览</p>
                  <p className="text-[10px] text-sub">已集 {groupedShenSha.length}/{ALL_SHENSHA_NAMES.length}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupedShenSha.map((s, i) => {
                    const svgIcon = SHENSHA_SVG[s.name] || SHENSHA_SVG['文昌'];
                    const count = s.positions.length;
                    const isWarning = !!s.warning;
                    const rarity = getRarity(s.name, count, isWarning);
                    const cfg = RARITY[rarity];
                    return (
                      <button
                        key={i}
                        className="min-w-0 rounded-[var(--radius)] bg-[var(--gray-50)] border border-line px-3 py-2.5 flex items-center gap-2 text-left active:scale-[0.99] transition focus:outline-none focus:ring-2 focus:ring-accent/20"
                        onClick={() => {
                          setRevealTarget({
                            name: s.name, svgIcon, rarity, position: s.positions.join('·'),
                            description: s.description, warning: s.warning,
                          });
                        }}
                      >
                        <span
                          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-semibold text-white"
                          style={{ background: cfg.borderColor }}
                          dangerouslySetInnerHTML={{ __html: svgIcon }}
                        />
                        <span className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-[11px] text-ink font-medium truncate">{s.name}</span>
                          <span className="text-[9px] text-sub truncate">{s.positions.join(' · ')}{isWarning ? ' · 需留意' : ''}</span>
                        </span>
                        {count > 1 && (
                          <span className="ml-auto shrink-0 text-[9px] text-sub px-1.5 py-0.5 rounded-full bg-bg">+{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/match")}
              className="w-full py-3.5 rounded-2xl bg-accent text-white text-sm font-semibold tracking-wide hover:bg-[#5A8D7A] transition-colors shadow-sm">
              看看谁能和你共鸣 →
            </button>
            <button onClick={() => window.print()}
              className="w-full py-2.5 rounded-2xl bg-white text-accent text-sm font-medium tracking-wide border-2 border-accent hover:bg-accent-soft transition-colors">
              晒命签
            </button>
            <button onClick={() => router.push("/register")}
              className="text-center text-xs text-line hover:text-sub transition-colors">
              重新生成
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
