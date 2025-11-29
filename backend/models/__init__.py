"""
Pydantic models for the application
"""
# User models
from .user import (
    User,
    UserCreate,
    UserLogin,
    TokenResponse,
    ParticipantData,
    SupervisorData
)

# Company models
from .company import Company, CompanyCreate, CompanyUpdate

# Program models
from .program import Program, ProgramCreate, ProgramUpdate

# Session models
from .session import Session, SessionCreate

# Test models
from .test import Test, TestCreate, TestQuestion, TestResult, TestSubmit

# Checklist models
from .checklist import (
    ChecklistTemplate,
    ChecklistTemplateCreate,
    ChecklistItem,
    VehicleChecklist,
    ChecklistSubmit,
    ChecklistVerify,
    VehicleDetails,
    VehicleDetailsSubmit,
    TrainerChecklistSubmit
)

# Feedback models
from .feedback import (
    FeedbackTemplate,
    FeedbackTemplateCreate,
    FeedbackTemplateUpdate,
    FeedbackQuestion,
    CourseFeedback,
    FeedbackSubmit,
    CoordinatorFeedbackTemplate,
    ChiefTrainerFeedbackTemplate,
    CoordinatorFeedback,
    ChiefTrainerFeedback
)

# Certificate models
from .certificate import Certificate

# Report models
from .report import TrainingReport, TrainingReportCreate, ReportGenerateRequest

# Attendance models
from .attendance import (
    Attendance,
    AttendanceClockIn,
    AttendanceClockOut,
    ParticipantAccess,
    UpdateParticipantAccess
)

# Settings models
from .settings import Settings, SettingsUpdate

# Audit models
from .audit import AuditLog, AuditLogResponse

# Vehicle models
from .vehicle import VehicleDetails, VehicleDetailsSubmit

__all__ = [
    # User
    'User', 'UserCreate', 'UserLogin', 'TokenResponse', 'ParticipantData', 'SupervisorData',
    # Company
    'Company', 'CompanyCreate', 'CompanyUpdate',
    # Program
    'Program', 'ProgramCreate', 'ProgramUpdate',
    # Session
    'Session', 'SessionCreate',
    # Test
    'Test', 'TestCreate', 'TestQuestion', 'TestResult', 'TestSubmit',
    # Checklist
    'ChecklistTemplate', 'ChecklistTemplateCreate', 'ChecklistItem', 'VehicleChecklist',
    'ChecklistSubmit', 'ChecklistVerify', 'VehicleDetails', 'VehicleDetailsSubmit', 'TrainerChecklistSubmit',
    # Feedback
    'FeedbackTemplate', 'FeedbackTemplateCreate', 'FeedbackTemplateUpdate', 'FeedbackQuestion',
    'CourseFeedback', 'FeedbackSubmit', 'CoordinatorFeedbackTemplate', 'ChiefTrainerFeedbackTemplate',
    'CoordinatorFeedback', 'ChiefTrainerFeedback',
    # Certificate
    'Certificate',
    # Report
    'TrainingReport', 'TrainingReportCreate', 'ReportGenerateRequest',
    # Attendance
    'Attendance', 'AttendanceClockIn', 'AttendanceClockOut', 'ParticipantAccess', 'UpdateParticipantAccess',
    # Settings
    'Settings', 'SettingsUpdate',
    # Audit
    'AuditLog', 'AuditLogResponse',
    # Vehicle
    'VehicleDetails', 'VehicleDetailsSubmit',
]
