import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Get database URL from settings
DATABASE_URL = settings.DATABASE_URL

# Create SQLAlchemy engine with Azure-optimized configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # For PostgreSQL or other databases (Azure)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=300,    # Recycle connections every 5 minutes
        pool_size=10,        # Number of connections to maintain
        max_overflow=20      # Additional connections when needed
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()