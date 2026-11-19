import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsApi, feesApi, leavesApi, complaintsApi } from '../../lib/api';
import { ResidentDetail, FeeInvoice, LeaveRequest, Complaint } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Bed, Users, IndianRupee, DoorOpen, Wrench,
  Mail, Phone, MapPin, Shield, Calendar, Clock, QrCode
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [student, setStudent] = useState<ResidentDetail | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<'room' | 'fees' | 'leaves' | 'complaints'>('room');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const studentId = Number(id);
        const [profileData, invData, leavesData, compData] = await Promise.all([
          studentsApi.getStudentProfile(studentId),
          feesApi.getInvoices({ resident_id: studentId }),
          leavesApi.getLeaves({ resident_id: studentId }),
          complaintsApi.getComplaints({ resident_id: studentId })
        ]);
        setStudent(profileData);
        setInvoices(invData);
        setLeaves(leavesData);
        setComplaints(compData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        Student record not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/students')} icon={<ArrowLeft className="w-4 h-4" />}>
          Directory
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{student.full_name}</h1>
            <Badge variant="auto" statusText={student.status}>{student.status}</Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {student.registration_number} • {student.course} (Year {student.year_of_study})
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-700 shrink-0">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Allocated Bed</span>
            <div className="text-sm font-bold text-slate-900">
              {student.current_room ? `Room ${student.current_room.room_number} (${student.current_room.bed_number})` : 'Unallocated'}
            </div>
            <div className="text-[10px] text-slate-500">
              {student.current_room ? `${student.current_room.block_name} • ${student.current_room.floor_name}` : 'Not assigned'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Outstanding Dues</span>
            <div className="text-sm font-bold text-slate-900">
              {formatCurrency(student.total_dues)}
            </div>
            <div className="text-[10px] text-slate-500">
              {student.total_dues > 0 ? 'Pending invoice payments' : 'All balances cleared'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Outpasses & Leaves</span>
            <div className="text-sm font-bold text-slate-900">
              {leaves.length} Total Requests
            </div>
            <div className="text-[10px] text-slate-500">
              {leaves.filter(l => l.status === 'APPROVED').length} Approved gate passes
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('room')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'room' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Room & Contact Info
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'fees' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'leaves' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Outpass Records ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'complaints' ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Maintenance Tickets ({complaints.length})
        </button>
      </div>

      {/* Tab 1: Room & Profile Info */}
      {activeTab === 'room' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal & Guardian Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{student.phone || 'No direct phone logged'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{student.permanent_address || 'Address on file'}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800">Guardian / Emergency:</span>
                <div className="mt-1 text-slate-600">
                  {student.guardian_name} ({student.guardian_relation}) • {student.guardian_phone}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Roommates & Shared Quarters</CardTitle>
            </CardHeader>
            <CardContent>
              {student.roommates.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  No roommates sharing this room (or single room occupancy)
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {student.roommates.map((rm) => (
                    <div key={rm.resident_id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{rm.name}</div>
                        <div className="text-[10px] text-slate-500">{rm.course}</div>
                      </div>
                      <Badge variant="teal">{rm.bed_number}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Fees */}
      {activeTab === 'fees' && (
        <Card>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Remaining Due</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4">{inv.title}</td>
                    <td className="py-2.5 px-4 text-slate-500">{inv.billing_period}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(inv.total_amount)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(inv.paid_amount)}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatCurrency(inv.remaining_due)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="auto" statusText={inv.status}>{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Leaves */}
      {activeTab === 'leaves' && (
        <Card>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Destination</th>
                  <th className="py-2.5 px-4">Departure & Return</th>
                  <th className="py-2.5 px-4">Pass Number</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{l.leave_type}</td>
                    <td className="py-2.5 px-4">{l.destination}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {formatDateTime(l.start_time)} → {formatDateTime(l.end_time)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-brand-800">
                      {l.gate_pass?.pass_number || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="auto" statusText={l.status}>{l.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Complaints */}
      {activeTab === 'complaints' && (
        <Card>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Ticket</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.ticket_number}</td>
                    <td className="py-2.5 px-4 text-slate-700">{c.category}</td>
                    <td className="py-2.5 px-4 font-medium">{c.title}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="auto" statusText={c.priority}>{c.priority}</Badge>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="auto" statusText={c.status}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
