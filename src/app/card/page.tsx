"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { InkMark } from "@/components/InkMark";
import { calcShenSha as calcShenShaLocal } from "@/lib/shensha";

// ============ 常量 ============
const WX_COLOR: Record<string, string> = {
  "木": "#9CB89A", "火": "#D88A7A", "土": "#C9A86A", "金": "#B9AE92", "水": "#7AA0C4",
};
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

// 兼容旧emoji接口
const SHENSHA_ICON: Record<string, string> = Object.fromEntries(
  Object.keys(SHENSHA_SVG).map(k => [k, k])
);
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

// ============ 神煞徽章组件 ============
function BadgeItem({
  name, svgIcon, rarity, count, gradient, onClick,
}: {
  name: string; svgIcon: string; rarity: RarityTier;
  count: number; gradient: string;
  onClick: () => void;
}) {
  const cfg = RARITY[rarity];
  const isWarning = rarity === 'tidal';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 徽章 */}
      <button
        className="relative rounded-full flex items-center justify-center text-xl transition-all duration-200 active:scale-90"
        style={{
          width: '72px',
          height: '72px',
          border: `2px solid ${cfg.borderColor}`,
          background: `linear-gradient(135deg, ${gradient.includes('[') ? '' : ''}var(--tw-gradient-stops))`,
          boxShadow: `0 4px 20px ${cfg.glowColor}33, 0 0 0 0 ${cfg.glowColor}00`,
          transition: 'box-shadow 0.3s ease, transform 0.15s ease',
        }}
        onClick={onClick}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 30px ${cfg.glowColor}55, 0 0 8px ${cfg.glowColor}33`;
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${cfg.glowColor}33`;
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {/* 稀有度流光（金传说） */}
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
        {/* 凶煞警示环 */}
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
            ×{count}
          </div>
        )}
      </button>
      {/* 名称 */}
      <span className="text-[10px] font-medium text-ink text-center leading-tight">{name}</span>
      {/* 稀有度星级 */}
      {cfg.tier >= 4 && (
        <div className="flex gap-0.5">
          {Array.from({ length: cfg.tier - 3 }).map((_, i) => (
            <span key={i} className="text-[7px]" style={{ color: cfg.borderColor }}>★</span>
          ))}
        </div>
      )}
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
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState<string>("");
  const [revealTarget, setRevealTarget] = useState<{name: string; svgIcon: string; rarity: RarityTier; position: string; description: string; warning?: string} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const raw = sessionStorage.getItem("xinzhai_birth");
      if (raw) {
        let form;
        try { form = JSON.parse(raw); } catch (e) {
          sessionStorage.removeItem("xinzhai_birth");
          sessionStorage.removeItem("xinzhai_bazi");
          router.push("/register");
          setLoading(false); return;
        }
        // 优先 Python 引擎
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
              setCard(cardData); setBazi(baziResult); setEngine("python"); setLoading(false); return;
            }
          }
        } catch (e) { /* silent */ }
        // Fallback: TS 引擎
        try {
          const res = await fetch("/api/generate-card", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.card && data.bazi) { setCard(data.card); setBazi(data.bazi); setEngine("ts"); setLoading(false); return; }
          }
        } catch {}
      }
      // Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
          if (profile) {
            const form2 = { birth_year: profile.birth_year, birth_month: profile.birth_month, birth_day: profile.birth_day, birth_hour: profile.birth_hour, birth_minute: profile.birth_minute, gender: profile.gender };
            const res2 = await fetch("/api/generate-card", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form2) });
            const data2 = await res2.json();
            setCard(data2.card); setBazi(data2.bazi); setEngine("ts"); setLoading(false); return;
          }
        }
      } catch {}
      setLoading(false); router.push("/register");
    };
    loadData().catch(err => { console.error('card loadData fatal:', err); setLoading(false); });
  }, [router]);

  // 渲染阶段防御：如果 card 或 bazi 缺失关键字段，不崩溃
  if (!card || !bazi) {
    if (!loading) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-bg px-6">
          <p className="text-sub mb-4">命签数据加载异常</p>
          <button onClick={() => { sessionStorage.removeItem('xinzhai_birth'); router.push('/register'); }} className="px-4 py-2 rounded-xl bg-accent text-white">
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
        <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-6">

          {/* 标题 */}
          <div className="text-center flex flex-col items-center gap-2">
            <InkMark />
            <h2 className="text-xl font-semibold text-ink">我的能量名片</h2>
          </div>

          {/* 白色卡片主体 */}
          <div className="bg-card rounded-2xl shadow-sm border border-line/50 p-6 flex flex-col gap-5">

            {/* 日主 */}
            <div className="text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">{card.wuxing_personality?.[0]}</span>
              </div>
              <h3 className="text-lg font-semibold text-ink">{card.wuxing_personality}</h3>
              {wxEntries.length > 0 && (
                <div className="flex gap-2">
                  {wxEntries.map(([wx, pct]) => (
                    <div key={wx} className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: WX_COLOR[wx] || '#ccc' }} />
                      <span className="text-[9px] text-sub">{wx}</span>
                      <span className="text-[9px] text-ink font-medium">{Math.round((pct as number) * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 四柱 */}
            <div>
              <p className="text-[10px] text-sub text-center mb-2 font-medium">八字</p>
              <div className="grid grid-cols-4 gap-2">
                {pillars.map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] text-sub">{PILLAR_LABELS[i]}</span>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium ${i === 2 ? 'bg-accent-soft text-accent' : 'bg-bg text-ink'}`}>
                      {p ? `${p.gan}${p.zhi}` : '??'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 能量状态条 */}
            {card.strength && (
              <div className="bg-bg/60 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-sub font-medium">能量状态</span>
                  <span className="text-xs font-semibold text-ink">{card.strength.level}</span>
                </div>
                <div className="w-full h-2 bg-line/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.max(5, Math.min(95, (card.strength.score || 0.5) * 100))}%` }} />
                </div>
              </div>
            )}

            {/* 用神 / 喜神 */}
            {card.yongShen && (
              <div className="flex flex-wrap gap-1.5">
                {card.yongShen.yongShen.map((el, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: WX_COLOR[el] || '#eee', color: '#fff' }}>{el}</span>
                ))}
                {card.yongShen.xiShen.map((el, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent">{el}</span>
                ))}
              </div>
            )}

            {/* 神煞图鉴 - 稀有度徽章墙 */}
            {groupedShenSha.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-sub font-medium">神煞图鉴</p>
                  <p className="text-[10px] text-sub">已集 {groupedShenSha.length}/{ALL_SHENSHA_NAMES.length}</p>
                </div>

                {/* 徽章网格 */}
                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {groupedShenSha.map((s, i) => {
                    const category = SHENSHA_CATEGORY[s.name] || 'qiTa';
                    const gradient = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT['qiTa'];
                    const svgIcon = SHENSHA_SVG[s.name] || SHENSHA_SVG['文昌'];
                    const icon = SHENSHA_ICON[s.name] || '✨';
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
                            width: '72px', height: '72px',
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
                        <span className="text-[10px] font-medium text-ink text-center leading-tight">{s.name}</span>
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

                {/* 稀有度图例 */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-1">
                  {(['legendary4', 'legendary3', 'epic', 'rare', 'common', 'tidal'] as RarityTier[]).map(t => (
                    <div key={t} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: RARITY[t].borderColor }} />
                      <span className="text-[8px] text-sub">{RARITY[t].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 总结 */}
            {card.summary && (
              <p className="text-xs text-sub leading-relaxed text-center">{card.summary}</p>
            )}
          </div>

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
