import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.kg import KGEntitySchema, KGSubgraphResponse
from app.services.kg import KGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kg", tags=["Knowledge Graph"])

@router.get("/search", response_model=StandardResponse[List[KGEntitySchema]])
def search_entities(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search the Knowledge Graph for entities matching name or property keywords.
    """
    try:
        entities = KGService.search_entities(db, q)
        return StandardResponse(
            success=True,
            data=entities
        )
    except Exception as e:
        logger.error(f"Error searching graph entities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/subgraph", response_model=StandardResponse[KGSubgraphResponse])
def get_subgraph(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a visual subgraph (nodes & links) centered around matching query terms.
    Highly useful for loading dynamic force-directed graph diagrams.
    """
    try:
        subgraph = KGService.get_subgraph_for_ui(db, q)
        return StandardResponse(
            success=True,
            data=subgraph
        )
    except Exception as e:
        logger.error(f"Error fetching visualization subgraph: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
