import React, { useEffect, useState } from 'react';
import { roomsApi, allocationsApi, studentsApi } from '../../lib/api';
import { BlockGridItem, RoomGridItem, BedGridItem, Resident } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  Bed,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  Building,
  Layers,
  ArrowRightLeft,
  LogOut,
  PlusCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

export const RoomGrid: React.FC = () => {
  const { role } = useAuth();
  const [gridData, setGridData] = useState<BlockGridItem[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Allocation Modal State
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{ bed_id: number; bed_number: string; room_number: string } | null>(null);
  const [students, setStudents] = useState<Resident[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [allocationRemarks, setAllocationRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vacate Modal State
  const [isVacateOpen, setIsVacateOpen] = useState(false);
  const [bedToVacate, setBedToVacate] = useState<{ bed_id: number; bed_number: string; room_number: string; resident_name: string; resident_id: number } | null>(null);

  const fetchGrid = async () => {
    setIsLoading(true);
    try {
      const data = await roomsApi.getVisualGrid();
      setGridData(data);
    } catch (err) {
      console.error('Error fetching visual room grid', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();
  }, []);

  const openAllocateModal = async (bed: BedGridItem, room: RoomGridItem) => {
    setSelectedBed({ bed_id: bed.bed_id, bed_number: bed.bed_number, room_number: room.room_number });
    setErrorMsg(null);
    setSelectedStudentId('');
    setAllocationRemarks('');
    setIsAllocateOpen(true);

    try {
      const res = await studentsApi.getStudents({ limit: 100 });
      // Filter students who are active and not currently allocated
      const unallocated = res.items.filter(s => !s.current_room);
      setStudents(unallocated);
      if (unallocated.length > 0) {
        setSelectedStudentId(String(unallocated[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedStudentId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await allocationsApi.allocateBed({
        bed_id: selectedBed.bed_id,
        resident_id: Number(selectedStudentId),
        remarks: allocationRemarks || 'Allocated via Visual Room Matrix'
      });
      setIsAllocateOpen(false);
      await fetchGrid();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to allocate bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacateConfirm = async () => {
    if (!bedToVacate) return;
    setIsSubmitting(true);
    try {
      // Find allocation for this bed
      const allocs = await allocationsApi.getAllocations('ACTIVE');
      const activeAlloc = allocs.find(a => a.bed_id === bedToVacate.bed_id);
      if (activeAlloc) {
        await allocationsApi.vacateBed({
          allocation_id: activeAlloc.id,
          remarks: 'Vacated via Room Grid Management'
        });
      }
      setIsVacateOpen(false);
      setBedToVacate(null);
      await fetchGrid();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to vacate bed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics summary
  let totalBeds = 0;
  let occupiedBeds = 0;
  let availableBeds = 0;
  let maintenanceBeds = 0;

  gridData.forEach(block => {
    block.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.beds.forEach(bed => {
          totalBeds++;
          if (bed.status === 'OCCUPIED') occupiedBeds++;
          else if (bed.status === 'AVAILABLE') availableBeds++;
          else maintenanceBeds++;
        });
      });
    });
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-brand-700" />
            Interactive Room & Bed Allocation Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual spatial view of hostels, floors, rooms, and live bed occupancy states
          </p>
        </div>

        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-2xs text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">{availableBeds} Available</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-2xs text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="font-semibold text-slate-700">{occupiedBeds} Occupied</span>
          </div>
          {maintenanceBeds > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md shadow-2xs text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-semibold text-slate-700">{maintenanceBeds} Maintenance</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200/90 rounded-lg shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Block:</span>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-1 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Hostel Blocks</option>
              {gridData.map(b => (
                <option key={b.block_id} value={String(b.block_id)}>
                  {b.block_name} ({b.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Bed Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-1 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="OCCUPIED">Occupied Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Total Inventory: <strong>{totalBeds} Beds</strong> across <strong>{gridData.length} Blocks</strong>
        </div>
      </div>

      {/* Hierarchical Block -> Floor -> Room -> Beds Grid */}
      <div className="space-y-8">
        {gridData
          .filter(b => selectedBlockId === 'ALL' || String(b.block_id) === selectedBlockId)
          .map((block) => (
            <div key={block.block_id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-700" />
                  <h2 className="text-base font-bold text-slate-900">{block.block_name}</h2>
                  <Badge variant={block.gender === 'FEMALE' ? 'rose' : block.gender === 'MALE' ? 'sky' : 'slate'}>
                    {block.gender}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500">
                  {block.floors.length} Floors
                </span>
              </div>

              {block.floors.map((floor) => (
                <div key={floor.floor_id} className="space-y-3 bg-slate-50/60 p-4 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{floor.floor_name}</span>
                    <span className="text-[11px] text-slate-400">({floor.rooms.length} Rooms)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {floor.rooms.map((room) => {
                      const displayedBeds = room.beds.filter(
                        bed => statusFilter === 'ALL' || bed.status === statusFilter
                      );
                      if (displayedBeds.length === 0 && statusFilter !== 'ALL') return null;

                      const isFull = room.occupied_count >= room.capacity;

                      return (
                        <div
                          key={room.room_id}
                          className="bg-white rounded-lg border border-slate-200 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between overflow-hidden"
                        >
                          {/* Room Header */}
                          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">Room {room.room_number}</span>
                                {room.has_ac && (
                                  <span className="px-1.5 py-0.2 bg-teal-50 text-brand-800 border border-teal-200 rounded text-[9px] font-bold">
                                    AC
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 capitalize">
                                {room.room_type.replace(/_/g, ' ').toLowerCase()}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-900">
                                {formatCurrency(room.monthly_rate)}
                              </span>
                              <div className="text-[10px] text-slate-400">/mo</div>
                            </div>
                          </div>

                          {/* Beds Grid inside Room */}
                          <div className="p-3 space-y-2 flex-1">
                            {room.beds.map((bed) => {
                              const isOccupied = bed.status === 'OCCUPIED';
                              const isAvail = bed.status === 'AVAILABLE';

                              return (
                                <div
                                  key={bed.bed_id}
                                  className={`p-2.5 rounded-md border text-xs transition-all flex items-center justify-between ${
                                    isOccupied
                                      ? 'bg-sky-50/60 border-sky-200 text-sky-950'
                                      : isAvail
                                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                      : 'bg-rose-50 border-rose-200 text-rose-950'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                        isOccupied
                                          ? 'bg-sky-100 text-sky-700'
                                          : isAvail
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-rose-100 text-rose-700'
                                      }`}
                                    >
                                      <Bed className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="truncate">
                                      <div className="font-semibold text-xs flex items-center gap-1.5 truncate">
                                        <span>{bed.bed_number}</span>
                                        <Badge variant={isOccupied ? 'sky' : isAvail ? 'emerald' : 'rose'} className="text-[9px] py-0 px-1">
                                          {bed.status}
                                        </Badge>
                                      </div>
                                      {isOccupied && bed.resident_name ? (
                                        <div className="text-[11px] text-slate-700 truncate font-medium mt-0.5">
                                          {bed.resident_name} ({bed.registration_number})
                                        </div>
                                      ) : isAvail ? (
                                        <div className="text-[10px] text-emerald-700">Ready for allocation</div>
                                      ) : null}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
                                    <div className="shrink-0 ml-2">
                                      {isAvail ? (
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          className="h-6 px-2 text-[10px] bg-brand-700 hover:bg-brand-800"
                                          onClick={() => openAllocateModal(bed, room)}
                                        >
                                          Allocate
                                        </Button>
                                      ) : isOccupied ? (
                                        <button
                                          title="Vacate Bed"
                                          onClick={() => {
                                            setBedToVacate({
                                              bed_id: bed.bed_id,
                                              bed_number: bed.bed_number,
                                              room_number: room.room_number,
                                              resident_name: bed.resident_name || 'Student',
                                              resident_id: bed.resident_id || 0
                                            });
                                            setIsVacateOpen(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                        >
                                          <LogOut className="w-3.5 h-3.5" />
                                        </button>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Capacity Progress */}
                          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                              {room.occupied_count} / {room.capacity} Beds Occupied
                            </span>
                            <span className={isFull ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                              {isFull ? 'Full' : `${room.available_count} Left`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Allocate Bed Modal */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title="Direct Bed Allocation"
        description={`Assigning resident to Room ${selectedBed?.room_number} (${selectedBed?.bed_number})`}
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
              {errorMsg}
            </div>
          )}

          {students.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs">
              No unallocated students available. Please admit a student first from the Student Admission portal.
            </div>
          ) : (
            <Select
              label="Select Registered Student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.registration_number}) — {s.course}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Academic Year"
            defaultValue="2026-2027"
            disabled
          />

          <Input
            label="Allocation Remarks"
            placeholder="e.g. Admitted in Fall 2026 Batch"
            value={allocationRemarks}
            onChange={(e) => setAllocationRemarks(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAllocateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={students.length === 0}>
              Confirm Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Vacate Bed Modal */}
      <Modal
        isOpen={isVacateOpen}
        onClose={() => setIsVacateOpen(false)}
        title="Confirm Bed Vacating"
        description={`De-allocate ${bedToVacate?.resident_name} from Room ${bedToVacate?.room_number} (${bedToVacate?.bed_number})`}
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to vacate this bed? This will transition the allocation to <strong>VACATED</strong> and mark the bed as <strong>AVAILABLE</strong> for new student bookings.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div>Student: <strong>{bedToVacate?.resident_name}</strong></div>
            <div>Bed Slot: <strong>Room {bedToVacate?.room_number} - {bedToVacate?.bed_number}</strong></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsVacateOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleVacateConfirm} isLoading={isSubmitting}>
              Vacate & Release Bed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
