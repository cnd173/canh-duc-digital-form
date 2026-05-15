#!/usr/bin/env python3
"""
Ingestion pipeline — embed your personal data into the vector DB.

Usage:
    python ingestion/ingest.py --source data/notes/ --type text
    python ingestion/ingest.py --source data/chats.json --type chat
    python ingestion/ingest.py --source data/emails/ --type email
    python ingestion/ingest.py --source data/tweets.js --type social
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from config import settings
from ingestion.parsers import get_parser


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


def ingest(source: str, source_type: str):
    parser = get_parser(source_type)
    documents = parser.parse(source)

    if not documents:
        print(f"No documents found at {source}")
        return

    print(f"Parsed {len(documents)} document(s) from {source}")

    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    collection = client.get_or_create_collection(name=settings.collection_name, embedding_function=ef)

    all_chunks, all_ids, all_metas = [], [], []

    for i, doc in enumerate(documents):
        chunks = chunk_text(doc["content"])
        for j, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{source_type}_{i}_{j}")
            all_metas.append({"source": source_type, "file": doc.get("file", "")})

    if not all_chunks:
        print("No usable chunks found.")
        return

    print(f"Embedding {len(all_chunks)} chunk(s)...")

    batch = 100
    for i in range(0, len(all_chunks), batch):
        collection.upsert(
            documents=all_chunks[i : i + batch],
            ids=all_ids[i : i + batch],
            metadatas=all_metas[i : i + batch],
        )
        done = min(i + batch, len(all_chunks))
        print(f"  {done}/{len(all_chunks)} chunks ingested")

    print(f"Done. Collection now has {collection.count()} total chunks.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Path to file or directory")
    parser.add_argument("--type", required=True, choices=["text", "chat", "email", "social"])
    args = parser.parse_args()
    ingest(args.source, args.type)
