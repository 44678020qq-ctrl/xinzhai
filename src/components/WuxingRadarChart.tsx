"use client";

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

const BLOB_LAYOUT: Record<string, { x: number; y: number; rx: number; ry: number; rotate: number }> = {
  木: { x: 64, y: 58, rx: 38, ry: 48, rotate: -24 },
  火: { x: 48, y: 122, rx: 58, ry: 36, rotate: 14 },
  土: { x: 132, y: 123, rx: 38, ry: 30, rotate: -12 },
  金: { x: 128, y: 72, rx: 34, ry: 28, rotate: 28 },
  水: { x: 70, y: 92, rx: 42, ry: 32, rotate: -8 },
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
  const items = normalizeStrength(wuxingStrength);
  const centerLabel = dayType || items.find((item) => item.percent === Math.max(...items.map((i) => i.percent)))?.wx || "能量";
  const scale = size / 180;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 180 180"
        role="img"
        aria-label={`五行能量结构：${items.map((item) => `${item.wx}${item.percent}%`).join("，")}`}
        className="overflow-visible"
        style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
      >
        <defs>
          <clipPath id="wuxing-orb-clip">
            <circle cx="90" cy="90" r="68" />
          </clipPath>
          <filter id="orb-soften" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="orb-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#1A1A18" floodOpacity="0.1" />
          </filter>
        </defs>

        <circle cx="90" cy="90" r="68" fill="var(--bg-card)" stroke="var(--line)" strokeWidth="1" filter="url(#orb-shadow)" />

        <g clipPath="url(#wuxing-orb-clip)">
          <rect x="12" y="12" width="156" height="156" fill="#FBF8F3" />
          {items.map((item, index) => {
            const layout = BLOB_LAYOUT[item.wx];
            const energyScale = 0.72 + item.value * 1.55;
            return (
              <ellipse
                key={item.wx}
                cx={layout.x}
                cy={layout.y}
                rx={layout.rx * energyScale}
                ry={layout.ry * energyScale}
                fill={WX_COLOR[item.wx]}
                opacity={0.42 + Math.min(0.32, item.value * 0.8)}
                filter="url(#orb-soften)"
                transform={`rotate(${layout.rotate} ${layout.x} ${layout.y})`}
                style={{ animation: `fadeUp .25s ease-out ${index * 0.04}s both` }}
              />
            );
          })}
          <path
            d="M 28 106 C 54 84, 72 116, 96 94 C 118 74, 136 86, 157 62 L 157 168 L 28 168 Z"
            fill="rgba(251,248,243,0.62)"
          />
          <circle cx="90" cy="90" r="27" fill="rgba(251,248,243,0.88)" />
        </g>

        <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(229,227,220,0.95)" strokeWidth="1.2" />
        <circle cx="90" cy="90" r="71" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="5" />

        <text x="90" y="84" textAnchor="middle" dominantBaseline="middle" fill="var(--ink)" className="font-serif-bazi text-[22px] font-semibold">
          {centerLabel}
        </text>
        <text x="90" y="108" textAnchor="middle" dominantBaseline="middle" fill="var(--sub)" className="text-[10px] font-medium">
          五行结构
        </text>
      </svg>

      <div className="w-full max-w-[270px] flex flex-col gap-2">
        <p className="text-center text-[13.5px] leading-6 text-ink-2">{getSummary(items)}</p>
        <div className="grid grid-cols-5 gap-2">
          {items.map((item) => (
            <div key={item.wx} className="min-w-0 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(8, item.percent)}%`, background: WX_COLOR[item.wx] }}
                />
              </div>
              <span className="text-[10px] text-sub">{WX_LABEL[item.wx]}</span>
              <span className="num text-[9px] text-sub/70">{item.percent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
