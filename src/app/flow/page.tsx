"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const ReferenceLine = dynamic(() => import("recharts").then((mod) => mod.ReferenceLine), { ssr: false });

import { generateFlowData, type FlowData, type LifeEvent } from "@/lib/flow-data";
import { calculateBazi } from "@/lib/bazi";
import Navigation from "@/components/Navigation";

export default function FlowPage() {
  const router = useRouter();
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("xinzhai_birth") || sessionStorage.getItem("userData");
    if (!stored) {
      router.push("/register");
      return;
    }

    try {
      const userData = JSON.parse(stored);
      const birthYear = parseInt(userData.birth_year) || 2003;
      const birthMonth = parseInt(userData.birth_month) || 1;
      const birthDay = parseInt(userData.birth_day) || 1;
      const birthHour = userData.birth_hour ? parseInt(userData.birth_hour) : null;
      const birthMinute = userData.birth_minute ? parseInt(userData.birth_minute) : 0;
      const gender = userData.gender || "male";

      let bazi;
      try {
        bazi = calculateBazi(birthYear, birthMonth, birthDay, birthHour, birthMinute);
      } catch {
        router.push("/register");
        return;
      }

      const data = generateFlowData(bazi, gender, birthYear);
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

  const chartData = flowData.chartPoints.slice(0, 60).map((point) => ({
    age: point.age,
    year: point.year,
    score: point.score,
    open: point.open,
    close: point.close,
    high: point.high,
    low: point.low,
    daYun: point.daYun,
    daYunEnergy: point.daYunEnergy,
    ganZhi: point.ganZhi,
    reason: point.reason,
  }));

  // 当前年龄标记
  const currentAge = new Date().getFullYear() - parseInt(flowData.bazi[2] ? "0" : "0"); // 简化

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* 顶部 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-stone-800">流年运势</h1>
          <div className="text-sm text-stone-500">
            {flowData.dayMasterWuxing}日主·{flowData.strengthLevel} · {flowData.bazi.join(" ")}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 运势K线图 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="text-sm font-medium text-stone-600 mb-2">人生运势曲线</h2>
          <p className="text-[11px] text-stone-400 mb-4">基于日主{flowData.dayMaster}与流年十神生克关系，每点=一年</p>
          
          <div className="h-64 relative">
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid #e7e5e4",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown, name: unknown) => [String(value), name === "score" ? "运势" : String(name)]}
                    labelFormatter={(label) => {
                      const point = chartData.find(d => d.age === label);
                      return point ? `${point.age}岁 · ${point.year}年 · ${point.ganZhi}` : `${label}岁`;
                    }}
                  />
                  
                  {/* 大运分界线 */}
                  {flowData.daYunList.slice(0, 6).map((dy) => (
                    <ReferenceLine
                      key={dy.startAge}
                      x={dy.startAge}
                      stroke="#d6d3d1"
                      strokeDasharray="3 3"
                      label={{ value: `${dy.gan}${dy.zhi}`, position: "top", fontSize: 9, fill: "#a8a29e" }}
                    />
                  ))}
                  
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
          <h2 className="text-sm font-medium text-stone-600 mb-2">大运周期</h2>
          <p className="text-[11px] text-stone-400 mb-4">阳男阴女顺排，每步10年</p>
          <div className="grid grid-cols-4 gap-2">
            {flowData.daYunList.slice(0, 8).map((dy, i) => {
              const avgScore = chartData
                .filter((d) => d.age >= dy.startAge && d.age <= dy.endAge)
                .reduce((sum, d) => sum + d.score, 0) / Math.max(1, chartData.filter((d) => d.age >= dy.startAge && d.age <= dy.endAge).length);
              
              return (
                <div
                  key={i}
                  className={`text-center p-2 rounded-lg cursor-pointer transition-all ${
                    selectedAge && selectedAge >= dy.startAge && selectedAge <= dy.endAge
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-stone-50 hover:bg-stone-100"
                  }`}
                  onClick={() => setSelectedAge(dy.startAge)}
                >
                  <div className="text-xs text-stone-500 mb-1">{dy.startAge}-{dy.endAge}岁</div>
                  <div className="text-sm font-medium text-stone-800">
                    {dy.gan}{dy.zhi}
                  </div>
                  <div className={`text-xs mt-1 ${
                    dy.energyMain === "帮扶"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}>
                    {dy.energyMain} · {Math.round(avgScore)}分
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 人生节点（转潮 + 关键事件） */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
          <h2 className="text-sm font-medium text-stone-600 mb-4">人生节点</h2>
          <div className="space-y-3">
            {flowData.events.map((event, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  selectedAge === event.age
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-stone-50 hover:bg-stone-100"
                }`}
                onClick={() => setSelectedAge(event.age)}
              >
                {/* 类型图标 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                  event.type === "turn"
                    ? event.energy === "帮扶" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    : event.type === "career"
                    ? "bg-blue-100 text-blue-600"
                    : event.type === "love"
                    ? "bg-rose-100 text-rose-600"
                    : event.type === "health"
                    ? "bg-emerald-100 text-emerald-600"
                    : event.type === "wealth"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {event.type === "turn" ? (event.energy === "帮扶" ? "起" : "守")
                    : event.type === "career" ? "事"
                    : event.type === "love" ? "情"
                    : event.type === "health" ? "健"
                    : event.type === "wealth" ? "财"
                    : "家"}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-stone-800">{event.title}</span>
                    <span className="text-xs text-stone-400">
                      {event.age}岁 · {event.year}年
                    </span>
                    {event.ganZhi && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                        {event.ganZhi}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 选中年份详情 */}
        {selectedAge && (() => {
          const point = flowData.chartPoints.find((p) => p.age === selectedAge);
          if (!point) return null;
          
          return (
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-stone-600">
                  {selectedAge}岁 · {point.year}年 · {point.ganZhi}
                </h2>
                <button
                  onClick={() => setSelectedAge(null)}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  关闭
                </button>
              </div>
              
              <div className="space-y-3">
                {/* K线数据 */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">{point.score}</div>
                    <div className="text-xs text-stone-400">综合评分</div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-stone-500">年初：<span className="text-stone-700">{point.open}</span></div>
                    <div className="text-stone-500">年末：<span className="text-stone-700">{point.close}</span></div>
                    <div className="text-stone-500">最高：<span className="text-emerald-600">{point.high}</span></div>
                    <div className="text-stone-500">最低：<span className="text-rose-600">{point.low}</span></div>
                  </div>
                </div>
                
                {/* 解读 */}
                <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600 leading-relaxed">
                  {point.reason}
                </div>
                
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">
                    {point.ganZhi}年
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    point.daYunEnergy === "帮扶" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {point.daYun} ({point.daYunEnergy})
                  </span>
                </div>
              </div>
            </section>
          );
        })()}
      </main>

      <Navigation />
    </div>
  );
}
