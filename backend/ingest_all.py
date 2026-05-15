#!/usr/bin/env python3
"""
Build-time script: ingest all data files into a fresh ChromaDB.
Run this inside Docker during image build — never at runtime.
"""

import json
from pathlib import Path

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

DATA_DIR = Path(__file__).parent / "data"
CHROMA_DIR = str(Path(__file__).parent / "chroma_db")
COLLECTION_NAME = "personal_data"
BATCH_SIZE = 32

INSTAGRAM_DIR = DATA_DIR / "instagram-canh.d-2026-05-15-DnOViC8x"
INSTAGRAM_JSON = [
    INSTAGRAM_DIR / "your_instagram_activity/comments/post_comments_1.json",
    INSTAGRAM_DIR / "your_instagram_activity/threads/threads_and_replies.json",
    INSTAGRAM_DIR / "connections/followers_and_following/following.json",
]

TEXT_FILES = [
    DATA_DIR / "facebook_posts.md",
    DATA_DIR / "cach_noi_chuyen.md",
    DATA_DIR / "mo_ta_cua_gpt.txt",
    DATA_DIR / "TOLO_Layer0_Philosophical_Foundation.md",
    DATA_DIR / "TOLO_Layer0_Restructured.md",
    Path(__file__).parent / "persona.txt",
]


def upsert_batched(col, chunks, start_id, source, file_path):
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        col.upsert(
            documents=batch,
            ids=[f"doc_{start_id + i + j}" for j in range(len(batch))],
            metadatas=[{"source": source, "file": file_path}] * len(batch),
        )


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 40) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if len(chunk.strip()) > 60:
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def main():
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Always start fresh
    try:
        client.delete_collection(COLLECTION_NAME)
        print("Deleted existing collection")
    except Exception:
        pass

    col = client.create_collection(name=COLLECTION_NAME, embedding_function=ef)
    doc_id = 0

    # Text / Markdown files
    for path in TEXT_FILES:
        if not path.exists():
            print(f"  SKIP (not found): {path.name}")
            continue
        content = path.read_text(encoding="utf-8")
        chunks = chunk_text(content)
        if not chunks:
            continue
        upsert_batched(col, chunks, doc_id, path.name, str(path))
        doc_id += len(chunks)
        print(f"  {len(chunks):3d} chunks  ← {path.name}")

    # Instagram JSON files
    for path in INSTAGRAM_JSON:
        if not path.exists():
            print(f"  SKIP (not found): {path.name}")
            continue
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  SKIP (parse error): {path.name}: {e}")
            continue

        texts = []
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, dict):
                    for v in item.values():
                        if isinstance(v, str) and len(v) > 30:
                            texts.append(v)
                        elif isinstance(v, list):
                            for sub in v:
                                if isinstance(sub, dict):
                                    for sv in sub.values():
                                        if isinstance(sv, str) and len(sv) > 30:
                                            texts.append(sv)
        elif isinstance(raw, dict):
            def extract(obj):
                if isinstance(obj, str) and len(obj) > 30:
                    texts.append(obj)
                elif isinstance(obj, list):
                    for item in obj:
                        extract(item)
                elif isinstance(obj, dict):
                    for v in obj.values():
                        extract(v)
            extract(raw)

        if not texts:
            print(f"  SKIP (no usable text): {path.name}")
            continue

        combined = "\n".join(texts)
        chunks = chunk_text(combined)
        if not chunks:
            continue
        upsert_batched(col, chunks, doc_id, path.name, str(path))
        doc_id += len(chunks)
        print(f"  {len(chunks):3d} chunks  ← {path.name}")

    print(f"\nDone. Total chunks in collection: {col.count()}")


if __name__ == "__main__":
    main()
