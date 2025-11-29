"""
Time utility functions for Malaysian timezone (UTC+8)
"""
from datetime import datetime
from zoneinfo import ZoneInfo

# Malaysian Timezone (UTC+8)
MALAYSIA_TZ = ZoneInfo("Asia/Kuala_Lumpur")


def get_malaysia_time():
    """Get current time in Malaysian timezone"""
    return datetime.now(MALAYSIA_TZ)


def get_malaysia_date():
    """Get current date in Malaysian timezone"""
    return get_malaysia_time().date()


def get_malaysia_time_str():
    """Get current time as string in HH:MM:SS format (Malaysian timezone)"""
    return get_malaysia_time().strftime("%H:%M:%S")
