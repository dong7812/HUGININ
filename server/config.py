from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://huginin:huginin@localhost:5433/huginin"
    jwt_secret: str = "change-me-in-production"
    kafka_brokers: str = "localhost:9092"
    anthropic_api_key: str = ""
    github_webhook_secret: str = ""
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
