# Hostel Management System (HMS) - API Specification

Base URL: `/api/v1`  
Interactive Swagger Docs: `http://localhost:8000/docs`  
OpenAPI Specification JSON: `http://localhost:8000/openapi.json`

---

## Authentication & Headers
All protected endpoints require an `Authorization` header with a valid Bearer token:
```http
Authorization: Bearer <access_token>
```

Tokens are PyJWT HS256 tokens carrying `sub` (username), `role` (`super_admin`, `warden`, `accountant`, `security`, `maintenance`, `student`), and expiry (`exp`).

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Form login (`username`, `password`), returns `access_token` and `token_type` |
| `POST` | `/auth/json-login` | Public | JSON body login (`{"username": "...", "password": "..."}`) |
| `GET` | `/auth/me` | Authenticated | Returns currently authenticated user profile |
| `POST` | `/auth/refresh` | Authenticated | Generates a fresh JWT access token |

---

## 2. Hostels & Infrastructure (`/api/v1/hostels`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/hostels/` | Authenticated | List all hostels with block/capacity counts |
| `POST` | `/hostels/` | `super_admin`, `warden` | Create a new hostel establishment |
| `GET` | `/hostels/{id}` | Authenticated | Detailed hostel profile |
| `POST` | `/hostels/{id}/blocks` | `super_admin`, `warden` | Add block to hostel |
| `POST` | `/hostels/blocks/{id}/floors` | `super_admin`, `warden` | Add floor to block |

---

## 3. Rooms & Beds (`/api/v1/rooms`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/rooms/` | Authenticated | List rooms with filtering by block, floor, type, status, search |
| `POST` | `/rooms/` | `super_admin`, `warden` | Add new room and automatically provision beds |
| `GET` | `/rooms/{id}` | Authenticated | Detailed room information with bed states |
| `GET` | `/rooms/grid` | Authenticated | **Visual Matrix**: hierarchical tree of Blocks -> Floors -> Rooms -> Beds with status colors and current occupants |
| `GET` | `/rooms/beds/vacant` | `super_admin`, `warden` | Quick lookup of all vacant beds available for allocation |

---

## 4. Student Profiles & Admissions (`/api/v1/students`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/students/` | Authenticated | Filterable directory of resident students (search, branch, year, status) |
| `POST` | `/students/` | `super_admin`, `warden` | Admit new student (validates roll number & email uniqueness) |
| `GET` | `/students/{id}` | Authenticated | 360-degree student profile (demographics, guardians, bed, dues) |
| `PUT` | `/students/{id}` | `super_admin`, `warden` | Update student profile |
| `GET` | `/students/me/profile` | `student` | Self student profile for logged-in resident |

---

## 5. Bed Allocations (`/api/v1/allocations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/allocations/` | Authenticated | Historical and active room allocation ledger |
| `POST` | `/allocations/` | `super_admin`, `warden` | Allocate bed (prevents double-booking and enforces room capacity) |
| `POST` | `/allocations/{id}/transfer` | `super_admin`, `warden` | Transfer resident to another vacant bed |
| `POST` | `/allocations/{id}/vacate` | `super_admin`, `warden` | Vacate bed, marks bed as vacant and sets resident to inactive |

---

## 6. Fees, Invoicing & Receipts (`/api/v1/fees`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/fees/structures` | Authenticated | List configured fee structures (Hostel, Mess, Caution) |
| `POST` | `/fees/structures` | `super_admin`, `accountant` | Create new fee structure rate card |
| `GET` | `/fees/invoices` | Authenticated | Invoices list with status filter (`paid`, `partial`, `pending`, `overdue`) |
| `POST` | `/fees/invoices` | `super_admin`, `accountant` | Generate fee invoice for student |
| `POST` | `/fees/payments` | `super_admin`, `accountant` | Record payment against invoice with receipt generation |
| `GET` | `/fees/defaulters` | `super_admin`, `accountant`, `warden` | Filtered list of students with outstanding dues |

---

## 7. Attendance (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/attendance/` | `super_admin`, `warden`, `security` | Attendance records by date and block |
| `POST` | `/attendance/` | `super_admin`, `warden`, `security` | Single resident attendance entry |
| `POST` | `/attendance/bulk` | `super_admin`, `warden`, `security` | Night roll-call bulk marker with automatic leave pass sync |

---

## 8. Leaves, Outpasses & Gate Passes (`/api/v1/leaves`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/leaves/` | Authenticated | Leave/outpass applications list |
| `POST` | `/leaves/` | `student`, `warden`, `super_admin` | Submit outpass application |
| `PUT` | `/leaves/{id}/status` | `super_admin`, `warden` | Approve/Reject application; auto-generates QR Gate Pass on approval |
| `GET` | `/leaves/gatepass/{pass_number}` | Authenticated | Digital Gate Pass detail lookup |
| `POST` | `/leaves/gate-log` | `super_admin`, `security` | Security terminal check-out / check-in action logger |

---

## 9. Complaints & Maintenance (`/api/v1/complaints`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/complaints/` | Authenticated | Maintenance ticket list with priority/status filters |
| `POST` | `/complaints/` | `student`, `warden`, `super_admin` | Raise new maintenance issue |
| `PUT` | `/complaints/{id}` | `super_admin`, `warden`, `maintenance` | Update status (`in_progress`, `resolved`), assign technician |

---

## 10. Visitor Logs (`/api/v1/visitors`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/visitors/` | Authenticated | Register of guest visitors |
| `POST` | `/visitors/` | `security`, `warden`, `super_admin` | Log visitor entry |
| `PUT` | `/visitors/{id}/exit` | `security`, `warden`, `super_admin` | Record visitor checkout timestamp |

---

## 11. Mess Operations (`/api/v1/mess`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/mess/menu` | Authenticated | 7-day weekly breakfast, lunch, snacks, dinner schedule |
| `POST` | `/mess/menu` | `super_admin`, `warden` | Update or replace weekly menu |

---

## 12. Notices & Broadcasts (`/api/v1/notices`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notices/` | Authenticated | Active circulars and hostel announcements |
| `POST` | `/notices/` | `super_admin`, `warden` | Broadcast new notice |

---

## 13. Reports & Analytics (`/api/v1/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/reports/dashboard-stats` | Authenticated | KPI metrics, block occupancy, room types, recent activity feed |
| `GET` | `/reports/export/{report_type}` | `super_admin`, `warden`, `accountant` | CSV download (`occupancy`, `fee_collection`, `defaulters`, `attendance`) |
