"""
API route modules
"""
from . import auth
from . import sessions
from . import users
from . import companies
from . import programs
from . import tests
from . import certificates
from . import reports
from . import feedback
from . import checklists
from . import attendance
from . import settings
from . import participant_access
from . import admin_data_management
from . import vehicle_details

__all__ = [
    'auth', 'sessions', 'users', 'companies', 'programs',
    'tests', 'certificates', 'reports', 'feedback', 'checklists',
    'attendance', 'settings', 'participant_access', 'admin_data_management', 'vehicle_details'
]
