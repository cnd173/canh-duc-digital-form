"use client";

import { Conversation } from "../hooks/useConversations";

type Props = {
  convs: Conversation[];
  currentId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

function timeLabel(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}

export default function ConversationSidebar({ convs, currentId, onSelect, onNew, onDelete, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed left-0 top-0 bottom-0 z-30 w-72 flex flex-col bg-black/90 border-r border-white/[0.08] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.07]">
          <span className="text-sm font-semibold text-white/80">Lịch sử trò chuyện</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/08 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* New conversation button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/50 text-sm hover:bg-white/08 hover:text-white/70 hover:border-white/20 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Cuộc trò chuyện mới
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1">
          {convs.map((conv) => (
            <div
              key={conv.id}
              className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                conv.id === currentId
                  ? "bg-white/[0.08] border border-white/[0.12]"
                  : "hover:bg-white/[0.05] border border-transparent"
              }`}
              onClick={() => { onSelect(conv.id); onClose(); }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/75 truncate leading-tight">{conv.title}</p>
                <p className="text-[11px] text-white/25 mt-0.5">{timeLabel(conv.createdAt)}</p>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all mt-0.5"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
