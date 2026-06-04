"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
}

interface ChatTarget {
  id: string;
  name: string;
  wuxing: string;
  isMock?: boolean;
}

function now() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function readChatTarget(): ChatTarget | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem("xinzhai_chat_target");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function initialMessages(target: ChatTarget | null): Message[] {
  if (!target) return [];
  return [{
    id: "m1",
    from: "other",
    time: now(),
    text: `和 ${target.name || target.wuxing} 的对话开始了`,
  }];
}

export default function ChatPage() {
  const router = useRouter();
  const [chatTarget] = useState<ChatTarget | null>(() => readChatTarget());
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(readChatTarget()));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const t = now();
    const newMsg: Message = { id: `msg_${Date.now()}`, from: "me", text: input.trim(), time: t };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const baziRaw = sessionStorage.getItem("xinzhai_bazi");
      const bazi = baziRaw ? JSON.parse(baziRaw) : null;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), bazi, chatTarget }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now() + 1}`, from: "other", text: data.reply || "抱歉，能再说一次吗？", time: now() }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now() + 1}`, from: "other", text: "抱歉，能再说一次吗？", time: now() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 空会话：无匹配对象 → 引导去遇合
  if (!chatTarget) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h2 className="text-base font-semibold text-ink mb-2">还没有对话</h2>
        <p className="text-sm text-sub mb-6 leading-relaxed">
          先去遇合找个人，<br />聊起来才知道合不合
        </p>
        <button
          onClick={() => router.push("/match")}
          className="px-6 py-2.5 rounded-2xl bg-accent text-white text-sm font-medium hover:bg-[#5A8D7A] transition-colors"
        >
          去遇合
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* 顶部栏 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-line/50 shrink-0">
        <button onClick={() => router.push("/match")} className="text-lg text-sub hover:text-accent transition-colors">←</button>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs font-semibold text-ink">
            {chatTarget.name || chatTarget.wuxing}
          </span>
        </div>
        <div className="w-4" />
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-6 py-6 flex flex-col gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.from === "me" ? "items-end" : "items-start"}`}>
            <div className={`msg-in max-w-[78%] px-4 py-2.5 text-xs leading-relaxed ${
              msg.from === "me"
                ? "bg-accent text-white rounded-2xl rounded-br-md"
                : "bg-card text-ink rounded-2xl rounded-bl-md shadow-sm border border-line/30"
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[9px] mt-1.5 text-right ${msg.from === "me" ? "text-white/60" : "text-sub"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[78%] px-4 py-2.5 bg-card rounded-2xl rounded-bl-md shadow-sm border border-line/30 text-xs text-sub">
              <span className="animate-pulse">…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="px-4 py-3 bg-card border-t border-line/50 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
          placeholder="说点什么…"
          disabled={loading}
          className="flex-1 bg-bg/50 rounded-2xl px-4 py-2.5 text-xs text-ink placeholder:text-line focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-2xl bg-accent text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5A8D7A] transition-colors shadow-sm"
        >
          发送
        </button>
      </div>
    </main>
  );
}
