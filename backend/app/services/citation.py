import logging
import re
from typing import List, Dict, Any
from app.schemas.chat import CitationItem

logger = logging.getLogger(__name__)

class CitationService:
    @classmethod
    def generate_citations(
        cls, 
        response_text: str, 
        retrieved_documents: List[Dict[str, Any]], 
        retrieved_kg_entities: List[Dict[str, Any]] = None
    ) -> List[CitationItem]:
        """
        Parses response text to extract citation items mapping to retrieved documents/KG nodes.
        Supports explicit source indices [Source X], raw chunk UUIDs, and name mentions.
        """
        citations: Dict[str, CitationItem] = {}
        text_lower = response_text.lower()

        # 1. Parse explicit source index patterns (e.g. "Source [1]" or "[Source 1]")
        source_indices = re.findall(r'(?:source\s*\[?|\[source\s*)(\d+)\]?', response_text, re.IGNORECASE)
        for idx_str in source_indices:
            try:
                idx = int(idx_str) - 1
                if 0 <= idx < len(retrieved_documents):
                    doc = retrieved_documents[idx]
                    chunk_id = doc.get("chunk_id")
                    if chunk_id not in citations:
                        citations[chunk_id] = CitationItem(
                            source=doc.get("jurisdiction", "Legal Database"),
                            title=doc.get("title", "Legal Excerpt"),
                            page=f"Paragraph/Excerpt {idx + 1}",
                            chunk_id=chunk_id
                        )
            except Exception as e:
                logger.error(f"Error parsing source index citation: {e}")

        # 2. Parse direct UUID patterns
        for doc in retrieved_documents:
            chunk_id = doc.get("chunk_id")
            if chunk_id and chunk_id in response_text:
                if chunk_id not in citations:
                    citations[chunk_id] = CitationItem(
                        source=doc.get("jurisdiction", "Legal Database"),
                        title=doc.get("title", "Legal Excerpt"),
                        page="Direct reference match",
                        chunk_id=chunk_id
                    )

        # 3. Fallback: Search for exact titles/sections mentioned in text
        for idx, doc in enumerate(retrieved_documents):
            title = doc.get("title", "")
            chunk_id = doc.get("chunk_id")
            if title and title.lower() in text_lower:
                if chunk_id not in citations:
                    citations[chunk_id] = CitationItem(
                        source=doc.get("jurisdiction", "Legal Database"),
                        title=title,
                        page=f"Semantic mention match (Excerpt {idx + 1})",
                        chunk_id=chunk_id
                    )

        # 4. Search for KG entity mentions
        if retrieved_kg_entities:
            for ent in retrieved_kg_entities:
                ent_name = ent.get("name", "")
                ent_id = ent.get("entity_id", "")
                if ent_name and ent_name.lower() in text_lower:
                    citation_key = f"kg_{ent_id}"
                    if citation_key not in citations:
                        citations[citation_key] = CitationItem(
                            source="Knowledge Graph Entity",
                            title=f"{ent.get('type')}: {ent_name}",
                            page="KG relationship reference",
                            chunk_id=ent_id
                        )

        return list(citations.values())
