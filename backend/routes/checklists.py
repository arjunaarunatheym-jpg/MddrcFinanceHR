"""
Checklist management routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List
import io
import shutil
import uuid as uuid_lib
from datetime import datetime
from pathlib import Path

from models import ChecklistTemplate, ChecklistTemplateCreate, VehicleChecklist, TrainerChecklistSubmit
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/checklists", tags=["checklists"])

# Create directory for checklist photos
CHECKLIST_PHOTOS_DIR = Path("/app/backend/static/checklist-photos")
CHECKLIST_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/templates/program/{program_id}", response_model=List[ChecklistTemplate])
async def get_checklist_templates(program_id: str, current_user = Depends(get_current_user)):
    """Get checklist templates for a program"""
    templates = await db.checklist_templates.find({"program_id": program_id}, {"_id": 0}).to_list(100)
    for template in templates:
        if isinstance(template.get('created_at'), str):
            template['created_at'] = datetime.fromisoformat(template['created_at'])
    return templates


@router.post("/templates", response_model=ChecklistTemplate)
async def create_checklist_template(template_data: ChecklistTemplateCreate, current_user = Depends(get_current_user)):
    """Create or update checklist template"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Check if template already exists for this program
    existing = await db.checklist_templates.find_one(
        {"program_id": template_data.program_id},
        {"_id": 0}
    )
    
    if existing:
        # Update existing template by adding new items
        current_items = existing.get('items', [])
        new_items = template_data.items
        
        # Merge items (avoid duplicates)
        for item in new_items:
            if item not in current_items:
                current_items.append(item)
        
        # Update in database
        await db.checklist_templates.update_one(
            {"program_id": template_data.program_id},
            {"$set": {"items": current_items}}
        )
        
        # Get updated template
        updated = await db.checklist_templates.find_one(
            {"program_id": template_data.program_id},
            {"_id": 0}
        )
        
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        
        return ChecklistTemplate(**updated)
    else:
        # Create new template
        template_obj = ChecklistTemplate(
            program_id=template_data.program_id,
            title=template_data.title,
            items=template_data.items
        )
        doc = template_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.checklist_templates.insert_one(doc)
        return template_obj


@router.post("/submit")
async def submit_checklist(submission: TrainerChecklistSubmit, current_user = Depends(get_current_user)):
    """Submit trainer checklist"""
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    from models import ChecklistItem
    from datetime import datetime, timezone
    items = [ChecklistItem(**item) for item in submission.checklist_items]
    
    checklist_obj = VehicleChecklist(
        session_id=submission.session_id,
        participant_id=submission.participant_id,
        trainer_id=current_user.id,
        items=items,
        photos=submission.photos,
        verified_by=current_user.id,
        verified_at=datetime.now(timezone.utc),
        verification_status='completed'
    )
    
    doc = checklist_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('verified_at'):
        doc['verified_at'] = doc['verified_at'].isoformat()
    await db.vehicle_checklists.insert_one(doc)
    
    return {"message": "Checklist submitted successfully", "checklist_id": checklist_obj.id}


@router.get("/session/{session_id}", response_model=List[VehicleChecklist])
async def get_session_checklists(session_id: str, current_user = Depends(get_current_user)):
    """Get all checklists for a session"""
    checklists = await db.vehicle_checklists.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    for checklist in checklists:
        if isinstance(checklist.get('created_at'), str):
            checklist['created_at'] = datetime.fromisoformat(checklist['created_at'])
        if isinstance(checklist.get('verified_at'), str):
            checklist['verified_at'] = datetime.fromisoformat(checklist['verified_at'])
        # Backward compatibility: set trainer_id from verified_by if missing
        if not checklist.get('trainer_id') and checklist.get('verified_by'):
            checklist['trainer_id'] = checklist['verified_by']
        # Backward compatibility: use checklist_items as items if items is missing
        if not checklist.get('items') and checklist.get('checklist_items'):
            checklist['items'] = checklist['checklist_items']
    return checklists



@router.get("/participant/{participant_id}", response_model=List[VehicleChecklist])
async def get_participant_checklists(participant_id: str, current_user = Depends(get_current_user)):
    """Get all checklists for a participant"""
    if current_user.role != "participant" and current_user.id != participant_id:
        if current_user.role not in ["admin", "coordinator", "trainer"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    checklists = await db.vehicle_checklists.find({"participant_id": participant_id}, {"_id": 0}).to_list(1000)
    for checklist in checklists:
        if isinstance(checklist.get('created_at'), str):
            checklist['created_at'] = datetime.fromisoformat(checklist['created_at'])
        if isinstance(checklist.get('verified_at'), str):
            checklist['verified_at'] = datetime.fromisoformat(checklist['verified_at'])
        # Backward compatibility - support both old and new field names
        if not checklist.get('trainer_id') and checklist.get('verified_by'):
            checklist['trainer_id'] = checklist['verified_by']
        if not checklist.get('items') and checklist.get('checklist_items'):
            checklist['items'] = checklist['checklist_items']
        # Ensure checklist_items exists for frontend compatibility
        if checklist.get('items') and not checklist.get('checklist_items'):
            checklist['checklist_items'] = checklist['items']
    return checklists


# Add missing endpoint for frontend compatibility
from fastapi import APIRouter as Router
checklist_compat_router = Router(tags=["checklist-compat"])

@checklist_compat_router.get("/vehicle-checklists/{session_id}/{participant_id}")
async def get_participant_session_checklist(
    session_id: str,
    participant_id: str,
    current_user = Depends(get_current_user)
):
    """Get most recent checklist for specific participant in session (for trainer UI)"""
    if current_user.role not in ["trainer", "admin", "coordinator"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get the most recent checklist (sorted by created_at descending)
    checklists = await db.vehicle_checklists.find(
        {"session_id": session_id, "participant_id": participant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1)
    
    if not checklists or len(checklists) == 0:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    checklist = checklists[0]
    
    # Handle datetime fields
    if isinstance(checklist.get('created_at'), str):
        checklist['created_at'] = datetime.fromisoformat(checklist['created_at'])
    if isinstance(checklist.get('verified_at'), str):
        checklist['verified_at'] = datetime.fromisoformat(checklist['verified_at'])
    if isinstance(checklist.get('submitted_at'), str):
        checklist['submitted_at'] = datetime.fromisoformat(checklist['submitted_at'])
    
    # Backward compatibility
    if not checklist.get('trainer_id') and checklist.get('verified_by'):
        checklist['trainer_id'] = checklist['verified_by']
    if not checklist.get('items') and checklist.get('checklist_items'):
        checklist['items'] = checklist['checklist_items']
    
    return checklist


@router.get("/templates")
async def get_all_checklist_templates(current_user = Depends(get_current_user)):
    """Get all checklist templates"""
    templates = await db.checklist_templates.find({}, {"_id": 0}).to_list(1000)
    for template in templates:
        if isinstance(template.get('created_at'), str):
            template['created_at'] = datetime.fromisoformat(template['created_at'])
    return templates


@router.put("/templates/{template_id}")
async def update_checklist_template(
    template_id: str,
    updates: dict,
    current_user = Depends(get_current_user)
):
    """Update checklist template"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    updates.pop("id", None)
    
    await db.checklist_templates.update_one({"id": template_id}, {"$set": updates})
    
    return {"message": "Template updated successfully"}


@router.delete("/templates/{template_id}")
async def delete_checklist_template(template_id: str, current_user = Depends(get_current_user)):
    """Delete checklist template"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete templates")
    
    result = await db.checklist_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}


@router.delete("/templates/{template_id}/items/{item_index}")
async def delete_checklist_item(
    template_id: str,
    item_index: int,
    current_user = Depends(get_current_user)
):
    """Delete a specific item from checklist template"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    template = await db.checklist_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    items = template.get("items", [])
    if item_index < 0 or item_index >= len(items):
        raise HTTPException(status_code=400, detail="Invalid item index")
    
    items.pop(item_index)
    
    await db.checklist_templates.update_one(
        {"id": template_id},
        {"$set": {"items": items}}
    )
    
    return {"message": "Item deleted successfully"}


@router.post("/templates/bulk-upload")
async def bulk_upload_checklists(
    file: UploadFile = File(...),
    program_id: str = Form(None),
    current_user = Depends(get_current_user)
):
    """Bulk upload checklist items from Excel"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if not program_id:
        raise HTTPException(status_code=400, detail="program_id is required")
    
    try:
        import pandas as pd
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")
    
    items = [str(row.get('Item', '')) for _, row in df.iterrows()]
    
    template_obj = ChecklistTemplate(
        program_id=program_id,
        title="Checklist - Bulk Upload",
        items=items
    )
    doc = template_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.checklist_templates.insert_one(doc)
    
    return {"message": "Checklist items uploaded successfully", "count": len(items)}


# Checklist Photo Upload Routes (moved outside /checklists prefix)
from fastapi import APIRouter as FastAPIRouter
photo_router = FastAPIRouter(tags=["checklist-photos"])

@photo_router.post("/checklist-photos/upload")
async def upload_checklist_photo(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload photo for checklist item"""
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(status_code=403, detail="Only trainers can upload checklist photos")
    
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{str(uuid_lib.uuid4())}.{file_extension}"
    file_path = CHECKLIST_PHOTOS_DIR / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save photo: {str(e)}")
    
    photo_url = f"/api/static/checklist-photos/{filename}"
    return {"photo_url": photo_url}


@photo_router.get("/static/checklist-photos/{filename}")
async def get_checklist_photo(filename: str):
    """Get checklist photo"""
    file_path = CHECKLIST_PHOTOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(file_path)

