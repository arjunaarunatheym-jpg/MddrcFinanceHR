"""
Data Cleanup Utility for Training Management System
This script allows you to delete all data associated with a session
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'driving_training_db')

async def list_sessions():
    """List all sessions"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    
    print("\n" + "="*80)
    print("ALL SESSIONS")
    print("="*80)
    
    for i, session in enumerate(sessions, 1):
        print(f"\n{i}. {session.get('name')}")
        print(f"   ID: {session.get('id')}")
        print(f"   Location: {session.get('location')}")
        print(f"   Date: {session.get('start_date')} to {session.get('end_date')}")
        print(f"   Status: {session.get('status', 'active')}")
        print(f"   Participants: {len(session.get('participant_ids', []))}")
    
    client.close()
    return sessions

async def delete_session_data(session_id: str, confirm: bool = False):
    """Delete all data for a session"""
    if not confirm:
        print("⚠️  WARNING: This will delete ALL data for this session!")
        print("   This includes:")
        print("   - Session record")
        print("   - Test results")
        print("   - Feedback submissions")
        print("   - Attendance records")
        print("   - Vehicle checklists")
        print("   - Certificates")
        print("   - Participant access records")
        print("\n   This action CANNOT be undone!")
        response = input("\n   Type 'DELETE' to confirm: ")
        if response != "DELETE":
            print("❌ Deletion cancelled")
            return
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get session details first
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        print(f"❌ Session {session_id} not found!")
        client.close()
        return
    
    print(f"\n🗑️  Deleting data for: {session.get('name')}")
    print(f"   Session ID: {session_id}")
    
    # Delete all related data
    collections_to_clean = [
        ("sessions", {"id": session_id}),
        ("test_results", {"session_id": session_id}),
        ("course_feedback", {"session_id": session_id}),
        ("attendance", {"session_id": session_id}),
        ("attendance_records", {"session_id": session_id}),
        ("participant_attendance", {"session_id": session_id}),
        ("vehicle_checklists", {"session_id": session_id}),
        ("vehicle_details", {"session_id": session_id}),
        ("certificates", {"session_id": session_id}),
        ("participant_access", {"session_id": session_id}),
        ("training_reports", {"session_id": session_id}),
        ("chief_trainer_feedback", {"session_id": session_id}),
        ("coordinator_feedback", {"session_id": session_id}),
    ]
    
    total_deleted = 0
    
    for collection_name, query in collections_to_clean:
        result = await db[collection_name].delete_many(query)
        if result.deleted_count > 0:
            print(f"   ✅ Deleted {result.deleted_count} record(s) from {collection_name}")
            total_deleted += result.deleted_count
    
    print(f"\n✅ Total records deleted: {total_deleted}")
    print(f"✅ Session '{session.get('name')}' completely removed from system")
    
    client.close()

async def main():
    """Main function"""
    print("\n" + "="*80)
    print("DATA CLEANUP UTILITY - TRAINING MANAGEMENT SYSTEM")
    print("="*80)
    
    while True:
        print("\n📋 Options:")
        print("  1. List all sessions")
        print("  2. Delete session data")
        print("  3. Exit")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == "1":
            await list_sessions()
        
        elif choice == "2":
            session_id = input("\nEnter Session ID to delete: ").strip()
            if session_id:
                await delete_session_data(session_id)
            else:
                print("❌ Session ID cannot be empty")
        
        elif choice == "3":
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid option")

if __name__ == "__main__":
    asyncio.run(main())
