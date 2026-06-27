import requests
import logging
from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.redis import redis_client
from app.repositories.chat import ChatRepository

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

    @staticmethod
    def ask_ollama(prompt: str) -> str:
        try:
            response = requests.post(
                settings.OLLAMA_URL,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=120
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "No response returned from Ollama.")
            
        except requests.exceptions.ConnectionError:
            return "Ollama is not running. Please run: ollama serve on the host system."
        except requests.exceptions.Timeout:
            return "Ollama took too long to respond. Try a shorter question."
        except Exception as e:
            return f"Ollama error: {str(e)}"

    @staticmethod
    def ask_ollama_chat(messages: list) -> str:
        try:
            chat_url = settings.OLLAMA_URL.replace("/api/generate", "/api/chat")
            response = requests.post(
                chat_url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False
                },
                timeout=120
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "No response returned from Ollama.")
            
        except requests.exceptions.ConnectionError:
            return "Ollama is not running. Please run: ollama serve on the host system."
        except requests.exceptions.Timeout:
            return "Ollama took too long to respond. Try a shorter question."
        except Exception as e:
            return f"Ollama error: {str(e)}"

    @staticmethod
    def check_and_pull_model() -> None:
        try:
            base_url = settings.OLLAMA_URL.rsplit('/', 2)[0]
            tags_url = f"{base_url}/api/tags"
            pull_url = f"{base_url}/api/pull"
            
            response = requests.get(tags_url, timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = []
                for m in models:
                    name = m.get("name")
                    if name:
                        model_names.append(name)
                        if ":" in name:
                            model_names.append(name.split(":")[0])
                
                target = settings.OLLAMA_MODEL
                if target not in model_names:
                    logger.info(f"Model '{target}' not found in Ollama. Pulling it automatically...")
                    pull_res = requests.post(pull_url, json={"name": target, "stream": False}, timeout=300)
                    if pull_res.status_code == 200:
                        logger.info(f"Successfully pulled model '{target}'.")
                    else:
                        logger.error(f"Failed to pull model '{target}': {pull_res.text}")
                else:
                    logger.info(f"Model '{target}' is ready in Ollama.")
            else:
                logger.warning(f"Ollama tags endpoint returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Error checking/pulling Ollama model: {e}")
