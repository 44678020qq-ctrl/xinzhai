"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 动态导入 Recharts（避免 SSR 问题）
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import("recharts").then((mod) => mod.ReferenceLine),
  { ssr: false }
);

import { generateMockFlowData, type FlowPoint, type LifeEvent } from "@/lib/flow-data";
import Navigation from "@/components/Navigation";

export default function FlowPage() {
  const router = useRouter();
  const [flowData, setFlowData] = useState<ReturnType<typeof generateMockFlowData> | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<LifeEvent | null>(null);

  useEffect(() => {
    // 从 sessionStorage 获取用户数据
    const stored = sessionStorage.getItem("userData");
    if (!stored) {
      router.push("/register");
      return;
    }

    try {
      const userData = JSON.parse(stored);
      // 使用出生年份和日主生成数据
      const birthYear = userData.birthYear || 2003;
      const dayMaster = userData.bazi?.day?.gan || "丙";
      const data = generateMockFlowData(birthYear, dayMaster);
      setFlowData(data);
    } catch (e) {
      console.error("Failed to parse userData:", e);
      router.push("/register");
    }
  }, [router]);

  if (!flowData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">加载中...</div>
      </div>
    );
  }

  // 准备图表数据（只取前60年）
  const chartData = flowData.chartPoints.slice(0, 60).map((point) => ({
    age: point.age,
    year: point.year,
    score: point.score,
    daYun: point.daYun,
    ganZhi: point.ganZhi,
    reason: point.reason,
  }));

  // 关键人生事件
  const keyEvents = flowData.events;

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-stone-800">流年运势</h1>
          <div className="text-sm text-stone-500">
            {flowData.dayMaster}日主 · {flowData.bazi.join(" ")}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 运势曲线图 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="text-sm font-medium text-stone-600 mb-4">人生运势曲线</h2>
          
          {/* 图表容器 */}
          <div className="h-64 relative">
            {/* 动态加载 Recharts 组件 */}
            {typeof window !== "undefined" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(e) => {
                    const payload = (e as { activePayload?: Array<{ payload: { age: number } }> })?.activePayload;
                    if (payload?.[0]) {
                      setSelectedAge(payload[0].payload.age);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="age"
                    stroke="#a8a29e"
                    fontSize={11}
                    tickFormatter={(value) => (value % 10 === 0 ? `${value}岁` : "")}
                  />
                  <YAxis
                    domain={[30, 100]}
                    stroke="#a8a29e"
                    fontSize={11}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid #e7e5e4",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  
                  {/* 大运分界线 */}
                  {[8, 18, 28, 38, 48, 58].map((age) => (
                    <ReferenceLine
                      key={age}
                      x={age}
                      stroke="#d6d3d1"
                      strokeDasharray="3 3"
                    />
                  ))}
                  
                  {/* 运势曲线 */}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#92400e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#92400e" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* 大运周期 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="text-sm font-medium text-stone-600 mb-4">大运周期</h2>
          <div className="grid grid-cols-5 gap-2">
            {["8-17岁", "18-27岁", "28-37岁", "38-47岁", "48-57岁"].map((period, i) => {
              const ages = [8, 18, 28, 38, 48];
              const age = ages[i];
              const point = flowData.chartPoints.find((p) => p.age === age);
              const avgScore = chartData
                .filter((d) => d.age >= age && d.age < age + 10)
                .reduce((sum, d) => sum + d.score, 0) / 10;
              
              return (
                <div
                  key={period}
                  className={`text-center p-2 rounded-lg cursor-pointer transition-all ${
                    selectedAge && selectedAge >= age && selectedAge < age + 10
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-stone-50 hover:bg-stone-100"
                  }`}
                  onClick={() => setSelectedAge(age)}
                >
                  <div className="text-xs text-stone-500 mb-1">{period}</div>
                  <div className="text-sm font-medium text-stone-800">
                    {point?.daYun || "童限"}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      avgScore >= 70
                        ? "text-emerald-600"
                        : avgScore >= 50
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {Math.round(avgScore)}分
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 关键人生事件 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="text-sm font-medium text-stone-600 mb-4">关键人生节点</h2>
          <div className="space-y-3">
            {keyEvents.map((event, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  hoveredEvent === event
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-stone-50 hover:bg-stone-100"
                }`}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* 事件类型图标 */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                    event.type === "career"
                      ? "bg-blue-100 text-blue-600"
                      : event.type === "love"
                      ? "bg-rose-100 text-rose-600"
                      : event.type === "health"
                      ? "bg-emerald-100 text-emerald-600"
                      : event.type === "wealth"
                      ? "bg-amber-100 text-amber-600"
                      : event.type === "family"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {event.type === "career"
                    ? "事"
                    : event.type === "love"
                    ? "情"
                    : event.type === "health"
                    ? "健"
                    : event.type === "wealth"
                    ? "财"
                    : event.type === "family"
                    ? "家"
                    : "变"}
                </div>
                
                {/* 事件内容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-stone-800">{event.title}</span>
                    <span className="text-xs text-stone-400">
                      {event.age}岁 · {event.year}年
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 详细解读（选中某岁时显示） */}
        {selectedAge && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-stone-600">
                {selectedAge}岁运势详解
              </h2>
              <button
                onClick={() => setSelectedAge(null)}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                关闭
              </button>
            </div>
            
            {(() => {
              const point = flowData.chartPoints.find((p) => p.age === selectedAge);
              if (!point) return null;
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-700">
                        {point.score}
                      </div>
                      <div className="text-xs text-stone-400">综合评分</div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                      <div className="text-stone-500">
                        年初：<span className="text-stone-700">{point.open}</span>
                      </div>
                      <div className="text-stone-500">
                        年末：<span className="text-stone-700">{point.close}</span>
                      </div>
                      <div className="text-stone-500">
                        最高：<span className="text-emerald-600">{point.high}</span>
                      </div>
                      <div className="text-stone-500">
                        最低：<span className="text-rose-600">{point.low}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600 leading-relaxed">
                    {point.reason}
                  </div>
                  
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">
                      {point.ganZhi}年
                    </span>
                    <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded">
                      {point.daYun}运
                    </span>
                  </div>
                </div>
              );
            })()}
          </section>
        )}
      </main>

      {/* 底部导航 */}
      <Navigation />
    </div>
  );
}
