"""Application settings loaded from environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database (individual fields to avoid URL-encoding issues with special chars)
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "orchid"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_POOL_MIN: int = 5
    DB_POOL_MAX: int = 20

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    LOG_QUEUE_NAME: str = "log_ingestion"

    # JWT
    JWT_SECRET_KEY: str = "change-me-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # AI — set at least one key in .env (backend tries OpenRouter first, Gemini second)
    OPENROUTER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""


settings = Settings()
