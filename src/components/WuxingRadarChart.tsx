"use client";

import { useId } from "react";

interface WuxingRadarChartProps {
  wuxingStrength: Record<string, number>;
  size?: number;
  dayType?: string;
}

const WX_ORDER = ["木", "火", "土", "金", "水"] as const;

const WX_COLOR: Record<string, string> = {
  木: "#6FA173",
  火: "#D97955",
  土: "#D7B564",
  金: "#BBB196",
  水: "#7FA8CC",
};

const WX_LABEL_FILL: Record<string, string> = {
  木: "#FBF8F0",
  火: "#FBF8F0",
  土: "#7A6236",
  金: "#756C55",
  水: "#FBF8F0",
};

const WX_LABEL: Record<string, string> = {
  木: "生长",
  火: "热度",
  土: "承接",
  金: "边界",
  水: "流动",
};

const REGION_PATH: Record<string, string> = {
  木: "M 59 50 C 79 31, 116 29, 139 49 C 153 61, 146 83, 124 92 C 100 102, 70 90, 56 72 C 49 63, 51 56, 59 50 Z",
  火: "M 137 48 C 169 54, 190 81, 184 113 C 178 145, 149 151, 126 130 C 109 115, 108 95, 125 78 C 139 64, 148 54, 137 48 Z",
  土: "M 127 129 C 151 111, 184 126, 183 157 C 181 182, 153 198, 130 184 C 110 171, 108 146, 127 129 Z",
  金: "M 75 158 C 91 139, 119 147, 131 184 C 113 201, 80 199, 60 183 C 51 175, 58 165, 75 158 Z",
  水: "M 42 78 C 60 56, 93 66, 112 96 C 130 124, 112 158, 78 170 C 49 180, 26 160, 25 127 C 24 105, 29 90, 42 78 Z",
};

const LABEL_POS: Record<string, { x: number; y: number }> = {
  木: { x: 95, y: 63 },
  火: { x: 157, y: 91 },
  土: { x: 155, y: 157 },
  金: { x: 93, y: 181 },
  水: { x: 56, y: 126 },
};

function normalizeStrength(wuxingStrength: Record<string, number>) {
  const raw = WX_ORDER.map((wx) => Math.max(0, wuxingStrength[wx] || 0));
  const total = raw.reduce((sum, value) => sum + value, 0) || 1;
  return WX_ORDER.map((wx, index) => ({
    wx,
    value: raw[index] / total,
    percent: Math.round((raw[index] / total) * 100),
  }));
}

function getSummary(items: ReturnType<typeof normalizeStrength>) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const low = sorted.filter((item) => item.percent <= 12).map((item) => item.wx);
  if (!top) return "能量结构平稳";
  if (low.length >= 2) return `${top.wx}较显，${low.join("")}偏低`;
  return `${top.wx}较显，整体流动`;
}

export default function WuxingRadarChart({
  wuxingStrength,
  size = 270,
  dayType,
}: WuxingRadarChartProps) {
  const id = useId().replace(/:/g, "");
  const items = normalizeStrength(wuxingStrength);
  const byWx = Object.fromEntries(items.map((item) => [item.wx, item]));
  const centerLabel = dayType || [...items].sort((a, b) => b.percent - a.percent)[0]?.wx || "能量";

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        role="img"
        aria-label={`五行能量结构：${items.map((item) => `${item.wx}${item.percent}%`).join("，")}`}
        className="energy-watercolor-orb overflow-visible"
      >
        <defs>
          <clipPath id={`${id}-orb-clip`}>
            <circle cx="120" cy="120" r="94" />
          </clipPath>
          <filter id={`${id}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#463F32" floodOpacity="0.1" />
          </filter>
          <filter id={`${id}-watercolor`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="12" result="texture" />
            <feDisplacementMap in="SourceGraphic" in2="texture" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.18" />
          </filter>
          <filter id={`${id}-paper`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="paperNoise" />
            <feColorMatrix
              in="paperNoise"
              type="matrix"
              values="0 0 0 0 0.96 0 0 0 0 0.93 0 0 0 0 0.86 0 0 0 .15 0"
            />
          </filter>
          {WX_ORDER.map((wx) => (
            <radialGradient key={wx} id={`${id}-${wx}`} cx="38%" cy="28%" r="82%">
              <stop offset="0%" stopColor={WX_COLOR[wx]} stopOpacity="0.78" />
              <stop offset="58%" stopColor={WX_COLOR[wx]} stopOpacity="0.6" />
              <stop offset="100%" stopColor={WX_COLOR[wx]} stopOpacity="0.43" />
            </radialGradient>
          ))}
        </defs>

        <circle cx="120" cy="120" r="102" fill="rgba(252,248,241,0.78)" filter={`url(#${id}-shadow)`} />
        <circle cx="120" cy="120" r="96" fill="#FBF7EF" stroke="#E9DFC9" strokeWidth="2" />

        <g clipPath={`url(#${id}-orb-clip)`}>
          <rect x="24" y="24" width="192" height="192" fill="#FBF7EF" />
          <rect x="24" y="24" width="192" height="192" opacity="0.34" filter={`url(#${id}-paper)`} />

          {WX_ORDER.map((wx) => {
            const item = byWx[wx];
            const emphasis = 0.78 + Math.min(0.18, item.percent / 180);
            return (
              <path
                key={wx}
                d={REGION_PATH[wx]}
                fill={`url(#${id}-${wx})`}
                opacity={item.percent <= 2 ? 0.42 : emphasis}
                stroke="#FBF7EF"
                strokeWidth="8"
                strokeLinejoin="round"
                filter={`url(#${id}-watercolor)`}
              />
            );
          })}

          <path d="M 34 96 C 55 83, 81 83, 105 99" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 139 78 C 159 82, 173 96, 178 115" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" strokeLinecap="round" />
          <path d="M 49 146 C 70 159, 94 159, 114 145" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" strokeLinecap="round" />

          <circle cx="120" cy="120" r="36" fill="rgba(252,248,241,0.94)" stroke="rgba(230,220,201,0.95)" strokeWidth="1.5" />
        </g>

        <circle cx="120" cy="120" r="94" fill="none" stroke="#DCD0B8" strokeWidth="2.2" />
        <circle cx="120" cy="120" r="100" fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="7" />

        {WX_ORDER.map((wx) => {
          const item = byWx[wx];
          const pos = LABEL_POS[wx];
          return (
            <g key={`label-${wx}`} opacity={item.percent <= 2 ? 0.45 : 1}>
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WX_LABEL_FILL[wx]}
                stroke="rgba(65,54,40,0.12)"
                strokeWidth="0.45"
                className="font-serif-bazi text-[18px] font-semibold"
              >
                {wx}
              </text>
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WX_LABEL_FILL[wx]}
                className="num text-[12px] font-medium"
              >
                {item.percent}%
              </text>
            </g>
          );
        })}

        <text x="120" y="116" textAnchor="middle" dominantBaseline="middle" fill="#2D3330" className="font-serif-bazi text-[31px] font-semibold">
          {centerLabel}
        </text>
        <text x="120" y="144" textAnchor="middle" dominantBaseline="middle" fill="#B0A896" className="text-[11px] font-medium">
          五行结构
        </text>
      </svg>

      <div className="w-full max-w-[280px] flex flex-col items-center gap-2">
        <p className="text-center text-[15px] leading-7 text-ink-2">{getSummary(items)}</p>
        <div className="rounded-full border border-[rgba(113,159,126,0.45)] px-5 py-1 text-[12px] tracking-[0.18em] text-[var(--brand)]">
          能量形状
        </div>
      </div>
    </div>
  );
}
