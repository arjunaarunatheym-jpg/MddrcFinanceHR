"""
Authentication service with JWT token handling
"""
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials

from utils import SECRET_KEY, ALGORITHM, security, verify_password, get_password_hash, db
from models import User


def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


async def authenticate_user(email: str, password: str):
    """Authenticate user by email/IC and password"""
    # Allow login with email OR IC number
    query_conditions = [{"id_number": email}]  # Always allow IC as username
    
    # Only check email if the input looks like an email (contains @)
    if "@" in email:
        query_conditions.append({"email": email})
    
    user_doc = await db.users.find_one({"$or": query_conditions}, {"_id": 0})
    if not user_doc:
        return None
    
    # Check for both 'password' and 'hashed_password' field names
    password_hash = user_doc.get('password') or user_doc.get('hashed_password')
    if not password_hash:
        return None
    
    if not verify_password(password, password_hash):
        return None
    
    if not user_doc.get('is_active', True):
        return None
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user_doc.pop('hashed_password', None)
    
    return User(**user_doc)
