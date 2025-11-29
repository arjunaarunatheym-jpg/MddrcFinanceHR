"""
Authentication routes
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from uuid import uuid4

from models import User, UserCreate, UserLogin, TokenResponse
from services.auth_service import create_access_token, get_current_user, authenticate_user
from utils import db, get_password_hash

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    """Register a new user"""
    # Role-based access control
    if current_user.role == "coordinator" or current_user.role == "assistant_admin":
        if user_data.role != "participant":
            raise HTTPException(status_code=403, detail="You can only create participants")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # For participants: use default password if not provided
    password = user_data.password
    email = user_data.email
    
    if user_data.role == "participant":
        # Default password: mddrc1
        if not password:
            password = "mddrc1"
        # Auto-generate email if not provided
        if not email or email.strip() == "":
            if user_data.id_number:
                email = f"{user_data.id_number.replace('-', '').replace(' ', '')}@temp.mddrc.local"
            else:
                email = f"user_{uuid4().hex[:8]}@temp.mddrc.local"
    
    # Check if user exists
    existing = await db.users.find_one({
        "$or": [
            {"id_number": user_data.id_number},
            {"email": email}
        ]
    }, {"_id": 0})
    
    if existing:
        if existing.get('id_number') == user_data.id_number:
            raise HTTPException(status_code=400, detail="User already exists with this IC number")
        else:
            raise HTTPException(status_code=400, detail="User already exists with this email")
    
    hashed_pw = get_password_hash(password)
    user_obj = User(
        email=email,
        full_name=user_data.full_name,
        id_number=user_data.id_number,
        role=user_data.role,
        company_id=user_data.company_id,
        location=user_data.location,
        phone_number=user_data.phone_number
    )
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hashed_pw
    
    await db.users.insert_one(doc)
    return user_obj


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login with email or IC number"""
    user = await authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Check if user exists (simplified - in production, would send email)"""
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        # Don't reveal if user exists or not (security best practice)
        return {"message": "If the email exists, a reset link will be sent"}
    
    return {"message": "If the email exists, a reset link will be sent"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change password for authenticated user"""
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    password_hash = user_doc.get('password') or user_doc.get('hashed_password')
    from utils import verify_password
    if not verify_password(request.old_password, password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Update with new password
    new_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": new_hash}}
    )
    
    return {"message": "Password changed successfully"}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password (simplified - in production, would require token)"""
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password": new_hash}}
    )
    
    return {"message": "Password reset successfully"}
