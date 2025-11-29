"""
Company management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models import Company, CompanyCreate, CompanyUpdate
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[Company])
async def get_companies(
    search: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get all companies"""
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    companies = await db.companies.find(query, {"_id": 0}).to_list(1000)
    from datetime import datetime
    for company in companies:
        if isinstance(company.get('created_at'), str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
    return companies


@router.post("", response_model=Company)
async def create_company(
    company_data: CompanyCreate,
    current_user = Depends(get_current_user)
):
    """Create a new company"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create companies")
    
    existing = await db.companies.find_one({"name": company_data.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    company_obj = Company(name=company_data.name)
    doc = company_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.companies.insert_one(doc)
    return company_obj


@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user = Depends(get_current_user)):
    """Get a specific company"""
    company_doc = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company_doc:
        raise HTTPException(status_code=404, detail="Company not found")
    
    from datetime import datetime
    if isinstance(company_doc.get('created_at'), str):
        company_doc['created_at'] = datetime.fromisoformat(company_doc['created_at'])
    return Company(**company_doc)


@router.put("/{company_id}", response_model=Company)
async def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    current_user = Depends(get_current_user)
):
    """Update a company"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update companies")
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {"name": company_data.name}}
    )
    
    company_doc = await db.companies.find_one({"id": company_id}, {"_id": 0})
    from datetime import datetime
    if isinstance(company_doc.get('created_at'), str):
        company_doc['created_at'] = datetime.fromisoformat(company_doc['created_at'])
    return Company(**company_doc)


@router.delete("/{company_id}")
async def delete_company(company_id: str, current_user = Depends(get_current_user)):
    """Delete a company"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete companies")
    
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {"message": "Company deleted successfully"}
