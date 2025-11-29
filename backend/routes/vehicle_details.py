"""
Vehicle details routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from models.vehicle import VehicleDetails, VehicleDetailsSubmit
from models import User
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/vehicle-details", tags=["vehicle_details"])


@router.post("/submit", response_model=VehicleDetails)
async def submit_vehicle_details(vehicle_data: VehicleDetailsSubmit, current_user: User = Depends(get_current_user)):
    """Submit or update vehicle details for a participant"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit vehicle details")
    
    # Check if already exists
    existing = await db.vehicle_details.find_one({
        "participant_id": current_user.id,
        "session_id": vehicle_data.session_id
    }, {"_id": 0})
    
    if existing:
        # Update existing
        await db.vehicle_details.update_one(
            {"participant_id": current_user.id, "session_id": vehicle_data.session_id},
            {"$set": {
                "vehicle_model": vehicle_data.vehicle_model,
                "registration_number": vehicle_data.registration_number,
                "roadtax_expiry": vehicle_data.roadtax_expiry
            }}
        )
        existing.update(vehicle_data.model_dump())
        if isinstance(existing.get('created_at'), str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        return VehicleDetails(**existing)
    
    # Create new
    vehicle_obj = VehicleDetails(
        participant_id=current_user.id,
        session_id=vehicle_data.session_id,
        vehicle_model=vehicle_data.vehicle_model,
        registration_number=vehicle_data.registration_number,
        roadtax_expiry=vehicle_data.roadtax_expiry
    )
    
    doc = vehicle_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.vehicle_details.insert_one(doc)
    return vehicle_obj


@router.get("/{session_id}/{participant_id}")
async def get_vehicle_details(session_id: str, participant_id: str, current_user: User = Depends(get_current_user)):
    """Get vehicle details for a participant in a session"""
    vehicle = await db.vehicle_details.find_one({
        "participant_id": participant_id,
        "session_id": session_id
    }, {"_id": 0})
    
    if not vehicle:
        return None
    
    if isinstance(vehicle.get('created_at'), str):
        vehicle['created_at'] = datetime.fromisoformat(vehicle['created_at'])
    return vehicle
