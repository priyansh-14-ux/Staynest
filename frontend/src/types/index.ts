// User & Auth Types
export type UserRole = 'SUPER_ADMIN' | 'WARDEN' | 'ACCOUNTANT' | 'SECURITY' | 'MAINTENANCE' | 'STUDENT';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Hostel & Room Hierarchy Types
export type GenderType = 'MALE' | 'FEMALE' | 'COED';
export type RoomType = 'SINGLE_AC' | 'SINGLE_NON_AC' | 'DOUBLE_AC' | 'DOUBLE_NON_AC' | 'TRIPLE' | 'DORMITORY';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export interface Bed {
  id: number;
  room_id: number;
  bed_number: string;
  status: BedStatus;
  current_resident_name?: string | null;
  current_resident_id?: number | null;
  registration_number?: string | null;
}

export interface Room {
  id: number;
  floor_id: number;
  room_number: string;
  room_type: RoomType;
  capacity: number;
  monthly_rate: number;
  has_attached_bathroom: boolean;
  has_air_conditioner: boolean;
  amenities?: string | null;
  is_active: boolean;
  occupied_beds_count: number;
  available_beds_count: number;
  beds: Bed[];
}

export interface Floor {
  id: number;
  block_id: number;
  floor_number: number;
  floor_name: string;
  rooms: Room[];
}

export interface Block {
  id: number;
  hostel_id: number;
  name: string;
  gender: GenderType;
  total_floors: number;
  warden_name?: string | null;
  floors: Floor[];
}

export interface Hostel {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  created_at: string;
  blocks: Block[];
}

// Visual Grid Types
export interface BedGridItem {
  bed_id: number;
  bed_number: string;
  status: BedStatus;
  resident_id?: number | null;
  resident_name?: string | null;
  registration_number?: string | null;
  course?: string | null;
}

export interface RoomGridItem {
  room_id: number;
  room_number: string;
  room_type: RoomType;
  capacity: number;
  occupied_count: number;
  available_count: number;
  monthly_rate: number;
  has_ac: boolean;
  has_attached_bath: boolean;
  beds: BedGridItem[];
}

export interface FloorGridItem {
  floor_id: number;
  floor_number: number;
  floor_name: string;
  rooms: RoomGridItem[];
}

export interface BlockGridItem {
  block_id: number;
  block_name: string;
  gender: GenderType;
  floors: FloorGridItem[];
}

// Student & Resident Types
export type ResidentStatus = 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'SUSPENDED';

export interface CurrentRoomInfo {
  hostel_name: string;
  block_name: string;
  floor_name: string;
  room_number: string;
  bed_number: string;
  room_type: string;
  bed_id: number;
  allocation_id: number;
}

export interface Resident {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  registration_number: string;
  course: string;
  department?: string | null;
  year_of_study: number;
  gender: string;
  dob?: string | null;
  blood_group?: string | null;
  permanent_address?: string | null;
  guardian_name: string;
  guardian_relation: string;
  guardian_phone: string;
  guardian_email?: string | null;
  status: ResidentStatus;
  admission_date: string;
  avatar_url?: string | null;
  current_room?: CurrentRoomInfo | null;
  total_dues: number;
}

export interface ResidentDetail extends Resident {
  roommates: {
    resident_id: number;
    name: string;
    bed_number: string;
    phone?: string | null;
    course: string;
  }[];
  created_at: string;
}

// Allocation Types
export type AllocationStatus = 'ACTIVE' | 'TRANSFERRED' | 'VACATED';

export interface Allocation {
  id: number;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  bed_id: number;
  bed_number: string;
  room_number: string;
  block_name: string;
  hostel_name: string;
  academic_year: string;
  allocated_from: string;
  allocated_to?: string | null;
  status: AllocationStatus;
  remarks?: string | null;
  created_at: string;
}

// Fee Types
export type FeeFrequency = 'MONTHLY' | 'SEMESTER' | 'ANNUAL' | 'ONE_TIME';
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'DEMAND_DRAFT';

export interface FeeStructure {
  id: number;
  name: string;
  room_type: string;
  room_rent: number;
  mess_fee: number;
  maintenance_fee: number;
  caution_deposit: number;
  frequency: FeeFrequency;
  academic_year: string;
  total_amount: number;
  created_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  resident_id: number;
  resident_name: string;
  receipt_number: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref?: string | null;
  status: string;
  payment_date: string;
  recorded_by: string;
  remarks?: string | null;
}

export interface FeeInvoice {
  id: number;
  invoice_number: string;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number?: string | null;
  title: string;
  billing_period: string;
  total_amount: number;
  paid_amount: number;
  remaining_due: number;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
  payments: Payment[];
}

export interface Receipt {
  receipt_number: string;
  payment_date: string;
  student_name: string;
  registration_number: string;
  room_number?: string | null;
  hostel_block?: string | null;
  invoice_number: string;
  invoice_title: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  transaction_ref?: string | null;
  remaining_invoice_due: number;
  recorded_by: string;
}

export interface Defaulter {
  resident_id: number;
  student_name: string;
  registration_number: string;
  phone?: string | null;
  guardian_phone: string;
  room_number?: string | null;
  total_invoiced: number;
  total_paid: number;
  total_overdue: number;
  overdue_invoices_count: number;
}

// Leave & Gate Pass Types
export type LeaveType = 'OUTPASS' | 'HOME_LEAVE' | 'MEDICAL' | 'EMERGENCY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type GatePassStatus = 'ISSUED' | 'CHECKED_OUT' | 'CHECKED_IN' | 'EXPIRED';
export type GateAction = 'EXIT' | 'ENTRY';

export interface GateLog {
  id: number;
  gate_pass_id: number;
  security_officer_name: string;
  action: GateAction;
  timestamp: string;
  remarks?: string | null;
}

export interface GatePass {
  id: number;
  pass_number: string;
  leave_request_id: number;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number?: string | null;
  destination: string;
  reason: string;
  qr_token: string;
  valid_from: string;
  valid_until: string;
  status: GatePassStatus;
  actual_out_time?: string | null;
  actual_in_time?: string | null;
  created_at: string;
  logs: GateLog[];
}

export interface LeaveRequest {
  id: number;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number?: string | null;
  leave_type: LeaveType;
  start_time: string;
  end_time: string;
  destination: string;
  reason: string;
  emergency_contact?: string | null;
  parent_informed: boolean;
  status: LeaveStatus;
  reviewed_by?: string | null;
  reviewer_remarks?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  gate_pass?: GatePass | null;
}

export interface GatePassVerification {
  is_valid: boolean;
  message: string;
  gate_pass?: GatePass | null;
  student_details?: {
    resident_id: number;
    name: string;
    registration_number: string;
    phone?: string | null;
    guardian_phone: string;
    room_number?: string | null;
  } | null;
}

// Attendance Types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'LATE_ENTRY';

export interface AttendanceRegisterRow {
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number: string;
  block_name: string;
  status: AttendanceStatus;
  has_approved_leave: boolean;
  leave_id?: number | null;
  attendance_id?: number | null;
}

// Complaint Types
export type ComplaintCategory = 'ELECTRICAL' | 'PLUMBING' | 'FURNITURE' | 'CLEANLINESS' | 'INTERNET' | 'OTHER';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Complaint {
  id: number;
  ticket_number: string;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number?: string | null;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  attachment_url?: string | null;
  status: ComplaintStatus;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Visitor Types
export interface Visitor {
  id: number;
  resident_id: number;
  resident_name: string;
  registration_number: string;
  room_number?: string | null;
  visitor_name: string;
  phone: string;
  relationship_to_resident: string;
  id_proof_type: string;
  id_proof_number: string;
  purpose: string;
  check_in_time: string;
  check_out_time?: string | null;
  logged_by: string;
  remarks?: string | null;
}

// Notice & Mess Types
export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  target_audience: string;
  is_pinned: boolean;
  author_id?: number | null;
  author_name: string;
  created_at: string;
}

export interface MessMenu {
  id: number;
  day_of_week: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  special_item?: string | null;
}

// Analytics Dashboard Types
export interface DashboardStats {
  total_hostels: number;
  total_blocks: number;
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  maintenance_beds: number;
  occupancy_rate: number;
  total_active_students: number;
  pending_leaves_count: number;
  open_complaints_count: number;
  total_fees_billed: number;
  total_fees_collected: number;
  total_pending_dues: number;
  defaulters_count: number;
  today_present_count: number;
  today_absent_count: number;
  today_on_leave_count: number;
}

export interface BlockOccupancyData {
  block_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_percentage: number;
}

export interface RoomTypeDistributionData {
  room_type: string;
  count: number;
  occupied: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status_tag?: string | null;
}
