import logging
from typing import List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.kg import KGEntity, KGRelationship

logger = logging.getLogger(__name__)

class KGService:
    @staticmethod
    def create_entity(
        db: Session, 
        name: str, 
        entity_type: str, 
        properties: Dict[str, Any] = None
    ) -> KGEntity:
        """
        Creates a new entity in the Knowledge Graph.
        """
        entity = KGEntity(
            name=name,
            type=entity_type,
            properties=properties or {}
        )
        db.add(entity)
        db.commit()
        db.refresh(entity)
        return entity

    @staticmethod
    def create_relationship(
        db: Session, 
        source_id: str, 
        target_id: str, 
        relationship_type: str, 
        properties: Dict[str, Any] = None
    ) -> KGRelationship:
        """
        Creates a relationship edge between two entities in the Knowledge Graph.
        """
        # Ensure entity endpoints exist to prevent database constraint issues
        src = db.query(KGEntity).filter(KGEntity.id == source_id).first()
        tgt = db.query(KGEntity).filter(KGEntity.id == target_id).first()
        if not src or not tgt:
            raise ValueError(f"Source ID '{source_id}' or Target ID '{target_id}' does not exist.")

        # Check if the relationship already exists to prevent duplicate edges
        existing = db.query(KGRelationship).filter(
            KGRelationship.source_id == source_id,
            KGRelationship.target_id == target_id,
            KGRelationship.type == relationship_type
        ).first()

        if existing:
            return existing

        rel = KGRelationship(
            source_id=source_id,
            target_id=target_id,
            type=relationship_type,
            properties=properties or {}
        )
        db.add(rel)
        db.commit()
        db.refresh(rel)
        return rel

    @staticmethod
    def search_entities(db: Session, query: str, limit: int = 10) -> List[KGEntity]:
        """
        Fuzzy search for entities based on name or description in properties.
        """
        if not query:
            return []

        search_filter = f"%{query}%"
        # Match entity name or description key inside properties JSON
        results = db.query(KGEntity).filter(
            or_(
                KGEntity.name.ilike(search_filter),
                KGEntity.type.ilike(search_filter),
                KGEntity.properties.cast(String).ilike(search_filter)
            )
        ).limit(limit).all()
        return results

    @classmethod
    def traverse_subgraph(
        cls, 
        db: Session, 
        seed_entity_ids: List[str], 
        max_depth: int = 1
    ) -> Tuple[List[KGEntity], List[KGRelationship]]:
        """
        Traverses relationships starting from seed entity IDs up to a maximum depth.
        Returns a list of unique entities and relationships making up the subgraph.
        """
        if not seed_entity_ids:
            return [], []

        visited_entities: Dict[str, KGEntity] = {}
        visited_relationships: Dict[str, KGRelationship] = {}
        
        # Load seed entities
        seeds = db.query(KGEntity).filter(KGEntity.id.in_(seed_entity_ids)).all()
        for s in seeds:
            visited_entities[s.id] = s

        current_layer_ids = set(seed_entity_ids)

        for depth in range(max_depth):
            if not current_layer_ids:
                break

            # Find all relationships connecting to the current layer
            relations = db.query(KGRelationship).filter(
                or_(
                    KGRelationship.source_id.in_(current_layer_ids),
                    KGRelationship.target_id.in_(current_layer_ids)
                )
            ).all()

            next_layer_ids = set()
            new_relations = []

            for r in relations:
                if r.id in visited_relationships:
                    continue
                
                visited_relationships[r.id] = r
                new_relations.append(r)

                # Add the connected node to the traversal queue
                if r.source_id not in visited_entities:
                    next_layer_ids.add(r.source_id)
                if r.target_id not in visited_entities:
                    next_layer_ids.add(r.target_id)

            if not next_layer_ids:
                break

            # Fetch the new entities found in this layer
            new_entities = db.query(KGEntity).filter(KGEntity.id.in_(next_layer_ids)).all()
            for e in new_entities:
                visited_entities[e.id] = e

            current_layer_ids = next_layer_ids

        return list(visited_entities.values()), list(visited_relationships.values())

    @classmethod
    def format_subgraph_context(
        cls, 
        entities: List[KGEntity], 
        relationships: List[KGRelationship]
    ) -> str:
        """
        Formats a retrieved subgraph into a natural-language description for LLM consumption.
        """
        if not entities:
            return "No related entities found in the Legal Knowledge Graph."

        lines = ["=== LEGAL KNOWLEDGE GRAPH REFERENCE ==="]
        lines.append("Entities:")
        for e in entities:
            props_str = ", ".join([f"{k}: {v}" for k, v in e.properties.items()]) if e.properties else "None"
            lines.append(f"- [{e.type}] '{e.name}' (ID: {e.id}, Details: {props_str})")

        if relationships:
            lines.append("\nRelationships & References:")
            # Create helper maps to resolve IDs to names
            entity_map = {e.id: (e.name, e.type) for e in entities}
            for r in relationships:
                src_info = entity_map.get(r.source_id, (r.source_id, "Entity"))
                tgt_info = entity_map.get(r.target_id, (r.target_id, "Entity"))
                props_str = f" ({r.properties})" if r.properties else ""
                lines.append(f"- '{src_info[0]}' ({src_info[1]}) --[{r.type}]--> '{tgt_info[0]}' ({tgt_info[1]}){props_str}")
        
        lines.append("=======================================")
        return "\n".join(lines)

    @classmethod
    def get_subgraph_for_ui(db: Session, query: str, limit: int = 15) -> Dict[str, Any]:
        """
        Returns nodes and links formatted for UI visualization (like D3 or vis.js).
        """
        seeds = db.query(KGEntity).filter(
            or_(
                KGEntity.name.ilike(f"%{query}%"),
                KGEntity.type.ilike(f"%{query}%")
            )
        ).limit(5).all()

        seed_ids = [s.id for s in seeds]
        entities, relationships = cls.traverse_subgraph(db, seed_ids, max_depth=1)

        nodes = []
        for e in entities:
            nodes.append({
                "id": e.id,
                "label": e.name,
                "type": e.type,
                "properties": e.properties or {}
            })

        links = []
        for r in relationships:
            links.append({
                "id": r.id,
                "source": r.source_id,
                "target": r.target_id,
                "type": r.type,
                "properties": r.properties or {}
            })

        return {
            "nodes": nodes,
            "links": links
        }
# We cast String for postgres compatibility in filters
from sqlalchemy import String
