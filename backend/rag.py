import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from config import settings

_ef = None


def _get_collection():
    global _ef
    if _ef is None:
        _ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    # Fresh client each call so server always sees latest ingested data
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return client.get_or_create_collection(
        name=settings.collection_name,
        embedding_function=_ef,
    )


def retrieve_context(query: str, conversation=None, n_results: int = 8) -> str:
    collection = _get_collection()
    if collection.count() == 0:
        return ""

    # Enrich query with recent conversation context
    if conversation:
        recent = " ".join(
            m.get("content", "") for m in conversation[-3:] if m.get("role") == "user"
        )
        if recent:
            query = f"{query} {recent}"

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    if not docs:
        return ""

    parts = []
    for doc, meta in zip(docs, metas):
        source = meta.get("source", "unknown")
        parts.append(f"[{source}]\n{doc}")

    return "\n\n---\n\n".join(parts)
