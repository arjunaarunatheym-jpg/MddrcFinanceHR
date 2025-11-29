"""
User-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Optional[str] = None  # Optional - auto-generated for participants
    full_name: str
    id_number: str
    role: str
    company_id: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    is_active: bool = True


class UserCreate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: str
    id_number: str
    role: str
    company_id: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None


class UserLogin(BaseModel):
    email: str  # Can be email or IC number
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class ParticipantData(BaseModel):
    email: Optional[str] = ""
    password: str = "mddrc1"  # Default password
    full_name: str
    id_number: str
    phone_number: Optional[str] = ""


class SupervisorData(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    id_number: str
    phone_number: Optional[str] = None
