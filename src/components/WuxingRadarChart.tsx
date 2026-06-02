"use client";

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
  木: "#79A27B",
  火: "#D98466",
  土: "#DAB96B",
  金: "#BEB69E",
  水: "#7EA9CC",
};

const WX_TEXT: Record<string, string> = {
  木: "#FDF9F0",
  火: "#FFF7EF",
  土: "#7A633A",
  金: "#726B57",
  水: "#F7FBFF",
};

const TEMPLATE_PERCENT: Record<string, number> = {
  木: 20,
  火: 23,
  土: 11,
  金: 11,
  水: 35,
};

const BLOB_LAYOUT: Record<string, {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate: number;
  radius: string;
  labelX: number;
  labelY: number;
}> = {
  木: {
    left: 55,
    top: 23,
    width: 108,
    height: 77,
    rotate: -5,
    radius: "46% 54% 55% 45% / 44% 43% 57% 56%",
    labelX: 102,
    labelY: 68,
  },
  火: {
    left: 128,
    top: 47,
    width: 91,
    height: 114,
    rotate: 8,
    radius: "42% 58% 49% 51% / 50% 42% 58% 50%",
    labelX: 169,
    labelY: 104,
  },
  土: {
    left: 139,
    top: 130,
    width: 82,
    height: 79,
    rotate: 12,
    radius: "55% 45% 42% 58% / 45% 51% 49% 55%",
    labelX: 169,
    labelY: 163,
  },
  金: {
    left: 72,
    top: 158,
    width: 86,
    height: 65,
    rotate: -9,
    radius: "44% 56% 55% 45% / 48% 51% 49% 52%",
    labelX: 100,
    labelY: 189,
  },
  水: {
    left: 17,
    top: 75,
    width: 123,
    height: 138,
    rotate: -10,
    radius: "58% 42% 48% 52% / 44% 55% 45% 56%",
    labelX: 58,
    labelY: 134,
  },
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

function getBlobScale(wx: string, percent: number) {
  const base = TEMPLATE_PERCENT[wx] || 20;
  return clamp(Math.sqrt((percent + 1) / (base + 1)), 0.18, 1.72);
}

function getBlobOpacity(percent: number) {
  if (percent <= 0) return 0.06;
  return clamp(0.38 + percent / 95, 0.42, 0.9);
}

function getFlowShift(wx: string, percent: number) {
  const base = TEMPLATE_PERCENT[wx] || 20;
  const delta = clamp((percent - base) / 28, -1, 1);
  const shifts: Record<string, { x: number; y: number }> = {
    木: { x: 0, y: -9 },
    火: { x: 8, y: -3 },
    土: { x: 8, y: 8 },
    金: { x: -6, y: 8 },
    水: { x: -10, y: 10 },
  };
  const shift = shifts[wx] || { x: 0, y: 0 };
  return { x: shift.x * delta, y: shift.y * delta };
}

export default function WuxingRadarChart(props: WuxingRadarChartProps) {
  const { size = 286, dayType, dayMaster } = props;
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

      <div
        role="img"
        aria-label={`五行能量意象：${items.map((item) => `${item.wx}${item.percent}%`).join("，")}`}
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(circle at 45% 42%, #FFFDF8 0%, #FBF6EC 56%, #F2EAD9 100%)",
          boxShadow: "0 18px 42px rgba(82, 70, 46, 0.09)",
        }}
      >
        <div className="absolute inset-[6px] rounded-full border-[7px] border-white/80" />
        <div className="absolute inset-[14px] rounded-full border-[2px] border-[#D9CBAE]" />
        <div className="absolute inset-[17px] overflow-hidden rounded-full bg-[#FBF7EF]">
          <div
            className="absolute inset-0 opacity-[0.34]"
            style={{
              background:
                "radial-gradient(circle at 18% 20%, rgba(206,188,146,.18), transparent 24%), radial-gradient(circle at 80% 68%, rgba(205,190,156,.16), transparent 28%), linear-gradient(120deg, rgba(255,255,255,.45), transparent 48%)",
            }}
          />

          {(["水", "木", "火", "土", "金"] as const).map((wx) => {
            const item = byWx[wx];
            const layout = BLOB_LAYOUT[wx];
            const scale = getBlobScale(wx, item.percent);
            const shift = getFlowShift(wx, item.percent);
            const opacity = getBlobOpacity(item.percent);
            return (
              <div
                key={wx}
                className="absolute"
                style={{
                  left: layout.left,
                  top: layout.top,
                  width: layout.width,
                  height: layout.height,
                  borderRadius: layout.radius,
                  opacity,
                  transform: `translate(${shift.x}px, ${shift.y}px) rotate(${layout.rotate}deg) scale(${scale})`,
                  transformOrigin: "50% 50%",
                  background: `radial-gradient(circle at 36% 28%, rgba(255,255,255,.42) 0%, ${WX_COLOR[wx]} 50%, ${WX_COLOR[wx]} 100%)`,
                  filter: "blur(.2px) saturate(.92)",
                  boxShadow: `inset 0 0 22px rgba(255,255,255,.34), 0 0 16px ${WX_COLOR[wx]}33`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-[inherit] opacity-45"
                  style={{
                    background:
                      "radial-gradient(circle at 25% 30%, rgba(255,255,255,.48), transparent 28%), radial-gradient(circle at 75% 78%, rgba(90,70,40,.16), transparent 42%)",
                  }}
                />
              </div>
            );
          })}

          <div className="absolute left-[56px] top-[92px] h-[20px] w-[88px] -rotate-[8deg] rounded-full bg-[#FBF7EF]/80 blur-[2px]" />
          <div className="absolute left-[119px] top-[105px] h-[18px] w-[78px] rotate-[28deg] rounded-full bg-[#FBF7EF]/76 blur-[2px]" />
          <div className="absolute left-[79px] top-[154px] h-[18px] w-[84px] rotate-[-18deg] rounded-full bg-[#FBF7EF]/74 blur-[2px]" />

          {WX_ORDER.map((wx) => {
            const item = byWx[wx];
            const layout = BLOB_LAYOUT[wx];
            if (item.percent <= 1) return null;
            return (
              <div
                key={`label-${wx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center leading-none"
                style={{
                  left: layout.labelX,
                  top: layout.labelY,
                  color: WX_TEXT[wx],
                  opacity: clamp(0.55 + item.percent / 70, 0.6, 1),
                  textShadow: wx === "土" || wx === "金" ? "0 1px 8px rgba(255,255,255,.7)" : "0 1px 7px rgba(47,40,28,.24)",
                }}
              >
                <div className="font-serif-bazi text-[17px] font-medium">{wx}</div>
                <div className="num mt-1 text-[11px] font-medium">{item.percent}%</div>
              </div>
            );
          })}

          <div className="absolute left-1/2 top-1/2 flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E5DCC8] bg-[#FFFBF3]/95 shadow-[0_2px_16px_rgba(91,76,48,0.08)]">
            <span className="font-serif-bazi text-[25px] font-medium text-[#2C6B9E]">{centerLabel}</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[280px] flex flex-col items-center gap-2">
        <p className="text-center text-[15px] leading-7 text-ink-2">{getSummary(items)}</p>
      </div>
    </div>
  );
}
