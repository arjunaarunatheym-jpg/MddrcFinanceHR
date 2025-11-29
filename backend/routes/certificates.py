"""
Certificate management routes
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import List

from models import Certificate
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/my-certificates", response_model=List[Certificate])
async def get_my_certificates(current_user = Depends(get_current_user)):
    """Get certificates for current user"""
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can access this endpoint")
    
    certificates = await db.certificates.find({"participant_id": current_user.id}, {"_id": 0}).to_list(100)
    from datetime import datetime
    for cert in certificates:
        if isinstance(cert.get('issue_date'), str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
    return certificates


@router.get("/participant/{participant_id}", response_model=List[Certificate])
async def get_participant_certificates(participant_id: str, current_user = Depends(get_current_user)):
    """Get certificates for a specific participant"""
    certificates = await db.certificates.find({"participant_id": participant_id}, {"_id": 0}).to_list(100)
    from datetime import datetime
    for cert in certificates:
        if isinstance(cert.get('issue_date'), str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
        if isinstance(cert.get('created_at'), str):
            cert['created_at'] = datetime.fromisoformat(cert['created_at'])
        if isinstance(cert.get('updated_at'), str):
            cert['updated_at'] = datetime.fromisoformat(cert['updated_at'])
    return certificates


@router.get("/session/{session_id}", response_model=List[Certificate])
async def get_session_certificates(session_id: str, current_user = Depends(get_current_user)):
    """Get all certificates for a session"""
    certificates = await db.certificates.find({"session_id": session_id}, {"_id": 0}).to_list(100)
    from datetime import datetime
    for cert in certificates:
        if isinstance(cert.get('issue_date'), str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
    return certificates


@router.post("/generate/{session_id}/{participant_id}")
async def generate_certificate(session_id: str, participant_id: str, current_user = Depends(get_current_user)):
    """Generate certificate for a participant"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Check if certificate already exists
    existing = await db.certificates.find_one({
        "session_id": session_id,
        "participant_id": participant_id
    }, {"_id": 0})
    
    if existing:
        return {"message": "Certificate already exists", "certificate_id": existing["id"]}
    
    # Generate certificate (simplified - full implementation would generate actual certificate file)
    from models import Certificate
    from utils import get_malaysia_time
    from uuid import uuid4
    
    cert_obj = Certificate(
        participant_id=participant_id,
        session_id=session_id,
        certificate_number=f"CERT-{uuid4().hex[:8].upper()}",
        issue_date=get_malaysia_time(),
        file_path=f"/static/certificates/cert_{session_id}_{participant_id}.pdf"
    )
    
    doc = cert_obj.model_dump()
    doc['issue_date'] = doc['issue_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.certificates.insert_one(doc)
    
    # Update participant access
    await db.participant_access.update_one(
        {"participant_id": participant_id, "session_id": session_id},
        {"$set": {"certificate_released": True}}
    )
    
    return {"message": "Certificate generated successfully", "certificate_id": cert_obj.id}


@router.get("/download/{certificate_id}")
async def download_certificate(certificate_id: str, current_user = Depends(get_current_user)):
    """Download a certificate"""
    from fastapi.responses import FileResponse
    import os
    
    cert = await db.certificates.find_one({"id": certificate_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    file_path = cert.get("file_path")
    if file_path and os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename=f"certificate_{certificate_id}.pdf")
    else:
        raise HTTPException(status_code=404, detail="Certificate file not found")


@router.get("/download/{session_id}/{participant_id}")
async def download_certificate_by_session_participant(
    session_id: str,
    participant_id: str,
    current_user = Depends(get_current_user)
):
    """Download certificate by session and participant"""
    from fastapi.responses import FileResponse
    import os
    
    cert = await db.certificates.find_one({
        "session_id": session_id,
        "participant_id": participant_id
    }, {"_id": 0})
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    file_path = cert.get("file_path")
    if file_path and os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf")
    else:
        raise HTTPException(status_code=404, detail="Certificate file not found")


@router.get("/eligibility/{session_id}/{participant_id}")
async def check_certificate_eligibility(
    session_id: str,
    participant_id: str,
    current_user = Depends(get_current_user)
):
    """Check if participant is eligible for certificate"""
    # Check if participant completed all requirements
    access = await db.participant_access.find_one({
        "participant_id": participant_id,
        "session_id": session_id
    }, {"_id": 0})
    
    if not access:
        return {"eligible": False, "reason": "Not enrolled in session"}
    
    # Check test completion
    test_results = await db.test_results.find({
        "participant_id": participant_id,
        "session_id": session_id
    }, {"_id": 0}).to_list(100)
    
    # Check if passed
    passed_tests = [r for r in test_results if r.get("passed")]
    
    eligible = (
        access.get("pre_test_submitted", False) and
        access.get("post_test_submitted", False) and
        access.get("feedback_submitted", False) and
        len(passed_tests) > 0
    )
    
    return {
        "eligible": eligible,
        "pre_test_submitted": access.get("pre_test_submitted", False),
        "post_test_submitted": access.get("post_test_submitted", False),
        "feedback_submitted": access.get("feedback_submitted", False),
        "passed_test": len(passed_tests) > 0
    }


@router.get("/repository")
async def get_certificate_repository(current_user = Depends(get_current_user)):
    """Get all certificates (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    certificates = await db.certificates.find({}, {"_id": 0}).to_list(1000)
    from datetime import datetime
    for cert in certificates:
        if isinstance(cert.get('issue_date'), str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
        if isinstance(cert.get('created_at'), str):
            cert['created_at'] = datetime.fromisoformat(cert['created_at'])
        if isinstance(cert.get('updated_at'), str):
            cert['updated_at'] = datetime.fromisoformat(cert['updated_at'])
    return certificates




@router.post("/upload/{session_id}/{participant_id}")
async def upload_certificate(
    session_id: str,
    participant_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload a certificate PDF for a participant"""
    import os
    from pathlib import Path
    from uuid import uuid4
    from utils import get_malaysia_time
    
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Ensure certificates directory exists
    cert_dir = Path("/app/backend/static/certificates_pdf")
    cert_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_id = uuid4().hex[:12]
    filename = f"cert_{session_id}_{participant_id}_{file_id}.pdf"
    file_path = cert_dir / filename
    
    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Get file size
        file_size_bytes = len(contents)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Check if certificate record exists
    existing = await db.certificates.find_one({
        "session_id": session_id,
        "participant_id": participant_id
    }, {"_id": 0})
    
    if existing:
        # Update existing certificate
        await db.certificates.update_one(
            {"session_id": session_id, "participant_id": participant_id},
            {"$set": {
                "file_path": f"/api/static/certificates_pdf/{filename}",
                "updated_at": get_malaysia_time().isoformat()
            }}
        )
        cert_id = existing["id"]
    else:
        # Create new certificate record
        from models import Certificate
        
        cert_obj = Certificate(
            participant_id=participant_id,
            session_id=session_id,
            certificate_number=f"CERT-{uuid4().hex[:8].upper()}",
            issue_date=get_malaysia_time(),
            file_path=f"/api/static/certificates_pdf/{filename}"
        )
        
        doc = cert_obj.model_dump()
        doc['issue_date'] = doc['issue_date'].isoformat()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.certificates.insert_one(doc)
        cert_id = cert_obj.id
    
    # Update participant access
    await db.participant_access.update_one(
        {"participant_id": participant_id, "session_id": session_id},
        {"$set": {"certificate_released": True}},
        upsert=True
    )
    
    return {
        "message": "Certificate uploaded successfully",
        "certificate_id": cert_id,
        "certificate_url": f"/api/static/certificates_pdf/{filename}",
        "file_size_mb": file_size_mb
    }
