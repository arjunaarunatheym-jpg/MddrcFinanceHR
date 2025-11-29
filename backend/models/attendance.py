"""
Attendance-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    participant_id: str
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class AttendanceClockIn(BaseModel):
    session_id: str


class AttendanceClockOut(BaseModel):
    session_id: str


class ParticipantAccess(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    can_access_pre_test: bool = False
    can_access_post_test: bool = False
    can_access_feedback: bool = False
    pre_test_completed: bool = False
    post_test_completed: bool = False
    feedback_completed: bool = False
    certificate_released: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class UpdateParticipantAccess(BaseModel):
    can_access_pre_test: Optional[bool] = None
    can_access_post_test: Optional[bool] = None
    can_access_feedback: Optional[bool] = None
    certificate_released: Optional[bool] = None
