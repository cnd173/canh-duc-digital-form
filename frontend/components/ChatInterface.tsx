"use client";

import { useEffect, useRef, useState } from "react";
import ConversationSidebar from "./ConversationSidebar";
import InputBar from "./InputBar";
import Message, { MessageType } from "./Message";
import { useConversations } from "../hooks/useConversations";

export default function ChatInterface() {
  const { convs, currentId, current, hydrated, updateMessages, switchTo, addNew, deleteConv } =
    useConversations();

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages: MessageType[] = current?.messages ?? [];

  function setMessages(updater: MessageType[] | ((prev: MessageType[]) => MessageType[])) {
    const next = typeof updater === "function" ? updater(messages) : updater;
    // Skip saving while a message is still streaming
    const hasStreaming = next.some((m) => m.streaming);
    if (!hasStreaming) updateMessages(next);
    // Force re-render by updating via hook
    updateMessages(next);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendGif(url: string, desc: string) {
    if (streaming) return;
    const gifMsg: MessageType = { role: "user", content: `[Gửi GIF: ${desc}]`, gifUrl: url };
    updateMessages([...messages, gifMsg]);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: MessageType = { role: "user", content: text };
    const history = [...messages, userMsg];

    updateMessages(history);
    setInput("");
    setStreaming(true);

    const assistantMsg: MessageType = { role: "assistant", content: "", streaming: true };
    updateMessages([...history, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => !m.isWelcome && (m.role !== "assistant" || m.content))
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let latest = [...history, { role: "assistant" as const, content: "", streaming: true }];

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
            latest = [
              ...history,
              { role: "assistant" as const, content: accumulated, streaming: true },
            ];
            updateMessages(latest);
          } catch {}
        }
      }

      updateMessages([
        ...history,
        { role: "assistant" as const, content: accumulated, streaming: false },
      ]);
    } catch {
      updateMessages([
        ...history,
        {
          role: "assistant" as const,
          content: "Có lỗi xảy ra rồi. Backend đang chạy chưa vậy?",
          streaming: false,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="relative z-10 flex flex-col h-screen">
      {showSidebar && (
        <ConversationSidebar
          convs={convs}
          currentId={currentId}
          onSelect={switchTo}
          onNew={addNew}
          onDelete={deleteConv}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/[0.07] bg-black/40 backdrop-blur-2xl px-6 py-4 flex items-center gap-4">
        {/* History button */}
        <button
          onClick={() => setShowSidebar(true)}
          title="Lịch sử trò chuyện"
          className="w-9 h-9 flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.04] text-white/35 flex items-center justify-center hover:bg-white/10 hover:border-white/20 hover:text-white/65 transition-all"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-white/10 blur-lg" />
          <img
            src="/avatar.jpg"
            alt="Cảnh Đức"
            className="relative w-10 h-10 rounded-full object-cover border border-white/20"
          />
        </div>

        <div>
          <h1 className="text-sm font-semibold text-white/90 leading-tight tracking-wide">
            {current?.title === "Cuộc trò chuyện mới" ? "Cảnh Đức Digital Form" : current?.title}
          </h1>
          <p className="text-[11px] text-white/35 leading-tight mt-0.5">Nói đi đừng ngại</p>
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

      <InputBar value={input} onChange={setInput} onSend={send} onSendGif={sendGif} disabled={streaming} />
    </div>
  );
}
