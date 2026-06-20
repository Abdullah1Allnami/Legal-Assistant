from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, Token, RefreshRequest
from app.schemas.user import UserCreate, UserResponse
from app.schemas.base import StandardResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    user = AuthService.register_user(db, user_in)
    return StandardResponse(success=True, data=user)

@router.post("/login", response_model=StandardResponse[Token])
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, credentials)
    tokens = AuthService.generate_auth_tokens(user.id)
    return StandardResponse(success=True, data=tokens)

@router.post("/refresh", response_model=StandardResponse[Token])
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    tokens = AuthService.refresh_user_tokens(db, request.refresh_token)
    return StandardResponse(success=True, data=tokens)
