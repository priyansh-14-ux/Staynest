import axios from 'axios';
import {
  AuthResponse, User, Hostel, Block, Room, Bed, BlockGridItem,
  Resident, ResidentDetail, Allocation, FeeStructure, FeeInvoice,
  Payment, Receipt, Defaulter, LeaveRequest, GatePass,
  GatePassVerification, AttendanceRegisterRow, AttendanceStatus,
  Complaint, Visitor, Notice, MessMenu, DashboardStats,
  BlockOccupancyData, RoomTypeDistributionData, ActivityItem
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { username_or_email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  }
};

export const roomsApi = {
  getVisualGrid: async (hostelId?: number): Promise<BlockGridItem[]> => {
    const res = await api.get<BlockGridItem[]>('/rooms/grid', { params: { hostel_id: hostelId } });
    return res.data;
  },
  getRooms: async (params?: { block_id?: number; floor_id?: number; room_type?: string }): Promise<Room[]> => {
    const res = await api.get<Room[]>('/rooms', { params });
    return res.data;
  },
  createRoom: async (data: any): Promise<Room> => {
    const res = await api.post<Room>('/rooms', data);
    return res.data;
  },
  getHostels: async (): Promise<Hostel[]> => {
    const res = await api.get<Hostel[]>('/hostels');
    return res.data;
  },
  getBlocks: async (hostelId?: number): Promise<Block[]> => {
    const res = await api.get<Block[]>('/hostels/blocks', { params: { hostel_id: hostelId } });
    return res.data;
  }
};

export const allocationsApi = {
  getAllocations: async (statusFilter?: string, search?: string): Promise<Allocation[]> => {
    const res = await api.get<Allocation[]>('/allocations', {
      params: { status_filter: statusFilter, search }
    });
    return res.data;
  },
  allocateBed: async (data: { resident_id: number; bed_id: number; academic_year?: string; remarks?: string }): Promise<Allocation> => {
    const res = await api.post<Allocation>('/allocations', data);
    return res.data;
  },
  transferBed: async (data: { allocation_id: number; new_bed_id: number; remarks?: string }): Promise<Allocation> => {
    const res = await api.post<Allocation>('/allocations/transfer', data);
    return res.data;
  },
  vacateBed: async (data: { allocation_id: number; vacated_date?: string; remarks?: string }): Promise<Allocation> => {
    const res = await api.post<Allocation>('/allocations/vacate', data);
    return res.data;
  }
};

export const studentsApi = {
  getStudents: async (params?: { search?: string; status_filter?: string; course_filter?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ items: Resident[]; total: number; page: number; pages: number }>('/students', { params });
    return res.data;
  },
  getStudentProfile: async (id: number): Promise<ResidentDetail> => {
    const res = await api.get<ResidentDetail>(`/students/${id}`);
    return res.data;
  },
  admitStudent: async (data: any): Promise<Resident> => {
    const res = await api.post<Resident>('/students', data);
    return res.data;
  }
};

export const feesApi = {
  getFeeStructures: async (): Promise<FeeStructure[]> => {
    const res = await api.get<FeeStructure[]>('/fees/structures');
    return res.data;
  },
  createFeeStructure: async (data: any): Promise<FeeStructure> => {
    const res = await api.post<FeeStructure>('/fees/structures', data);
    return res.data;
  },
  getInvoices: async (params?: { resident_id?: number; status_filter?: string; search?: string }): Promise<FeeInvoice[]> => {
    const res = await api.get<FeeInvoice[]>('/fees/invoices', { params });
    return res.data;
  },
  createIndividualInvoice: async (data: any): Promise<FeeInvoice> => {
    const res = await api.post<FeeInvoice>('/fees/invoices/individual', data);
    return res.data;
  },
  generateBatchInvoices: async (data: any): Promise<FeeInvoice[]> => {
    const res = await api.post<FeeInvoice[]>('/fees/invoices/batch', data);
    return res.data;
  },
  recordPayment: async (data: { invoice_id: number; amount: number; payment_method: string; transaction_ref?: string; remarks?: string }): Promise<Payment> => {
    const res = await api.post<Payment>('/fees/payments', data);
    return res.data;
  },
  getReceipt: async (receiptNo: string): Promise<Receipt> => {
    const res = await api.get<Receipt>(`/fees/receipts/${receiptNo}`);
    return res.data;
  },
  getDefaulters: async (): Promise<Defaulter[]> => {
    const res = await api.get<Defaulter[]>('/fees/defaulters');
    return res.data;
  }
};

export const leavesApi = {
  getLeaves: async (params?: { resident_id?: number; status_filter?: string }): Promise<LeaveRequest[]> => {
    const res = await api.get<LeaveRequest[]>('/leaves', { params });
    return res.data;
  },
  applyLeave: async (data: any): Promise<LeaveRequest> => {
    const res = await api.post<LeaveRequest>('/leaves', data);
    return res.data;
  },
  reviewLeave: async (id: number, data: { status: 'APPROVED' | 'REJECTED'; remarks?: string }): Promise<LeaveRequest> => {
    const res = await api.patch<LeaveRequest>(`/leaves/${id}/review`, data);
    return res.data;
  },
  getActiveGatePasses: async (): Promise<GatePass[]> => {
    const res = await api.get<GatePass[]>('/leaves/gate-passes/active');
    return res.data;
  },
  verifyGatePass: async (code: string): Promise<GatePassVerification> => {
    const res = await api.get<GatePassVerification>(`/leaves/gate-passes/verify/${encodeURIComponent(code)}`);
    return res.data;
  },
  logGateAction: async (gatePassId: number, data: { action: 'EXIT' | 'ENTRY'; remarks?: string }): Promise<GatePass> => {
    const res = await api.post<GatePass>(`/leaves/gate-passes/${gatePassId}/log`, data);
    return res.data;
  }
};

export const attendanceApi = {
  getRegister: async (targetDate?: string, blockId?: number): Promise<AttendanceRegisterRow[]> => {
    const res = await api.get<AttendanceRegisterRow[]>('/attendance/register', {
      params: { target_date: targetDate, block_id: blockId }
    });
    return res.data;
  },
  markBulk: async (data: { date: string; entries: { resident_id: number; status: AttendanceStatus; remarks?: string }[] }) => {
    const res = await api.post('/attendance/mark-bulk', data);
    return res.data;
  }
};

export const complaintsApi = {
  getComplaints: async (params?: { resident_id?: number; category?: string; status_filter?: string }): Promise<Complaint[]> => {
    const res = await api.get<Complaint[]>('/complaints', { params });
    return res.data;
  },
  fileComplaint: async (data: any): Promise<Complaint> => {
    const res = await api.post<Complaint>('/complaints', data);
    return res.data;
  },
  assignComplaint: async (id: number, assignedToId: number): Promise<Complaint> => {
    const res = await api.patch<Complaint>(`/complaints/${id}/assign`, { assigned_to_id: assignedToId });
    return res.data;
  },
  updateStatus: async (id: number, data: { status: string; resolution_notes?: string }): Promise<Complaint> => {
    const res = await api.patch<Complaint>(`/complaints/${id}/status`, data);
    return res.data;
  }
};

export const visitorsApi = {
  getVisitors: async (search?: string): Promise<Visitor[]> => {
    const res = await api.get<Visitor[]>('/visitors', { params: { search } });
    return res.data;
  },
  checkIn: async (data: any): Promise<Visitor> => {
    const res = await api.post<Visitor>('/visitors', data);
    return res.data;
  },
  checkOut: async (id: number, remarks?: string): Promise<Visitor> => {
    const res = await api.patch<Visitor>(`/visitors/${id}/checkout`, { remarks });
    return res.data;
  }
};

export const noticesApi = {
  getNotices: async (): Promise<Notice[]> => {
    const res = await api.get<Notice[]>('/notices');
    return res.data;
  },
  createNotice: async (data: any): Promise<Notice> => {
    const res = await api.post<Notice>('/notices', data);
    return res.data;
  },
  deleteNotice: async (id: number): Promise<void> => {
    await api.delete(`/notices/${id}`);
  }
};

export const messApi = {
  getMenu: async (): Promise<MessMenu[]> => {
    const res = await api.get<MessMenu[]>('/mess/menu');
    return res.data;
  },
  updateMenuDay: async (day: string, data: any): Promise<MessMenu> => {
    const res = await api.put<MessMenu>(`/mess/menu/${day}`, data);
    return res.data;
  }
};

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/analytics/dashboard-stats');
    return res.data;
  },
  getBlockOccupancy: async (): Promise<BlockOccupancyData[]> => {
    const res = await api.get<BlockOccupancyData[]>('/analytics/block-occupancy');
    return res.data;
  },
  getRoomTypes: async (): Promise<RoomTypeDistributionData[]> => {
    const res = await api.get<RoomTypeDistributionData[]>('/analytics/room-types');
    return res.data;
  },
  getRecentActivity: async (): Promise<ActivityItem[]> => {
    const res = await api.get<ActivityItem[]>('/analytics/recent-activity');
    return res.data;
  }
};

export default api;
