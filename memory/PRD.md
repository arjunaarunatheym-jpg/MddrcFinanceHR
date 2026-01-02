# Training Management Platform - Product Requirements Document

## Overview
A comprehensive training management platform for MDDRC (Malaysian Defensive Driving and Riding Centre) with multiple user roles and integrated finance management.

## Core User Personas
- **Admin/Super Admin**: Full system access, user management, session management, finance oversight
- **Finance**: Invoice, payment, and expense management
- **Trainer**: Training delivery, checklist management, participant tracking
- **Coordinator**: Session coordination, participant management, attendance tracking
- **Participant**: Training completion, indemnity acceptance, check-in/out

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

---

## What's Been Implemented

### January 2, 2026 - P0 Features Complete
- **Course Registration Form (Claim Form)**: Printable document from Session Costing showing income, expenses, trainers, and profit summary
  - New component: `frontend/src/components/ClaimFormPrint.jsx`
  - Added "Print Claim Form" button in SessionCosting modal
  - Layout matches user's provided screenshot with all sections
  
- **Individual Indemnity Form Printing**: Print individual indemnity forms from Indemnity Records dialog
  - New component: `frontend/src/components/IndemnityFormPrint.jsx`
  - Added Print button for each participant row in indemnity table
  - Includes participant details, emergency contact, declaration text, signature section

### Previous Session Completions
- Super Admin Finance Tab (Data tab with invoice/payment management, audit trail)
- Bulk User Deletion on Users tab
- Score Calculator with auto-percentage in Super Admin panel
- Excel Templates download for program config & participant data
- Dynamic Trainer Checklist filtering
- Document Styling & Custom Fields in Finance Dashboard
- Session Month Filter

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~Course Registration Form (Claim Form)~~ - DONE
- [x] ~~Individual Indemnity Form Printing~~ - DONE

### P1 - High Priority
- [ ] HR Module & Payroll System
  - Staff salary/statutory details management
  - Pay Advice for freelancers/staff who work on sessions
  - Payslips for full-time staff
  - EPF/SOCSO Excel upload for statutory rates
- [ ] Improve Live Document Previews - full-page representation

### P2 - Medium Priority
- [ ] Profit/Loss Ledger for Finance dashboard
- [ ] Petty Cash Module
- [ ] Password protection for "Data" tab
- [ ] Conditional F&B Expense Logic
- [ ] Excel download for Payables report

### P3 - Bug Fixes/Refactoring
- [ ] Fix `ResultsSummary.jsx` page crash (null-safe optional chaining)
- [ ] Fix `TrainerChiefFeedback.jsx` page crash (unsafe type conversions)
- [ ] Code refactoring - break down large files:
  - `backend/server.py` (oversized, needs router separation)
  - `AdminDashboard.jsx` (4700+ lines)
  - `FinanceDashboard.jsx` (2800+ lines)

---

## Key Files Reference
- `backend/server.py` - Main FastAPI server
- `frontend/src/pages/AdminDashboard.jsx` - Admin interface
- `frontend/src/pages/FinanceDashboard.jsx` - Finance interface
- `frontend/src/components/SessionCosting.jsx` - Session costing modal
- `frontend/src/components/ClaimFormPrint.jsx` - Claim form print component
- `frontend/src/components/IndemnityFormPrint.jsx` - Indemnity form print component
- `frontend/src/components/SuperAdminPanel.jsx` - Super admin features

---

## Test Credentials
- **Admin**: arjuna@mddrc.com.my / Dana102229
- **Finance**: munirah@sdc.com.my / mddrc1
- **Trainer**: vijay@mddrc.com.my / mddrc1
- **Participant**: 12121212@temp.mddrc.local / 12121212
