"""
Participant access and session management service
"""
from utils import db
from models import ParticipantAccess


async def get_or_create_participant_access(participant_id: str, session_id: str):
    """Get or create participant access record"""
    access_doc = await db.participant_access.find_one(
        {"participant_id": participant_id, "session_id": session_id},
        {"_id": 0}
    )
    
    if not access_doc:
        access_obj = ParticipantAccess(
            participant_id=participant_id,
            session_id=session_id
        )
        doc = access_obj.model_dump()
        await db.participant_access.insert_one(doc)
        return access_obj
    
    return ParticipantAccess(**access_doc)


async def find_or_create_user(user_data: dict, role: str, company_id: str) -> dict:
    """
    Find existing user by fullname OR email OR id_number
    If found: update the user with new data
    If not found: create new user
    """
    from uuid import uuid4
    from utils import get_password_hash
    from models import User
    
    full_name = user_data.get("full_name")
    email = user_data.get("email")
    id_number = user_data.get("id_number")
    phone_number = user_data.get("phone_number")
    
    # Search for existing user
    query = {"$or": []}
    if full_name:
        query["$or"].append({"full_name": full_name})
    if email:
        query["$or"].append({"email": email})
    if id_number:
        query["$or"].append({"id_number": id_number})
    
    if not query["$or"]:
        query = None
    
    existing_user = None
    if query:
        existing_user = await db.users.find_one(query, {"_id": 0})
    
    if existing_user:
        # Update existing user
        update_data = {}
        if full_name:
            update_data["full_name"] = full_name
        if email:
            update_data["email"] = email
        if id_number:
            update_data["id_number"] = id_number
        if phone_number:
            update_data["phone_number"] = phone_number
        if company_id:
            update_data["company_id"] = company_id
        
        if update_data:
            await db.users.update_one({"id": existing_user["id"]}, {"$set": update_data})
        
        return {"is_existing": True, "user_id": existing_user["id"]}
    else:
        # Create new user
        password = user_data.get("password", "mddrc1")
        
        # Auto-generate email for participants if not provided
        if not email and role == "participant":
            if id_number:
                email = f"{id_number.replace('-', '').replace(' ', '')}@temp.mddrc.local"
            else:
                email = f"user_{uuid4().hex[:8]}@temp.mddrc.local"
        
        user_obj = User(
            email=email,
            full_name=full_name,
            id_number=id_number,
            role=role,
            company_id=company_id,
            phone_number=phone_number
        )
        
        doc = user_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['password'] = get_password_hash(password)
        
        await db.users.insert_one(doc)
        return {"is_existing": False, "user_id": user_obj.id}
