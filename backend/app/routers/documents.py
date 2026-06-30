import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.base import StandardResponse
from app.schemas.document import IngestDocumentRequest, IngestDocumentResponse
from app.services.document import DocumentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/ingest", response_model=StandardResponse[IngestDocumentResponse])
def ingest_document(
    request: IngestDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingest a legal document text, chunk it, embed it, extract entities/relations,
    and index them in both Vector Database and Legal Knowledge Graph.
    """
    # Restrict to admin/staff role if needed, or allow any authenticated user
    if current_user.role not in ("admin", "user"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to ingest documents."
        )

    try:
        doc, chunks_count, entities_count = DocumentService.ingest_document(
            db=db,
            title=request.title,
            text=request.text,
            jurisdiction=request.jurisdiction,
            language=request.language,
            document_type=request.document_type
        )
        return StandardResponse(
            success=True,
            data=IngestDocumentResponse(
                document_id=doc.id,
                title=doc.title,
                chunks_count=chunks_count,
                entities_count=entities_count
            )
        )
    except Exception as e:
        logger.error(f"Failed to ingest document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )
