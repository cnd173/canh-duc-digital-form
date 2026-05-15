"use client";

import { useEffect, useRef, useState } from "react";
import InputBar from "./InputBar";
import Message, { MessageType } from "./Message";

const WELCOME: MessageType = {
  role: "assistant",
  content: "Chào! Mình là phiên bản số của Cảnh Đức. Hỏi mình bất cứ thứ gì — suy nghĩ, quan điểm, trải nghiệm, hoặc chỉ đơn giản là hú hồn mình một cái.",
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: MessageType = { role: "user", content: text };
    const history = [...messages, userMsg];

    setMessages(history);
    setInput("");
    setStreaming(true);

    const assistantMsg: MessageType = { role: "assistant", content: "", streaming: true };
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.role !== "assistant" || m.content)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              accumulated = `⚠️ ${parsed.error}`;
            } else {
              accumulated += parsed.text ?? "";
            }
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: accumulated, streaming: true };
              return next;
            });
          } catch {}
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: accumulated, streaming: false };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "Có lỗi xảy ra rồi. Backend đang chạy chưa vậy?", streaming: false };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="relative z-10 flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.07] bg-black/40 backdrop-blur-2xl px-6 py-4 flex items-center gap-4">
        {/* White hole orb */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-white/20 blur-lg animate-orb" />
          <div className="relative w-10 h-10 rounded-full border border-white/20 bg-gradient-to-br from-white/15 to-blue-200/5 backdrop-blur flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_4px_rgba(255,255,255,0.7)]" />
          </div>
        </div>

        <div>
          <h1 className="text-sm font-semibold text-white/90 leading-tight tracking-wide">Cảnh Đức Digital Form</h1>
          <p className="text-[11px] text-white/35 leading-tight mt-0.5">Luôn ở đây, luôn là mình</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] animate-pulse" />
          <span className="text-[11px] text-white/35">online</span>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((msg, i) => (
            <Message key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <InputBar value={input} onChange={setInput} onSend={send} disabled={streaming} />
    </div>
  );
}
