"""
Training Report-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class TrainingReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    coordinator_id: Optional[str] = None  # Made optional for backward compatibility
    status: str = "draft"  # draft, submitted, archived
    docx_path: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    submitted_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    # Enriched fields
    session_name: Optional[str] = None
    company_name: Optional[str] = None
    program_name: Optional[str] = None
    coordinator_name: Optional[str] = None


class TrainingReportCreate(BaseModel):
    session_id: str


class ReportGenerateRequest(BaseModel):
    session_id: str
