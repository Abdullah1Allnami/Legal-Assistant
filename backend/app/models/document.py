from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from datetime import datetime, timezone
from app.core.database import Base
from uuid import uuid4

class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    title = Column(String, nullable=False, index=True)
    jurisdiction = Column(String, nullable=False, index=True)
    language = Column(String, nullable=False, default="en")
    document_type = Column(String, nullable=True)  # e.g., "Constitution", "Civil Code", "Court Precedent"
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    document_id = Column(String, ForeignKey("legal_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    embedding = Column(JSON, nullable=False)  # Stored as a list of floats
    metadata_info = Column(JSON, nullable=True)
