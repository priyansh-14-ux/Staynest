# Staynest — Hostel Management System (HMS)

> A modern, production-grade Hostel Management SaaS platform engineered with **FastAPI** (Python 3.11+), **SQLAlchemy 2.0**, **PostgreSQL / SQLite**, and a **React 18 + TypeScript + Vite + Tailwind CSS** frontend.

Built strictly according to Software Requirements Specifications (IEEE SRS v1.0), ER domain models, and institutional workflows for higher education and residential campuses.

### Project Team (As per IEEE SRS v1.0 Section 6)
- **Priyansh Keshwani** — Backend & Project Manager (Business logic, REST APIs, JWT security, Docker deployment)
- **Samriddhi Shrivastava** — Frontend & UI/UX Designer (Design tokens, visual room/bed matrix, student directory, responsive UI)
- **Soumya Rathore** — Database & QA Engineer (SQLAlchemy 2.0 relational schema, database constraints, Pytest test automation)

---

## Architecture Overview

```
hostel-management/
├── backend/
│   ├── app/
│   │   ├── api/v1/routers/       # 13 REST API domain routers
│   │   ├── core/                 # Config, DB engine, JWT auth, RBAC dependencies
│   │   ├── models/               # SQLAlchemy 2.0 ORM entities
│   │   ├── schemas/              # Pydantic v2 schemas for request/response
│   │   ├── services/             # Business logic layer
│   │   └── main.py               # FastAPI application entrypoint & middleware
│   ├── scripts/
│   │   └── seed.py               # Idempotent DB seeder with realistic demo data
│   ├── tests/                    # Pytest test suite (auth, room grid, fees)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ui/        # Design system primitives (Button, Modal, Badge, etc.)
│   │   ├── context/              # AuthContext with JWT & fast demo role switcher
│   │   ├── lib/                  # Axios client with interceptors
│   │   ├── pages/                # 15+ comprehensive full-featured screen modules
│   │   ├── types/                # Strict TypeScript interfaces matching backend models
│   │   ├── App.tsx               # Client routes & RBAC role guards
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/
│   ├── PLAN.md                   # Complete architectural design and build plan
│   ├── ASSUMPTIONS.md            # Documented institutional assumptions
│   └── API.md                    # Detailed REST API endpoint specification
└── docker-compose.yml            # Multi-container orchestration (DB, API, Web)
```

---

## Key Features

1. **Role-Based Access Control (RBAC):**
   - 6 Dedicated Personas: **Super Admin**, **Warden**, **Accountant**, **Security**, **Maintenance**, and **Student Resident**.
   - Strict server-side route guards, JWT payload parsing, and client UI conditional authorization.

2. **Signature Visual Room & Bed Allocation Matrix:**
   - Interactive visual hierarchy: Hostels $\rightarrow$ Blocks $\rightarrow$ Floors $\rightarrow$ Rooms $\rightarrow$ Beds.
   - Real-time status indicators: **Available** (Green), **Occupied** (Teal), and **Maintenance** (Amber).
   - Instant direct bed allocation, bed transfer, and room vacating with capacity rule enforcement.

3. **Student Directory & 360° Profile:**
   - Multi-tab admission wizard (Personal, Academic, Guardian, Health, Documents).
   - Comprehensive resident drawer showing assigned bed, invoice dues, leave records, and complaints.

4. **Fee Management & Invoicing:**
   - Fee structures (Hostel, Mess, Caution Deposit, Utility heads).
   - Invoices generation, partial payments, automated dues balance calculation.
   - Printable thermal fee receipts with transaction reference numbers.
   - Defaulters directory with one-click CSV export.

5. **Night Roll-Call & Attendance:**
   - Daily roll-call ledger by block and floor.
   - Automatic sync with active approved leave outpasses to prevent false absentees.
   - Single-click bulk marking ("Mark All Present").

6. **Leave & Digital QR Gate Pass:**
   - Multi-step outpass request workflow with Warden approval.
   - Dynamic Gate Pass generation with encrypted QR verification tokens.
   - Live Security Terminal for QR scanning and real-time student ingress/egress logging.

7. **Maintenance & Complaints Helpdesk:**
   - Ticket submission (Plumbing, Electrical, Carpentry, Internet, Pest Control).
   - Live Kanban-style tracking and technician assignment drawer.

8. **Campus Ancillaries:**
   - **Visitor Gate Log:** Register visitors, vehicle numbers, and checkout timestamps.
   - **Weekly Mess Schedule:** Interactive 7-day meal chart (Breakfast, Lunch, Snacks, Dinner).
   - **Hostel Noticeboard:** Broadcast bulletins with pinned emergency alerts.
   - **Analytics & Reports:** Visual occupancy and fee distribution charts (Recharts) with CSV export.

---

## Demo Accounts & Credentials

All test accounts share the common password: **`password123`**

| Role | Username | Password | Default Landing | Responsibilities |
|---|---|---|---|---|
| **Super Admin** | `admin` | `password123` | Dashboard | Full system configuration, hostel setups, user accounts |
| **Warden** | `warden` | `password123` | Visual Room Matrix | Admissions, room allocations, leave approvals, attendance |
| **Accountant** | `accountant` | `password123` | Fee Invoices | Fee collections, receipts, payment records, defaulters |
| **Security Guard** | `security` | `password123` | Gate Terminal | QR Gate pass scanning, visitor logbook, roll-call |
| **Maintenance Tech**| `maintenance` | `password123` | Complaints Board | Resolving electrical, plumbing, and carpentry tickets |
| **Student Resident**| `aarav` | `password123` | Student Portal | Apply outpasses, view room details, pay dues, raise tickets |

> **Pro Tip:** The login screen includes a **"One-Click Demo Roles"** panel at the bottom to instantly test any persona without manual typing.

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- SQLite (included by default) or PostgreSQL 15+

### 1. Backend Setup
```bash
cd hostel-management/backend

# Create and activate virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed realistic demo database
python scripts/seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API server will be live at: `http://127.0.0.1:8000`
- Interactive Swagger documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd hostel-management/frontend

# Install node dependencies
npm install

# Run Vite dev server
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

---

## Production Deployment with Docker Compose

To run the entire full-stack system (PostgreSQL 16, FastAPI backend, Nginx frontend) in isolated Docker containers:

```bash
cd hostel-management
docker-compose up --build -d
```

- **Frontend App:** `http://localhost` (or `http://localhost:3000`)
- **Backend API:** `http://localhost:8000`
- **Postgres DB:** `localhost:5432`

---

## Automated Test Suite

The backend includes automated integration and unit tests covering JWT authentication, double-booking prevention, bed capacity constraints, and fee calculation.

```bash
cd hostel-management/backend
python -m pytest tests -v
```

All tests run in-memory via SQLite with 100% pass rate.

---

## Design System & Theme Tokens

- **Base Theme:** Slate Neutral `#F8FAFC` background with clean `#0F172A` contrast.
- **Brand Accent:** Deep Teal `#0F766E` (`brand-600`) representing institutional stability.
- **Typography:** Inter 400/500/600/700 with 14px base font and tight visual rhythm.
- **Data Tables:** Dense, sticky headers with instant search, badges, and inline actions.
- **Sensible Semantics:** Emerald `#059669` for paid/present, Amber `#D97706` for pending/maintenance, Rose `#E11D48` for overdue/absent.
