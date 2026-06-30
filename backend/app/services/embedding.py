import logging
import random
from typing import List
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    _configured = False

    @classmethod
    def _ensure_configured(cls) -> bool:
        if cls._configured:
            return True
        
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return False
            
        try:
            genai.configure(api_key=api_key)
            cls._configured = True
            return True
        except Exception as e:
            logger.error(f"Failed to configure google-generativeai for embeddings: {e}")
            return False

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """
        Generates embedding for a single string using text-embedding-004.
        """
        if not cls._ensure_configured():
            # Return a mock vector of length 3072
            # We seed the random number generator based on the text hash so that the same text
            # produces the same mock embedding (deterministic mock vector search!)
            text_hash = hash(text)
            random.seed(text_hash)
            return [random.uniform(-0.1, 0.1) for _ in range(3072)]

        try:
            model_name = f"models/{settings.EMBEDDING_MODEL}"
            result = genai.embed_content(
                model=model_name,
                content=text,
                task_type="retrieval_document"
            )
            return result.get("embedding", [])
        except Exception as e:
            logger.error(f"Error calling embedding API: {e}")
            # Fallback to deterministic mock on exception
            text_hash = hash(text)
            random.seed(text_hash)
            return [random.uniform(-0.1, 0.1) for _ in range(3072)]

    @classmethod
    def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of strings.
        """
        if not cls._ensure_configured():
            return [cls.get_embedding(t) for t in texts]

        try:
            model_name = f"models/{settings.EMBEDDING_MODEL}"
            result = genai.embed_content(
                model=model_name,
                content=texts,
                task_type="retrieval_document"
            )
            # The returned structure is a dictionary with key 'embedding' containing a list of lists of floats
            return result.get("embedding", [])
        except Exception as e:
            logger.error(f"Error calling batch embedding API: {e}. Falling back to single item embedding.")
            return [cls.get_embedding(t) for t in texts]
