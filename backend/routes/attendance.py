"""
Attendance management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models import Attendance, AttendanceClockIn, AttendanceClockOut
from services.auth_service import get_current_user
from utils import db, get_malaysia_time

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/clock-in")
async def clock_in(data: AttendanceClockIn, current_user = Depends(get_current_user)):
    """Clock in for attendance"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can clock in")
    
    current_time = get_malaysia_time()
    date_str = current_time.date().isoformat()
    
    # Check if already clocked in today
    existing = await db.attendance.find_one({
        "session_id": data.session_id,
        "participant_id": current_user.id,
        "date": date_str
    }, {"_id": 0})
    
    if existing:
        return {"message": "Already clocked in today", "attendance_id": existing['id']}
    
    attendance_obj = Attendance(
        session_id=data.session_id,
        participant_id=current_user.id,
        clock_in_time=current_time,
        date=date_str
    )
    
    doc = attendance_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['clock_in_time'] = doc['clock_in_time'].isoformat()
    
    await db.attendance.insert_one(doc)
    
    return {"message": "Clocked in successfully", "attendance_id": attendance_obj.id}


@router.post("/clock-out")
async def clock_out(data: AttendanceClockOut, current_user = Depends(get_current_user)):
    """Clock out for attendance"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can clock out")
    
    current_time = get_malaysia_time()
    date_str = current_time.date().isoformat()
    
    # Find today's attendance record
    attendance = await db.attendance.find_one({
        "session_id": data.session_id,
        "participant_id": current_user.id,
        "date": date_str
    }, {"_id": 0})
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No clock-in record found for today")
    
    if attendance.get('clock_out_time'):
        return {"message": "Already clocked out today"}
    
    await db.attendance.update_one(
        {"id": attendance['id']},
        {"$set": {"clock_out_time": current_time.isoformat()}}
    )
    
    return {"message": "Clocked out successfully"}


@router.get("/session/{session_id}")
async def get_session_attendance(session_id: str, current_user = Depends(get_current_user)):
    """Get attendance records for a session with participant names"""
    records = await db.attendance.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    
    from datetime import datetime
    
    # Enrich records with participant names
    for record in records:
        # Convert datetime strings
        if isinstance(record.get('clock_in_time'), str):
            record['clock_in_time'] = datetime.fromisoformat(record['clock_in_time'])
        if isinstance(record.get('clock_out_time'), str):
            record['clock_out_time'] = datetime.fromisoformat(record['clock_out_time'])
        if isinstance(record.get('created_at'), str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
        
        # Add participant name
        participant_id = record.get('participant_id')
        if participant_id:
            participant = await db.users.find_one({"id": participant_id}, {"_id": 0, "full_name": 1})
            if participant:
                record['participant_name'] = participant.get('full_name', 'Unknown')
            else:
                record['participant_name'] = 'Unknown Participant'
        else:
            record['participant_name'] = 'Unknown Participant'
    
    return records


@router.get("/{session_id}/{participant_id}")
async def get_participant_attendance(session_id: str, participant_id: str, current_user = Depends(get_current_user)):
    """Get attendance records for a specific participant in a session"""
    if current_user.role == "participant" and current_user.id != participant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    records = await db.attendance.find(
        {"session_id": session_id, "participant_id": participant_id},
        {"_id": 0}
    ).to_list(100)
    
    from datetime import datetime
    
    for record in records:
        if isinstance(record.get('clock_in_time'), str):
            record['clock_in_time'] = datetime.fromisoformat(record['clock_in_time'])
        if isinstance(record.get('clock_out_time'), str):
            record['clock_out_time'] = datetime.fromisoformat(record['clock_out_time'])
        if isinstance(record.get('created_at'), str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
    
    return records
