FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding model so it's baked into the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy source (chroma_db excluded via .dockerignore)
COPY . .

EXPOSE 8000

# Run ingest at startup (not build time) to avoid build-time OOM
CMD ["sh", "-c", "python ingest_all.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
