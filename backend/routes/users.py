"""
User management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models import User
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[User])
async def get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get users with filtering"""
    if current_user.role not in ["admin", "supervisor", "coordinator", "trainer"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    query = {}
    
    if role:
        query["role"] = role
    
    if company_id:
        query["company_id"] = company_id
    
    if search:
        search_pattern = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"full_name": search_pattern},
            {"email": search_pattern},
            {"id_number": search_pattern}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    from datetime import datetime
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from datetime import datetime
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    updates: dict,
    current_user: User = Depends(get_current_user)
):
    """Update user information"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update users")
    
    # Remove protected fields
    updates.pop("password", None)
    updates.pop("id", None)
    
    await db.users.update_one({"id": user_id}, {"$set": updates})
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    from datetime import datetime
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated participant_access records
    await db.participant_access.delete_many({"participant_id": user_id})
    
    return {"message": "User deleted successfully"}
