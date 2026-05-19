"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InputPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    year: "",
    month: "",
    day: "",
    hour: "",
    gender: "male" as "male" | "female",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.year || !form.month || !form.day) return;
    setLoading(true);
    // 将输入数据存储到 sessionStorage，跳转后读取
    sessionStorage.setItem("xinzhai_birth", JSON.stringify(form));
    router.push("/card");
  };

  const hourOptions = [
    "子时 (23:00-01:00)",
    "丑时 (01:00-03:00)",
    "寅时 (03:00-05:00)",
    "卯时 (05:00-07:00)",
    "辰时 (07:00-09:00)",
    "巳时 (09:00-11:00)",
    "午时 (11:00-13:00)",
    "未时 (13:00-15:00)",
    "申时 (15:00-17:00)",
    "酉时 (17:00-19:00)",
    "戌时 (19:00-21:00)",
    "亥时 (21:00-23:00)",
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="animate-fade-in-up flex w-full max-w-sm flex-col gap-8">
        <div className="text-center">
          <p className="text-xs text-ink-400 tracking-wider font-light">
            输入你的出生信息
          </p>
          <div className="mx-auto mt-3 w-8 h-[0.5px] bg-ink-300" />
        </div>

        {/* 日期输入 */}
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="年"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="border-b border-ink-200 bg-transparent py-2 text-center text-sm text-ink-800 placeholder:text-ink-300 focus:border-ink-500 focus:outline-none font-light"
          />
          <input
            type="number"
            placeholder="月"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
            className="border-b border-ink-200 bg-transparent py-2 text-center text-sm text-ink-800 placeholder:text-ink-300 focus:border-ink-500 focus:outline-none font-light"
          />
          <input
            type="number"
            placeholder="日"
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            className="border-b border-ink-200 bg-transparent py-2 text-center text-sm text-ink-800 placeholder:text-ink-300 focus:border-ink-500 focus:outline-none font-light"
          />
        </div>

        {/* 时辰选择（可选） */}
        <div>
          <select
            value={form.hour}
            onChange={(e) => setForm({ ...form, hour: e.target.value })}
            className="w-full border-b border-ink-200 bg-transparent py-2 text-center text-sm text-ink-600 focus:border-ink-500 focus:outline-none font-light"
          >
            <option value="">时辰（可选）</option>
            {hourOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* 性别选择 */}
        <div className="flex justify-center gap-8">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setForm({ ...form, gender: g })}
              className={`pb-1 text-sm tracking-wider border-b-2 transition-colors font-light ${
                form.gender === g
                  ? "border-ink-700 text-ink-900"
                  : "border-transparent text-ink-400"
              }`}
            >
              {g === "male" ? "乾造" : "坤造"}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.year || !form.month || !form.day}
          className="mt-4 py-3 border border-ink-300 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light disabled:opacity-30"
        >
          {loading ? "生成中…" : "生成人格卡"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-light"
        >
          ← 返回
        </button>
      </div>
    </main>
  );
}
