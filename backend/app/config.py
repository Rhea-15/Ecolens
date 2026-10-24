from functools import lru_cache
from pathlib import Path
import json

from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemma_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma4:e4b"
    gemma_api_key: str = ""
    gemma_api_model: str = "gemma-4-26b-a4b-it"
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def load_json(name: str):
    return json.loads((APP_DIR / name).read_text(encoding="utf-8"))


def dataset_labels() -> dict:
    return load_json("dataset_labels.json")


def facilities() -> list[dict]:
    return load_json("facilities.json")