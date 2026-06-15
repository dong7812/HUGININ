from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://huginin:huginin@localhost:5433/huginin"
    jwt_secret: str = "change-me-in-production"
    kafka_brokers: str = ""          # 빈 문자열이면 NullQueuePort 사용
    anthropic_api_key: str = ""
    github_webhook_secret: str = ""
    allowed_origins: str = "http://localhost:3000"  # 콤마 구분 — Vercel URL 추가
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
