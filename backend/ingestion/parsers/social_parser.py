import json
from pathlib import Path


class SocialParser:
    """
    Parses social media exports.
    Supports:
      - Twitter/X: tweets.js or tweets.json (Twitter archive format)
      - Generic: JSON list of {"text": str} or plain .txt files
    """

    def parse(self, source: str) -> list[dict]:
        path = Path(source)
        docs = []

        files = [path] if path.is_file() else sorted(path.rglob("*.json")) + sorted(path.rglob("*.js")) + sorted(path.rglob("*.txt"))

        for file in files:
            text = file.read_text(errors="ignore").strip()
            if not text:
                continue

            if file.suffix in (".json", ".js"):
                docs.extend(self._parse_json(text, str(file)))
            else:
                docs.append({"content": text, "file": str(file)})

        return docs

    def _parse_json(self, raw: str, file: str) -> list[dict]:
        # Twitter archive format: window.YTD.tweets.part0 = [...]
        if raw.startswith("window."):
            raw = raw[raw.index("=") + 1:].strip()

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return []

        posts = []

        if isinstance(data, list):
            for item in data:
                text = (
                    item.get("text")
                    or item.get("full_text")
                    or (item.get("tweet") or {}).get("full_text")
                    or (item.get("tweet") or {}).get("text")
                )
                if text and not text.startswith("RT "):
                    posts.append(text)

        if posts:
            return [{"content": "\n\n".join(posts), "file": file}]
        return []
