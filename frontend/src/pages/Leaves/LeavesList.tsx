import React, { useEffect, useState } from 'react';
import { leavesApi } from '../../lib/api';
import { LeaveRequest, LeaveType, GatePass } from '../../types';
import { formatDateTime, formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  DoorOpen, Plus, Search, Filter, QrCode, CheckCircle2,
  XCircle, Clock, ShieldCheck, Printer, Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const LeavesList: React.FC = () => {
  const { role, user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Apply Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('OUTPASS');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [parentInformed, setParentInformed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review Modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [targetLeave, setTargetLeave] = useState<LeaveRequest | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Gate Pass Modal
  const [isGatePassOpen, setIsGatePassOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const data = await leavesApi.getLeaves({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await leavesApi.applyLeave({
        leave_type: leaveType,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        destination,
        reason,
        emergency_contact: emergencyContact,
        parent_informed: parentInformed
      });
      setIsApplyOpen(false);
      await fetchLeaves();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit outpass request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!targetLeave) return;
    setIsSubmitting(true);
    try {
      await leavesApi.reviewLeave(targetLeave.id, {
        status,
        remarks: reviewRemarks || (status === 'APPROVED' ? 'Approved by Warden' : 'Rejected due to timing constraints')
      });
      setIsReviewOpen(false);
      await fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Review action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-brand-700" />
            Student Outpasses & Digital Gate Passes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Application, warden approvals, QR token issuance, and security gate entry/exit tracking
          </p>
        </div>

        {role === 'STUDENT' && (
          <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsApplyOpen(true)}>
            Apply for Outpass
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-1.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Outpass Requests</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved & Active Passes</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <span className="text-xs text-slate-500">
            Total {leaves.length} records
          </span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Resident</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Departure & Return</th>
                <th className="py-3 px-4">Gate Pass #</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading leave requests...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No leave applications found</td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{l.resident_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{l.registration_number} {l.room_number ? `• Rm ${l.room_number}` : ''}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.leave_type}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{l.destination}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{l.reason}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>Out: {formatDateTime(l.start_time)}</div>
                      <div className="text-[10px] text-slate-500">In: {formatDateTime(l.end_time)}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-brand-800">
                      {l.gate_pass ? (
                        <button
                          onClick={() => {
                            setSelectedPass(l.gate_pass!);
                            setIsGatePassOpen(true);
                          }}
                          className="hover:underline flex items-center gap-1 text-brand-700 font-bold"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{l.gate_pass.pass_number}</span>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="auto" statusText={l.status}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && l.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setTargetLeave(l);
                            setReviewRemarks('');
                            setIsReviewOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      ) : l.gate_pass ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          icon={<QrCode className="w-3 h-3" />}
                          onClick={() => {
                            setSelectedPass(l.gate_pass!);
                            setIsGatePassOpen(true);
                          }}
                        >
                          View Pass
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Outpass / Leave"
        description="Submit destination, departure, and return schedule for Warden authorization"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
              {errorMsg}
            </div>
          )}

          <Select
            label="Outpass Category"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            <option value="OUTPASS">Day Outpass (City / Local)</option>
            <option value="HOME_LEAVE">Home Leave (Weekend / Vacation)</option>
            <option value="MEDICAL">Medical Emergency / Hospital</option>
            <option value="EMERGENCY">Family Emergency</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Departure Date & Time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="Expected Return Date & Time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Destination"
            placeholder="e.g. Delhi (Home Address) or Central Library"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <Input
            label="Detailed Reason"
            placeholder="e.g. Attending sibling wedding / research seminar"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <Input
            label="Emergency Contact Number"
            placeholder="+91 98111 22233"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
          />

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={parentInformed}
              onChange={(e) => setParentInformed(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            Parents / Guardian have been informed and consent to this travel
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Warden Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Warden Outpass Review"
        description={`Review request for ${targetLeave?.resident_name} (${targetLeave?.destination})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
            <div><strong>Student:</strong> {targetLeave?.resident_name} ({targetLeave?.registration_number})</div>
            <div><strong>Destination:</strong> {targetLeave?.destination}</div>
            <div><strong>Reason:</strong> {targetLeave?.reason}</div>
            <div><strong>Schedule:</strong> {formatDateTime(targetLeave?.start_time)} to {formatDateTime(targetLeave?.end_time)}</div>
          </div>

          <Input
            label="Warden Decision Remarks / Instructions"
            placeholder="e.g. Approved. Must report back before curfew at 9:00 PM."
            value={reviewRemarks}
            onChange={(e) => setReviewRemarks(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="danger"
              isLoading={isSubmitting}
              onClick={() => handleReviewAction('REJECTED')}
            >
              Reject Outpass
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={() => handleReviewAction('APPROVED')}
            >
              Approve & Issue Gate Pass
            </Button>
          </div>
        </div>
      </Modal>

      {/* Digital Gate Pass Modal */}
      <Modal
        isOpen={isGatePassOpen}
        onClose={() => setIsGatePassOpen(false)}
        title="Digital Gate Pass"
        maxWidth="md"
      >
        {selectedPass && (
          <div className="space-y-5 text-center p-2">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg inline-block">
              <QrCode className="w-32 h-32 text-brand-800 mx-auto" />
            </div>

            <div>
              <div className="text-lg font-bold text-slate-900 font-mono tracking-wider">
                {selectedPass.pass_number}
              </div>
              <Badge variant="emerald" className="mt-1">
                {selectedPass.status}
              </Badge>
            </div>

            <div className="text-left text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Resident:</span>
                <span className="font-bold text-slate-800">{selectedPass.resident_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="font-mono">{selectedPass.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-medium">{selectedPass.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valid From:</span>
                <span>{formatDateTime(selectedPass.valid_from)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valid Until:</span>
                <span className="font-semibold text-rose-700">{formatDateTime(selectedPass.valid_until)}</span>
              </div>
            </div>

            {selectedPass.actual_out_time && (
              <div className="text-[11px] text-slate-500">
                Gate Exit Timestamp: <strong>{formatDateTime(selectedPass.actual_out_time)}</strong>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Outpass Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
