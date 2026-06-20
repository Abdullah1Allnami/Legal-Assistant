from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from app.core.database import Base
from uuid import uuid4

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    role = Column(String, default="user", nullable=False)
