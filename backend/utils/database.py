"""
Database connection and configuration
"""
import os
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME')

if not db_name:
    raise ValueError("DB_NAME environment variable is required")

db = client[db_name]
logging.info(f"🔥🔥🔥 CONNECTED TO DATABASE: {db_name} 🔥🔥🔥")


def get_database():
    """Get database instance"""
    return db
