"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
  reasoning?: Array<{step: string, content: string}>;
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
  strength: {level: string, score: number};
  yongShen: {yongShen: string[], reason: string};
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
    // 读取聊天对象信息
    const raw = sessionStorage.getItem("xinzhai_chat_target");
    if (raw) {
      setChatTarget(JSON.parse(raw));
    }

    // 读取八字信息
    const baziRaw = sessionStorage.getItem("xinzhai_bazi");
    if (baziRaw) {
      const parsed = JSON.parse(baziRaw);
      setBazi(parsed);
      
      // AI 初始消息
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const initMsg = `你好，我是心斋。我看到你的命局 —— ${parsed.dayMasterGan}${parsed.dayMaster}日主，${parsed.strength?.level || "中和"}。有什么想聊的？`;
      
      setMessages([
        {
          id: "m1",
          from: "other",
          text: initMsg,
          time,
        },
      ]);
    } else {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      setMessages([
        {
          id: "m1",
          from: "other",
          text: "你好，我是心斋。有什么想聊的？",
          time,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      from: "me",
      text: input.trim(),
      time,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      // 调用 AI 对话 API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          bazi: bazi,
          history: messages.slice(-10).map(m => ({
            role: m.from === "me" ? "user" : "assistant",
            content: m.text
          }))
        })
      });
      
      const data = await res.json();
      
      const reply: Message = {
        id: `msg_${Date.now() + 1}`,
        from: "other",
        text: data.reply,
        time: `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
        reasoning: data.reasoning,
        verdict: data.verdict
      };
      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      console.error("对话失败:", error);
      const errorMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        from: "other",
        text: "抱歉，我需要想一下。能再说一遍吗？",
        time: `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen max-w-sm mx-auto">
      {/* 顶部 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-ink-100">
        <button
          onClick={() => router.push("/match")}
          className="text-[10px] text-ink-400 hover:text-ink-700 transition-colors font-light"
        >
          ← 返回
        </button>
        <div className="flex-1 text-center flex flex-col items-center gap-0.5">
          <span className="text-xs text-ink-700 tracking-wider font-light">
            {chatTarget?.name || "心斋对话"}
          </span>
          {chatTarget?.wuxing && (
            <span className="text-[9px] text-ink-400 font-light">
              {chatTarget.wuxing} · 日主
            </span>
          )}
        </div>
        <div className="w-8" />
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
              <p>{msg.text}</p>
              <p
                className={`text-[9px] mt-1.5 text-right font-light ${
                  msg.from === "me" ? "text-ink-300" : "text-ink-400"
                }`}
              >
                {msg.time}
              </p>
            </div>
            {/* 推理链展示 */}
            {msg.from === "other" && msg.reasoning && msg.reasoning.length > 0 && (
              <button
                onClick={() => setShowReasoning(showReasoning === msg.id ? null : msg.id)}
                className="text-[9px] text-ink-400 mt-1 hover:text-ink-600 transition-colors font-light"
              >
                {showReasoning === msg.id ? "隐藏推理 ▴" : "查看推理 ▾"}
              </button>
            )}
            {msg.from === "other" && showReasoning === msg.id && msg.reasoning && (
              <div className="max-w-[75%] mt-1 px-3 py-2 bg-ink-50/50 rounded text-[9px] text-ink-600 font-light space-y-1">
                {msg.reasoning.map((r, i) => (
                  <p key={i}>
                    <span className="text-ink-400">{r.step}:</span> {r.content}
                  </p>
                ))}
                {msg.verdict && (
                  <p className="pt-1 border-t border-ink-200 text-ink-700">
                    <span className="font-medium">结论:</span> {msg.verdict}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-2.5 bg-ink-50 text-ink-400 rounded text-xs font-light">
              思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="px-4 py-3 border-t border-ink-100 flex gap-2">
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
