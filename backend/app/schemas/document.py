from pydantic import BaseModel
from typing import Optional

class IngestDocumentRequest(BaseModel):
    title: str
    text: str
    jurisdiction: str
    language: str = "en"
    document_type: Optional[str] = "Law"

class IngestDocumentResponse(BaseModel):
    document_id: str
    title: str
    chunks_count: int
    entities_count: int
