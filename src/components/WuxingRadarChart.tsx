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

const REGION_PATH: Record<string, string> = {
  木: "M 52 46 C 72 26, 116 22, 141 45 C 158 60, 145 84, 118 91 C 91 98, 62 85, 48 66 C 42 57, 44 51, 52 46 Z",
  火: "M 137 43 C 170 50, 193 78, 187 112 C 181 142, 153 149, 128 128 C 110 113, 108 94, 125 77 C 141 61, 149 50, 137 43 Z",
  土: "M 129 126 C 151 108, 185 122, 187 153 C 188 181, 156 199, 132 184 C 113 172, 109 143, 129 126 Z",
  金: "M 76 157 C 94 136, 122 146, 134 184 C 113 203, 78 200, 58 181 C 49 172, 58 162, 76 157 Z",
  水: "M 38 76 C 57 53, 91 63, 113 94 C 132 122, 113 160, 77 173 C 47 184, 21 161, 22 126 C 22 103, 28 88, 38 76 Z",
};

const LABEL_POS: Record<string, { x: number; y: number }> = {
  木: { x: 96, y: 63 },
  火: { x: 163, y: 91 },
  土: { x: 161, y: 159 },
  金: { x: 91, y: 184 },
  水: { x: 55, y: 129 },
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
  size = 286,
  dayType,
}: WuxingRadarChartProps) {
  const id = useId().replace(/:/g, "");
  const items = normalizeStrength(wuxingStrength);
  const byWx = Object.fromEntries(items.map((item) => [item.wx, item]));
  const centerLabel = dayType || [...items].sort((a, b) => b.percent - a.percent)[0]?.wx || "能量";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-3">
        <h3 className="font-serif-bazi text-[25px] font-semibold leading-none text-ink">能量形状</h3>
        <div className="flex items-center gap-5 text-[15px] font-medium">
          {WX_ORDER.map((wx) => (
            <span key={wx} style={{ color: WX_COLOR[wx] }}>
              {wx}
            </span>
          ))}
        </div>
        <span className="h-1.5 w-1.5 rounded-full bg-[rgba(193,187,174,0.8)]" />
      </div>

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
            <circle cx="120" cy="120" r="96" />
          </clipPath>
          <filter id={`${id}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#463F32" floodOpacity="0.1" />
          </filter>
          <filter id={`${id}-watercolor`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" seed="12" result="texture" />
            <feDisplacementMap in="SourceGraphic" in2="texture" scale="1.15" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.08" />
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

        <circle cx="120" cy="120" r="103" fill="rgba(252,248,241,0.78)" filter={`url(#${id}-shadow)`} />
        <circle cx="120" cy="120" r="98" fill="#FBF7EF" stroke="#E1D5BB" strokeWidth="2.4" />

        <g clipPath={`url(#${id}-orb-clip)`}>
          <rect x="24" y="24" width="192" height="192" fill="#FBF7EF" />
          <rect x="24" y="24" width="192" height="192" opacity="0.34" filter={`url(#${id}-paper)`} />

          {WX_ORDER.map((wx) => {
            const item = byWx[wx];
            const emphasis = 0.84 + Math.min(0.12, item.percent / 220);
            return (
              <path
                key={wx}
                d={REGION_PATH[wx]}
                fill={`url(#${id}-${wx})`}
                opacity={item.percent <= 2 ? 0.42 : emphasis}
                stroke="#FBF7EF"
                strokeWidth="9.5"
                strokeLinejoin="round"
                filter={`url(#${id}-watercolor)`}
              />
            );
          })}

          <path d="M 34 96 C 55 83, 81 83, 105 99" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 139 78 C 159 82, 173 96, 178 115" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" strokeLinecap="round" />
          <path d="M 49 146 C 70 159, 94 159, 114 145" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" strokeLinecap="round" />

          <circle cx="120" cy="120" r="31" fill="rgba(252,248,241,0.95)" stroke="rgba(230,220,201,0.95)" strokeWidth="1.4" />
        </g>

        <circle cx="120" cy="120" r="96" fill="none" stroke="#D7C9AA" strokeWidth="2.2" />
        <circle cx="120" cy="120" r="101" fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="7" />

        {WX_ORDER.map((wx) => {
          const item = byWx[wx];
          const pos = LABEL_POS[wx];
          return (
            <g key={`label-${wx}`} opacity={item.percent <= 2 ? 0.72 : 1}>
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WX_LABEL_FILL[wx]}
                stroke={wx === "土" || wx === "金" ? "rgba(255,255,255,0.5)" : "rgba(65,54,40,0.18)"}
                strokeWidth="0.55"
                className="font-serif-bazi text-[17px] font-medium"
              >
                {wx}
              </text>
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WX_LABEL_FILL[wx]}
                stroke={wx === "土" || wx === "金" ? "rgba(255,255,255,0.45)" : "rgba(65,54,40,0.12)"}
                strokeWidth="0.35"
                className="num text-[11px] font-medium"
              >
                {item.percent}%
              </text>
            </g>
          );
        })}

        <text x="120" y="116" textAnchor="middle" dominantBaseline="middle" fill="#2C6B9E" className="font-serif-bazi text-[25px] font-medium">
          {centerLabel}
        </text>
      </svg>

      <div className="w-full max-w-[280px] flex flex-col items-center gap-2">
        <p className="text-center text-[15px] leading-7 text-ink-2">{getSummary(items)}</p>
      </div>
    </div>
  );
}
