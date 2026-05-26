"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { InkMark } from "@/components/InkMark";

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
// ============ 水墨风SVG神煞图标 ============
// 每个图标是SVG字符串，渲染为 <span dangerouslySetInnerHTML={{__html: icon}} />
// 风格：单色#333，线条粗细1.5-2px，24x24 viewBox，中式极简
const SHENSHA_SVG: Record<string, string> = {
  // ── 贵人类（星芒/光环）──
  '天乙贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#8B6914" stroke-width="1.5"><path d="M12 2l2.4 7.3H22l-6 4.4 2.3 7.1L12 16.6 5.7 20.8 8 13.7 2 9.3h7.6z" fill="rgba(139,105,20,.15)"/></svg>',
  '太极贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#6B5B95" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18M12 3c-2.5 2.5-2.5 6.5 0 9s2.5 6.5 0 9"/><circle cx="12" cy="7.5" r="1.5" fill="#6B5B95"/><circle cx="12" cy="16.5" r="1.5" fill="#fff" stroke="#6B5B95"/></svg>',
  '福星贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#2D7D46" stroke-width="1.5"><path d="M12 3c1.5 2 4 3 6 3-1 2-2 4-1 6.5m-5 .5c-2 0-4 1-5 3m5-13c-1.5 2-4 3-6 3 1 2 2 4 1 6.5m5 .5c2 0 4 1 5 3"/><circle cx="12" cy="13" r="2" fill="rgba(45,125,70,.15)"/></svg>',
  '德秀贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="1.5"><path d="M12 3L14 8h5l-4 3.5 1.5 5L12 14l-4.5 2.5L9 11.5 5 8h5z" fill="rgba(146,64,14,.12)"/><circle cx="12" cy="10" r="1.5" fill="none" stroke-dasharray="2 1"/></svg>',
  '天德贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#5A7A9A" stroke-width="1.5"><path d="M12 3l1.5 4.5h4.5l-3.5 2.5 1.3 4.2L12 12l-3.8 2.2 1.3-4.2L6 7.5h4.5z" fill="rgba(90,122,154,.12)"/><path d="M12 14v7M9 18h6"/></svg>',
  '月德贵人': '<svg viewBox="0 0 24 24" fill="none" stroke="#7A6BA5" stroke-width="1.5"><path d="M12 4a6 6 0 100 12 6 6 0 000-12zm0 0a8 8 0 018 8"/><path d="M4 20l2-2m12 2l2-2"/></svg>',
  // ── 动变类（运动/行动）──
  '驿马': '<svg viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="1.5"><ellipse cx="12" cy="13" rx="7" ry="5" transform="rotate(-20 12 13)"/><path d="M17 9l3-4M19 5l1 2M18 4l2 1M8 16l-3 4M5 20l1-2M4 21l2-1"/><circle cx="9" cy="11" r="1" fill="#8B4513"/><path d="M5 13c-1-2 0-4 2-5"/></svg>',
  '将星': '<svg viewBox="0 0 24 24" fill="none" stroke="#A0522D" stroke-width="1.5"><polygon points="12,2 15,9 22,10 17,15 18,22 12,19 6,22 7,15 2,10 9,9" fill="rgba(160,82,45,.12)"/><line x1="12" y1="2" x2="12" y2="19" opacity=".3"/></svg>',
  // ── 情缘类（柔和曲线）──
  '桃花': '<svg viewBox="0 0 24 24" fill="none" stroke="#C47A8A" stroke-width="1.2"><circle cx="12" cy="10" r="3" fill="rgba(196,122,138,.15)"/><circle cx="8" cy="7" r="2.2" fill="rgba(196,122,138,.1)"/><circle cx="16" cy="7" r="2.2" fill="rgba(196,122,138,.1)"/><circle cx="12" cy="14" r="2.2" fill="rgba(196,122,138,.1)"/><path d="M12 16v5M10 18h4" stroke-linecap="round"/></svg>',
  '红鸾': '<svg viewBox="0 0 24 24" fill="none" stroke="#C45050" stroke-width="1.3"><path d="M12 4c-4 3-7 6-7 10a7 7 0 0014 0c0-4-3-7-7-10z" fill="rgba(196,80,80,.1)"/><path d="M12 8v8M9 13h6"/></svg>',
  '天喜': '<svg viewBox="0 0 24 24" fill="none" stroke="#D4845C" stroke-width="1.5"><circle cx="12" cy="12" r="8" fill="rgba(212,132,92,.1)"/><path d="M12 7v2M12 15v2M7 12h2M15 12h2" stroke-linecap="round"/><circle cx="12" cy="12" r="2.5" fill="none" stroke-dasharray="3 2"/></svg>',
  '咸池': '<svg viewBox="0 0 24 24" fill="none" stroke="#5A8FA8" stroke-width="1.3"><path d="M3 14c2-4 6-6 9-6s7 2 9 6"/><path d="M5 14c1.5-3 4.2-4.5 7-4.5s5.5 1.5 7 4.5" opacity=".5"/><path d="M2 18h20" stroke-linecap="round"/></svg>',
  // ── 内向类（收敛/独处）──
  '华盖': '<svg viewBox="0 0 24 24" fill="none" stroke="#6A7A9A" stroke-width="1.5"><path d="M4 10h16l-2 8H6z" fill="rgba(106,122,154,.08)"/><path d="M6 10V7a6 6 0 0112 0v3"/><line x1="12" y1="10" x2="12" y2="18" opacity=".4"/></svg>',
  '孤鸾煞': '<svg viewBox="0 0 24 24" fill="none" stroke="#7A6A8A" stroke-width="1.3"><path d="M12 4c-3 2-5 5-5 9s2 7 5 9c3-2 5-5 5-9s-2-7-5-9z" fill="rgba(122,106,138,.08)"/><path d="M12 8v8" opacity=".3"/></svg>',
  // ── 锋芒类（锐利/警示）──
  '羊刃': '<svg viewBox="0 0 24 24" fill="none" stroke="#A03030" stroke-width="1.5"><path d="M12 3l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-7.5L2 10h7z" fill="rgba(160,48,48,.1)"/><line x1="12" y1="3" x2="12" y2="18" stroke-width="1"/></svg>',
  '血刃': '<svg viewBox="0 0 24 24" fill="none" stroke="#B03030" stroke-width="1.5"><path d="M6 3l12 0-3 14H9z" fill="rgba(176,48,48,.08)"/><path d="M9 17l-2 4M15 17l2 4" stroke-linecap="round"/></svg>',
  '空亡': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><circle cx="12" cy="12" r="8" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="3" opacity=".3"/></svg>',
  '劫煞': '<svg viewBox="0 0 24 24" fill="none" stroke="#8B6040" stroke-width="1.5"><path d="M4 12h4l3-8 3 8h4l-3 8-3-8H7z" fill="rgba(139,96,64,.08)"/></svg>',
  '童子': '<svg viewBox="0 0 24 24" fill="none" stroke="#7A9A6A" stroke-width="1.5"><circle cx="12" cy="8" r="4" fill="rgba(122,154,106,.1)"/><path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H8z" fill="rgba(122,154,106,.06)"/><circle cx="10" cy="7.5" r="0.8" fill="#7A9A6A"/><circle cx="14" cy="7.5" r="0.8" fill="#7A9A6A"/><path d="M10 10q2 1 4 0" stroke-width="1"/></svg>',
  '吊客': '<svg viewBox="0 0 24 24" fill="none" stroke="#707080" stroke-width="1.5"><rect x="6" y="4" width="12" height="16" rx="1" fill="rgba(112,112,128,.04)"/><circle cx="12" cy="12" r="2.5"/><path d="M10 18h4M12 16v4"/></svg>',
  // ── 其他类 ──
  '文昌': '<svg viewBox="0 0 24 24" fill="none" stroke="#5A7A9A" stroke-width="1.5"><path d="M6 3h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V3z" fill="rgba(90,122,154,.06)"/><path d="M14 3v4h4"/><line x1="10" y1="10" x2="14" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
  '禄神': '<svg viewBox="0 0 24 24" fill="none" stroke="#927030" stroke-width="1.5"><circle cx="12" cy="10" r="6" fill="rgba(146,112,48,.1)"/><path d="M9 16v4h6v-4M10 18h4"/></svg>',
  '金舆': '<svg viewBox="0 0 24 24" fill="none" stroke="#8A7A5A" stroke-width="1.5"><rect x="4" y="8" width="16" height="8" rx="2" fill="rgba(138,122,90,.06)"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><path d="M8 8V6M16 8V6"/></svg>',
  '魁罡': '<svg viewBox="0 0 24 24" fill="none" stroke="#8B4060" stroke-width="1.5"><path d="M12 2l2 6h6l-5 4 2 6-5-3-5 3 2-6-5-4h6z" fill="rgba(139,64,96,.1)"/><path d="M12 8v9" stroke-width="1" opacity=".5"/></svg>',
  '八专': '<svg viewBox="0 0 24 24" fill="none" stroke="#6A6A7A" stroke-width="1.5"><circle cx="8" cy="8" r="3" fill="rgba(106,106,122,.08)"/><circle cx="16" cy="16" r="3" fill="rgba(106,106,122,.08)"/><path d="M10.5 9.5l3 3M13.5 9.5l-3 3"/></svg>',
  '亡神': '<svg viewBox="0 0 24 24" fill="none" stroke="#6A5070" stroke-width="1.5"><path d="M12 4c-4 3-6 7-6 11a6 6 0 0012 0c0-4-2-8-6-11z" fill="rgba(106,80,112,.07)"/><circle cx="12" cy="15" r="1.5"/></svg>',
  '病符': '<svg viewBox="0 0 24 24" fill="none" stroke="#7A8A5A" stroke-width="1.5"><rect x="5" y="4" width="14" height="17" rx="2" fill="rgba(122,138,90,.05)"/><path d="M9 10h6M9 14h4" stroke-linecap="round"/><path d="M12 4v3"/></svg>',
  '四废': '<svg viewBox="0 0 24 24" fill="none" stroke="#7A7A6A" stroke-width="1.5"><polyline points="4,8 8,4 8,12 12,8 12,16 16,12 16,20 20,16" fill="none"/><path d="M4 8l16 8" opacity=".25"/></svg>',
  '十恶大败': '<svg viewBox="0 0 24 24" fill="none" stroke="#8B5050" stroke-width="1.5"><path d="M5 5h14v14H5z" fill="rgba(139,80,80,.06)"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
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
type RarityTier = 'legendary4' | 'legendary3' | 'epic' | 'rare' | 'common' | 'tidal';

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
  tidal: {
    label: '潮汐', labelColor: '#0E7490',
    borderColor: '#22D3EE', glowColor: '#06B6D4',
    bgClass: 'bg-gradient-to-br from-cyan-100 to-slate-50',
    burstColor: '#22D3EE', tier: 1,
  },
};

function getRarity(
  name: string, count: number, isWarning: boolean
): RarityTier {
  if (isWarning) return 'tidal';
  if (count >= 4) return 'legendary4';
  if (count === 3) return 'legendary3';
  if (count === 2) return 'epic';
  return 'common';
}

// ============ 分组神煞 ============
function groupShenSha(shenSha: Array<{name: string; position: string; description: string; warning?: string}>) {
  const grouped: Record<string, {name: string; positions: string[]; description: string; warning?: string}> = {};
  for (const s of shenSha) {
    if (!grouped[s.name]) {
      grouped[s.name] = { name: s.name, positions: [], description: s.description, warning: s.warning };
    }
    if (!grouped[s.name].positions.includes(s.position)) {
      grouped[s.name].positions.push(s.position);
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
  shenSha?: Array<{name: string; position: string; description: string; warning?: string}>;
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
                shenSha: (a.shen_sha || []).map((s: {name: string; position: string; description: string; warning?: string}) => ({
                  name: s.name, position: s.position, description: s.description, warning: s.warning,
                })),
                tiaoHou: a.tiao_hou ? { coreNeed: a.tiao_hou.core_need || [], reason: a.tiao_hou.reason || '', avoid: a.tiao_hou.avoid || [] } : undefined,
              };
              const baziResult: BaziResult = {
                year: pillars[0] || { gan: '?', zhi: '?', wuxing_gan: '' },
                month: pillars[1] || { gan: '?', zhi: '?', wuxing_gan: '' },
                day: pillars[2] || { gan: '?', zhi: '?', wuxing_gan: '' },
                hour: pillars[3] || undefined,
              };
              // 始终用 TS 引擎补充神煞（TS引擎覆盖29种，Python引擎可能缺失）
              try {
                const tsRes = await fetch("/api/generate-card", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    birth_year: form.birth_year, birth_month: form.birth_month,
                    birth_day: form.birth_day, birth_hour: form.birth_hour,
                    birth_minute: form.birth_minute, gender: form.gender,
                  }),
                });
                if (tsRes.ok) {
                  const tsData = await tsRes.json();
                  if (tsData.card?.shenSha && tsData.card.shenSha.length > 0) {
                    cardData.shenSha = tsData.card.shenSha;
                  }
                }
              } catch (e) { /* silent */ }
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
    loadData().catch(err => { console.error(err); setLoading(false); });
  }, [router]);

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
  const groupedShenSha = card.shenSha ? groupShenSha(card.shenSha) : [];

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
                              ×{count}
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
