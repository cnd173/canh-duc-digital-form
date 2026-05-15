import json
from pathlib import Path


class ChatParser:
    """
    Expects a JSON file: list of {"sender": str, "text": str} objects,
    or a directory of such files.
    Also handles plain text exports (WhatsApp format).
    """

    def parse(self, source: str) -> list[dict]:
        path = Path(source)
        docs = []

        files = [path] if path.is_file() else sorted(path.rglob("*.json")) + sorted(path.rglob("*.txt"))

        for file in files:
            text = file.read_text(errors="ignore").strip()
            if not text:
                continue

            if file.suffix == ".json":
                docs.extend(self._parse_json(text, str(file)))
            else:
                docs.extend(self._parse_plain(text, str(file)))

        return docs

    def _parse_json(self, text: str, file: str) -> list[dict]:
        try:
            data = json.loads(text)
            if isinstance(data, list):
                messages = [
                    f"{m.get('sender', 'me')}: {m.get('text', '')}"
                    for m in data
                    if m.get("text")
                ]
                if messages:
                    return [{"content": "\n".join(messages), "file": file}]
        except json.JSONDecodeError:
            pass
        return []

    def _parse_plain(self, text: str, file: str) -> list[dict]:
        return [{"content": text, "file": file}]
