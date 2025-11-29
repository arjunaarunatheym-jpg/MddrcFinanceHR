"""
Participant access management routes
"""
from fastapi import APIRouter, HTTPException, Depends

from models import UpdateParticipantAccess
from services.auth_service import get_current_user
from services.participant_service import get_or_create_participant_access
from utils import db

router = APIRouter(prefix="/participant-access", tags=["participant-access"])


@router.post("/update")
async def update_participant_access(
    participant_id: str,
    session_id: str,
    access_data: UpdateParticipantAccess,
    current_user = Depends(get_current_user)
):
    """Update participant access permissions"""
    # Allow admins and coordinators
    if current_user.role == "coordinator":
        session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.get("coordinator_id") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only manage access for sessions assigned to you")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins and coordinators can update access")
    
    await get_or_create_participant_access(participant_id, session_id)
    
    update_fields = {}
    if access_data.can_access_pre_test is not None:
        update_fields["can_access_pre_test"] = access_data.can_access_pre_test
    if access_data.can_access_post_test is not None:
        update_fields["can_access_post_test"] = access_data.can_access_post_test
    if access_data.can_access_feedback is not None:
        update_fields["can_access_feedback"] = access_data.can_access_feedback
    if access_data.certificate_released is not None:
        update_fields["certificate_released"] = access_data.certificate_released
    
    if update_fields:
        await db.participant_access.update_one(
            {"participant_id": participant_id, "session_id": session_id},
            {"$set": update_fields}
        )
    
    return {"message": "Participant access updated successfully"}



@router.get("/{session_id}")
async def get_my_access(session_id: str, current_user = Depends(get_current_user)):
    """Get current participant's access for a session"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can check access")
    
    access = await get_or_create_participant_access(current_user.id, session_id)
    return access


@router.get("/session/{session_id}")
async def get_session_access(session_id: str, current_user = Depends(get_current_user)):
    """Get all participant access records for a session (for coordinators/admins)"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    access_records = await db.participant_access.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    return access_records


@router.post("/session/{session_id}/toggle")
async def toggle_session_access(session_id: str, access_data: dict, current_user = Depends(get_current_user)):
    """Toggle access for all participants in a session (coordinator/admin)"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Only coordinators and admins can control access")
    
    # Get session to find all participants
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    access_type = access_data.get("access_type")
    enabled = access_data.get("enabled", False)
    
    # Map access_type to field name
    field_mapping = {
        "pre_test": "can_access_pre_test",
        "post_test": "can_access_post_test",
        "feedback": "can_access_feedback",
        "checklist": "can_access_checklist"
    }
    
    if access_type not in field_mapping:
        raise HTTPException(status_code=400, detail="Invalid access type")
    
    field_name = field_mapping[access_type]
    
    # Update all participant access records for this session
    participant_ids = session.get("participant_ids", [])
    
    for participant_id in participant_ids:
        # Ensure access record exists
        await get_or_create_participant_access(participant_id, session_id)
        
        # Update the field
        await db.participant_access.update_one(
            {"participant_id": participant_id, "session_id": session_id},
            {"$set": {field_name: enabled}}
        )
    
    return {"message": f"Successfully {('enabled' if enabled else 'disabled')} {access_type} for all participants"}

