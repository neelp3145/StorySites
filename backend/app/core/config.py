from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "StorySites"
    debug: bool = False
    # No default — must be set via environment for admin sessions.
    secret_key: str = ""

    # Cursor hosting injects DATABASE_URL when cursor-app.json declares a database.
    # Local preview falls back to SQLite sample data.
    database_url: str = "sqlite+pysqlite:///./storysites.db"

    cors_origins: str = (
        "https://storysite-entry.netlify.app,"
        "http://localhost:5500,"
        "http://127.0.0.1:5500,"
        "http://127.0.0.1:3847,"
        "http://localhost:3847"
    )

    # No defaults — admin login fails closed until both are set.
    admin_username: str = ""
    admin_password: str = ""

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

    @property
    def admin_configured(self) -> bool:
        return bool(self.secret_key and self.admin_username and self.admin_password)


@lru_cache
def get_settings() -> Settings:
    return Settings()
