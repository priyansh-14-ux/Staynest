import React, { useEffect, useState } from 'react';
import { roomsApi } from '../../lib/api';
import { Room, RoomType, Block } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const RoomList: React.FC = () => {
  const { role } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Add Room Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [floorId, setFloorId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('DOUBLE_NON_AC');
  const [capacity, setCapacity] = useState('2');
  const [rate, setRate] = useState('6000');
  const [hasAC, setHasAC] = useState(false);
  const [hasBath, setHasBath] = useState(false);
  const [amenities, setAmenities] = useState('Wi-Fi, Study Table, Wardrobe');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const [roomsData, blocksData] = await Promise.all([
        roomsApi.getRooms(),
        roomsApi.getBlocks()
      ]);
      setRooms(roomsData);
      setBlocks(blocksData);
      if (blocksData.length > 0 && blocksData[0].floors.length > 0) {
        setFloorId(String(blocksData[0].floors[0].id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await roomsApi.createRoom({
        floor_id: Number(floorId),
        room_number: roomNumber,
        room_type: roomType,
        capacity: Number(capacity),
        monthly_rate: Number(rate),
        has_air_conditioner: hasAC,
        has_attached_bathroom: hasBath,
        amenities: amenities
      });
      setIsAddOpen(false);
      setRoomNumber('');
      await fetchRooms();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.room_number.toLowerCase().includes(search.toLowerCase()) ||
                          r.room_type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.room_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-700" />
            Hostel Rooms Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete registry of accommodation rooms, bed capacities, amenities, and rental rates
          </p>
        </div>

        {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
          <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddOpen(true)}>
            Add New Room
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search room number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Room Types</option>
              <option value="SINGLE_AC">Single AC</option>
              <option value="SINGLE_NON_AC">Single Non-AC</option>
              <option value="DOUBLE_AC">Double AC</option>
              <option value="DOUBLE_NON_AC">Double Non-AC</option>
              <option value="TRIPLE">Triple</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredRooms.length} of {rooms.length} Rooms
          </span>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Room No.</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4 text-center">Capacity</th>
                <th className="py-3 px-4 text-center">Occupancy</th>
                <th className="py-3 px-4">Amenities</th>
                <th className="py-3 px-4 text-right">Monthly Rent</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading rooms...</td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No rooms found</td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const isFull = (room.occupied_beds_count || 0) >= room.capacity;
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{room.room_number}</td>
                      <td className="py-3 px-4 text-slate-700 capitalize">
                        {room.room_type.replace(/_/g, ' ').toLowerCase()}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{room.capacity} Beds</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold">{room.occupied_beds_count || 0}</span> / {room.capacity}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          {room.has_air_conditioner && <Badge variant="teal" className="text-[10px] py-0">AC</Badge>}
                          {room.has_attached_bathroom && <Badge variant="slate" className="text-[10px] py-0">Bath</Badge>}
                          <span className="truncate">{room.amenities}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(room.monthly_rate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isFull ? 'amber' : 'emerald'}>
                          {isFull ? 'Full' : `${room.available_beds_count || 0} Vacant`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Room"
        description="Add a room and auto-provision its physical bed slots"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <Select
            label="Floor Location"
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            required
          >
            {blocks.flatMap(b =>
              b.floors.map(f => (
                <option key={f.id} value={f.id}>
                  {b.name} — {f.floor_name}
                </option>
              ))
            )}
          </Select>

          <Input
            label="Room Number"
            placeholder="e.g. A-105"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Room Type"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomType)}
            >
              <option value="SINGLE_AC">Single AC</option>
              <option value="SINGLE_NON_AC">Single Non-AC</option>
              <option value="DOUBLE_AC">Double AC</option>
              <option value="DOUBLE_NON_AC">Double Non-AC</option>
              <option value="TRIPLE">Triple</option>
              <option value="DORMITORY">Dormitory</option>
            </Select>

            <Input
              label="Bed Capacity"
              type="number"
              min="1"
              max="8"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <Input
            label="Monthly Rental Rate (₹)"
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />

          <div className="flex items-center gap-6 pt-1 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAC}
                onChange={(e) => setHasAC(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              Air Conditioned
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBath}
                onChange={(e) => setHasBath(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              Attached Bathroom
            </label>
          </div>

          <Input
            label="Amenities"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Room
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
