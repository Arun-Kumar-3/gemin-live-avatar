"""Application configuration loaded from environment / .env."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Vertex AI
    google_application_credentials: str = "credentials.json"
    vertex_project_id: str = ""
    vertex_location: str = "us-central1"
    live_model: str = "gemini-live-2.5-flash-preview-native-audio"
    voice_name: str = "Aoede"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: str = "http://localhost:5173"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
