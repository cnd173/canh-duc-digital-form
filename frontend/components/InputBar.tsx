"use client";

import { KeyboardEvent, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export default function InputBar({ value, onChange, onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Hỏi mình bất cứ thứ gì…"
          rows={1}
          className="flex-1 resize-none bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[#e8e8ee] placeholder-[#555] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-40"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="w-10 h-10 flex-shrink-0 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-[#444] mt-2">Enter để gửi · Shift+Enter để xuống dòng</p>
    </div>
  );
}
