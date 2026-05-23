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
import { InkMark } from "@/components/InkMark";

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
      <main className="min-h-screen flex items-center justify-center bg-bg page-in">
        <div className="animate-pulse text-sub text-sm">加载中…</div>
      </main>
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

  const point = selectedAge ? flowData.chartPoints.find((p) => p.age === selectedAge) : null;

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10 bg-bg">
      {/* 标题 */}
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <InkMark />
          <h2 className="text-xl font-semibold text-ink">流年运势</h2>
        </div>

        {/* 运势图 */}
        <section className="bg-card rounded-2xl p-5 shadow-sm border border-line/50">
          <div className="h-52 relative">
            {typeof window !== "undefined" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: -24, bottom: 0 }}
                  onClick={(e) => {
                    const payload = (e as { activePayload?: Array<{ payload: { age: number } }> })?.activePayload;
                    if (payload?.[0]) setSelectedAge(payload[0].payload.age);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECE7DF" />
                  <XAxis
                    dataKey="age"
                    stroke="#9A958C"
                    fontSize={10}
                    tickFormatter={(value) => (value % 10 === 0 ? `${value}岁` : "")}
                  />
                  <YAxis
                    domain={[30, 100]}
                    stroke="#9A958C"
                    fontSize={10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.98)",
                      border: "1px solid #ECE7DF",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown, name: unknown) => [String(value), name === "score" ? "运势" : String(name)]}
                    labelFormatter={(label) => {
                      const pt = chartData.find(d => d.age === label);
                      return pt ? `${pt.age}岁 · ${pt.year}年 · ${pt.ganZhi}` : `${label}岁`;
                    }}
                  />
                  {flowData.daYunList.slice(0, 6).map((dy) => (
                    <ReferenceLine
                      key={dy.startAge}
                      x={dy.startAge}
                      stroke="#ECE7DF"
                      strokeDasharray="3 3"
                      label={{ value: `${dy.gan}${dy.zhi}`, position: "top", fontSize: 9, fill: "#9A958C" }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6FA292"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#6FA292" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* 大运周期 */}
        <section className="bg-card rounded-2xl p-5 shadow-sm border border-line/50">
          <h2 className="text-sm font-semibold text-ink mb-3">大运周期</h2>
          <div className="grid grid-cols-4 gap-2">
            {flowData.daYunList.slice(0, 8).map((dy, i) => {
              const avgScore = chartData
                .filter((d) => d.age >= dy.startAge && d.age <= dy.endAge)
                .reduce((sum, d) => sum + d.score, 0) / Math.max(1, chartData.filter((d) => d.age >= dy.startAge && d.age <= dy.endAge).length);
              const isGood = flowData.isStrong ? dy.energyMain === "克泄耗" : dy.energyMain === "帮扶";

              return (
                <div
                  key={i}
                  className={`text-center p-2 rounded-xl cursor-pointer transition-all ${
                    selectedAge && selectedAge >= dy.startAge && selectedAge <= dy.endAge
                      ? "bg-accent-soft border border-accent/30"
                      : "bg-bg hover:bg-bg/80"
                  }`}
                  onClick={() => setSelectedAge(dy.startAge)}
                >
                  <div className="text-[10px] text-sub mb-1">{dy.startAge}-{dy.endAge}岁</div>
                  <div className="text-sm font-medium text-ink">{dy.gan}{dy.zhi}</div>
                  <div className={`text-[10px] mt-1 ${isGood ? "text-accent" : "text-fire"}`}>
                    {isGood ? "喜运" : "忌运"} · {Math.round(avgScore)}分
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 人生节点 */}
        <section className="bg-card rounded-2xl p-5 shadow-sm border border-line/50">
          <h2 className="text-sm font-semibold text-ink mb-3">人生节点</h2>
          <div className="flex flex-col gap-2">
            {flowData.events.map((event, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                  selectedAge === event.age ? "bg-accent-soft border border-accent/30" : "bg-bg hover:bg-bg/80"
                }`}
                onClick={() => setSelectedAge(event.age)}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  event.type === "turn"
                    ? event.energy === "喜" ? "bg-accent-soft text-accent" : "bg-fire/10 text-fire"
                    : event.type === "career" ? "bg-water/10 text-water"
                    : event.type === "love" ? "bg-fire/10 text-fire"
                    : event.type === "health" ? "bg-accent-soft text-accent"
                    : event.type === "wealth" ? "bg-earth/10 text-earth"
                    : "bg-bg text-sub"
                }`}>
                  {event.type === "turn" ? (event.energy === "喜" ? "起" : "守")
                    : event.type === "career" ? "事"
                    : event.type === "love" ? "情"
                    : event.type === "health" ? "健"
                    : event.type === "wealth" ? "财"
                    : "家"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ink">{event.title}</span>
                    <span className="text-xs text-sub">{event.age}岁 · {event.year}年</span>
                    {event.ganZhi && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-earth/10 text-earth rounded-full">{event.ganZhi}</span>
                    )}
                  </div>
                  <div className="text-xs text-sub leading-relaxed">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 选中年份详情 */}
        {point && (
          <section className="bg-card rounded-2xl p-5 shadow-sm border border-line/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">{selectedAge}岁 · {point.year}年 · {point.ganZhi}</h2>
              <button onClick={() => setSelectedAge(null)} className="text-xs text-sub hover:text-ink transition-colors">关闭</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{point.score}</div>
                <div className="text-[10px] text-sub">综合评分</div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                <div className="text-sub">年初：<span className="text-ink">{point.open}</span></div>
                <div className="text-sub">年末：<span className="text-ink">{point.close}</span></div>
                <div className="text-sub">最高：<span className="text-accent">{point.high}</span></div>
                <div className="text-sub">最低：<span className="text-fire">{point.low}</span></div>
              </div>
            </div>
            <div className="text-xs text-sub leading-relaxed bg-bg rounded-xl p-3">{point.reason}</div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-earth/10 text-earth rounded-full">{point.ganZhi}年</span>
              <span className={`px-2 py-1 rounded-full ${
                (flowData.isStrong ? point.daYunEnergy === "克泄耗" : point.daYunEnergy === "帮扶")
                  ? "bg-accent-soft text-accent" : "bg-fire/10 text-fire"
              }`}>
                {point.daYun}（{(flowData.isStrong ? point.daYunEnergy === "克泄耗" : point.daYunEnergy === "帮扶") ? "喜运" : "忌运"}）
              </span>
            </div>
          </section>
        )}

        {/* 返回入口 */}
        <button onClick={() => router.push("/card")} className="text-center text-xs text-line hover:text-sub transition-colors pt-2">
          ← 返回能量名片
        </button>
      </div>
    </main>
  );
}