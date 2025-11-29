"""
Program management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models import Program, ProgramCreate, ProgramUpdate
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("", response_model=List[Program])
async def get_programs(
    search: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get all programs"""
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    programs = await db.programs.find(query, {"_id": 0}).to_list(1000)
    from datetime import datetime
    for program in programs:
        if isinstance(program.get('created_at'), str):
            program['created_at'] = datetime.fromisoformat(program['created_at'])
    return programs


@router.post("", response_model=Program)
async def create_program(
    program_data: ProgramCreate,
    current_user = Depends(get_current_user)
):
    """Create a new program"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create programs")
    
    program_obj = Program(
        name=program_data.name,
        description=program_data.description,
        pass_percentage=program_data.pass_percentage or 70.0
    )
    doc = program_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.programs.insert_one(doc)
    return program_obj


@router.get("/{program_id}", response_model=Program)
async def get_program(program_id: str, current_user = Depends(get_current_user)):
    """Get a specific program"""
    program_doc = await db.programs.find_one({"id": program_id}, {"_id": 0})
    if not program_doc:
        raise HTTPException(status_code=404, detail="Program not found")
    
    from datetime import datetime
    if isinstance(program_doc.get('created_at'), str):
        program_doc['created_at'] = datetime.fromisoformat(program_doc['created_at'])
    return Program(**program_doc)


@router.put("/{program_id}", response_model=Program)
async def update_program(
    program_id: str,
    program_data: ProgramUpdate,
    current_user = Depends(get_current_user)
):
    """Update a program"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update programs")
    
    update_data = {}
    if program_data.name is not None:
        update_data["name"] = program_data.name
    if program_data.description is not None:
        update_data["description"] = program_data.description
    if program_data.pass_percentage is not None:
        update_data["pass_percentage"] = program_data.pass_percentage
    
    if update_data:
        await db.programs.update_one({"id": program_id}, {"$set": update_data})
    
    program_doc = await db.programs.find_one({"id": program_id}, {"_id": 0})
    from datetime import datetime
    if isinstance(program_doc.get('created_at'), str):
        program_doc['created_at'] = datetime.fromisoformat(program_doc['created_at'])
    return Program(**program_doc)


@router.delete("/{program_id}")
async def delete_program(program_id: str, current_user = Depends(get_current_user)):
    """Delete a program"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete programs")
    
    result = await db.programs.delete_one({"id": program_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return {"message": "Program deleted successfully"}
