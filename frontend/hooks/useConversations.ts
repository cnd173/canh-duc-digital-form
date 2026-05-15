"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageType } from "../components/Message";

const STORAGE_KEY = "cnd_conversations";
const CURRENT_KEY = "cnd_current_conv";

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  messages: MessageType[];
};

const WELCOME: MessageType = {
  role: "assistant",
  content: "Chào! Mình là phiên bản số của Cảnh Đức. Mình đang nói chuyện với ai vậy?",
  isWelcome: true,
};

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function makeTitle(messages: MessageType[]): string {
  const first = messages.find((m) => m.role === "user" && m.content && !m.gifUrl);
  if (!first) return "Cuộc trò chuyện mới";
  const t = first.content.trim();
  return t.length > 36 ? t.slice(0, 35) + "…" : t;
}

function newConv(): Conversation {
  return { id: makeId(), title: "Cuộc trò chuyện mới", createdAt: Date.now(), messages: [WELCOME] };
}

function load(): { convs: Conversation[]; currentId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const convs: Conversation[] = raw ? JSON.parse(raw) : [];
    const currentId = localStorage.getItem(CURRENT_KEY) ?? "";
    if (convs.length === 0) {
      const c = newConv();
      return { convs: [c], currentId: c.id };
    }
    const exists = convs.some((c) => c.id === currentId);
    return { convs, currentId: exists ? currentId : convs[0].id };
  } catch {
    const c = newConv();
    return { convs: [c], currentId: c.id };
  }
}

function save(convs: Conversation[], currentId: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  localStorage.setItem(CURRENT_KEY, currentId);
}

export function useConversations() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { convs: c, currentId: id } = load();
    setConvs(c);
    setCurrentId(id);
    setHydrated(true);
  }, []);

  const current = convs.find((c) => c.id === currentId) ?? null;

  const updateMessages = useCallback(
    (msgs: MessageType[]) => {
      setConvs((prev) => {
        const next = prev.map((c) =>
          c.id === currentId ? { ...c, messages: msgs, title: makeTitle(msgs) } : c
        );
        save(next, currentId);
        return next;
      });
    },
    [currentId]
  );

  const switchTo = useCallback((id: string) => {
    setCurrentId(id);
    localStorage.setItem(CURRENT_KEY, id);
  }, []);

  const addNew = useCallback(() => {
    const c = newConv();
    setConvs((prev) => {
      const next = [c, ...prev];
      save(next, c.id);
      return next;
    });
    setCurrentId(c.id);
    return c.id;
  }, []);

  const deleteConv = useCallback(
    (id: string) => {
      setConvs((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const fallback = next.length > 0 ? next : [newConv()];
        const nextId = id === currentId ? fallback[0].id : currentId;
        save(fallback, nextId);
        setCurrentId(nextId);
        return fallback;
      });
    },
    [currentId]
  );

  return { convs, currentId, current, hydrated, updateMessages, switchTo, addNew, deleteConv };
}
