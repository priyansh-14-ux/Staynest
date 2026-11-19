import React, { useEffect, useState } from 'react';
import { noticesApi } from '../../lib/api';
import { Notice } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Bell, Pin, Plus, Trash2, Calendar, User, Megaphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const NoticesPage: React.FC = () => {
  const { role } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const data = await noticesApi.getNotices();
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await noticesApi.createNotice({
        title,
        content,
        category,
        target_audience: targetAudience,
        is_pinned: isPinned
      });
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      await fetchNotices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await noticesApi.deleteNotice(id);
      await fetchNotices();
    } catch (err: any) {
      alert('Failed to delete notice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-700" />
            Hostel Notice & Announcements Bulletin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official circulars, curfew advisories, maintenance schedules, and student council events
          </p>
        </div>

        {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
          <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            Post Circular
          </Button>
        )}
      </div>

      {/* Notices Stream */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white border border-dashed rounded-lg">
            No circulars posted on the bulletin board.
          </div>
        ) : (
          notices.map((n) => (
            <Card key={n.id} className={n.is_pinned ? 'border-brand-500/80 shadow-md ring-1 ring-brand-100' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.is_pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-brand-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3 text-brand-600 fill-brand-600" /> Pinned Advisory
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                  <Badge variant="teal">{n.category}</Badge>
                </div>
                {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-5 text-xs text-slate-700 space-y-3">
                <p className="whitespace-pre-line leading-relaxed">{n.content}</p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Issued by {n.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(n.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Notice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Post Hostel Circular"
        description="Publish an advisory to student and staff dashboards"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Notice Title"
            placeholder="e.g. Annual Maintenance & Water Tank Cleaning Schedule"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Notice Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General Administration</option>
              <option value="Discipline & Safety">Discipline & Safety</option>
              <option value="Events">Sports & Cultural Events</option>
              <option value="Maintenance">Maintenance & Utilities</option>
              <option value="Mess">Mess & Dining</option>
            </Select>

            <Select
              label="Target Audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              <option value="ALL">All Residents & Staff</option>
              <option value="BOYS_HOSTEL">Aryabhata (Boys Wings)</option>
              <option value="GIRLS_HOSTEL">Gargi (Girls Wing)</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Notice Body</label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-600"
              placeholder="Write the complete announcement text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            Pin to top of bulletin board as urgent advisory
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publish Circular
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
