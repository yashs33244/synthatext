"""Authentication service."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from app.models.user import User, Session as UserSession, VerificationToken, PasswordResetToken, Account
from app.core.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_token,
    generate_device_id,
    decode_token,
)
from app.core.config import get_settings
import httpx
from urllib.parse import urlencode
import os


ACCOUNT_LOCKOUT_ATTEMPTS = int(os.getenv("ACCOUNT_LOCKOUT_ATTEMPTS", "5"))
ACCOUNT_LOCKOUT_DURATION_MINUTES = int(os.getenv("ACCOUNT_LOCKOUT_DURATION_MINUTES", "30"))
VERIFICATION_TOKEN_EXPIRE_HOURS = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_HOURS", "24"))
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_HOURS", "1"))


class AuthService:
    """Authentication service."""

    @staticmethod
    def signup(db: Session, email: str, password: str, ip_address: str | None = None) -> dict:
        """Register a new user with email/password."""
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        password_hash = hash_password(password)
        user = User(email=email, password_hash=password_hash)
        db.add(user)
        db.flush()

        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
        verification = VerificationToken(email=email, token=token, expires_at=expires_at)
        db.add(verification)

        db.commit()
        db.refresh(user)

        settings = get_settings()
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})
        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            device_id=generate_device_id(),
            ip_address=ip_address,
            user_agent=None,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours),
        )
        db.add(session)
        db.commit()

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": None,
                "avatar": None,
                "emailVerified": user.email_verified,
                "twoFactorEnabled": user.two_factor_enabled,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
            },
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "verificationToken": token,
        }

    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str,
        device_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Login with email/password."""
        user = db.query(User).filter(User.email == email).first()

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if user.locked and user.locked_until:
            if datetime.now(timezone.utc) < user.locked_until:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is locked. Try again later.",
                )
            user.locked = False
            user.locked_until = None
            user.failed_login_attempts = 0

        if not verify_password(password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= ACCOUNT_LOCKOUT_ATTEMPTS:
                user.locked = True
                user.locked_until = datetime.now(timezone.utc) + timedelta(
                    minutes=ACCOUNT_LOCKOUT_DURATION_MINUTES
                )
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account locked due to too many failed login attempts",
                )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        user.failed_login_attempts = 0

        if user.two_factor_enabled:
            db.commit()
            return {
                "requiresTwoFactor": True,
                "userId": user.id,
            }

        settings = get_settings()
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            device_id=device_id or generate_device_id(),
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours),
        )
        db.add(session)
        db.commit()

        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": None,
                "avatar": None,
                "emailVerified": user.email_verified,
                "twoFactorEnabled": user.two_factor_enabled,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
            },
        }

    @staticmethod
    def refresh_token(db: Session, refresh_token: str) -> dict:
        """Refresh access token using a refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        session = db.query(UserSession).filter(UserSession.refresh_token == refresh_token).first()
        if not session or session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = db.query(User).filter(User.id == session.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        settings = get_settings()
        access_token = create_access_token({"sub": user.id, "email": user.email})
        new_refresh_token = create_refresh_token({"sub": user.id})
        session.refresh_token = new_refresh_token
        session.expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours)
        db.commit()

        return {
            "accessToken": access_token,
            "refreshToken": new_refresh_token,
        }

    @staticmethod
    def logout(db: Session, refresh_token: str) -> dict:
        """Logout by revoking refresh token."""
        session = db.query(UserSession).filter(UserSession.refresh_token == refresh_token).first()
        if session:
            db.delete(session)
            db.commit()
        return {"message": "Logged out"}

    @staticmethod
    def verify_email(db: Session, token: str) -> dict:
        """Verify email with token."""
        verification = db.query(VerificationToken).filter(VerificationToken.token == token).first()
        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )
        if datetime.now(timezone.utc) > verification.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token expired",
            )

        user = db.query(User).filter(User.email == verification.email).first()
        if user:
            user.email_verified = True
        db.delete(verification)
        db.commit()

        return {"message": "Email verified successfully"}

    @staticmethod
    def resend_verification(db: Session, user: User) -> dict:
        """Resend email verification token."""
        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
        verification = VerificationToken(email=user.email, token=token, expires_at=expires_at)
        db.add(verification)
        db.commit()
        return {"message": "Verification email sent", "verificationToken": token}

    @staticmethod
    def forgot_password(db: Session, email: str) -> dict:
        """Request password reset."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {"message": "If the email exists, a reset link will be sent"}

        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        reset_token = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
        db.add(reset_token)
        db.commit()

        return {"message": "If the email exists, a reset link will be sent", "token": token}

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> dict:
        """Reset password with token."""
        reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token",
            )
        if datetime.now(timezone.utc) > reset_token.expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token expired",
            )

        user = db.query(User).filter(User.id == reset_token.user_id).first()
        if user:
            user.password_hash = hash_password(new_password)
            user.failed_login_attempts = 0
            user.locked = False
            user.locked_until = None

        db.delete(reset_token)
        db.commit()

        return {"message": "Password reset successfully"}

    @staticmethod
    def get_oauth_url(provider: str, state: str) -> str:
        """Get OAuth authorization URL for a provider."""
        settings = get_settings()
        if provider != "google":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")
        if not settings.google_client_id or not settings.google_redirect_uri:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google OAuth not configured")
        query = urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": settings.google_redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "access_type": "offline",
                "prompt": "consent",
                "state": state,
            }
        )
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"

    @staticmethod
    def handle_google_oauth_callback(db: Session, code: str) -> dict:
        """Handle Google OAuth callback and return tokens."""
        settings = get_settings()
        if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google OAuth not configured")

        token_url = "https://oauth2.googleapis.com/token"
        with httpx.Client(timeout=10) as client:
            token_response = client.post(
                token_url,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        if token_response.status_code != 200:
            error_detail = token_response.text
            print(f"Google OAuth token exchange failed: {token_response.status_code} - {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Failed to exchange OAuth code: {error_detail}"
            )
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth access token")

        userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"
        with httpx.Client(timeout=10) as client:
            userinfo_response = client.get(userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch OAuth user info")
        userinfo = userinfo_response.json()

        email = userinfo.get("email")
        provider_account_id = userinfo.get("sub")
        if not email or not provider_account_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth user info")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=None,
                email_verified=True,
                name=userinfo.get("name"),
                avatar=userinfo.get("picture")
            )
            db.add(user)
            db.flush()
        else:
            user.email_verified = True
            # Update name and avatar from Google if available
            if userinfo.get("name") and not user.name:
                user.name = userinfo.get("name")
            if userinfo.get("picture"):
                user.avatar = userinfo.get("picture")

        account = db.query(Account).filter(
            Account.user_id == user.id, Account.provider == "google", Account.provider_account_id == provider_account_id
        ).first()
        if not account:
            account = Account(
                user_id=user.id,
                provider="google",
                provider_account_id=provider_account_id,
                access_token=token_data.get("access_token"),
                refresh_token=token_data.get("refresh_token"),
                expires_at=token_data.get("expires_in"),
                token_type=token_data.get("token_type"),
                scope=token_data.get("scope"),
                id_token=token_data.get("id_token"),
            )
            db.add(account)

        settings = get_settings()
        access_token_jwt = create_access_token({"sub": user.id, "email": user.email})
        refresh_token_jwt = create_refresh_token({"sub": user.id})
        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token_jwt,
            device_id=generate_device_id(),
            ip_address=None,
            user_agent=None,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours),
        )
        db.add(session)
        db.commit()

        return {
            "accessToken": access_token_jwt,
            "refreshToken": refresh_token_jwt,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": userinfo.get("name"),
                "avatar": userinfo.get("picture"),
                "emailVerified": user.email_verified,
                "twoFactorEnabled": user.two_factor_enabled,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
            },
        }
