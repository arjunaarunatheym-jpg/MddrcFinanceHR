"""
Feedback management routes
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List
from datetime import datetime

from models import FeedbackTemplate, FeedbackTemplateCreate, CourseFeedback, FeedbackSubmit, FeedbackQuestion
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/templates/program/{program_id}", response_model=List[FeedbackTemplate])
async def get_feedback_templates(program_id: str, current_user = Depends(get_current_user)):
    """Get feedback templates for a program"""
    templates = await db.feedback_templates.find({"program_id": program_id}, {"_id": 0}).to_list(100)
    from datetime import datetime
    for template in templates:
        if isinstance(template.get('created_at'), str):
            template['created_at'] = datetime.fromisoformat(template['created_at'])
    return templates


@router.post("/templates", response_model=FeedbackTemplate)
async def create_feedback_template(template_data: FeedbackTemplateCreate, current_user = Depends(get_current_user)):
    """Create or update feedback template"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Check if template already exists for this program
    existing = await db.feedback_templates.find_one(
        {"program_id": template_data.program_id},
        {"_id": 0}
    )
    
    if existing:
        # Update existing template by replacing questions
        # Convert Pydantic objects to dict for MongoDB
        questions_dict = [q.model_dump() if hasattr(q, 'model_dump') else q for q in template_data.questions]
        
        await db.feedback_templates.update_one(
            {"program_id": template_data.program_id},
            {"$set": {"questions": questions_dict}}
        )
        
        # Get updated template
        updated = await db.feedback_templates.find_one(
            {"program_id": template_data.program_id},
            {"_id": 0}
        )
        
        if isinstance(updated.get('created_at'), str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        
        return FeedbackTemplate(**updated)
    else:
        # Create new template
        template_obj = FeedbackTemplate(
            program_id=template_data.program_id,
            title=template_data.title,
            questions=template_data.questions
        )
        doc = template_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.feedback_templates.insert_one(doc)
        return template_obj


@router.post("/submit", response_model=CourseFeedback)
async def submit_feedback(submission: FeedbackSubmit, current_user = Depends(get_current_user)):
    """Submit course feedback"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit feedback")
    
    feedback_obj = CourseFeedback(
        session_id=submission.session_id,
        participant_id=current_user.id,
        feedback_template_id=submission.feedback_template_id,
        responses=submission.responses
    )
    
    doc = feedback_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.course_feedback.insert_one(doc)
    
    # Update participant access
    await db.participant_access.update_one(
        {"participant_id": current_user.id, "session_id": submission.session_id},
        {"$set": {"feedback_completed": True}},
        upsert=True
    )
    
    return feedback_obj


@router.get("/session/{session_id}", response_model=List[CourseFeedback])
async def get_session_feedback(session_id: str, current_user = Depends(get_current_user)):
    """Get all feedback for a session"""
    feedback = await db.course_feedback.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    from datetime import datetime
    for f in feedback:
        if isinstance(f.get('submitted_at'), str):
            f['submitted_at'] = datetime.fromisoformat(f['submitted_at'])
    return feedback


@router.delete("/templates/{template_id}")
async def delete_feedback_template(template_id: str, current_user = Depends(get_current_user)):
    """Delete feedback template"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete templates")
    
    result = await db.feedback_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted successfully"}


@router.post("/templates/bulk-upload")
async def bulk_upload_feedback(
    file: UploadFile = File(...),
    program_id: str = Form(None),
    current_user = Depends(get_current_user)
):
    """Bulk upload feedback questions from Excel"""
    if current_user.role not in ["admin", "assistant_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if not program_id:
        raise HTTPException(status_code=400, detail="program_id is required")
    
    try:
        import pandas as pd
        import io
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")
    
    questions = []
    for _, row in df.iterrows():
        question = FeedbackQuestion(
            question=str(row.get('Question', '')),
            type=str(row.get('Type', 'text')),
            options=str(row.get('Options', '')).split(',') if row.get('Options') else None
        )
        questions.append(question)
    
    template_obj = FeedbackTemplate(
        program_id=program_id,
        title="Feedback - Bulk Upload",
        questions=questions
    )
    doc = template_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.feedback_templates.insert_one(doc)
    
    return {"message": "Feedback questions uploaded successfully", "count": len(questions)}


@router.get("/company/{company_id}")
async def get_company_feedback(company_id: str, current_user = Depends(get_current_user)):
    """Get all feedback for a company"""
    # Get all sessions for this company
    sessions = await db.sessions.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    session_ids = [s["id"] for s in sessions]
    
    # Get feedback for these sessions
    feedback = await db.course_feedback.find(
        {"session_id": {"$in": session_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    from datetime import datetime
    for f in feedback:
        if isinstance(f.get('submitted_at'), str):
            f['submitted_at'] = datetime.fromisoformat(f['submitted_at'])
    
    return feedback
