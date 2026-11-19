import React from 'react';
import { FileBarChart2, Download, Table, CheckCircle2, Shield, Users, Bed, IndianRupee } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const reportsList = [
    {
      title: 'Occupancy & Bed Allocation Audit',
      description: 'Comprehensive roster of all physical bed allocations, vacant slots, room types, and occupant identities across all blocks.',
      endpoint: '/api/v1/reports/occupancy/csv',
      filename: 'hostel_occupancy_report.csv',
      icon: <Bed className="w-5 h-5 text-brand-700" />,
      tag: 'Real-time Matrix'
    },
    {
      title: 'Fee Collections & Invoice Master',
      description: 'Detailed billing ledger detailing student fees, amounts paid, remaining dues, payment channels (UPI/NetBanking/Cash), and invoice statuses.',
      endpoint: '/api/v1/reports/fees/csv',
      filename: 'hostel_fees_collections.csv',
      icon: <IndianRupee className="w-5 h-5 text-emerald-600" />,
      tag: 'Financial Audit'
    },
    {
      title: 'Defaulters & Outstanding Dues Summary',
      description: 'Filtered list of all residents with overdue invoices past deadline, including guardian emergency phone numbers and room references for follow-up.',
      endpoint: '/api/v1/reports/defaulters/csv',
      filename: 'hostel_defaulters_ledger.csv',
      icon: <Users className="w-5 h-5 text-rose-600" />,
      tag: 'Collection Notice'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileBarChart2 className="w-5 h-5 text-brand-700" />
          Reports, Exports & Operational Audit Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Export institutional records in standards-compliant CSV formats for finance, warden auditing, and executive reviews
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportsList.map((rep) => (
          <Card key={rep.title} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
            <CardHeader className="bg-slate-50/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-md border border-slate-200 shadow-2xs">
                  {rep.icon}
                </div>
                <div>
                  <CardTitle className="text-sm">{rep.title}</CardTitle>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rep.tag}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-600 leading-relaxed mb-6">{rep.description}</p>
              <a
                href={rep.endpoint}
                download={rep.filename}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Dataset
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance / Institutional Info Banner */}
      <Card>
        <CardContent className="p-5 text-xs text-slate-600 flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Regulatory Data Protection & Audit Trail</h4>
            <p className="text-slate-500">
              In compliance with Institutional Accommodation Standards and SRS Section 5.2 (Safety & Privacy Requirements), financial ledgers and resident movement timestamps are immutable. Exported datasets contain timestamped operational verification records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
