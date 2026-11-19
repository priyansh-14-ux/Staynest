import React, { useEffect, useState } from 'react';
import { visitorsApi, studentsApi } from '../../lib/api';
import { Visitor, Resident } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { BookOpen, UserPlus, Search, LogOut, CheckCircle2, Shield, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const VisitorLog: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check In Modal
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [students, setStudents] = useState<Resident[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const data = await visitorsApi.getVisitors(search);
      setVisitors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [search]);

  const openCheckInModal = async () => {
    setIsCheckInOpen(true);
    try {
      const res = await studentsApi.getStudents({ limit: 100 });
      setStudents(res.items);
      if (res.items.length > 0) {
        setSelectedStudentId(String(res.items[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setIsSubmitting(true);
    try {
      await visitorsApi.checkIn({
        resident_id: Number(selectedStudentId),
        visitor_name: visitorName,
        phone,
        relationship_to_resident: relation,
        id_proof_type: idType,
        id_proof_number: idNumber,
        purpose
      });
      setIsCheckInOpen(false);
      setVisitorName('');
      setPhone('');
      setIdNumber('');
      setPurpose('');
      await fetchVisitors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to check-in visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (visitorId: number) => {
    try {
      await visitorsApi.checkOut(visitorId, 'Departed campus normally');
      await fetchVisitors();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to check out visitor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-700" />
            Hostel Visitor Entry Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logging parents, guardians, and external guests visiting campus residents
          </p>
        </div>

        <Button size="sm" variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={openCheckInModal}>
          Register Visitor Check-In
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="w-72">
            <Input
              placeholder="Search visitor name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {visitors.length} entries
          </span>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Visitor Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Hostel Resident</th>
                <th className="py-3 px-4">Relationship</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Check-Out Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">Loading visitor logs...</td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">No visitor records logged</td>
                </tr>
              ) : (
                visitors.map((v) => {
                  const isInside = !v.check_out_time;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.visitor_name}</div>
                        <div className="text-[10px] text-slate-400">{v.id_proof_type}: {v.id_proof_number}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{v.phone}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{v.resident_name}</div>
                        <div className="text-[10px] text-slate-500">Rm {v.room_number || 'N/A'} • {v.registration_number}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{v.relationship_to_resident}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{v.purpose}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDateTime(v.check_in_time)}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {v.check_out_time ? formatDateTime(v.check_out_time) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isInside ? 'sky' : 'emerald'}>
                          {isInside ? 'Inside Campus' : 'Departed'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isInside && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            icon={<LogOut className="w-3 h-3" />}
                            onClick={() => handleCheckOut(v.id)}
                          >
                            Check-Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Visitor Check-In Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Visitor Gate Check-In"
        description="Verify government ID and record resident guest entry"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <Select
            label="Visiting Resident Student"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            required
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.registration_number}) {s.current_room ? `• Room ${s.current_room.room_number}` : ''}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Visitor Full Name"
              placeholder="e.g. Ramesh Patel"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              required
            />
            <Input
              label="Visitor Phone Number"
              placeholder="+91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Relationship"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
            >
              <option value="Parent">Parent (Father / Mother)</option>
              <option value="Sibling">Sibling (Brother / Sister)</option>
              <option value="Guardian">Local Guardian</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
            </Select>

            <Select
              label="ID Proof Type"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID Card</option>
              <option value="Passport">Passport</option>
            </Select>
          </div>

          <Input
            label="ID Proof Number"
            placeholder="e.g. XXXX-XXXX-4912"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
          />

          <Input
            label="Purpose of Visit"
            placeholder="e.g. Bringing winter essentials / academic meeting"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCheckInOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Check-In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
