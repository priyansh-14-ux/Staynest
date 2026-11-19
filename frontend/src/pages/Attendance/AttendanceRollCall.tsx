import React, { useEffect, useState } from 'react';
import { attendanceApi, roomsApi } from '../../lib/api';
import { AttendanceRegisterRow, AttendanceStatus, Block } from '../../types';
import { formatDate } from '../../lib/utils';
import { CalendarCheck2, Check, X, Clock, Calendar, CheckCheck, Save, Building } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const AttendanceRollCall: React.FC = () => {
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [rows, setRows] = useState<AttendanceRegisterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const bData = await roomsApi.getBlocks();
        setBlocks(bData);
        if (bData.length > 0) {
          setSelectedBlockId(String(bData[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBlocks();
  }, []);

  const fetchRegister = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const data = await attendanceApi.getRegister(
        targetDate,
        selectedBlockId ? Number(selectedBlockId) : undefined
      );
      setRows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBlockId) {
      fetchRegister();
    }
  }, [targetDate, selectedBlockId]);

  const updateStatus = (residentId: number, newStatus: AttendanceStatus) => {
    setRows(prev =>
      prev.map(r => (r.resident_id === residentId ? { ...r, status: newStatus } : r))
    );
    setSaveSuccess(false);
  };

  const markAllPresent = () => {
    setRows(prev =>
      prev.map(r => ({
        ...r,
        // preserve ON_LEAVE if they have an approved outpass
        status: r.has_approved_leave ? 'ON_LEAVE' : 'PRESENT'
      }))
    );
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await attendanceApi.markBulk({
        date: targetDate,
        entries: rows.map(r => ({
          resident_id: r.resident_id,
          status: r.status,
          remarks: r.has_approved_leave ? 'Approved Outpass' : undefined
        }))
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save attendance register');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = rows.filter(r => r.status === 'PRESENT').length;
  const absentCount = rows.filter(r => r.status === 'ABSENT').length;
  const leaveCount = rows.filter(r => r.status === 'ON_LEAVE').length;
  const lateCount = rows.filter(r => r.status === 'LATE_ENTRY').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-brand-700" />
            Night Attendance & Curfew Roll-Call
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily resident roll-call with automated synchronization for approved gate passes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllPresent} icon={<CheckCheck className="w-4 h-4" />}>
            Mark All Present
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            Save Roll-Call
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> Attendance register saved successfully for {formatDate(targetDate)}!
        </div>
      )}

      {/* Date & Block Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Roll-Call Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-xs rounded-md border border-slate-300 py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Hostel Block:</span>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="text-xs rounded-md border border-slate-300 py-1.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold">
              {absentCount} Absent
            </span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded font-semibold">
              {leaveCount} On Leave
            </span>
            {lateCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                {lateCount} Late Entry
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roll Call Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Room No.</th>
                <th className="py-3 px-4">Resident Student</th>
                <th className="py-3 px-4">Reg No.</th>
                <th className="py-3 px-4">Gate Pass Status</th>
                <th className="py-3 px-4 text-center">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Loading roll-call register...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No active students allocated in this block</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.resident_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.room_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.resident_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{row.registration_number}</td>
                    <td className="py-3 px-4">
                      {row.has_approved_leave ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-semibold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                          Approved Outpass #{row.leave_id}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">In Hostel</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(row.resident_id, 'PRESENT')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            row.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(row.resident_id, 'ABSENT')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            row.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(row.resident_id, 'ON_LEAVE')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            row.status === 'ON_LEAVE'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          On Leave
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(row.resident_id, 'LATE_ENTRY')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            row.status === 'LATE_ENTRY'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Late Entry
                        </button>
                      </div>
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
