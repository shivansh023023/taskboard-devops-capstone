import os
import sys
from pathlib import Path
from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import settings
from backend.app.db.base import Base
from backend.app.db.session import get_db
from backend.app.main import app
from backend.app.models.task import Task

# Engine connected to test/dev PostgreSQL database
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database schema is created prior to running test suite."""
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after test suite
    with engine.connect() as conn:
        conn.execute(Task.__table__.delete())
        conn.commit()

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Provide a clean database session per test with automatic teardown."""
    db = TestingSessionLocal()
    # Clean tasks table before each test
    db.query(Task).delete()
    db.commit()
    try:
        yield db
    finally:
        db.query(Task).delete()
        db.commit()
        db.close()

@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient that overrides the get_db dependency with test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
