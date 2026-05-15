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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--accent-dim)] border-2 border-[var(--accent)] flex items-center justify-center text-sm font-bold text-[var(--accent)]">
          ME
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white leading-tight">Cảnh Đức Digital Form</h1>
          <p className="text-xs text-[#666] leading-tight">Luôn ở đây, luôn là mình</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-[#666]">online</span>
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
