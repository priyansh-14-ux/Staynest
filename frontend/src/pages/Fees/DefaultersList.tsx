import React, { useEffect, useState } from 'react';
import { feesApi } from '../../lib/api';
import { Defaulter } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AlertCircle, Download, Search, Phone, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const DefaultersList: React.FC = () => {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDefaulters = async () => {
      setIsLoading(true);
      try {
        const data = await feesApi.getDefaulters();
        setDefaulters(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaulters();
  }, []);

  const totalOverdue = defaulters.reduce((acc, d) => acc + d.total_overdue, 0);

  const filtered = defaulters.filter(d =>
    d.student_name.toLowerCase().includes(search.toLowerCase()) ||
    d.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    d.room_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Hostel Fee Defaulters Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Residents with unsettled overdue invoices past the formal deadline
          </p>
        </div>

        <a
          href="/api/v1/reports/defaulters/csv"
          download="hostel_defaulters.csv"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Defaulters CSV
        </a>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-600">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Outstanding Overdue</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalOverdue)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Aggregated overdue across all rooms</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Defaulter Students</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{defaulters.length} Residents</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Require collection reminders</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-slate-400">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Average Overdue Balance</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(defaulters.length > 0 ? totalOverdue / defaulters.length : 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Per defaulter resident</div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="w-72">
            <Input
              placeholder="Search by student, reg no, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <span className="text-xs text-slate-500">
            Showing {filtered.length} defaulters
          </span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Reg No.</th>
                <th className="py-3 px-4">Room No.</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Overdue Dues</th>
                <th className="py-3 px-4 text-center">Overdue Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading defaulters...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-emerald-600 font-semibold">
                    No overdue defaulters! All accounts are in good standing.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.resident_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.student_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{d.registration_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{d.room_number || 'Unallocated'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{d.guardian_phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(d.total_invoiced)}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(d.total_paid)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(d.total_overdue)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="rose">{d.overdue_invoices_count} Invoices</Badge>
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
