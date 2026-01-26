"""Authentication middleware and dependencies."""
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth_utils import decode_token
from app.models.user import User, Session as UserSession
from datetime import datetime, timezone
from typing import Optional

security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_cookie: Optional[str] = Cookie(None, alias="session"),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from Bearer token or session cookie."""
    
    # Try Bearer token first (from Authorization header)
    if credentials:
        token = credentials.credentials
        payload = decode_token(token)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user and not user.locked:
                    return user
    
    # Try session cookie (from OAuth redirect)
    if session_cookie:
        session = db.query(UserSession).filter(
            UserSession.refresh_token == session_cookie
        ).first()
        
        if session and session.expires_at > datetime.now(timezone.utc):
            user = db.query(User).filter(User.id == session.user_id).first()
            if user and not user.locked:
                return user
    
    # No valid authentication found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> User | None:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None

    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
