"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MatchData {
  id: string;
  wuxing_personality: string;
  summary: string;
  reason: string;
  dayMaster?: string;
}

export default function ResonancePage() {
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [icebreaker, setIcebreaker] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("xinzhai_match");
    if (!raw) {
      router.push("/match");
      return;
    }
    const matchData = JSON.parse(raw);
    setMatch(matchData);

    // 生成破冰语
    generateIcebreaker(matchData);
  }, [router]);

  const generateIcebreaker = (m: MatchData) => {
    const templates = [
      `你的${m.wuxing_personality}气质，让我想到深秋的月光。`,
      `看到你的${m.wuxing_personality}标签，觉得我们之间会有有趣的共振。`,
      `你的存在方式，像是我八字里缺失的那一笔。`,
      `不必多言，人格标签已经说明了很多。`,
    ];
    const pick = templates[Math.floor(Math.random() * templates.length)];
    setIcebreaker(pick);
  };

  const handleSend = async () => {
    setSending(true);
    // V1：模拟发送，V2：调用 API
    setTimeout(() => {
      setSending(false);
      setSent(true);
      // 保存聊天对象信息到 sessionStorage
      sessionStorage.setItem("xinzhai_chat_target", JSON.stringify({
        id: match?.id,
        name: match?.wuxing_personality || "匿名",
        wuxing: match?.dayMaster || "",
      }));
    }, 1200);
  };

  if (!match) return null;

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="animate-fade-in-up w-full max-w-sm flex flex-col gap-8">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-[0.5px] bg-ink-300" />
          <h2 className="text-base tracking-[0.2em] text-ink-800 font-light">
            共鸣卡
          </h2>
          <p className="text-[10px] text-ink-400 font-light">
            一张卡片，一句破冰
          </p>
        </div>

        {/* 对方人格信息 */}
        <div className="border border-ink-100 rounded-sm p-5 flex flex-col gap-3">
          <div className="text-center">
            <span className="text-lg text-ink-800 tracking-wider font-light">
              {match.wuxing_personality}
            </span>
            {match.dayMaster && (
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-ink-50 text-ink-500">
                {match.dayMaster}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-500 text-center leading-relaxed font-light">
            {match.summary}
          </p>
        </div>

        {/* 破冰语卡片 */}
        <div className="bg-ink-50/50 border border-ink-100 rounded-sm p-6 text-center">
          <p className="text-xs text-ink-600 leading-relaxed font-light italic">
            "{icebreaker || "正在生成破冰语…"}"
          </p>
        </div>

        {/* 操作 */}
        {!sent ? (
          <button
            onClick={handleSend}
            disabled={sending || !icebreaker}
            className="mt-2 py-3 border border-ink-300 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light disabled:opacity-40"
          >
            {sending ? "发送中…" : "发送共鸣卡"}
          </button>
        ) : (
          <div className="text-center flex flex-col gap-4">
            <p className="text-sm text-ink-700 font-light">
              共鸣卡已发送 ✓
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="py-3 border border-ink-700 text-ink-700 text-sm tracking-widest hover:bg-ink-50 transition-colors duration-500 font-light"
            >
              开始对话 →
            </button>
            <button
              onClick={() => router.push("/match")}
              className="text-[10px] text-ink-300 hover:text-ink-500 transition-colors font-light"
            >
              返回推荐列表
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
