"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
  reasoning?: Array<{ step: string; content: string }>;
  verdict?: string;
}

interface ChatTarget {
  id: string;
  name: string;
  wuxing: string;
}

interface BaziInfo {
  dayMaster: string;
  dayMasterGan: string;
  strength: { level: string; score: number };
  yongShen: { yongShen: string[]; reason: string };
}

function now() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [bazi, setBazi] = useState<BaziInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 读取聊天对象
    const raw = sessionStorage.getItem("xinzhai_chat_target");
    let target: ChatTarget | null = null;
    if (raw) target = JSON.parse(raw);
    setChatTarget(target);

    // 读取八字
    const baziRaw = sessionStorage.getItem("xinzhai_bazi");
    if (baziRaw) {
      const info: BaziInfo = JSON.parse(baziRaw);
      setBazi(info);
      const t = now();
      setMessages([{
        id: "m1", from: "other", time: t,
        text: target
          ? `你好，${target.wuxing}人格已连接。有什么想了解的？`
          : `你好，我是心斋。${info.dayMasterGan}${info.dayMaster}日主，${info.strength?.level || "中和"}。有什么想聊的？`,
      }]);
    } else {
      const birthRaw = sessionStorage.getItem("xinzhai_birth");
      if (birthRaw) {
        import("@/lib/bazi").then((mod) => {
          const form = JSON.parse(birthRaw);
          const bazi = mod.calculateBazi(
            parseInt(form.birth_year), parseInt(form.birth_month), parseInt(form.birth_day),
            form.birth_hour ? parseInt(form.birth_hour) : undefined,
            form.birth_minute ? parseInt(form.birth_minute) : undefined,
            form.is_lunar || false
          );
          const strength = mod.judgeStrength(bazi);
          const yongShen = mod.findYongShen(bazi);
          const info: BaziInfo = { dayMaster: bazi.day.wuxing_gan, dayMasterGan: bazi.dayGan, strength, yongShen };
          setBazi(info);
          sessionStorage.setItem("xinzhai_bazi", JSON.stringify(info));
          const t = now();
          setMessages([{
            id: "m1", from: "other", time: t,
            text: target
              ? `你好，${target.wuxing}人格已连接。有什么想了解的？`
              : `你好，我是心斋。${info.dayMasterGan}${info.dayMaster}日主，${info.strength?.level || "中和"}。有什么想聊的？`,
          }]);
        });
      } else {
        setMessages([{
          id: "m1", from: "other", time: now(),
          text: "你好，我是心斋。请先到「入斋」填写生辰信息。",
        }]);
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const t = now();
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      from: "me",
      text: input.trim(),
      time: t,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          bazi,
          chatTarget,
          history: messages.slice(-10).map((m) => ({
            role: m.from === "me" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      const reply: Message = {
        id: `msg_${Date.now() + 1}`,
        from: "other",
        text: data.reply || "请再说一次？",
        time: now(),
        reasoning: data.reasoning,
        verdict: data.verdict,
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now() + 1}`, from: "other", text: "抱歉，我需要想一下。", time: now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen max-w-sm mx-auto pt-safe">
      {/* 顶部栏 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-ink-50 to-white border-b border-ink-100 shrink-0">
        <button
          onClick={() => router.push("/match")}
          className="text-[10px] text-ink-400 hover:text-ink-700 transition-colors font-light"
        >
          ←
        </button>
        <div className="flex-1 text-center flex flex-col items-center gap-0.5">
          <span className="text-xs text-ink-800 tracking-wider font-light">
            {chatTarget ? `${chatTarget.name || chatTarget.wuxing} · 对谈` : `${bazi?.dayMasterGan || ""}${bazi?.dayMaster || "命理"} · 对谈`}
          </span>
          <div className="flex items-center gap-2">
            {bazi?.strength && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-light ${
                bazi.strength.level.includes("旺") ? "bg-red-50 text-red-600" :
                bazi.strength.level.includes("弱") ? "bg-blue-50 text-blue-600" :
                "bg-emerald-50 text-emerald-600"
              }`}>
                {bazi.strength.level}
              </span>
            )}
            {bazi?.yongShen && bazi.yongShen.yongShen.length > 0 && (
              <span className="text-[9px] text-ink-500 font-light">
                用{bazi.yongShen.yongShen.join("、")}
              </span>
            )}
          </div>
        </div>
        <div className="w-4" />
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.from === "me" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 text-xs leading-relaxed font-light ${
                msg.from === "me"
                  ? "bg-ink-800 text-paper rounded-tl-sm rounded-bl-sm rounded-br-sm"
                  : "bg-ink-50 text-ink-800 rounded-tr-sm rounded-bl-sm rounded-br-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[9px] mt-1.5 text-right font-light ${
                msg.from === "me" ? "text-ink-300" : "text-ink-400"
              }`}>
                {msg.time}
              </p>
            </div>
            {msg.from === "other" && msg.reasoning && msg.reasoning.length > 0 && (
              <>
                <button
                  onClick={() => setShowReasoning(showReasoning === msg.id ? null : msg.id)}
                  className="text-[9px] text-ink-400 mt-1 hover:text-ink-600 transition-colors font-light"
                >
                  {showReasoning === msg.id ? "隐藏推理 ▴" : "查看推理 ▾"}
                </button>
                {showReasoning === msg.id && (
                  <div className="max-w-[75%] mt-1 px-3 py-2 bg-ink-50/50 rounded-sm text-[9px] text-ink-600 font-light space-y-1">
                    {msg.reasoning.map((r, i) => (
                      <p key={i}><span className="text-ink-400">{r.step}:</span> {r.content}</p>
                    ))}
                    {msg.verdict && (
                      <p className="pt-1 border-t border-ink-200 text-ink-700">
                        <span className="font-medium">结论:</span> {msg.verdict}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-2.5 bg-ink-50 text-ink-400 rounded-sm text-xs font-light">
              思考中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="px-4 py-3 pb-safe border-t border-ink-100 flex gap-2 shrink-0 bg-paper">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
          placeholder="输入消息…"
          disabled={loading}
          className="flex-1 bg-transparent text-xs text-ink-800 placeholder:text-ink-300 focus:outline-none font-light disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="text-[10px] text-ink-500 hover:text-ink-800 transition-colors disabled:opacity-30 font-light tracking-wider"
        >
          发送
        </button>
      </div>
    </main>
  );
}
