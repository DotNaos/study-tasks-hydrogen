from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "study-tasks-hydrogen-api"
    app_env: str = "development"
    app_debug: bool = True

    database_url: str = "postgresql+psycopg://study_tasks:study_tasks@db:5432/study_tasks"

    supabase_url: str = ""
    supabase_jwt_issuer: str = ""
    supabase_jwt_audience: str = "authenticated"
    supabase_jwks_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
