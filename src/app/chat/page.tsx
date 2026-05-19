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
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 读取聊天对象信息
    const raw = sessionStorage.getItem("xinzhai_chat_target");
    if (raw) {
      setChatTarget(JSON.parse(raw));
    }

    // V1 mock 初始消息
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setMessages([
      {
        id: "m1",
        from: "other",
        text: "你好，共鸣卡已收到。你的八字气质很特别。",
        time,
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
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

    // 模拟对方回复
    setTimeout(() => {
      const replies = [
        "嗯，我能感受到你说的是什么。",
        "这个角度很有意思。",
        "继续聊，我在听。",
        "八字里的这个组合，确实会让人这样想。",
        "你的表达方式很特别。",
      ];
      const reply: Message = {
        id: `msg_${Date.now() + 1}`,
        from: "other",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500 + Math.random() * 1000);
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
            {chatTarget?.name || "共鸣对话"}
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
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
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
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="px-4 py-3 border-t border-ink-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入消息…"
          className="flex-1 bg-transparent text-xs text-ink-800 placeholder:text-ink-300 focus:outline-none font-light"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="text-[10px] text-ink-500 hover:text-ink-800 transition-colors disabled:opacity-30 font-light tracking-wider"
        >
          发送
        </button>
      </div>
    </main>
  );
}
