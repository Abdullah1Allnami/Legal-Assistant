import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.kg import KGService
from app.models.document import DocumentChunk, LegalDocument

logger = logging.getLogger(__name__)

class RetrievalService:
    @classmethod
    def retrieve_context(
        cls, 
        db: Session, 
        query: str, 
        jurisdiction: Optional[str] = None, 
        language: Optional[str] = None,
        limit: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Coordinates hybrid retrieval: Vector Search + Keyword Search + KG Subgraph.
        Returns:
            - Context String: Formatted text for insertion in the prompt.
            - Vector/Keyword chunks list (for citations).
            - KG Entities list (for citations/information).
        """
        search_limit = limit or settings.RETRIEVAL_LIMIT
        threshold = similarity_threshold or settings.SIMILARITY_THRESHOLD

        # 1. Vector Search
        query_embedding = EmbeddingService.get_embedding(query)
        vector_results = VectorStoreService.similarity_search(
            db=db,
            query_embedding=query_embedding,
            jurisdiction=jurisdiction,
            language=language,
            limit=search_limit,
            threshold=threshold
        )
        logger.info(f"Vector search returned {len(vector_results)} chunks above threshold {threshold}.")

        # 2. Keyword Search (for high exact-keyword matching recall)
        keyword_results = cls._keyword_search(
            db=db,
            query=query,
            jurisdiction=jurisdiction,
            language=language,
            limit=search_limit
        )
        logger.info(f"Keyword search returned {len(keyword_results)} chunks.")

        # 3. Knowledge Graph Subgraph Traversal
        kg_entities, kg_relations = cls._kg_search(db, query)
        logger.info(f"Knowledge Graph traversal returned {len(kg_entities)} entities and {len(kg_relations)} relations.")

        # 4. Deduplicate and Combine Chunks
        all_chunks: Dict[str, Dict[str, Any]] = {}
        
        # Add vector search results
        for item in vector_results:
            chunk = item["chunk"]
            all_chunks[chunk.id] = {
                "chunk": chunk,
                "document": item["document"],
                "score": item["similarity"],
                "source_type": "semantic"
            }

        # Add keyword search results
        for item in keyword_results:
            chunk = item["chunk"]
            if chunk.id in all_chunks:
                # Upgrade source description and add keyword bonus to score
                all_chunks[chunk.id]["source_type"] = "hybrid"
                all_chunks[chunk.id]["score"] = min(1.0, all_chunks[chunk.id]["score"] + 0.1)
            else:
                all_chunks[chunk.id] = {
                    "chunk": chunk,
                    "document": item["document"],
                    "score": 0.5, # Baseline score for keyword matches
                    "source_type": "keyword"
                }

        # Sort combined chunks by score descending
        sorted_chunks = list(all_chunks.values())
        sorted_chunks.sort(key=lambda x: x["score"], reverse=True)
        top_chunks = sorted_chunks[:search_limit]

        # 5. Format Prompt Context
        context_parts = []

        # Add KG Subgraph Context
        if kg_entities:
            kg_context = KGService.format_subgraph_context(kg_entities, kg_relations)
            context_parts.append(kg_context)

        # Add Chunk Documents Context
        context_parts.append("=== GROUNDED LEGAL DOCUMENT EXCERPTS ===")
        for idx, item in enumerate(top_chunks):
            doc = item["document"]
            chunk = item["chunk"]
            context_parts.append(
                f"Source [{idx + 1}]: {doc.title} ({doc.jurisdiction})\n"
                f"Reference ID: {chunk.id}\n"
                f"Excerpt:\n{chunk.text}\n"
                f"---"
            )
        
        if not top_chunks and not kg_entities:
            context_parts.append("No grounded legal documents found matching the user request.")

        assembled_context = "\n\n".join(context_parts)

        # Map return objects for citation purposes
        retrieved_documents = []
        for item in top_chunks:
            retrieved_documents.append({
                "chunk_id": item["chunk"].id,
                "text": item["chunk"].text,
                "title": item["document"].title,
                "jurisdiction": item["document"].jurisdiction
            })

        retrieved_kg_entities = []
        for ent in kg_entities:
            retrieved_kg_entities.append({
                "entity_id": ent.id,
                "name": ent.name,
                "type": ent.type,
                "properties": ent.properties or {}
            })

        return assembled_context, retrieved_documents, retrieved_kg_entities

    @classmethod
    def _keyword_search(
        cls, 
        db: Session, 
        query: str, 
        jurisdiction: Optional[str] = None, 
        language: Optional[str] = None, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Simple database-level text matching.
        """
        query_words = [w.strip() for w in query.split() if len(w.strip()) > 3]
        if not query_words:
            # Fallback to general query search
            query_words = [query]

        # Build combined filter: match any of the long words
        filters = []
        for word in query_words[:3]:  # Limit to 3 words to keep it fast
            filters.append(DocumentChunk.text.ilike(f"%{word}%"))

        db_query = db.query(DocumentChunk, LegalDocument).join(
            LegalDocument, DocumentChunk.document_id == LegalDocument.id
        )

        if jurisdiction and jurisdiction.lower() != "auto":
            db_query = db_query.filter(LegalDocument.jurisdiction.ilike(jurisdiction))
        if language and language.lower() != "auto":
            db_query = db_query.filter(LegalDocument.language.ilike(language))

        # Perform the actual text filters match
        if filters:
            from sqlalchemy import or_
            db_query = db_query.filter(or_(*filters))

        records = db_query.limit(limit * 2).all()
        
        results = []
        for chunk, doc in records:
            results.append({
                "chunk": chunk,
                "document": doc
            })
        return results[:limit]

    @classmethod
    def _kg_search(cls, db: Session, query: str) -> Tuple[List[Any], List[Any]]:
        """
        Finds entities matching query words and performs depth-1 relationship traversal.
        """
        # Find seed entities
        query_words = [w.strip() for w in query.split() if len(w.strip()) > 3]
        if not query_words:
            query_words = [query]

        from sqlalchemy import or_
        from app.models.kg import KGEntity
        
        filters = []
        for w in query_words[:3]:
            filters.append(KGEntity.name.ilike(f"%{w}%"))
            filters.append(KGEntity.type.ilike(f"%{w}%"))

        seeds = db.query(KGEntity).filter(or_(*filters)).limit(5).all()
        if not seeds:
            return [], []

        seed_ids = [s.id for s in seeds]
        return KGService.traverse_subgraph(db, seed_ids, max_depth=1)
