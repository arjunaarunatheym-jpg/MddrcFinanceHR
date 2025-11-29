"""
Certificate-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
import uuid


class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    certificate_number: str
    issue_date: datetime
    file_path: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
