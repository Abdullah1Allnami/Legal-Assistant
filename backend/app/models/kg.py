from sqlalchemy import Column, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from uuid import uuid4

class KGEntity(Base):
    __tablename__ = "kg_entities"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # e.g., "Law", "Article", "Section", "Court Case", "Legal Concept", "Judge", etc.
    properties = Column(JSON, nullable=True)  # JSON details like description, date, jurisdiction, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class KGRelationship(Base):
    __tablename__ = "kg_relationships"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    source_id = Column(String, ForeignKey("kg_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(String, ForeignKey("kg_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # e.g., "REFERENCES", "AMENDS", "PRECEDENT_FOR", "APPLIES_TO", etc.
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
