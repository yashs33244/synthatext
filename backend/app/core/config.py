import os
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # ============================================
    # Environment Configuration
    # ============================================
    environment: Literal["local", "production"] = os.getenv("ENVIRONMENT", "local")
    
    # ============================================
    # URL Configuration (with fallback)
    # ============================================
    @property
    def backend_url(self) -> str:
        """Backend API URL with production fallback to local"""
        if self.environment == "production":
            return os.getenv("BACKEND_URL", "https://api-synthatext.itsyash.space")
        return "http://localhost:8000"
    
    @property
    def frontend_url(self) -> str:
        """Frontend app URL with production fallback to local"""
        if self.environment == "production":
            return os.getenv("FRONTEND_URL", "https://app-synthatext.itsyash.space")
        return "http://localhost:3001"
    
    @property
    def landing_url(self) -> str:
        """Landing page URL with production fallback to local"""
        if self.environment == "production":
            return os.getenv("LANDING_URL", "https://synthatext.itsyash.space")
        return "http://localhost:3000"
    
    # ============================================
    # Database & Redis (Secrets - from ENV only)
    # ============================================
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/synthatext")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # ============================================
    # JWT Configuration
    # ============================================
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"  # Not a secret, hardcoded
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    session_expire_hours: int = 168  # 7 days = 168 hours
    
    # ============================================
    # Google OAuth (Secrets - from ENV only)
    # ============================================
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    @property
    def google_redirect_uri(self) -> str:
        """Google OAuth redirect URI based on environment"""
        return f"{self.backend_url}/api/auth/google/callback"
    
    # ============================================
    # AWS S3 Configuration (Secrets - from ENV only)
    # ============================================
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "")
    
    # ============================================
    # API Keys (Secrets - from ENV only)
    # ============================================
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    
    # ============================================
    # Celery Configuration
    # ============================================
    @property
    def celery_broker_url(self) -> str:
        """Celery broker URL (uses Redis)"""
        return self.redis_url
    
    @property
    def celery_result_backend(self) -> str:
        """Celery result backend (uses Redis)"""
        return self.redis_url
    
    # ============================================
    # CORS Configuration (hardcoded, not secrets)
    # ============================================
    @property
    def cors_origins(self) -> list[str]:
        """CORS allowed origins based on environment"""
        if self.environment == "production":
            return [
                "https://synthatext.itsyash.space",
                "https://app-synthatext.itsyash.space",
                "https://api-synthatext.itsyash.space",
            ]
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:8000",
        ]
    
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    
    # ============================================
    # Application Settings (hardcoded)
    # ============================================
    app_name: str = "Synthatext API"
    debug: bool = environment == "local"
    
    class Config:
        case_sensitive = False
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables

settings = Settings()

def get_settings() -> Settings:
    """Get application settings instance"""
    return settings
