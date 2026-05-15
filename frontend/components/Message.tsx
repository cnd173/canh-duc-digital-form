"use client";

export type MessageType = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 animate-fade-up ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="relative w-7 h-7 flex-shrink-0 mt-1">
          <div className="absolute inset-0 rounded-full bg-white/15 blur-md" />
          <div className="relative w-7 h-7 rounded-full border border-white/15 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/90 shadow-[0_0_8px_3px_rgba(255,255,255,0.5)]" />
          </div>
        </div>
      )}

      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-white/10 border border-white/20 text-white/90 rounded-tr-sm backdrop-blur-sm shadow-[0_0_24px_rgba(200,230,255,0.08)]"
            : "bg-black/30 border border-white/[0.06] text-white/80 rounded-tl-sm backdrop-blur-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words m-0">
          {message.content}
          {message.streaming && (
            <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-blink align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
