import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.routers.deps import get_current_user
from app.core.database import get_db, SessionLocal
from app.repositories.chat import ChatRepository
from app.schemas.chat import (
    StartSessionRequest, StartSessionResponse,
    EndSessionRequest, EndSessionResponse,
    ChatRequest, ChatResponse,
    ChatSessionResponse, ChatSessionDetailResponse,
    RenameSessionRequest
)
from app.schemas.base import StandardResponse
from app.services.chat import ChatService
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chat"])

@router.post("/session/start", response_model=StandardResponse[StartSessionResponse])
def start_session(
    request: StartSessionRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_id = ChatService.start_session(
        db=db, 
        user_id=current_user.id, 
        language=request.language,
        country=request.country
    )
    return StandardResponse(
        success=True,
        data=StartSessionResponse(session_id=session_id, status="started")
    )

@router.post("/session/end", response_model=StandardResponse[EndSessionResponse])
def end_session(
    request: EndSessionRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify owner of session
    session = ChatRepository.get_session(db, request.session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized."
        )

    success = ChatService.end_session(db=db, session_id=request.session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session could not be ended."
        )
    return StandardResponse(
        success=True,
        data=EndSessionResponse(status="ended")
    )

@router.post("/gateway/chat", response_model=StandardResponse[ChatResponse])
def chat(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    system_prompt = f"""You are a professional legal AI assistant.

User language: {request.language}
Jurisdiction: {request.country}

Important:
- Explain clearly.
- Do not pretend to be a lawyer.
- Say this is general legal information, not official legal advice."""

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    # Verify session if session_id is provided
    if request.session_id:
        session = ChatRepository.get_session(db, request.session_id)
        if not session or session.user_id != current_user.id or not session.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active session required."
            )
        
        # Save user message to database
        ChatRepository.create_message(db, session_id=request.session_id, role="user", text=request.message)

        # Retrieve all messages in the session (including the current user message)
        history_messages = ChatRepository.get_session_messages(db, request.session_id)
        for msg in history_messages:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.text})
    else:
        messages.append({"role": "user", "content": request.message})

    answer = ChatService.ask_ollama_chat(messages)

    if request.session_id:
        # Save assistant message to database
        ChatRepository.create_message(db, session_id=request.session_id, role="assistant", text=answer)
        
        # Auto rename title if it was default
        session = ChatRepository.get_session(db, request.session_id)
        if session and session.title == "New Chat":
            title = request.message[:30] + "..." if len(request.message) > 30 else request.message
            ChatRepository.update_session_title(db, request.session_id, title)

    return StandardResponse(
        success=True,
        data=ChatResponse(answer=answer, citations=[])
    )

# Past Chats Management Endpoints
@router.get("/chat/sessions", response_model=StandardResponse[List[ChatSessionResponse]])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = ChatRepository.get_user_sessions(db, user_id=current_user.id)
    return StandardResponse(
        success=True,
        data=sessions
    )

@router.get("/chat/sessions/{session_id}", response_model=StandardResponse[ChatSessionDetailResponse])
def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = ChatRepository.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized access."
        )
    # Fetch messages and format them
    messages = ChatRepository.get_session_messages(db, session_id)
    # Attach messages back to session for automatic Pydantic serialization
    session.messages = messages
    return StandardResponse(
        success=True,
        data=session
    )

@router.patch("/chat/sessions/{session_id}", response_model=StandardResponse[ChatSessionResponse])
def rename_session(
    session_id: str,
    request: RenameSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = ChatRepository.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized access."
        )
    updated_session = ChatRepository.update_session_title(db, session_id, request.title)
    return StandardResponse(
        success=True,
        data=updated_session
    )

@router.delete("/chat/sessions/{session_id}", response_model=StandardResponse[str])
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = ChatRepository.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized access."
        )
    ChatRepository.delete_session(db, session_id)
    return StandardResponse(
        success=True,
        data="Session deleted successfully."
    )

@router.websocket("/gateway/ws")
async def websocket_chat(websocket: WebSocket, token: Optional[str] = None):
    # 1. Accept and validate JWT token
    await websocket.accept()
    
    if not token:
        await websocket.send_json({
            "type": "error",
            "content": "Unauthorized: Authentication token is missing."
        })
        await websocket.close(code=1008)
        return
        
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        await websocket.send_json({
            "type": "error",
            "content": "Unauthorized: Invalid or expired token."
        })
        await websocket.close(code=1008)
        return

    try:
        while True:
            data = await websocket.receive_json()

            session_id = data.get("session_id")
            message = data.get("message", "")
            language = data.get("language", "auto")
            country = data.get("country", "auto")

            # Validate active session and owner
            system_prompt = f"""You are a professional cross-border legal AI assistant.

User language: {language}
Jurisdiction: {country}

Rules:
- Give clear, structured answers.
- Mention that this is general legal information, not official legal advice.
- If the question is about country law, mention the selected jurisdiction.
- If you do not know, say you do not know."""

            messages = [
                {"role": "system", "content": system_prompt}
            ]

            with SessionLocal() as db:
                session = ChatRepository.get_session(db, session_id)
                if not session or session.user_id != user_id or not session.is_active:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Invalid or unauthorized session. Please start a session first."
                    })
                    continue

                # Save user message to database
                ChatRepository.create_message(db, session_id=session_id, role="user", text=message)

                # Fetch conversation history (including the user message we just saved)
                history_messages = ChatRepository.get_session_messages(db, session_id)
                for msg in history_messages:
                    if msg.role in ("user", "assistant"):
                        messages.append({"role": msg.role, "content": msg.text})

            answer = ChatService.ask_ollama_chat(messages)

            # Standard websocket payload protocol
            await websocket.send_json({
                "type": "token",
                "content": answer
            })

            await websocket.send_json({
                "type": "citation",
                "citations": []
            })

            await websocket.send_json({
                "type": "done"
            })

            # Save assistant response to database and auto rename title
            with SessionLocal() as db:
                ChatRepository.create_message(db, session_id=session_id, role="assistant", text=answer, citations=[])
                
                # Check and auto-generate title if it's currently default
                session = ChatRepository.get_session(db, session_id)
                if session and session.title == "New Chat":
                    title = message[:30] + "..." if len(message) > 30 else message
                    ChatRepository.update_session_title(db, session_id, title)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": f"Internal server error: {str(e)}"
            })
        except:
            pass
