"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from app.core.auth_utils import generate_token
from app.core.config import get_settings
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
api_router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new user."""
    ip_address = request.client.host if request.client else None
    return AuthService.signup(db, data.email, data.password, ip_address=ip_address)


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login with email/password."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return AuthService.login(db, data.email, data.password, ip_address=ip_address, user_agent=user_agent)


@router.post("/logout")
def logout(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Logout by revoking refresh token."""
    return AuthService.logout(db, data.refreshToken)


@router.post("/refresh")
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token."""
    return AuthService.refresh_token(db, data.refreshToken)


@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify email with token."""
    return AuthService.verify_email(db, data.token)


@router.post("/resend-verification")
def resend_verification(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Resend verification email."""
    return AuthService.resend_verification(db, user)


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset."""
    return AuthService.forgot_password(db, data.email)


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token."""
    return AuthService.reset_password(db, data.token, data.password)


@router.get("/me")
def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "id": user.id,
        "email": user.email,
        "emailVerified": user.email_verified,
        "twoFactorEnabled": user.two_factor_enabled,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.post("/2fa/setup")
def setup_2fa():
    raise HTTPException(status_code=501, detail="2FA setup not implemented")


@router.post("/2fa/verify")
def verify_2fa():
    raise HTTPException(status_code=501, detail="2FA verify not implemented")


@router.post("/2fa/disable")
def disable_2fa():
    raise HTTPException(status_code=501, detail="2FA disable not implemented")


@router.get("/oauth/{provider}")
def oauth_provider(provider: str):
    state = generate_token(12)
    url = AuthService.get_oauth_url(provider, state)
    return {"success": True, "url": url}


def oauth_callback_handler(code: str | None = None, error: str | None = None, db: Session = Depends(get_db), response: Response = None):
    settings = get_settings()
    if error:
        return RedirectResponse(
            f"{settings.frontend_url}/login?error={error}",
            status_code=status.HTTP_302_FOUND,
        )
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth code")

    tokens = AuthService.handle_google_oauth_callback(db, code)
    
    # Redirect to main app with tokens in URL (will be stored by frontend)
    # This works across different ports on localhost
    redirect_url = f"{settings.frontend_url}/auth/callback?access_token={tokens['accessToken']}&refresh_token={tokens['refreshToken']}"
    
    return RedirectResponse(
        redirect_url,
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/oauth/callback")
def oauth_callback(code: str | None = None, error: str | None = None, db: Session = Depends(get_db), response: Response = None):
    return oauth_callback_handler(code=code, error=error, db=db, response=response)


@api_router.get("/google")
def api_google_oauth():
    """Get Google OAuth URL (API route for frontend)"""
    state = generate_token(12)
    url = AuthService.get_oauth_url("google", state)
    return {"success": True, "url": url}


@api_router.get("/google/callback")
def google_callback(code: str | None = None, error: str | None = None, db: Session = Depends(get_db), response: Response = None):
    return oauth_callback_handler(code=code, error=error, db=db, response=response)


@router.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}
