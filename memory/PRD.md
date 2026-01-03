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

### January 3, 2026 - P0, P1, P2 Features Complete

#### EA Forms Generation (P0)
- **EA Forms Tab** in HR Module: Admin can select staff member and year to generate annual remuneration statement
- Displays: Employee Particulars, Annual Gross Income, Annual Deductions (Employee), Employer Contributions, Monthly Breakdown
- **Printable EA Form** with bilingual format (English/Malay) following Malaysian tax form standards
- Backend API: `/hr/ea-form/{staff_id}/{year}`

#### Self-Service Payroll Portal (P0)
- **MyPayroll Component** for staff to view their own payroll documents
- Integrated into: TrainerDashboard, CoordinatorDashboard, MarketingDashboard
- Features: Payslips tab, Pay Advice tab, EA Form tab (self-service)
- Backend APIs: `/hr/my-payslips`, `/hr/my-pay-advice`, `/hr/my-ea-form/{year}`

#### Statutory Rates Upload (P1)
- Complete Excel upload functionality for EPF, SOCSO, EIS rate tables
- Download template functionality for each rate type
- Rate type selector with visual display of uploaded records

#### Mobile-Friendly UI (P2)
- Responsive TabsList components across all dashboards
- Flex-wrap enabled for tabs on smaller viewports
- Improved spacing and sizing for mobile devices

### January 2, 2026 - HR & Payroll System Complete
- **HR Module with Full Payroll Features**:
  - **Staff Management**: Add/Edit staff with salary, allowances, bank details, NRIC, statutory info
  - **Payroll Period Management**: Open/Close monthly periods (closed = read-only)
  - **Payslip Generation**: 
    - Auto-calculates EPF, SOCSO, EIS with **age-based rules from NRIC**
    - **Editable statutory values** - can override auto-calculated amounts
    - YTD (Year-to-date) tracking
    - Printable payslip with company branding
  - **Pay Advice**: For session workers (trainers/coordinators) with printable output

- **NRIC-Based Age Calculation**:
  - First 6 digits of NRIC = YYMMDD (date of birth)
  - System auto-detects if 60+ and adjusts rates accordingly

- **Statutory Calculation Rules**:
  - **EPF**: 11% employee / 13% employer (below 60); 0% / 4% (60+)
  - **SOCSO**: 0.5% employee / 1.75% employer (below 60); 0% / 1.25% employer only (60+)
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
- [x] ~~EA Forms Generation~~ - DONE (Jan 3, 2026)
- [x] ~~Self-Service Payroll Portal~~ - DONE (Jan 3, 2026)

### P1 - High Priority
- [x] HR Module - Staff Management - DONE
- [x] **Payslip Generation** - DONE (with statutory deductions, YTD tracking)
- [x] **Pay Advice** - DONE (for session workers)
- [x] EPF/SOCSO/EIS Excel upload for statutory rate tables - DONE
- [x] Live Document Previews - DONE (in Finance Dashboard Settings)

### P2 - Medium Priority
- [x] Mobile-friendly UI - DONE (responsive tabs across all dashboards)
- [ ] Profit/Loss Ledger
- [ ] Petty Cash Module
- [ ] Password protection for Data tab

### P3 - Bug Fixes/Refactoring
- [ ] Fix `ResultsSummary.jsx` page crash
- [ ] Fix `TrainerChiefFeedback.jsx` page crash
- [ ] Code refactoring (split large files: server.py, HRModule.jsx)
- [ ] Conditional F&B Expense Logic

---

## Key Files Reference
- `backend/server.py` - Main FastAPI server (HR APIs, 11000+ lines)
- `frontend/src/pages/FinanceDashboard.jsx` - Finance interface with HR tab
- `frontend/src/components/HRModule.jsx` - HR module with Staff, Payroll, EA Forms
- `frontend/src/components/MyPayroll.jsx` - Self-service payroll portal
- `frontend/src/components/PayslipPrint.jsx` - Payslip print component
- `frontend/src/components/PayAdvicePrint.jsx` - Pay advice print component
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
