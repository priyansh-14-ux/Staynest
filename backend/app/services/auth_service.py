from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token
from app.schemas.user import UserCreate, LoginRequest, TokenResponse, UserOut

class AuthService:
    @staticmethod
    def authenticate(db: Session, login_data: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(
            (User.username == login_data.username_or_email) | (User.email == login_data.username_or_email)
        ).first()

        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )
        
        token_payload = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value
        }
        
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserOut.model_validate(user)
        )

    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        existing = db.query(User).filter(
            (User.username == user_in.username) | (User.email == user_in.email)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        new_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=hash_password(user_in.password),
            full_name=user_in.full_name,
            phone=user_in.phone,
            role=user_in.role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
