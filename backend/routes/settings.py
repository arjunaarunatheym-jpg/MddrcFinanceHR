"""
Settings management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from models import Settings, SettingsUpdate
from services.auth_service import get_current_user
from utils import db

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=Settings)
async def get_settings():
    """Get application settings"""
    settings_doc = await db.settings.find_one({}, {"_id": 0})
    
    if not settings_doc:
        # Create default settings
        default_settings = Settings()
        doc = default_settings.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.settings.insert_one(doc)
        return default_settings
    
    from datetime import datetime
    if isinstance(settings_doc.get('created_at'), str):
        settings_doc['created_at'] = datetime.fromisoformat(settings_doc['created_at'])
    if isinstance(settings_doc.get('updated_at'), str):
        settings_doc['updated_at'] = datetime.fromisoformat(settings_doc['updated_at'])
    
    return Settings(**settings_doc)


@router.put("", response_model=Settings)
async def update_settings(updates: SettingsUpdate, current_user = Depends(get_current_user)):
    """Update application settings"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update settings")
    
    from utils import get_malaysia_time
    update_data = {}
    if updates.company_name is not None:
        update_data["company_name"] = updates.company_name
    if updates.primary_color is not None:
        update_data["primary_color"] = updates.primary_color
    if updates.logo_url is not None:
        update_data["logo_url"] = updates.logo_url
    
    update_data["updated_at"] = get_malaysia_time().isoformat()
    
    await db.settings.update_one({}, {"$set": update_data}, upsert=True)
    
    settings_doc = await db.settings.find_one({}, {"_id": 0})
    from datetime import datetime
    if isinstance(settings_doc.get('created_at'), str):
        settings_doc['created_at'] = datetime.fromisoformat(settings_doc['created_at'])
    if isinstance(settings_doc.get('updated_at'), str):
        settings_doc['updated_at'] = datetime.fromisoformat(settings_doc['updated_at'])
    
    return Settings(**settings_doc)
