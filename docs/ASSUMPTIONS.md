# Hostel Management System (HMS) - Engineering Assumptions

This document lists design decisions, defaults, and architectural assumptions made while synthesizing the specifications from the Software Requirements Specification (SRS v1.0), UML Class Modeling Guide, Component Diagrams, Deployment Architecture, and Testing Specifications.

---

## 1. Domain Structure & Room Hierarchy
- **Hierarchy**: `Hostel -> Block -> Floor -> Room -> Bed`.
- **Atomic Unit of Allocation**: Students are allocated to a specific **Bed** within a **Room**.
- **Bed Statuses**: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`.
- **Room Capacity**: The room's capacity equals the number of physical beds configured. The system strictly enforces `allocated_beds <= room_capacity` at the database and application service layers.
- **Gender Segregation**: Blocks have assigned genders (`MALE`, `FEMALE`, `COED`). Students cannot be allocated to a block with an incompatible gender assignment.

---

## 2. Roles and Permissions (RBAC)
Based on SRS Section 2.3 and Section 4.1-4.6, the system defines 6 discrete roles:
1. **Super Admin**: System configuration, hostel establishment, academic year setup, staff accounts, audit logs.
2. **Warden / Administrator**: Hostel block management, room & bed management, student admissions, room allocation & deallocation, leave approvals, complaint assignment, notices, and operational reports.
3. **Accountant**: Fee head configuration, invoice generation, manual receipt collection, dues tracking, financial reports and defaulters export.
4. **Security Staff**: Gate pass verification, logging real-time student exit and entry timestamps, visitor registration and check-in/out logs.
5. **Maintenance Staff**: Ticket queue view for assigned complaints, status updates (`IN_PROGRESS`, `RESOLVED`), and technician resolution notes.
6. **Student / Resident**: Self-service portal to view room details, roommates, fee dues, payment history, submit leave & late-entry requests, view digital gate passes, lodge complaints, and view hostel notices.

---

## 3. Financial & Fee Invoicing Rules
- **Fee Structures**: Composed of multiple configurable Fee Heads (e.g., Room Rent, Mess Fee, Caution Deposit, Utility Charges, Gym/Amenities).
- **Invoice Billing**: Invoices can be generated per academic semester or monthly.
- **Partial Payments**: Students can pay invoices in full or in partial installments.
- **Invoice Statuses**: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`.
- **Overpayment Prevention**: Payments exceeding the remaining invoice balance are strictly rejected.
- **Payment Modes**:
  - Offline: Cash, Demand Draft, Bank NEFT/RTGS, Cheque (verified by Accountant/Warden).
  - Online (Simulated): Direct instant online payment with mock gateway verification, generating cryptographic transaction references and PDF/printable receipts.

---

## 4. Attendance, Leave, and Digital Gate Pass Workflow
- **Night Attendance (Roll Call)**: Conducted daily per block/floor. Statuses: `PRESENT`, `ABSENT`, `ON_LEAVE`, `LATE_ENTRY`.
- **Automatic Leave Synchronization**: If a student has an approved `LeaveRequest` spanning the attendance date, the system automatically marks them as `ON_LEAVE`.
- **Gate Pass Lifecycle**:
  1. Student requests Leave or Late-entry specifying departure/arrival dates, destination, and reason.
  2. Warden reviews and approves or rejects the request.
  3. Upon approval, an immutable `GatePass` is generated with a unique Pass Number and QR verification payload.
  4. Security staff looks up or scans the pass at the hostel gate to record `actual_out_time` and `actual_in_time`.

---

## 5. Complaints and Maintenance Lifecycle
- **Categories**: `ELECTRICAL`, `PLUMBING`, `FURNITURE`, `CLEANLINESS`, `INTERNET`, `OTHER`.
- **Priority**: `LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`.
- **Status Progression**: `OPEN` -> `IN_PROGRESS` -> `RESOLVED` (or `CLOSED`).
- **Assignment**: Admins or Wardens assign open tickets to maintenance staff members, who can add notes and mark resolution.

---

## 6. Mess & Dining Operations
- Weekly rotating mess menu (Breakfast, Lunch, Snacks, Dinner).
- Special meal attendance/opt-out for students planning to be away during leaves.

---

## 7. Storage and File Attachments
- Local filesystem storage managed under `backend/uploads/` (student photos, ID proofs, receipt PDFs, complaint photo attachments).
- Serving via authenticated or static media endpoint with strict MIME-type validation.

---

## 8. Technology Stack & Database Strategy
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2.0 with async engine, Pydantic v2 schemas.
- **Database**: SQLite default for zero-friction local development, PostgreSQL ready via `DATABASE_URL` switch and Docker Compose.
- **Frontend**: Vite + React 18 + TypeScript, Tailwind CSS, TanStack Query v5, TanStack Table v8, Lucide React icons, Recharts for analytics.
