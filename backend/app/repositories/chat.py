from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chat import ChatSession, ChatMessage
from datetime import datetime, timezone

class ChatRepository:
    @staticmethod
    def create_session(db: Session, user_id: str, language: str = "auto", country: str = "auto") -> ChatSession:
        db_session = ChatSession(
            user_id=user_id,
            language=language,
            country=country,
            is_active=True
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[ChatSession]:
        return db.query(ChatSession).filter(ChatSession.id == session_id).first()

    @staticmethod
    def get_user_sessions(db: Session, user_id: str) -> List[ChatSession]:
        return (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id, ChatSession.is_active == True)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    @staticmethod
    def update_session_title(db: Session, session_id: str, title: str) -> Optional[ChatSession]:
        db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if db_session:
            db_session.title = title
            db_session.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(db_session)
        return db_session

    @staticmethod
    def delete_session(db: Session, session_id: str) -> bool:
        db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if db_session:
            db.delete(db_session)
            db.commit()
            return True
        return False

    @staticmethod
    def create_message(
        db: Session, 
        session_id: str, 
        role: str, 
        text: str, 
        citations: Optional[list] = None
    ) -> ChatMessage:
        db_msg = ChatMessage(
            session_id=session_id,
            role=role,
            text=text,
            citations=citations or []
        )
        db.add(db_msg)
        
        # Touch updated_at for parent session
        db_session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if db_session:
            db_session.updated_at = datetime.now(timezone.utc)
            db.add(db_session)
            
        db.commit()
        db.refresh(db_msg)
        return db_msg

    @staticmethod
    def get_session_messages(db: Session, session_id: str) -> List[ChatMessage]:
        return (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
