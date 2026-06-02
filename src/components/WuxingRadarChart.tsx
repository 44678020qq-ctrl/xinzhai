"use client";

import { useId } from "react";

interface WuxingRadarChartProps {
  wuxingStrength?: Record<string, number>;
  wood?: number;
  fire?: number;
  earth?: number;
  metal?: number;
  water?: number;
  size?: number;
  dayType?: string;
  dayMaster?: string;
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

const TEMPLATE_PERCENT: Record<string, number> = {
  木: 20,
  火: 23,
  土: 11,
  金: 11,
  水: 35,
};

const REGION_RENDER_ORDER = ["水", "木", "火", "土", "金"] as const;

const REGION_PATH: Record<string, string> = {
  木: "M 31 63 C 60 31, 113 24, 150 44 C 166 53, 160 78, 139 90 C 114 104, 82 96, 51 86 C 31 80, 18 73, 31 63 Z",
  火: "M 137 43 C 178 48, 207 76, 202 116 C 198 151, 165 163, 138 136 C 116 114, 114 91, 130 74 C 144 59, 159 55, 137 43 Z",
  土: "M 126 130 C 154 112, 193 122, 202 153 C 212 185, 183 208, 151 198 C 123 189, 105 151, 126 130 Z",
  金: "M 74 154 C 100 137, 132 147, 149 179 C 135 210, 88 216, 56 190 C 39 176, 51 162, 74 154 Z",
  水: "M 31 84 C 55 58, 95 66, 118 98 C 140 128, 123 168, 88 189 C 55 208, 23 185, 18 151 C 14 124, 17 100, 31 84 Z",
};

const LABEL_POS: Record<string, { x: number; y: number }> = {
  木: { x: 95, y: 69 },
  火: { x: 166, y: 99 },
  土: { x: 165, y: 160 },
  金: { x: 91, y: 185 },
  水: { x: 58, y: 132 },
};

const REGION_ANCHOR: Record<string, { x: number; y: number }> = {
  木: { x: 96, y: 61 },
  火: { x: 160, y: 96 },
  土: { x: 165, y: 161 },
  金: { x: 92, y: 182 },
  水: { x: 61, y: 127 },
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAreaScale(wx: string, percent: number) {
  const base = TEMPLATE_PERCENT[wx] || 20;
  return clamp(1 + ((percent - base) / 100) * 0.95, 0.82, 1.36);
}

function getAreaShift(wx: string, percent: number) {
  const base = TEMPLATE_PERCENT[wx] || 20;
  const delta = clamp((percent - base) / 20, -1, 1);
  const shifts: Record<string, { x: number; y: number }> = {
    木: { x: 0, y: -8 },
    火: { x: 9, y: -2 },
    土: { x: 8, y: 7 },
    金: { x: -4, y: 8 },
    水: { x: -10, y: 9 },
  };
  const shift = shifts[wx] || { x: 0, y: 0 };
  return { x: shift.x * delta, y: shift.y * delta };
}

function resolveWuxingStrength(props: WuxingRadarChartProps) {
  const fromProps = {
    木: props.wood,
    火: props.fire,
    土: props.earth,
    金: props.metal,
    水: props.water,
  };
  const hasEnglishProps = Object.values(fromProps).some((value) => typeof value === "number");
  if (!hasEnglishProps) return props.wuxingStrength || {};
  return {
    木: fromProps.木 ?? props.wuxingStrength?.木 ?? 0,
    火: fromProps.火 ?? props.wuxingStrength?.火 ?? 0,
    土: fromProps.土 ?? props.wuxingStrength?.土 ?? 0,
    金: fromProps.金 ?? props.wuxingStrength?.金 ?? 0,
    水: fromProps.水 ?? props.wuxingStrength?.水 ?? 0,
  };
}

export default function WuxingRadarChart(props: WuxingRadarChartProps) {
  const { size = 286, dayType, dayMaster } = props;
  const id = useId().replace(/:/g, "");
  const items = normalizeStrength(resolveWuxingStrength(props));
  const byWx = Object.fromEntries(items.map((item) => [item.wx, item]));
  const centerLabel = dayMaster || dayType || [...items].sort((a, b) => b.percent - a.percent)[0]?.wx || "能量";

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
            <radialGradient key={wx} id={`${id}-${wx}`} cx="36%" cy="26%" r="86%">
              <stop offset="0%" stopColor={WX_COLOR[wx]} stopOpacity="0.86" />
              <stop offset="56%" stopColor={WX_COLOR[wx]} stopOpacity="0.64" />
              <stop offset="100%" stopColor={WX_COLOR[wx]} stopOpacity="0.46" />
            </radialGradient>
          ))}
        </defs>

        <circle cx="120" cy="120" r="103" fill="rgba(252,248,241,0.78)" filter={`url(#${id}-shadow)`} />
        <circle cx="120" cy="120" r="99" fill="#FBF7EF" stroke="#E1D5BB" strokeWidth="2.2" />

        <g clipPath={`url(#${id}-orb-clip)`}>
          <rect x="24" y="24" width="192" height="192" fill="#FBF7EF" />
          <rect x="24" y="24" width="192" height="192" opacity="0.34" filter={`url(#${id}-paper)`} />

          {REGION_RENDER_ORDER.map((wx) => {
            const item = byWx[wx];
            const emphasis = 0.76 + Math.min(0.2, item.percent / 180);
            const anchor = REGION_ANCHOR[wx];
            const scale = getAreaScale(wx, item.percent);
            const shift = getAreaShift(wx, item.percent);
            return (
              <g key={wx} transform={`translate(${shift.x} ${shift.y}) translate(${anchor.x} ${anchor.y}) scale(${scale}) translate(${-anchor.x} ${-anchor.y})`}>
                <path
                  d={REGION_PATH[wx]}
                  fill={`url(#${id}-${wx})`}
                  opacity={item.percent <= 2 ? 0.42 : emphasis}
                  stroke="#FBF7EF"
                  strokeWidth="6.5"
                  strokeLinejoin="round"
                  filter={`url(#${id}-watercolor)`}
                />
              </g>
            );
          })}

          <path d="M 35 95 C 59 83, 86 86, 109 102" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 137 79 C 160 84, 176 99, 181 119" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 48 148 C 71 161, 96 159, 116 145" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" strokeLinecap="round" />

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
