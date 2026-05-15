from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv(Path(__file__).parent / ".env", override=True)


class Settings(BaseSettings):
    anthropic_api_key: str
    frontend_url: str = "*"
    chroma_persist_dir: str = str(Path(__file__).parent / "chroma_db")
    collection_name: str = "personal_data"


settings = Settings()
