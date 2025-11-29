#!/usr/bin/env python3
"""
Direct MongoDB debug for attendance records
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_mongo():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["driving_training_db"]
    
    session_id = "dcb95e42-fced-4100-bc89-572fcd5d653c"
    participant_id = "79f7ee5b-7d13-4427-b16f-c34abfb083bd"
    
    print(f"🔍 Debugging attendance records for session: {session_id}")
    print(f"👤 Participant: {participant_id}")
    
    # Query 1: All attendance records
    print("\n📊 All attendance records:")
    all_records = await db.attendance.find({}, {"_id": 0}).to_list(1000)
    print(f"Total attendance records in DB: {len(all_records)}")
    for i, record in enumerate(all_records):
        print(f"  Record {i+1}:")
        print(f"    ID: {record.get('id')}")
        print(f"    Participant ID: {record.get('participant_id')}")
        print(f"    Session ID: {record.get('session_id')}")
        print(f"    Date: {record.get('date')}")
        print(f"    Clock-in: {record.get('clock_in')}")
        print(f"    Clock-out: {record.get('clock_out')}")
    
    # Query 2: Records for specific session
    print(f"\n🎯 Records for session {session_id}:")
    session_records = await db.attendance.find({"session_id": session_id}, {"_id": 0}).to_list(1000)
    print(f"Session records found: {len(session_records)}")
    for i, record in enumerate(session_records):
        print(f"  Record {i+1}:")
        print(f"    ID: {record.get('id')}")
        print(f"    Participant ID: {record.get('participant_id')}")
        print(f"    Session ID: {record.get('session_id')}")
        print(f"    Date: {record.get('date')}")
    
    # Query 3: Records for specific participant and session
    print(f"\n👤 Records for participant {participant_id} in session {session_id}:")
    participant_records = await db.attendance.find({
        "participant_id": participant_id,
        "session_id": session_id
    }, {"_id": 0}).to_list(100)
    print(f"Participant records found: {len(participant_records)}")
    for i, record in enumerate(participant_records):
        print(f"  Record {i+1}:")
        print(f"    ID: {record.get('id')}")
        print(f"    Participant ID: {record.get('participant_id')}")
        print(f"    Session ID: {record.get('session_id')}")
        print(f"    Date: {record.get('date')}")
        print(f"    Clock-in: {record.get('clock_in')}")
        print(f"    Clock-out: {record.get('clock_out')}")
    
    # Query 4: Check if session_id field has any issues
    print(f"\n🔍 Checking session_id field consistency:")
    for record in all_records:
        if record.get('session_id'):
            session_id_in_record = record.get('session_id')
            matches = session_id_in_record == session_id
            print(f"  Record session_id: '{session_id_in_record}' | Matches: {matches}")
            if not matches:
                print(f"    Expected: '{session_id}'")
                print(f"    Got:      '{session_id_in_record}'")
                print(f"    Length expected: {len(session_id)}")
                print(f"    Length got:      {len(session_id_in_record)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_mongo())