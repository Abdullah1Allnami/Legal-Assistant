from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StartSessionRequest(BaseModel):
    language: str = "auto"
    country: str = "auto"

class StartSessionResponse(BaseModel):
    session_id: str
    status: str

class EndSessionRequest(BaseModel):
    session_id: str

class EndSessionResponse(BaseModel):
    status: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "auto"
    country: str = "auto"

class CitationItem(BaseModel):
    source: Optional[str] = None
    title: Optional[str] = None
    page: Optional[str] = None
    chunk_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    citations: List[CitationItem] = []

# New schemas for past chats (ChatGPT style)
class ChatMessageResponse(BaseModel):
    id: str
    role: str
    text: str
    citations: List[CitationItem] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    language: str
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatSessionDetailResponse(BaseModel):
    id: str
    title: str
    language: str
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class RenameSessionRequest(BaseModel):
    title: str
