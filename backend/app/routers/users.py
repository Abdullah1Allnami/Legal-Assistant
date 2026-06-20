from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.base import StandardResponse
from app.routers.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=StandardResponse[UserResponse])
def read_user_me(current_user: User = Depends(get_current_user)):
    return StandardResponse(success=True, data=current_user)
