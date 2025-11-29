"""
Audit log models for tracking admin actions
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    action: str  # "create", "update", "delete"
    resource_type: str  # "test_result", "feedback", "attendance", "checklist", etc.
    resource_id: str
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    ip_address: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    action: str
    resource_type: str
    resource_id: str
    timestamp: datetime
    changes_summary: Optional[str] = None
