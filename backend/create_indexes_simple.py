"""Simple database index creation - adds only essential indexes"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def main():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔍 Adding essential database indexes...")
    
    # Define indexes to create (collection, field, options)
    indexes = [
        # Users - most critical
        ("users", [("role", 1), ("company_id", 1)], {}),
        
        # Sessions - critical for performance
        ("sessions", [("start_date", -1), ("end_date", -1)], {}),
        ("sessions", [("completion_status", 1)], {}),
        
        # Test Results - high volume queries
        ("test_results", [("session_id", 1), ("participant_id", 1)], {}),
        
        # Attendance - frequent lookups
        ("attendance", [("session_id", 1), ("participant_id", 1)], {}),
        
        # Participant Access - unique constraint
        ("participant_access", [("participant_id", 1), ("session_id", 1)], {"unique": True}),
        
        # Training Reports
        ("training_reports", [("session_id", 1), ("status", 1)], {}),
        
        # Certificates
        ("certificates", [("participant_id", 1)], {}),
    ]
    
    created = 0
    skipped = 0
    
    for coll_name, keys, options in indexes:
        try:
            await db[coll_name].create_index(keys, **options)
            key_str = " + ".join([f[0] for f in keys])
            print(f"✅ {coll_name}: {key_str}")
            created += 1
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                skipped += 1
            else:
                print(f"❌ {coll_name}: {str(e)[:60]}")
    
    print(f"\n📊 Summary: {created} created, {skipped} already existed")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
