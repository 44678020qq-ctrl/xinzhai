"use client";

import { useId } from "react";

interface WuxingRadarChartProps {
  wuxingStrength: Record<string, number>;
  size?: number;
  dayType?: string;
}

const WX_ORDER = ["木", "火", "土", "金", "水"] as const;

const WX_COLOR: Record<string, string> = {
  木: "#5E9C6B",
  火: "#D8744F",
  土: "#C9A86A",
  金: "#B9AE92",
  水: "#7AA0C4",
};

const WX_LABEL: Record<string, string> = {
  木: "生长",
  火: "热度",
  土: "承接",
  金: "边界",
  水: "流动",
};

const REGION_PATH: Record<string, string> = {
  木: "M 35 36 C 55 18, 91 16, 112 34 C 126 47, 118 68, 95 75 C 75 82, 44 68, 35 36 Z",
  火: "M 111 35 C 143 34, 161 57, 156 84 C 151 111, 121 116, 99 97 C 89 88, 91 79, 102 70 C 112 60, 121 48, 111 35 Z",
  土: "M 102 100 C 127 91, 155 101, 158 130 C 153 151, 130 162, 110 153 C 93 145, 88 122, 102 100 Z",
  金: "M 58 125 C 73 108, 98 116, 111 151 C 94 162, 66 160, 49 144 C 42 136, 47 130, 58 125 Z",
  水: "M 29 67 C 45 51, 72 54, 89 75 C 103 92, 89 116, 63 126 C 42 134, 23 119, 22 96 C 21 84, 23 74, 29 67 Z",
};

const LABEL_POS: Record<string, { x: number; y: number }> = {
  木: { x: 73, y: 48 },
  火: { x: 130, y: 73 },
  土: { x: 128, y: 124 },
  金: { x: 77, y: 141 },
  水: { x: 49, y: 98 },
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
  size = 220,
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
        viewBox="0 0 180 180"
        role="img"
        aria-label={`五行能量结构：${items.map((item) => `${item.wx}${item.percent}%`).join("，")}`}
        className="overflow-visible"
      >
        <defs>
          <clipPath id={`${id}-orb-clip`}>
            <circle cx="90" cy="90" r="68" />
          </clipPath>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#1A1A18" floodOpacity="0.08" />
          </filter>
          {WX_ORDER.map((wx) => (
            <radialGradient key={wx} id={`${id}-${wx}`} cx="42%" cy="35%" r="78%">
              <stop offset="0%" stopColor={WX_COLOR[wx]} stopOpacity="0.62" />
              <stop offset="68%" stopColor={WX_COLOR[wx]} stopOpacity="0.5" />
              <stop offset="100%" stopColor={WX_COLOR[wx]} stopOpacity="0.38" />
            </radialGradient>
          ))}
        </defs>

        <circle cx="90" cy="90" r="72" fill="rgba(255,255,255,0.64)" />
        <circle cx="90" cy="90" r="68" fill="var(--bg-card)" stroke="var(--line)" strokeWidth="1" filter={`url(#${id}-shadow)`} />

        <g clipPath={`url(#${id}-orb-clip)`}>
          <rect x="18" y="18" width="144" height="144" fill="#FBF8F3" />
          {WX_ORDER.map((wx) => {
            const item = byWx[wx];
            const emphasis = 0.78 + Math.min(0.2, item.percent / 160);
            return (
              <path
                key={wx}
                d={REGION_PATH[wx]}
                fill={`url(#${id}-${wx})`}
                opacity={emphasis}
                stroke="rgba(251,248,243,0.82)"
                strokeWidth="5.5"
                strokeLinejoin="round"
                style={{ animation: "fadeUp .25s ease-out both" }}
              />
            );
          })}
          <circle cx="90" cy="90" r="29" fill="rgba(251,248,243,0.92)" stroke="rgba(229,227,220,0.8)" strokeWidth="1" />
        </g>

        <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(201,188,154,0.42)" strokeWidth="1.2" />
        <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="5" />

        {WX_ORDER.map((wx) => {
          const item = byWx[wx];
          const pos = LABEL_POS[wx];
          return (
            <g key={`label-${wx}`} opacity={item.percent <= 3 ? 0.35 : 1}>
              <text x={pos.x} y={pos.y - 3} textAnchor="middle" dominantBaseline="middle" fill="#FBF8F3" className="font-serif-bazi text-[13px] font-semibold">
                {wx}
              </text>
              <text x={pos.x} y={pos.y + 13} textAnchor="middle" dominantBaseline="middle" fill="#FBF8F3" className="num text-[10px] font-medium">
                {item.percent}%
              </text>
            </g>
          );
        })}

        <text x="90" y="85" textAnchor="middle" dominantBaseline="middle" fill="var(--ink)" className="font-serif-bazi text-[21px] font-semibold">
          {centerLabel}
        </text>
        <text x="90" y="108" textAnchor="middle" dominantBaseline="middle" fill="var(--sub)" className="text-[10px] font-medium">
          五行结构
        </text>
      </svg>

      <div className="w-full max-w-[270px] flex flex-col gap-2">
        <p className="text-center text-[13.5px] leading-6 text-ink-2">{getSummary(items)}</p>
        <div className="flex justify-center gap-3">
          {items.map((item) => (
            <div key={item.wx} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: WX_COLOR[item.wx] }} />
              <span className="text-[10px] text-sub">{WX_LABEL[item.wx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
