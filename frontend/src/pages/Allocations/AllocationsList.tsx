import React, { useEffect, useState } from 'react';
import { allocationsApi, roomsApi } from '../../lib/api';
import { Allocation, AllocationStatus, BlockGridItem } from '../../types';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { BedDouble, ArrowRightLeft, LogOut, Search, Filter, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const AllocationsList: React.FC = () => {
  const { role } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Allocation | null>(null);
  const [availableBeds, setAvailableBeds] = useState<{ id: number; label: string }[]>([]);
  const [newBedId, setNewBedId] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vacate Modal
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [vacateTarget, setVacateTarget] = useState<Allocation | null>(null);

  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const data = await allocationsApi.getAllocations(statusFilter === 'ALL' ? undefined : statusFilter, search);
      setAllocations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [statusFilter]);

  const openTransferModal = async (alloc: Allocation) => {
    setTransferTarget(alloc);
    setIsTransferOpen(true);
    setNewBedId('');
    setTransferRemarks('');
    try {
      const grid = await roomsApi.getVisualGrid();
      const avBeds: { id: number; label: string }[] = [];
      grid.forEach(b => {
        b.floors.forEach(f => {
          f.rooms.forEach(r => {
            r.beds.forEach(bed => {
              if (bed.status === 'AVAILABLE') {
                avBeds.push({
                  id: bed.bed_id,
                  label: `${b.block_name} • Room ${r.room_number} (${bed.bed_number})`
                });
              }
            });
          });
        });
      });
      setAvailableBeds(avBeds);
      if (avBeds.length > 0) setNewBedId(String(avBeds[0].id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !newBedId) return;
    setIsSubmitting(true);
    try {
      await allocationsApi.transferBed({
        allocation_id: transferTarget.id,
        new_bed_id: Number(newBedId),
        remarks: transferRemarks
      });
      setIsTransferOpen(false);
      await fetchAllocations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to transfer bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacateConfirm = async () => {
    if (!vacateTarget) return;
    setIsSubmitting(true);
    try {
      await allocationsApi.vacateBed({
        allocation_id: vacateTarget.id,
        remarks: 'Vacated by administration'
      });
      setIsVacateOpen(false);
      await fetchAllocations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to vacate bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = allocations.filter(a =>
    a.resident_name.toLowerCase().includes(search.toLowerCase()) ||
    a.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    a.room_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-brand-700" />
            Bed Allocations Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking active student bed bookings, inter-room transfers, and historical checkout records
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search student or room..."
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
              <option value="ACTIVE">Active Allocations</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="VACATED">Vacated</option>
              <option value="ALL">All Records</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} Allocations
          </span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Reg. No</th>
                <th className="py-3 px-4">Block & Room</th>
                <th className="py-3 px-4">Bed Slot</th>
                <th className="py-3 px-4">Allocated Date</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4 text-center">Status</th>
                {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
                  <th className="py-3 px-4 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading allocations...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No allocation records found</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.resident_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{a.registration_number}</td>
                    <td className="py-3 px-4 text-slate-800">
                      {a.block_name} • <span className="font-semibold">Room {a.room_number}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand-800">{a.bed_number}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(a.allocated_from)}</td>
                    <td className="py-3 px-4 text-slate-500">{a.academic_year}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="auto" statusText={a.status}>
                        {a.status}
                      </Badge>
                    </td>
                    {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
                      <td className="py-3 px-4 text-right">
                        {a.status === 'ACTIVE' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              icon={<ArrowRightLeft className="w-3 h-3" />}
                              onClick={() => openTransferModal(a)}
                            >
                              Transfer
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="h-7 px-2 text-[11px]"
                              icon={<LogOut className="w-3 h-3" />}
                              onClick={() => {
                                setVacateTarget(a);
                                setIsVacateOpen(true);
                              }}
                            >
                              Vacate
                            </Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Student to New Bed"
        description={`Moving ${transferTarget?.resident_name} from Room ${transferTarget?.room_number} (${transferTarget?.bed_number})`}
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {availableBeds.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs">
              No vacant beds available in the system for transfer.
            </div>
          ) : (
            <Select
              label="Select Target Available Bed"
              value={newBedId}
              onChange={(e) => setNewBedId(e.target.value)}
              required
            >
              {availableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Transfer Remarks"
            placeholder="e.g. Requested room change due to medical/study reasons"
            value={transferRemarks}
            onChange={(e) => setTransferRemarks(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={availableBeds.length === 0}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vacate Confirmation Modal */}
      <Modal
        isOpen={isVacateOpen}
        onClose={() => setIsVacateOpen(false)}
        title="Vacate Bed Confirmation"
        description={`End active allocation for ${vacateTarget?.resident_name}`}
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to vacate Room <strong>{vacateTarget?.room_number}</strong> ({vacateTarget?.bed_number})? The bed will immediately become AVAILABLE for allocation.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsVacateOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleVacateConfirm} isLoading={isSubmitting}>
              Confirm Vacate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
