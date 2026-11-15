from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "StorySites API"
    debug: bool = False
    secret_key: str = "dev-secret-change-me"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    cors_origins: str = (
        "https://storysite-entry.netlify.app,"
        "http://localhost:5500,"
        "http://127.0.0.1:5500"
    )

    admin_username: str = "admin"
    admin_password: str = "change-me"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = "StorySites <noreply@example.com>"
    notify_to: str = ""
    smtp_use_tls: bool = True

    rate_limit: str = "10/minute"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.notify_to)


@lru_cache
def get_settings() -> Settings:
    return Settings()
