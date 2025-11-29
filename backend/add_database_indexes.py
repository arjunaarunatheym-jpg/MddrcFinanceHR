"""
Database Index Creation Script
Adds performance indexes to MongoDB collections
Run this script once to optimize database queries
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_index_safe(collection, keys, **kwargs):
    """Create index with error handling for existing indexes"""
    try:
        await collection.create_index(keys, **kwargs)
        return True
    except Exception as e:
        if "already exists" in str(e).lower():
            return False  # Index already exists, skip
        raise  # Re-raise if it's a different error

async def create_indexes():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔍 Creating database indexes...")
    print("=" * 60)
    
    # Users collection indexes
    print("\n📊 Users Collection:")
    created_count = 0
    
    if await create_index_safe(db.users, [("email", 1)], unique=True, sparse=True, name="email_unique"):
        print("✅ Created unique index on email")
        created_count += 1
    else:
        print("⏭️  Email index already exists, skipped")
    
    if await create_index_safe(db.users, [("role", 1)]):
        print("✅ Created index on role")
        created_count += 1
    else:
        print("⏭️  Role index already exists, skipped")
    
    if await create_index_safe(db.users, [("company_id", 1)]):
        print("✅ Created index on company_id")
        created_count += 1
    else:
        print("⏭️  Company_id index already exists, skipped")
    
    if await create_index_safe(db.users, [("role", 1), ("company_id", 1)], name="role_company_compound"):
        print("✅ Created compound index on role + company_id")
        created_count += 1
    else:
        print("⏭️  Role+Company compound index already exists, skipped")
    
    # Sessions collection indexes
    print("\n📊 Sessions Collection:")
    await db.sessions.create_index([("start_date", -1)], name="start_date_desc")
    print("✅ Created descending index on start_date")
    
    await db.sessions.create_index([("end_date", -1)], name="end_date_desc")
    print("✅ Created descending index on end_date")
    
    await db.sessions.create_index([("completion_status", 1)], name="completion_status_index")
    print("✅ Created index on completion_status")
    
    await db.sessions.create_index([("company_id", 1)], name="company_id_index")
    print("✅ Created index on company_id")
    
    await db.sessions.create_index([("program_id", 1)], name="program_id_index")
    print("✅ Created index on program_id")
    
    await db.sessions.create_index(
        [("start_date", -1), ("completion_status", 1)], 
        name="date_status_compound"
    )
    print("✅ Created compound index on start_date + completion_status")
    
    # Test Results collection indexes
    print("\n📊 Test Results Collection:")
    await db.test_results.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.test_results.create_index([("test_id", 1)], name="test_id_index")
    print("✅ Created index on test_id")
    
    await db.test_results.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.test_results.create_index(
        [("participant_id", 1), ("test_id", 1)], 
        name="participant_test_compound"
    )
    print("✅ Created compound index on participant_id + test_id")
    
    await db.test_results.create_index([("submitted_at", -1)], name="submitted_at_desc")
    print("✅ Created descending index on submitted_at")
    
    # Attendance collection indexes
    print("\n📊 Attendance Collection:")
    await db.attendance.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.attendance.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.attendance.create_index(
        [("session_id", 1), ("participant_id", 1)], 
        name="session_participant_compound"
    )
    print("✅ Created compound index on session_id + participant_id")
    
    await db.attendance.create_index([("clock_in_time", -1)], name="clock_in_desc")
    print("✅ Created descending index on clock_in_time")
    
    # Course Feedback collection indexes
    print("\n📊 Course Feedback Collection:")
    await db.course_feedback.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.course_feedback.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.course_feedback.create_index([("submitted_at", -1)], name="submitted_at_desc")
    print("✅ Created descending index on submitted_at")
    
    # Training Reports collection indexes
    print("\n📊 Training Reports Collection:")
    await db.training_reports.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.training_reports.create_index([("status", 1)], name="status_index")
    print("✅ Created index on status")
    
    await db.training_reports.create_index([("created_at", -1)], name="created_at_desc")
    print("✅ Created descending index on created_at")
    
    # Certificates collection indexes
    print("\n📊 Certificates Collection:")
    await db.certificates.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.certificates.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.certificates.create_index([("issue_date", -1)], name="issue_date_desc")
    print("✅ Created descending index on issue_date")
    
    # Participant Access collection indexes
    print("\n📊 Participant Access Collection:")
    await db.participant_access.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.participant_access.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.participant_access.create_index(
        [("participant_id", 1), ("session_id", 1)], 
        unique=True,
        name="participant_session_unique_compound"
    )
    print("✅ Created unique compound index on participant_id + session_id")
    
    # Vehicle Checklists collection indexes
    print("\n📊 Vehicle Checklists Collection:")
    await db.vehicle_checklists.create_index([("session_id", 1)], name="session_id_index")
    print("✅ Created index on session_id")
    
    await db.vehicle_checklists.create_index([("participant_id", 1)], name="participant_id_index")
    print("✅ Created index on participant_id")
    
    await db.vehicle_checklists.create_index([("trainer_id", 1)], name="trainer_id_index")
    print("✅ Created index on trainer_id")
    
    # Programs collection indexes
    print("\n📊 Programs Collection:")
    await db.programs.create_index([("name", 1)], name="name_index")
    print("✅ Created index on name")
    
    # Companies collection indexes
    print("\n📊 Companies Collection:")
    await db.companies.create_index([("name", 1)], name="name_index")
    print("✅ Created index on name")
    
    print("\n" + "=" * 60)
    print("✅ All indexes created successfully!")
    print("\n📈 Benefits:")
    print("  - Faster user lookups by email and role")
    print("  - Faster session queries by date and status")
    print("  - Faster test result queries")
    print("  - Faster attendance tracking")
    print("  - Better performance at scale")
    
    # Show index statistics
    print("\n📊 Index Statistics:")
    collections = [
        'users', 'sessions', 'test_results', 'attendance', 
        'course_feedback', 'training_reports', 'certificates',
        'participant_access', 'vehicle_checklists', 'programs', 'companies'
    ]
    
    for coll_name in collections:
        indexes = await db[coll_name].index_information()
        print(f"  {coll_name}: {len(indexes)} indexes")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())
