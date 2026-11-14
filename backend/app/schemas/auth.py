from typing import Optional
from pydantic import BaseModel, Field

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class VerifyOTPRequest(BaseModel):
    phone: Optional[str] = Field(None, description="Mobile number with country code, e.g. +919876543210")
    phoneNumber: Optional[str] = Field(None, description="Alias for phone")
    mobile: Optional[str] = Field(None, description="Alias for phone")
    otp: Optional[str] = Field(None, description="6-digit OTP code")
    firebase_id_token: Optional[str] = Field(None, description="Firebase ID token from real SMS verification")
    full_name: Optional[str] = Field(None, description="User full name for first-time registration")

class SendOTPRequest(BaseModel):
    phone: Optional[str] = Field(None, description="Mobile number with country code, e.g. +919876543210")
    phoneNumber: Optional[str] = Field(None, description="Alias for phone")
    mobile: Optional[str] = Field(None, description="Alias for phone")
    email: Optional[str] = Field(None, description="Optional email address for OTP delivery")

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    phone: Optional[str] = None
    provider: Optional[str] = "simulated"
    is_development_fallback: bool = True
    dev_otp: Optional[str] = None
    expires_in_seconds: int = 600

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
