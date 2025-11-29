"""
FastAPI Training Management System - Refactored
Main application file with modular route structure
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging

# Import all refactored routes
from routes import (
    auth, sessions, users, companies, programs,
    tests, certificates, reports, feedback, checklists,
    attendance, settings, participant_access, admin_data_management, vehicle_details
)

# Create FastAPI app
app = FastAPI(
    title="Training Management System",
    description="Multi-role training management system for Malaysian Defensive Driving and Riding Centre",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(auth.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(programs.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(checklists.router, prefix="/api")
app.include_router(checklists.photo_router, prefix="/api")  # Checklist photo routes
app.include_router(checklists.checklist_compat_router, prefix="/api")  # Compatibility routes
app.include_router(attendance.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(participant_access.router, prefix="/api")
app.include_router(admin_data_management.router, prefix="/api")
app.include_router(vehicle_details.router, prefix="/api")

# Static files setup
ROOT_DIR = Path(__file__).parent
STATIC_DIR = ROOT_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
LOGO_DIR = STATIC_DIR / "logos"
LOGO_DIR.mkdir(exist_ok=True)
CERTIFICATE_DIR = STATIC_DIR / "certificates"
CERTIFICATE_DIR.mkdir(exist_ok=True)
CERTIFICATE_PDF_DIR = STATIC_DIR / "certificates_pdf"
CERTIFICATE_PDF_DIR.mkdir(exist_ok=True)
REPORT_DIR = STATIC_DIR / "reports"
REPORT_DIR.mkdir(exist_ok=True)
REPORT_PDF_DIR = STATIC_DIR / "reports_pdf"
REPORT_PDF_DIR.mkdir(exist_ok=True)
TEMPLATE_DIR = STATIC_DIR / "templates"
TEMPLATE_DIR.mkdir(exist_ok=True)
CHECKLIST_PHOTOS_DIR = STATIC_DIR / "checklist_photos"
CHECKLIST_PHOTOS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logging.info("🚀 Training Management System v2.0 Started (Refactored)")
    logging.info("📁 Static files directory: " + str(STATIC_DIR))
    logging.info("✅ All routes loaded successfully")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Training Management System API",
        "status": "running",
        "version": "2.0.0",
        "architecture": "Refactored Modular Structure"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}
