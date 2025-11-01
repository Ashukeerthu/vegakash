import os
from typing import List

class Settings:
    """Configuration settings for the application"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vegakash.db")
    
    # API Configuration
    API_TITLE: str = "VegaKash API"
    API_DESCRIPTION: str = "Personal Finance Management API with AI Insights"
    API_VERSION: str = "1.0.0"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    # Add Azure-specific CORS origins if provided
    if azure_origins := os.getenv("CORS_ORIGINS"):
        CORS_ORIGINS.extend([origin.strip() for origin in azure_origins.split(",")])
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Azure App Service specific
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()