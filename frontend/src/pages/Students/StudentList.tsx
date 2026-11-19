import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsApi } from '../../lib/api';
import { Resident, ResidentStatus } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Search, Eye, Bed, AlertCircle, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const StudentList: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Resident[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentsApi.getStudents({
        search,
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 100
      });
      setStudents(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-700" />
            Resident Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete records of admitted students, room occupancy, contact details, and financial dues
          </p>
        </div>

        {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
          <Button size="sm" variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => navigate('/students/admit')}>
            Admit New Resident
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-72">
              <Input
                placeholder="Search by name, reg no., or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Residents</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="GRADUATED">Graduated</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {total} Enrolled Students
          </span>
        </CardContent>
      </Card>

      {/* Students Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Reg. Number</th>
                <th className="py-3 px-4">Course & Year</th>
                <th className="py-3 px-4">Allocated Room</th>
                <th className="py-3 px-4">Emergency Contact</th>
                <th className="py-3 px-4 text-right">Fee Dues</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading student directory...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No students found matching query</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{s.registration_number}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{s.course}</div>
                      <div className="text-[10px] text-slate-400">Year {s.year_of_study} • {s.gender}</div>
                    </td>
                    <td className="py-3 px-4">
                      {s.current_room ? (
                        <div className="flex items-center gap-1.5 font-semibold text-brand-900">
                          <Bed className="w-3.5 h-3.5 text-brand-700" />
                          <span>{s.current_room.room_number} ({s.current_room.bed_number})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unallocated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{s.guardian_name} ({s.guardian_relation})</div>
                      <div className="text-[10px] text-slate-500">{s.guardian_phone}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.total_dues > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(s.total_dues)}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600">Paid</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="auto" statusText={s.status}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px]"
                        icon={<Eye className="w-3 h-3" />}
                        onClick={() => navigate(`/students/${s.id}`)}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
