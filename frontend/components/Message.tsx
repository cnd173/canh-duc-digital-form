"use client";

import ReactMarkdown from "react-markdown";

export type MessageType = {
  role: "user" | "assistant";
  content: string;
  gifUrl?: string;
  streaming?: boolean;
  isWelcome?: boolean;
  timestamp?: number;
};

function TimeLabel({ ts }: { ts: number }) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return <span className="text-[10px] text-white/20 mt-1 px-1 select-none">{h}:{m}</span>;
}

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";
  const isTyping = !isUser && message.streaming && message.content === "";

  return (
    <div className={`flex gap-3 animate-fade-up ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="relative w-7 h-7 flex-shrink-0 mt-1">
          <img
            src="/avatar.jpg"
            alt="Cảnh Đức"
            className="w-7 h-7 rounded-full object-cover border border-white/15"
          />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[75%]`}>
        <div className={`${message.gifUrl ? "" : `px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-white/10 border border-white/20 text-white/90 rounded-tr-sm backdrop-blur-sm shadow-[0_0_24px_rgba(200,230,255,0.08)]"
            : "bg-black/30 border border-white/[0.06] text-white/80 rounded-tl-sm backdrop-blur-sm"
        }`}`}>
          {message.gifUrl ? (
            <img
              src={message.gifUrl}
              alt="sticker"
              className="rounded-2xl max-w-[180px] max-h-[180px] object-contain"
            />
          ) : isTyping ? (
            <span className="flex gap-1 items-center h-4">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
            </span>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:m-0 prose-p:leading-relaxed prose-ul:my-1 prose-li:my-0 prose-strong:text-white/90">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.streaming && (
                <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-blink align-middle" />
              )}
            </div>
          )}
        </div>
        {message.timestamp && !message.streaming && (
          <TimeLabel ts={message.timestamp} />
        )}
      </div>
    </div>
  );
}
