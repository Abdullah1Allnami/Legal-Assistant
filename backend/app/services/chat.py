import logging
from uuid import uuid4
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.redis import redis_client
from app.repositories.chat import ChatRepository
from app.services.gemini import GeminiService
from app.services.retrieval import RetrievalService
from app.services.citation import CitationService

logger = logging.getLogger(__name__)

# Fallback sessions dictionary if Redis/Postgres is unavailable
_memory_sessions = {}

class ChatService:
    @staticmethod
    def start_session(db: Session, user_id: str, language: str, country: str = "auto") -> str:
        try:
            # Save to PostgreSQL
            session = ChatRepository.create_session(db, user_id=user_id, language=language, country=country)
            session_id = session.id
        except Exception as e:
            logger.error(f"Postgres session start failed, falling back to UUID and memory: {e}")
            session_id = str(uuid4())
            _memory_sessions[session_id] = {
                "user_id": user_id,
                "language": language,
                "country": country,
                "active": True
            }
            return session_id

        # Secondary Redis sync for active session cache if needed
        try:
            redis_client.hset(f"session:{session_id}", mapping={
                "user_id": user_id,
                "language": language,
                "country": country,
                "active": "true"
            })
            redis_client.expire(f"session:{session_id}", 86400)
        except Exception as e:
            logger.error(f"Redis session sync failed: {e}")
            
        return session_id

    @staticmethod
    def end_session(db: Session, session_id: str) -> bool:
        db_success = False
        try:
            # Deactivate in PostgreSQL
            session = ChatRepository.get_session(db, session_id)
            if session:
                session.is_active = False
                db.commit()
                db_success = True
        except Exception as e:
            logger.error(f"Postgres session end failed: {e}")

        # Update in Redis
        try:
            redis_client.hset(f"session:{session_id}", "active", "false")
            redis_client.expire(f"session:{session_id}", 300)
            return True
        except Exception as e:
            logger.error(f"Redis session end failed, falling back to memory: {e}")
            if session_id in _memory_sessions:
                _memory_sessions[session_id]["active"] = False
                return True
        return db_success

    @staticmethod
    def is_session_active(db: Session, session_id: str) -> bool:
        try:
            # Query PostgreSQL as the primary source of truth for active chats
            session = ChatRepository.get_session(db, session_id)
            if session:
                return session.is_active
        except Exception as e:
            logger.error(f"Postgres session check failed: {e}")

        # Fallback to Redis / memory
        try:
            session = redis_client.hgetall(f"session:{session_id}")
            if session:
                return session.get("active") == "true"
        except Exception as e:
            logger.error(f"Redis session check failed, falling back to memory: {e}")
            if session_id in _memory_sessions:
                return _memory_sessions[session_id]["active"]
        return False

    @classmethod
    def ask_gemini_rag(
        cls, 
        db: Session, 
        user_query: str, 
        history_messages: List[Dict[str, str]], 
        language: str, 
        country: str
    ) -> Tuple[str, List[Any]]:
        """
        Runs hybrid retrieval (vector store + KG), constructs grounded prompts,
        calls Google Gemini, generates source citations, and returns (answer, citations).
        """
        # 1. Retrieve legal context matching current user query
        context_str, retrieved_docs, retrieved_kg = RetrievalService.retrieve_context(
            db=db,
            query=user_query,
            jurisdiction=country,
            language=language
        )

        # 2. Build the System Instruction
        system_instruction = f"""You are a professional cross-border legal AI assistant.
Your goal is to answer the user's questions based ONLY on the retrieved legal evidence and knowledge graph excerpts provided in the context.

Rules:
- Formulate your legal reasoning step-by-step.
- Ground every statement strictly in the provided excerpts.
- Cite your sources by appending "[Source X]" (e.g. "[Source 1]", "[Source 2]") to the sentences referring to that source.
- Do NOT pretend to be a lawyer. State clearly that this is general legal information and not official legal advice.
- If the retrieved context does not contain sufficient details to answer the user query, state clearly that you have insufficient information.
- Provide a confidence indicator (e.g. "Confidence: High", "Confidence: Medium", "Confidence: Insufficient Information") at the end.

User settings:
- Selected Jurisdiction: {country}
- Output Language: {language}
"""

        # 3. Assemble chat payload for Gemini
        # We format historical turns, and for the final user query, we inject the retrieved context.
        formatted_messages = []
        for msg in history_messages:
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        # Inject the context and query block into the final turn
        final_prompt = (
            f"Here is the retrieved legal context for grounding:\n"
            f"{context_str}\n\n"
            f"-----------------\n\n"
            f"User Question: {user_query}\n"
            f"Explain clearly, step-by-step, referencing the above sources where appropriate."
        )
        
        formatted_messages.append({
            "role": "user",
            "content": final_prompt
        })

        # 4. Generate response via Gemini
        try:
            answer = GeminiService.chat(messages=formatted_messages, system_instruction=system_instruction)
        except Exception as e:
            logger.error(f"Failed to query Gemini: {e}")
            answer = f"An error occurred while generating response: {str(e)}"

        # 5. Extract citations based on the response text and retrieved documents
        citations = CitationService.generate_citations(
            response_text=answer,
            retrieved_documents=retrieved_docs,
            retrieved_kg_entities=retrieved_kg
        )

        return answer, citations
