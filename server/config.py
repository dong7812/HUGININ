from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://huginin:huginin@localhost:5433/huginin"
    jwt_secret: str = "change-me-in-production"
    kafka_brokers: str = ""          # 빈 문자열이면 NullQueuePort 사용
    anthropic_api_key: str = ""
    github_webhook_secret: str = ""
    allowed_origins: str = "http://localhost:3000"  # 콤마 구분 — Vercel URL 추가
    debug: bool = False

    # SMTP (이메일 인증)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "HUGININ <noreply@huginin.app>"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "https://huginin-server-production.up.railway.app/auth/google/callback"

    # 프론트엔드 base URL (OAuth 리다이렉트용)
    frontend_url: str = "https://huginin.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
