"""
Checklist-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid


class ChecklistItem(BaseModel):
    item: str
    completed: bool = False


class ChecklistTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    program_id: str
    title: Optional[str] = "Vehicle Inspection Checklist"
    items: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class ChecklistTemplateCreate(BaseModel):
    program_id: str
    title: Optional[str] = "Vehicle Inspection Checklist"
    items: List[str]


class VehicleChecklist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    participant_id: str
    trainer_id: Optional[str] = None
    items: Optional[List[ChecklistItem]] = []
    photos: List[str] = []
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    # Old format compatibility
    interval: Optional[str] = None
    checklist_items: Optional[List[dict]] = []


class ChecklistSubmit(BaseModel):
    session_id: str
    participant_id: str
    items: List[ChecklistItem]


class ChecklistVerify(BaseModel):
    checklist_id: str
    verified: bool


class VehicleDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    vehicle_number: str
    vehicle_type: str
    issues: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class VehicleDetailsSubmit(BaseModel):
    session_id: str
    vehicle_number: str
    vehicle_type: str
    issues: List[str] = []


class TrainerChecklistSubmit(BaseModel):
    session_id: str
    participant_id: str
    checklist_items: List[dict]
    photos: List[str] = []
