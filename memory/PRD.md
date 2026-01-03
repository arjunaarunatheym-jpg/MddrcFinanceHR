# Training Management Platform - Product Requirements Document

## Overview
A comprehensive training management platform for MDDRC (Malaysian Defensive Driving and Riding Centre) with multiple user roles and integrated finance management.

## Core User Personas
- **Admin/Super Admin**: Full system access, user management, session management, finance oversight
- **Finance**: Invoice, payment, expense management, HR & Payroll
- **Trainer**: Training delivery, checklist management, participant tracking
- **Coordinator**: Session coordination, participant management, attendance tracking
- **Participant**: Training completion, indemnity acceptance, check-in/out
- **Supervisor**: Company representative, view training reports

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

---

## MEGA E2E TESTING RESULTS (January 3, 2026)

### Test Session Created
- **Program**: Bus Defensive Training
- **Company**: RapidKL
- **Session ID**: d664b79d-91a1-4968-bd72-de82611cdb1f
- **Participants**: 15 total (13 present, 2 absent)
- **Invoice**: INV/MDDRC/2026/01/0002 (RM 15,000 - PAID)

### Phase 1-4 Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Login | ✅ WORKING | arjuna@mddrc.com.my |
| Program Creation | ✅ WORKING | Bus Defensive Training created |
| Session Creation | ✅ WORKING | With full costing |
| Participant Upload | ✅ WORKING | 15 participants (3 individual, 12 bulk) |
| Pre/Post Test Questions | ✅ WORKING | 40 questions each, 90% pass mark |
| Participant Indemnity | ✅ WORKING | 13/15 signed |
| Participant Clock-in | ✅ WORKING | 13/15 clocked in |
| Coordinator Attendance | ✅ WORKING | 13 present, 2 absent |
| Pre-Test Release | ✅ WORKING | 3 pass, 10 fail |
| Trainer Checklists | ✅ WORKING | 3 trainers, 13 participants |
| Post-Test Release | ✅ WORKING | 12 pass, 1 fail |
| Feedback Submission | ✅ WORKING | 13/13 submitted |
| Chief Trainer Feedback | ✅ WORKING | Submitted |
| Coordinator Feedback | ✅ WORKING | Submitted |
| Invoice Creation | ✅ WORKING | Draft → Issued → Paid |
| **Payment Recording** | ✅ FIXED | Was broken, now working |
| P&L Ledger | ✅ WORKING | Shows RM 20,000 income |
| Petty Cash | ✅ WORKING | RM 359.50 balance |
| HR Payroll APIs | ✅ WORKING | Staff, Payslips, Pay Advice |
| Report Generation | ⚠️ FIXED | LlmChat API updated |
| Pre/Post Test Display | ✅ FIXED | Was showing 0/15, now correct |

### Bugs Fixed During Testing
1. **Payment Recording**: MongoDB ObjectId serialization error - FIXED
2. **Pre/Post Test Count Display**: Coordinator dashboard showing 0/15 - FIXED  
3. **Report Generation**: LlmChat initialization missing args - FIXED
4. **Test Type Mismatch**: API expected 'pre'/'post' but stored 'pre_test'/'post_test' - FIXED

---

## What's Been Implemented

### January 3, 2026 - P0, P1, P2 Features Complete

#### Profit/Loss Ledger (P2 - NEW)
- **Monthly P&L Comparison**: All 12 months displayed with Income, Expenses, Net Profit, Status
- **YTD Summary Cards**: Total Income, Total Expenses, Net Profit, Profit Margin %
- **Income Sources**: Invoices (auto-aggregated) + Manual one-off entries
- **Expense Tracking**: Payroll, Session Workers, Session Expenses, Petty Cash, Manual entries
- **Expense Breakdown**: Visual category breakdown with percentages and progress bars
- Backend APIs: `/finance/profit-loss`, `/finance/manual-income`, `/finance/manual-expenses`

#### Petty Cash Module (P2 - NEW)
- **Float Management**: Set initial float amount, current balance tracking
- **Expense Recording**: Date, description, amount, category, notes
- **Category Tracking**: Office Supplies, Transport, Refreshments, Postage, Printing, etc.
- **Approval Workflow**: Auto-approve under threshold (default RM 100), manual approval for larger expenses
- **Reconciliation**: Compare physical count with system balance, variance tracking, adjustment transactions
- **Audit Trail**: Full transaction history with who created/approved
- Backend APIs: `/finance/petty-cash/*` (settings, transaction, approve, reject, reconcile, summary)

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
- [x] **Profit/Loss Ledger** - DONE (Jan 3, 2026) - Monthly comparison, YTD, manual entries
- [x] **Petty Cash Module** - DONE (Jan 3, 2026) - Float, expenses, approvals, reconciliation
- [ ] Password protection for Data tab

### P3 - Bug Fixes/Refactoring
- [ ] Fix `ResultsSummary.jsx` page crash
- [ ] Fix `TrainerChiefFeedback.jsx` page crash
- [ ] Code refactoring (split large files: server.py, HRModule.jsx)
- [ ] Conditional F&B Expense Logic

---

## Key Files Reference
- `backend/server.py` - Main FastAPI server (HR APIs, P&L, Petty Cash - 12000+ lines)
- `frontend/src/pages/FinanceDashboard.jsx` - Finance interface with HR, P&L, Petty Cash tabs
- `frontend/src/components/HRModule.jsx` - HR module with Staff, Payroll, EA Forms
- `frontend/src/components/ProfitLossLedger.jsx` - P&L monthly overview and manual entries
- `frontend/src/components/PettyCash.jsx` - Petty cash management with approvals
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
