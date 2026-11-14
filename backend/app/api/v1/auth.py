from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import logger
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
    raw_phone = payload.phone or payload.phoneNumber or payload.mobile
    if not raw_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile phone number is required to send verification OTP."
        )
    auth_service = AuthService(db)
    try:
        result = auth_service.send_otp(raw_phone, email=payload.email)
        return result
    except ValueError as e:
        logger.warning("OTP dispatch validation error for %s: %s", raw_phone, e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in send_otp for %s: %s", raw_phone, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch verification OTP: {str(e)}"
        )

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies Firebase Phone Token or Development OTP and returns authenticated session token."""
    raw_phone = payload.phone or payload.phoneNumber or payload.mobile
    if not raw_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile phone number is required for OTP verification."
        )
    auth_service = AuthService(db)
    try:
        user, token = auth_service.verify_otp_or_token(
            phone=raw_phone,
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
        logger.warning("OTP verification failed for %s: %s", raw_phone, e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in verify_otp for %s: %s", raw_phone, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

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
