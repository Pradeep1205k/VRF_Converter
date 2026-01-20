from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Video Manipulator"
    api_v1_prefix: str = "/api"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./video_manipulator.db"
    storage_dir: str = "./storage"
    max_upload_mb: int = 1024
    allowed_mime_types: str = "video/mp4,video/x-matroska,video/webm,video/avi,video/quicktime"
    rate_limit_per_minute: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
