from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    TokenResponse,
    AdminLoginRequest,
    UserProfileResponse,
)
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """Dispatches real SMS OTP or returns development fallback instructions."""
    auth_service = AuthService(db)
    result = auth_service.send_otp(payload.phone)
    return result

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies Firebase Phone Token or Development OTP and returns authenticated session token."""
    auth_service = AuthService(db)
    try:
        user, token = auth_service.verify_otp_or_token(
            phone=payload.phone,
            otp=payload.otp,
            firebase_id_token=payload.firebase_id_token,
            full_name=payload.full_name,
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 60 * 24 * 7 * 60,
            "user": user.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """Authenticates pre-provisioned administrator account."""
    auth_service = AuthService(db)
    try:
        user, token = auth_service.authenticate_admin(payload.phone, payload.password)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 60 * 24 * 7 * 60,
            "user": user.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns authenticated user profile details."""
    return current_user.to_dict()

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Cleans up authenticated session."""
    return {"success": True, "message": "Successfully logged out."}
