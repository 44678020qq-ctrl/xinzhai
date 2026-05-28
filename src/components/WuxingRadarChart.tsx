"use client";

import React from "react";

interface WuxingRadarChartProps {
  wuxingStrength: Record<string, number>; // {木: 0.2, 火: 0.3, ...}
  size?: number;
}

const WX_COLOR: Record<string, string> = {
  木: "#5E9C6B",
  火: "#D8744F",
  土: "#C9A86A",
  金: "#B9AE92",
  水: "#7AA0C4",
};

const WX_ORDER = ["木", "火", "土", "金", "水"];

export default function WuxingRadarChart({ wuxingStrength, size = 200 }: WuxingRadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;

  // 计算五个顶点的坐标
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2; // 从顶部开始
    const r = radius * Math.min(1, Math.max(0, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 生成五边形路径
  const generatePath = (values: number[]) => {
    const points = values.map((v, i) => getPoint(i, v));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  // 生成背景网格
  const generateGrid = (level: number) => {
    const values = Array(5).fill(level);
    return generatePath(values);
  };

  // 获取数值
  const values = WX_ORDER.map((wx) => wuxingStrength[wx] || 0);

  // 生成多边形路径
  const dataPath = generatePath(values);

  // 生成五个顶点的坐标（用于标签）
  const labelPoints = WX_ORDER.map((_, i) => getPoint(i, 1.2));

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, i) => (
          <path
            key={i}
            d={generateGrid(level)}
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* 轴线 */}
        {WX_ORDER.map((_, i) => {
          const p = getPoint(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="var(--line)"
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* 数据区域 */}
        <path
          d={dataPath}
          fill="rgba(29, 158, 117, 0.18)"
          stroke="var(--accent)"
          strokeWidth="2"
        />

        {/* 数据点 */}
        {values.map((v, i) => {
          const p = getPoint(i, v);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="var(--accent)"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* 标签 */}
        {WX_ORDER.map((wx, i) => {
          const p = labelPoints[i];
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[12px] font-medium"
              fill={WX_COLOR[wx] || "#666"}
            >
              {wx}
            </text>
          );
        })}
      </svg>

      {/* 数值显示 */}
      <div className="num text-[11px] font-medium text-sub tracking-normal">
        {WX_ORDER.map((wx) => Math.round((wuxingStrength[wx] || 0) * 100)).join(" · ")}
      </div>
    </div>
  );
}
