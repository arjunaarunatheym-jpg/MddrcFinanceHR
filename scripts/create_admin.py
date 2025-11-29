#!/usr/bin/env python3
"""Script to create default admin user"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["driving_training_db"]
    
    # Check if admin exists
    existing = await db.users.find_one({"email": "admin@example.com"})
    if existing:
        print("Admin user already exists")
        return
    
    # Create admin
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": "admin@example.com",
        "password": pwd_context.hash("admin123"),
        "full_name": "System Administrator",
        "id_number": "ADMIN001",
        "role": "admin",
        "company_id": None,
        "location": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(admin_doc)
    print("✅ Admin user created successfully!")
    print("Email: admin@example.com")
    print("Password: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
