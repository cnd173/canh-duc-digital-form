from pathlib import Path

_context_cache = None

DATA_FILES = [
    Path(__file__).parent / "persona.txt",
    Path(__file__).parent / "data" / "facebook_posts.md",
    Path(__file__).parent / "data" / "cach_noi_chuyen.md",
    Path(__file__).parent / "data" / "mo_ta_cua_gpt.txt",
    Path(__file__).parent / "data" / "TOLO_Layer0_Philosophical_Foundation.md",
    Path(__file__).parent / "data" / "TOLO_Layer0_Restructured.md",
]


def retrieve_context(query: str = "", conversation=None, n_results: int = 8) -> str:
    global _context_cache
    if _context_cache is None:
        parts = []
        for f in DATA_FILES:
            if f.exists():
                content = f.read_text(encoding="utf-8").strip()
                if content:
                    parts.append(f"### {f.name}\n{content}")
        _context_cache = "\n\n---\n\n".join(parts)
    return _context_cache
