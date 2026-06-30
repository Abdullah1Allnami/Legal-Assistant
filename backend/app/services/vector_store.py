import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import numpy as np

from app.models.document import LegalDocument, DocumentChunk

logger = logging.getLogger(__name__)

class VectorStoreService:
    @staticmethod
    def create_document(
        db: Session, 
        title: str, 
        jurisdiction: str, 
        language: str = "en", 
        document_type: Optional[str] = None,
        metadata_info: Optional[Dict[str, Any]] = None
    ) -> LegalDocument:
        """
        Creates a new LegalDocument record in PostgreSQL.
        """
        doc = LegalDocument(
            title=title,
            jurisdiction=jurisdiction,
            language=language,
            document_type=document_type,
            metadata_info=metadata_info or {}
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.info(f"Created LegalDocument: {doc.id} - '{doc.title}' ({doc.jurisdiction})")
        return doc

    @staticmethod
    def add_chunk(
        db: Session, 
        document_id: str, 
        chunk_index: int, 
        text: str, 
        embedding: List[float], 
        metadata_info: Optional[Dict[str, Any]] = None
    ) -> DocumentChunk:
        """
        Saves a DocumentChunk with its text and embedding array.
        """
        chunk = DocumentChunk(
            document_id=document_id,
            chunk_index=chunk_index,
            text=text,
            embedding=embedding,
            metadata_info=metadata_info or {}
        )
        db.add(chunk)
        db.commit()
        db.refresh(chunk)
        return chunk

    @staticmethod
    def delete_document(db: Session, document_id: str) -> bool:
        """
        Deletes a document and all cascading chunks.
        """
        doc = db.query(LegalDocument).filter(LegalDocument.id == document_id).first()
        if doc:
            db.delete(doc)
            db.commit()
            logger.info(f"Deleted LegalDocument and associated chunks: {document_id}")
            return True
        return False

    @staticmethod
    def similarity_search(
        db: Session, 
        query_embedding: List[float], 
        jurisdiction: Optional[str] = None, 
        language: Optional[str] = None, 
        limit: int = 5, 
        threshold: float = 0.4
    ) -> List[Dict[str, Any]]:
        """
        Perform a metadata-filtered vector similarity search over document chunks.
        Computes cosine similarity in memory using NumPy.
        """
        if not query_embedding:
            return []

        # Start query joining DocumentChunk with LegalDocument to enforce jurisdiction/language filtering at the database level
        query = db.query(DocumentChunk, LegalDocument).join(
            LegalDocument, DocumentChunk.document_id == LegalDocument.id
        )

        # Apply database filters
        if jurisdiction and jurisdiction.lower() != "auto":
            # Direct or case-insensitive matching
            query = query.filter(LegalDocument.jurisdiction.ilike(jurisdiction))
        if language and language.lower() != "auto":
            query = query.filter(LegalDocument.language.ilike(language))

        records = query.all()
        if not records:
            return []

        results = []
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)

        if q_norm == 0:
            return []

        for chunk, doc in records:
            c_vec = np.array(chunk.embedding, dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            
            if c_norm == 0:
                continue

            # Cosine similarity formula
            sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            
            if sim >= threshold:
                results.append({
                    "chunk": chunk,
                    "document": doc,
                    "similarity": sim
                })

        # Sort descending by similarity score
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]
