import logging
import json
import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.gemini import GeminiService
from app.services.kg import KGService
from app.models.document import LegalDocument

logger = logging.getLogger(__name__)

class DocumentService:
    @classmethod
    def chunk_text(cls, text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
        """
        Splits text into overlapping chunks of words.
        """
        size = chunk_size or settings.CHUNK_SIZE
        overlap = chunk_overlap or settings.CHUNK_OVERLAP

        words = text.split()
        if len(words) <= size:
            return [text]

        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + size]
            chunks.append(" ".join(chunk_words))
            i += (size - overlap)
            
            # Prevent infinite loops if overlap >= size
            if size - overlap <= 0:
                break
                
        return chunks

    @classmethod
    def ingest_document(
        cls, 
        db: Session, 
        title: str, 
        text: str, 
        jurisdiction: str, 
        language: str = "en", 
        document_type: str = "Law"
    ) -> Tuple[LegalDocument, int, int]:
        """
        Ingests a document: creates a record, splits text, generates embeddings,
        stores vector chunks, extracts entities/relations, and populates the Knowledge Graph.
        """
        # 1. Create document entry
        doc = VectorStoreService.create_document(
            db=db,
            title=title,
            jurisdiction=jurisdiction,
            language=language,
            document_type=document_type,
            metadata_info={"char_length": len(text)}
        )

        # 2. Chunk text
        chunks = cls.chunk_text(text)
        logger.info(f"Split document '{title}' into {len(chunks)} chunks.")

        # 3. Generate embeddings and save chunks
        for idx, chunk_text in enumerate(chunks):
            embedding = EmbeddingService.get_embedding(chunk_text)
            VectorStoreService.add_chunk(
                db=db,
                document_id=doc.id,
                chunk_index=idx,
                text=chunk_text,
                embedding=embedding,
                metadata_info={"length": len(chunk_text)}
            )

        # 4. Extract entities and relationships to build the Knowledge Graph
        num_entities_added = cls.extract_and_populate_kg(db, title, text, document_type, doc.id)

        return doc, len(chunks), num_entities_added

    @classmethod
    def extract_and_populate_kg(
        cls, 
        db: Session, 
        doc_title: str, 
        doc_text: str, 
        doc_type: str, 
        doc_id: str
    ) -> int:
        """
        Extracts key legal entities and relationships and registers them in the Knowledge Graph.
        Utilizes Gemini for parsing, falling back to a regex-based heuristics builder.
        """
        # Create a root node for the document itself in the KG
        doc_node = KGService.create_entity(
            db=db,
            name=doc_title,
            entity_type="Legal Document",
            properties={"document_id": doc_id, "type": doc_type}
        )

        entities_count = 1  # Starting with the document root node itself

        # Attempt Gemini entity extraction
        extracted_data = cls._extract_with_gemini(doc_text[:8000]) # Send a representative sample to fit context limits
        
        # If Gemini extraction failed or is empty, use regex fallback
        if not extracted_data or (not extracted_data.get("entities") and not extracted_data.get("relationships")):
            logger.info("Falling back to heuristic regex entity extraction.")
            extracted_data = cls._extract_with_regex(doc_title, doc_text)

        # Map entities by temporary names to actual database IDs
        entity_name_to_id: Dict[str, str] = {doc_title.lower(): doc_node.id}

        # Add entities to KG
        for ent in extracted_data.get("entities", []):
            name = ent.get("name")
            ent_type = ent.get("type", "Legal Concept")
            props = ent.get("properties", {})
            
            if not name:
                continue

            try:

                # Check database
                from app.models.kg import KGEntity
                existing_entity = db.query(KGEntity).filter(
                    KGEntity.name.ilike(name),
                    KGEntity.type.ilike(ent_type)
                ).first()

                if existing_entity:
                    entity_node = existing_entity
                else:
                    entity_node = KGService.create_entity(db, name, ent_type, props)
                    entities_count += 1

                entity_name_to_id[name.lower()] = entity_node.id
            except Exception as e:
                logger.error(f"Error adding entity '{name}': {e}")

        # Add relationships to KG
        for rel in extracted_data.get("relationships", []):
            source_name = rel.get("source")
            target_name = rel.get("target")
            rel_type = rel.get("type", "RELATED_TO")
            props = rel.get("properties", {})

            if not source_name or not target_name:
                continue

            source_id = entity_name_to_id.get(source_name.lower())
            target_id = entity_name_to_id.get(target_name.lower())

            # If node names were not in the entity list, look up or create them dynamically
            if not source_id:
                try:
                    from app.models.kg import KGEntity
                    existing = db.query(KGEntity).filter(KGEntity.name.ilike(source_name)).first()
                    if existing:
                        source_id = existing.id
                    else:
                        new_node = KGService.create_entity(db, source_name, "Legal Concept")
                        source_id = new_node.id
                        entity_name_to_id[source_name.lower()] = source_id
                        entities_count += 1
                except:
                    continue

            if not target_id:
                try:
                    from app.models.kg import KGEntity
                    existing = db.query(KGEntity).filter(KGEntity.name.ilike(target_name)).first()
                    if existing:
                        target_id = existing.id
                    else:
                        new_node = KGService.create_entity(db, target_name, "Legal Concept")
                        target_id = new_node.id
                        entity_name_to_id[target_name.lower()] = target_id
                        entities_count += 1
                except:
                    continue

            try:
                KGService.create_relationship(db, source_id, target_id, rel_type, props)
            except Exception as e:
                logger.error(f"Error creating relationship: {e}")

        # Ensure all extracted entities have a relationship back to the document root if not otherwise linked
        for ent_name, ent_id in entity_name_to_id.items():
            if ent_id == doc_node.id:
                continue
            try:
                # Link as PART_OF or REFERENCED_IN
                KGService.create_relationship(db, ent_id, doc_node.id, "PART_OF", {"context": "Document ingestion"})
            except:
                pass

        return entities_count

    @classmethod
    def _extract_with_gemini(cls, sample_text: str) -> Dict[str, Any]:
        """
        Uses Google Gemini to extract structural entities and relationships from the text.
        """
        prompt = f"""You are an expert legal knowledge graph architect.
Analyze the following legal text and extract key legal entities and their relationships.

Entities can belong to categories like: "Law", "Article", "Section", "Court Case", "Legal Concept", "Judge", "Court", "Government Authority", "Legal Topic".
Relationships represent connections, such as: "REFERENCES", "AMENDS", "PRECEDENT_FOR", "APPLIES_TO", "PENALIZES", "EXEMPTS".

Text to analyze:
---
{sample_text}
---

Your response MUST be a JSON object containing exactly two lists: "entities" and "relationships".
Do NOT include any markdown code blocks, explanations, or extra text. Output ONLY valid JSON.

JSON Structure:
{{
  "entities": [
    {{
      "name": "Name of the entity (e.g., 'Article 74' or 'Supreme Court')",
      "type": "Category type",
      "properties": {{
        "description": "Short explanation of its role or content",
        "jurisdiction": "Country or state if mentioned"
      }}
    }}
  ],
  "relationships": [
    {{
      "source": "Name of source entity (must match a name in the entities list or the document title)",
      "target": "Name of target entity",
      "type": "Relationship type",
      "properties": {{
        "detail": "Description of relationship context"
      }}
    }}
  ]
}}
"""
        try:
            response_text = GeminiService.generate_text(prompt, temperature=0.1)
            # Strip potential markdown fences
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except Exception as e:
            logger.warning(f"Gemini-based KG extraction failed: {e}")
            return {}

    @classmethod
    def _extract_with_regex(cls, doc_title: str, text: str) -> Dict[str, Any]:
        """
        Heuristic regex fallback to parse articles/sections and associate them.
        """
        entities = []
        relationships = []

        # Find "Article \d+" or "Article \d+ \w+"
        articles = re.findall(r'(Article\s+\d+[\s\w]*)', text, re.IGNORECASE)
        # Find "Section \d+"
        sections = re.findall(r'(Section\s+\d+[\s\w]*)', text, re.IGNORECASE)
        # Find "Chapter \d+"
        chapters = re.findall(r'(Chapter\s+\d+[\s\w]*)', text, re.IGNORECASE)

        seen_names = set()

        for article in set(articles):
            name = article.strip()
            clean_name = re.sub(r'\s+', ' ', name)
            if clean_name.lower() not in seen_names:
                entities.append({
                    "name": clean_name,
                    "type": "Article",
                    "properties": {"description": f"Extracted article from {doc_title}"}
                })
                relationships.append({
                    "source": clean_name,
                    "target": doc_title,
                    "type": "PART_OF"
                })
                seen_names.add(clean_name.lower())

        for section in set(sections):
            name = section.strip()
            clean_name = re.sub(r'\s+', ' ', name)
            if clean_name.lower() not in seen_names:
                entities.append({
                    "name": clean_name,
                    "type": "Section",
                    "properties": {"description": f"Extracted section from {doc_title}"}
                })
                relationships.append({
                    "source": clean_name,
                    "target": doc_title,
                    "type": "PART_OF"
                })
                seen_names.add(clean_name.lower())

        for chap in set(chapters):
            name = chap.strip()
            clean_name = re.sub(r'\s+', ' ', name)
            if clean_name.lower() not in seen_names:
                entities.append({
                    "name": clean_name,
                    "type": "Chapter",
                    "properties": {"description": f"Extracted chapter from {doc_title}"}
                })
                relationships.append({
                    "source": clean_name,
                    "target": doc_title,
                    "type": "PART_OF"
                })
                seen_names.add(clean_name.lower())

        # Search for references to other documents
        precedents = re.findall(r'(Decision\s+No\s*\d+/\d+|Case\s+No\s*\d+|\bSupreme\s+Court\b)', text, re.IGNORECASE)
        for prec in set(precedents):
            name = prec.strip()
            if name.lower() not in seen_names:
                entities.append({
                    "name": name,
                    "type": "Court Case" if "case" in name.lower() or "decision" in name.lower() else "Court",
                    "properties": {"description": f"Reference found in {doc_title}"}
                })
                relationships.append({
                    "source": doc_title,
                    "target": name,
                    "type": "REFERENCES"
                })
                seen_names.add(name.lower())

        return {"entities": entities, "relationships": relationships}
