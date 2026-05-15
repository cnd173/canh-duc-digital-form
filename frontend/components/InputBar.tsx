"use client";

import { KeyboardEvent, useRef, useState } from "react";
import GifPicker from "./GifPicker";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onSendGif: (url: string) => void;
  disabled: boolean;
};

export default function InputBar({ value, onChange, onSend, onSendGif, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showGifs, setShowGifs] = useState(false);

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
    <div className="relative z-10 border-t border-white/[0.06] bg-black/40 backdrop-blur-2xl px-4 py-4">
      {/* GIF Picker — renders above input bar */}
      {showGifs && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowGifs(false)} />
          <div className="relative z-20">
            <GifPicker
              onSelect={(url) => { onSendGif(url); setShowGifs(false); }}
              onClose={() => setShowGifs(false)}
            />
          </div>
        </>
      )}

      <div className="max-w-2xl mx-auto flex items-end gap-2">
        {/* GIF button */}
        <button
          onClick={() => setShowGifs((v) => !v)}
          disabled={disabled}
          title="Gửi GIF"
          className={`w-10 h-10 flex-shrink-0 rounded-xl border text-white/50 flex items-center justify-center transition-all duration-200 disabled:opacity-20 ${
            showGifs
              ? "border-white/30 bg-white/15 text-white/80"
              : "border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-white/20 hover:text-white/70"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Hỏi mình bất cứ thứ gì…"
          rows={1}
          className="flex-1 resize-none bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all duration-200 focus:border-white/25 focus:bg-white/[0.07] focus:shadow-[0_0_20px_rgba(200,230,255,0.06)] disabled:opacity-30"
        />

        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="w-10 h-10 flex-shrink-0 rounded-xl border border-white/15 bg-white/8 text-white/80 flex items-center justify-center transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-20"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-white/15 mt-2">Enter để gửi · Shift+Enter để xuống dòng</p>
    </div>
  );
}
