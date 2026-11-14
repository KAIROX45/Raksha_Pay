from typing import Optional
from pydantic import BaseModel, Field

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., description="Mobile number with country code, e.g. +919876543210")
    otp: Optional[str] = Field(None, description="6-digit OTP code")
    firebase_id_token: Optional[str] = Field(None, description="Firebase ID token from real SMS verification")
    full_name: Optional[str] = Field(None, description="User full name for first-time registration")

class SendOTPRequest(BaseModel):
    phone: str = Field(..., description="Mobile number with country code, e.g. +919876543210")

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    is_development_fallback: bool = False
    dev_otp: Optional[str] = None  # Only present when Firebase SMS provider is not configured

class AdminLoginRequest(BaseModel):
    phone: str
    password: str

class UserProfileResponse(BaseModel):
    id: str
    phone: str
    full_name: str
    email: Optional[str] = None
    role: str
    status: str
    is_demo: bool
    created_at: Optional[str] = None
