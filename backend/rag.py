from pathlib import Path
import re

DATA_FILES = [
    Path(__file__).parent / "persona.txt",
    Path(__file__).parent / "data" / "facebook_posts.md",
    Path(__file__).parent / "data" / "cach_noi_chuyen.md",
    Path(__file__).parent / "data" / "mo_ta_cua_gpt.txt",
    Path(__file__).parent / "data" / "TOLO_Layer0_Philosophical_Foundation.md",
    Path(__file__).parent / "data" / "TOLO_Layer0_Restructured.md",
]

CHUNK_SIZE = 300  # words
OVERLAP = 30
TOP_K = 6

_chunks: list[dict] = []


def _load():
    global _chunks
    if _chunks:
        return
    for f in DATA_FILES:
        if not f.exists():
            continue
        words = f.read_text(encoding="utf-8").split()
        i = 0
        while i < len(words):
            chunk = " ".join(words[i: i + CHUNK_SIZE])
            if len(chunk.strip()) > 60:
                _chunks.append({"text": chunk, "source": f.name})
            i += CHUNK_SIZE - OVERLAP


def _score(chunk_text: str, query_tokens: set) -> int:
    text_lower = chunk_text.lower()
    return sum(1 for t in query_tokens if t in text_lower)


def retrieve_context(query: str = "", conversation=None, n_results: int = TOP_K) -> str:
    _load()
    if not _chunks:
        return ""

    # Build query from current message + last 2 user turns
    q = query
    if conversation:
        recent = [m.get("content", "") for m in conversation[-4:] if m.get("role") == "user"]
        q = " ".join(recent)

    tokens = set(re.findall(r"\w+", q.lower())) - {"và", "là", "của", "có", "không", "bạn", "mình", "the", "a", "is"}

    # Always include persona.txt and cach_noi_chuyen chunks
    priority = [c for c in _chunks if c["source"] in ("persona.txt", "cach_noi_chuyen.md")][:4]
    rest = [c for c in _chunks if c["source"] not in ("persona.txt", "cach_noi_chuyen.md")]

    if tokens:
        scored = sorted(rest, key=lambda c: _score(c["text"], tokens), reverse=True)
    else:
        scored = rest

    selected = priority + scored[: max(0, n_results - len(priority))]

    parts = [f"[{c['source']}]\n{c['text']}" for c in selected]
    return "\n\n---\n\n".join(parts)
