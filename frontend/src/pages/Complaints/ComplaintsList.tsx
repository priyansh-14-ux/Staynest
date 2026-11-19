import React, { useEffect, useState } from 'react';
import { complaintsApi } from '../../lib/api';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  Wrench, Plus, Search, Filter, CheckCircle2, Clock,
  AlertTriangle, Shield, Check, MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const ComplaintsList: React.FC = () => {
  const { role, user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // File Complaint Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>('ELECTRICAL');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Status Modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [targetComplaint, setTargetComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await complaintsApi.getComplaints({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter
      });
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await complaintsApi.fileComplaint({
        category,
        priority,
        title,
        description
      });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      await fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to file complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComplaint) return;
    setIsSubmitting(true);
    try {
      await complaintsApi.updateStatus(targetComplaint.id, {
        status: newStatus,
        resolution_notes: resolutionNotes
      });
      setIsUpdateOpen(false);
      await fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update ticket status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-700" />
            Hostel Maintenance & Complaints Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking electrical, plumbing, carpentry, and facility repairs across rooms and common areas
          </p>
        </div>

        <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
          Lodge Maintenance Ticket
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-1.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Ticket Statuses</option>
              <option value="OPEN">Open Tickets</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-md border border-slate-300 py-1.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              <option value="ALL">All Categories</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="FURNITURE">Furniture / Carpentry</option>
              <option value="CLEANLINESS">Housekeeping / Cleanliness</option>
              <option value="INTERNET">Internet / Wi-Fi</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <span className="text-xs text-slate-500">
            Total {complaints.length} tickets
          </span>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Room & Resident</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Issue Title & Details</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Logged At</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading complaints queue...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No maintenance tickets found</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.ticket_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.room_number ? `Room ${c.room_number}` : 'Common Area'}</div>
                      <div className="text-[10px] text-slate-500">{c.resident_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="teal">{c.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-sm">
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.description}</div>
                      {c.resolution_notes && (
                        <div className="mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <strong>Note:</strong> {c.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="auto" statusText={c.priority}>{c.priority}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(c.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="auto" statusText={c.status}>{c.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {['SUPER_ADMIN', 'WARDEN', 'MAINTENANCE'].includes(role || '') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setTargetComplaint(c);
                            setNewStatus(c.status);
                            setResolutionNotes(c.resolution_notes || '');
                            setIsUpdateOpen(true);
                          }}
                        >
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lodge Complaint Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Lodge Maintenance Complaint"
        description="Submit a repair ticket to hostel maintenance technicians"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Issue Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
            >
              <option value="ELECTRICAL">Electrical (Fan, Light, Switch)</option>
              <option value="PLUMBING">Plumbing (Tap, Flush, Leakage)</option>
              <option value="FURNITURE">Furniture (Bed, Chair, Table)</option>
              <option value="CLEANLINESS">Housekeeping / Cleaning</option>
              <option value="INTERNET">Internet / Wi-Fi Router</option>
              <option value="OTHER">Other Facility Issue</option>
            </Select>

            <Select
              label="Urgency / Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
            >
              <option value="LOW">Low (Routine maintenance)</option>
              <option value="MEDIUM">Medium (Standard 24h repair)</option>
              <option value="HIGH">High (Urgent disruption)</option>
              <option value="EMERGENCY">Emergency (Hazard/Safety)</option>
            </Select>
          </div>

          <Input
            label="Brief Summary"
            placeholder="e.g. Wash basin tap continuously leaking"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Detailed Problem Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
              placeholder="Describe the exact location, symptoms, or behavior..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Ticket Status Modal */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Update Maintenance Ticket"
        description={`Ticket ${targetComplaint?.ticket_number}: ${targetComplaint?.title}`}
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <Select
            label="Update Ticket Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
          >
            <option value="OPEN">Open (Pending inspection)</option>
            <option value="IN_PROGRESS">In Progress (Parts procured / Technician on site)</option>
            <option value="RESOLVED">Resolved (Repaired and verified)</option>
            <option value="CLOSED">Closed (Archived)</option>
          </Select>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Technician Resolution Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
              placeholder="e.g. Replaced faulty modular capacitor and verified fan speeds 1-5."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
