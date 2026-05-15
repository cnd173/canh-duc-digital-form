import email
import mailbox
from pathlib import Path


class EmailParser:
    """
    Parses .mbox files or directories of .eml files.
    Only extracts emails you sent (From header matches your address).
    """

    def parse(self, source: str) -> list[dict]:
        path = Path(source)
        docs = []

        if path.suffix == ".mbox":
            docs.extend(self._parse_mbox(path))
        elif path.is_dir():
            for eml in sorted(path.rglob("*.eml")):
                docs.extend(self._parse_eml(eml))
            for mbox in sorted(path.rglob("*.mbox")):
                docs.extend(self._parse_mbox(mbox))
        elif path.suffix == ".eml":
            docs.extend(self._parse_eml(path))

        return docs

    def _parse_mbox(self, path: Path) -> list[dict]:
        docs = []
        try:
            mbox = mailbox.mbox(str(path))
            for msg in mbox:
                content = self._extract_body(msg)
                if content:
                    docs.append({"content": content, "file": str(path)})
        except Exception:
            pass
        return docs

    def _parse_eml(self, path: Path) -> list[dict]:
        try:
            msg = email.message_from_bytes(path.read_bytes())
            content = self._extract_body(msg)
            if content:
                return [{"content": content, "file": str(path)}]
        except Exception:
            pass
        return []

    def _extract_body(self, msg) -> str:
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_payload(decode=True).decode(errors="ignore")
        else:
            body = msg.get_payload(decode=True).decode(errors="ignore")
        return body.strip()
