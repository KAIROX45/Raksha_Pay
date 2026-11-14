from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()

@router.patch("/me")
def update_me(payload: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.full_name:
        current_user.full_name = payload.full_name.strip()
    if payload.email:
        current_user.email = payload.email.strip().lower()
    db.commit()
    db.refresh(current_user)
    return current_user.to_dict()
