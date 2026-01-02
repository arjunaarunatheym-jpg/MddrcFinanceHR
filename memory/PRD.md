# Training Management Platform - Product Requirements Document

## Overview
A comprehensive training management platform for MDDRC (Malaysian Defensive Driving and Riding Centre) with multiple user roles and integrated finance management.

## Core User Personas
- **Admin/Super Admin**: Full system access, user management, session management, finance oversight
- **Finance**: Invoice, payment, expense management, HR & Payroll
- **Trainer**: Training delivery, checklist management, participant tracking
- **Coordinator**: Session coordination, participant management, attendance tracking
- **Participant**: Training completion, indemnity acceptance, check-in/out

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

---

## What's Been Implemented

### January 2, 2026 - HR & Payroll System Complete
- **HR Module with Full Payroll Features**:
  - **Staff Management**: Add/Edit staff with salary, allowances, bank details, statutory info
  - **Payroll Period Management**: Open/Close monthly periods (closed = read-only)
  - **Payslip Generation**: Auto-calculates EPF, SOCSO, EIS with age-based rules
  - **Pay Advice**: For session workers (trainers/coordinators)
  - **YTD Tracking**: Year-to-date totals on payslips

- **Statutory Calculation Rules**:
  - **EPF**: 11% employee / 13% employer (below 60); 0% / 4% (60+)
  - **SOCSO**: 0.5% employee / 1.75% employer (below 60); 0% / 1.25% (60+)
  - **EIS**: 0.2% each (below 60); 0% (60+)
  - Wage ceiling: RM6,000 for SOCSO/EIS

- **Period Close Feature**: Once closed, payslips become read-only (is_locked = true)

- **Claim Form UI Improvements**
  - Fixed header layout (single company name, centered with logo)
  - Improved spacing throughout the form
  - Better table formatting and visual hierarchy

### January 2, 2026 - P0 Features Complete
- **Course Registration Form (Claim Form)**: Printable document from Session Costing
  - Component: `frontend/src/components/ClaimFormPrint.jsx`
  
- **Individual Indemnity Form Printing**
  - Component: `frontend/src/components/IndemnityFormPrint.jsx`

### Previous Session Completions
- Super Admin Finance Tab (Data tab with invoice/payment management, audit trail)
- Bulk User Deletion on Users tab
- Score Calculator in Super Admin panel
- Excel Templates download
- Dynamic Trainer Checklist filtering
- Document Styling & Custom Fields
- Session Month Filter

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~Course Registration Form (Claim Form)~~ - DONE
- [x] ~~Individual Indemnity Form Printing~~ - DONE

### P1 - High Priority (In Progress)
- [x] HR Module - Staff Management - DONE
- [ ] **Payslip Generation** - Generate monthly payslips with statutory deductions
- [ ] **Pay Advice** - For session workers, data from Claim Form
- [ ] EPF/SOCSO Excel upload for statutory rate tables
- [ ] Improve Live Document Previews

### P2 - Medium Priority
- [ ] Profit/Loss Ledger
- [ ] Petty Cash Module
- [ ] Password protection for Data tab

### P3 - Bug Fixes/Refactoring
- [ ] Fix `ResultsSummary.jsx` page crash
- [ ] Fix `TrainerChiefFeedback.jsx` page crash
- [ ] Code refactoring (split large files)

---

## Key Files Reference
- `backend/server.py` - Main FastAPI server (HR APIs at bottom)
- `frontend/src/pages/FinanceDashboard.jsx` - Finance interface with HR tab
- `frontend/src/components/HRModule.jsx` - HR staff management
- `frontend/src/components/ClaimFormPrint.jsx` - Claim form print
- `frontend/src/components/IndemnityFormPrint.jsx` - Indemnity print

---

## HR Module Database Schema (hr_staff collection)
```json
{
  "id": "uuid",
  "user_id": "optional - link to users collection",
  "employee_id": "EMP001",
  "full_name": "string",
  "designation": "string",
  "department": "string",
  "date_joined": "date",
  "bank_name": "string",
  "bank_account": "string",
  "basic_salary": 2700.00,
  "housing_allowance": 0,
  "transport_allowance": 0,
  "meal_allowance": 0,
  "phone_allowance": 0,
  "other_allowance": 0,
  "epf_number": "string",
  "socso_number": "string",
  "tax_number": "string",
  "employee_epf_rate": 11,
  "employer_epf_rate": 13,
  "is_active": true
}
```

---

## Test Credentials
- **Admin**: arjuna@mddrc.com.my / Dana102229
- **Finance**: munirah@sdc.com.my / mddrc1
