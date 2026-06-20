from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest, Token
from app.core.security import (
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    decode_refresh_token
)

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate):
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        return UserRepository.create(db, user_in)

    @staticmethod
    def authenticate_user(db: Session, credentials: LoginRequest):
        user = UserRepository.get_by_email(db, credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    @staticmethod
    def generate_auth_tokens(user_id: str) -> Token:
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    @staticmethod
    def refresh_user_tokens(db: Session, refresh_token: str) -> Token:
        payload = decode_refresh_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )
        
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
            
        return AuthService.generate_auth_tokens(user.id)
