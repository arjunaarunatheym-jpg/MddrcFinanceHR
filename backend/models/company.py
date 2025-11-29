"""
Company-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
import uuid


class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class CompanyCreate(BaseModel):
    name: str


class CompanyUpdate(BaseModel):
    name: str
