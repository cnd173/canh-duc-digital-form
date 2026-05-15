"use client";

import { useEffect, useRef, useState } from "react";

const TENOR_KEY = "LIVDSRZULELA";
const LIMIT = 12;

type TenorGif = {
  id: string;
  title: string;
  content_description: string;
  media: { tinygif: { url: string } }[];
};

type Props = {
  onSelect: (url: string, description: string) => void;
  onClose: () => void;
};

export default function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchGifs(q: string) {
    setLoading(true);
    const endpoint = q.trim()
      ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${LIMIT}&media_filter=minimal&locale=vi_VN`
      : `https://api.tenor.com/v1/featured?key=${TENOR_KEY}&limit=${LIMIT}&media_filter=minimal`;
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.results ?? []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGifs("");
    inputRef.current?.focus();
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(value), 400);
  }

  // Close on outside click handled by parent overlay
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 mx-auto max-w-2xl px-0">
      <div className="bg-black/80 border border-white/10 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm GIF…"
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none focus:border-white/25"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1 px-3 pb-3 max-h-56 overflow-y-auto">
          {loading && (
            <div className="col-span-3 text-center py-6 text-white/20 text-xs">Đang tải…</div>
          )}
          {!loading && gifs.length === 0 && (
            <div className="col-span-3 text-center py-6 text-white/20 text-xs">Không tìm thấy</div>
          )}
          {!loading && gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => {
                const desc = gif.content_description || gif.title || "GIF";
                onSelect(gif.media[0].tinygif.url, desc);
                onClose();
              }}
              className="rounded-lg overflow-hidden aspect-square bg-white/[0.04] hover:ring-2 hover:ring-white/30 transition-all"
            >
              <img
                src={gif.media[0].tinygif.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
