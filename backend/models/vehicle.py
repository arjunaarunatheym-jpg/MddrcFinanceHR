"""
Vehicle-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
import uuid


class VehicleDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    vehicle_model: str
    registration_number: str
    roadtax_expiry: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class VehicleDetailsSubmit(BaseModel):
    session_id: str
    vehicle_model: str
    registration_number: str
    roadtax_expiry: str
