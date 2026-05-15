from pathlib import Path


class TextParser:
    EXTENSIONS = ["*.txt", "*.md", "*.rst"]

    def parse(self, source: str) -> list[dict]:
        path = Path(source)
        docs = []

        if path.is_file():
            text = path.read_text(errors="ignore").strip()
            if text:
                docs.append({"content": text, "file": str(path)})
        elif path.is_dir():
            for ext in self.EXTENSIONS:
                for file in sorted(path.rglob(ext)):
                    text = file.read_text(errors="ignore").strip()
                    if text:
                        docs.append({"content": text, "file": str(file)})
        return docs
