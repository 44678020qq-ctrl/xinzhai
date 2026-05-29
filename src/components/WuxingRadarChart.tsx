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

function normalizeStrength(wuxingStrength: Record<string, number>) {
  const raw = WX_ORDER.map((wx) => Math.max(0, wuxingStrength[wx] || 0));
  const total = raw.reduce((sum, value) => sum + value, 0) || 1;
  return WX_ORDER.map((wx, index) => ({
    wx,
    value: raw[index] / total,
    percent: Math.round((raw[index] / total) * 100),
  }));
}

function buildSlices(items: ReturnType<typeof normalizeStrength>, size: number) {
  const center = size / 2;
  const radius = size * 0.43;
  let startAngle = -90;

  return items.map((item, index) => {
    const angle = Math.max(10, item.value * 360);
    const endAngle = startAngle + angle;
    const middleAngle = startAngle + angle / 2;
    const start = polarToCartesian(center, center, radius, startAngle);
    const end = polarToCartesian(center, center, radius, endAngle);
    const label = polarToCartesian(center, center, radius * 0.68, middleAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const wave = index % 2 === 0 ? radius * 0.08 : -radius * 0.06;
    const controlA = polarToCartesian(center, center, radius * 0.72 + wave, startAngle + angle * 0.32);
    const controlB = polarToCartesian(center, center, radius * 0.72 - wave, startAngle + angle * 0.68);

    const path = [
      `M ${center} ${center}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `C ${controlB.x} ${controlB.y} ${controlA.x} ${controlA.y} ${center} ${center}`,
      "Z",
    ].join(" ");

    startAngle = endAngle;
    return { ...item, path, label };
  });
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
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
  const slices = buildSlices(items, size);
  const center = size / 2;
  const circleRadius = size * 0.43;
  const strongest = [...items].sort((a, b) => b.value - a.value)[0];
  const centerLabel = dayType || strongest?.wx || "能量";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          role="img"
          aria-label={`五行能量结构：${items.map((item) => `${item.wx}${item.percent}%`).join("，")}`}
        >
          <defs>
            <clipPath id="wuxing-flow-circle">
              <circle cx={center} cy={center} r={circleRadius} />
            </clipPath>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1A1A18" floodOpacity="0.08" />
            </filter>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={circleRadius}
            fill="var(--bg-card)"
            stroke="var(--line)"
            strokeWidth="1"
            filter="url(#soft-shadow)"
          />

          <g clipPath="url(#wuxing-flow-circle)">
            {slices.map((slice, index) => (
              <path
                key={slice.wx}
                d={slice.path}
                fill={WX_COLOR[slice.wx]}
                opacity={0.34 + Math.min(0.32, slice.value * 0.75)}
                stroke="rgba(251,248,243,0.72)"
                strokeWidth="1.2"
                style={{ transition: "all .15s ease", animation: `fadeUp .25s ease-out ${index * 0.035}s both` }}
              />
            ))}
            <circle cx={center} cy={center} r={circleRadius * 0.28} fill="rgba(251,248,243,0.84)" />
          </g>

          <circle cx={center} cy={center} r={circleRadius} fill="none" stroke="var(--line)" strokeWidth="1" />

          {slices.map((slice) => (
            <g key={`label-${slice.wx}`}>
              <text
                x={slice.label.x}
                y={slice.label.y - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={WX_COLOR[slice.wx]}
                className="font-serif-bazi text-[13px] font-semibold"
              >
                {slice.wx}
              </text>
              <text
                x={slice.label.x}
                y={slice.label.y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--gray-600)"
                className="num text-[9px] font-medium"
              >
                {slice.percent}
              </text>
            </g>
          ))}

          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--ink)"
            className="font-serif-bazi text-[22px] font-semibold"
          >
            {centerLabel}
          </text>
          <text
            x={center}
            y={center + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--sub)"
            className="text-[10px] font-medium"
          >
            五行结构
          </text>
        </svg>
      </div>

      <div className="w-full max-w-[260px] flex flex-col gap-2">
        <p className="text-center text-[13.5px] leading-6 text-ink-2">{getSummary(items)}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {items.map((item) => (
            <div key={item.wx} className="min-w-0 flex flex-col items-center gap-1">
              <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(10, item.percent)}%`, background: WX_COLOR[item.wx] }}
                />
              </div>
              <span className="text-[10px] text-sub">{WX_LABEL[item.wx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
