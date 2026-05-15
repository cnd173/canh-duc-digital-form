"use client";

export type MessageType = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export default function Message({ message }: { message: MessageType }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--accent-dim)] border border-[var(--accent)] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[var(--accent)] mt-1">
          ME
        </div>
      )}

      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--accent)] text-white rounded-tr-sm"
            : "bg-[var(--surface)] border border-[var(--border)] text-[#e8e8ee] rounded-tl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words m-0">
          {message.content}
          {message.streaming && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-blink align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
