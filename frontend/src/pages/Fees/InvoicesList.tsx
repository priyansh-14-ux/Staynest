import React, { useEffect, useState } from 'react';
import { feesApi } from '../../lib/api';
import { FeeInvoice, FeeStructure, PaymentMethod, Receipt } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt as ReceiptIcon, Plus, Search, Filter,
  CreditCard, Printer, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';

export const InvoicesList: React.FC = () => {
  const { role, user } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<FeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [txnRef, setTxnRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Batch Invoices Modal State
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchTitle, setBatchTitle] = useState('Spring Semester 2027 Hostel & Mess Fee');
  const [batchPeriod, setBatchPeriod] = useState('Jan - May 2027');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [batchDueDate, setBatchDueDate] = useState('2027-01-31');

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const [invData, structData] = await Promise.all([
        feesApi.getInvoices({
          status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
          search
        }),
        feesApi.getFeeStructures()
      ]);
      setInvoices(invData);
      setFeeStructures(structData);
      if (structData.length > 0) {
        setSelectedStructureId(String(structData[0].id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openPaymentModal = (inv: FeeInvoice) => {
    setTargetInvoice(inv);
    setPaymentAmount(String(inv.remaining_due));
    setTxnRef(`UPI/${Date.now().toString().slice(-8)}/PAY`);
    setPaymentRemarks('Direct Fee Settlement');
    setPayError(null);
    setIsPaymentOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoice) return;
    setIsSubmitting(true);
    setPayError(null);
    try {
      const paymentRes = await feesApi.recordPayment({
        invoice_id: targetInvoice.id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        transaction_ref: txnRef,
        remarks: paymentRemarks
      });
      setIsPaymentOpen(false);
      // Fetch and show receipt
      const rec = await feesApi.getReceipt(paymentRes.receipt_number);
      setReceiptData(rec);
      setIsReceiptOpen(true);
      await fetchInvoices();
    } catch (err: any) {
      setPayError(err.response?.data?.detail || 'Payment transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feesApi.generateBatchInvoices({
        title: batchTitle,
        billing_period: batchPeriod,
        fee_structure_id: Number(selectedStructureId),
        due_date: batchDueDate
      });
      setIsBatchOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate batch invoices');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = invoices.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.resident_name.toLowerCase().includes(search.toLowerCase()) ||
    i.registration_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-brand-700" />
            Hostel Fee Invoices & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Billing cycles, installment collections, outstanding dues, and verifiable payment receipts
          </p>
        </div>

        {['SUPER_ADMIN', 'WARDEN', 'ACCOUNTANT'].includes(role || '') && (
          <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsBatchOpen(true)}>
            Generate Batch Invoices
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-72">
              <Input
                placeholder="Search invoice #, student name..."
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
              <option value="ALL">All Invoices</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid in Full</option>
              <option value="OVERDUE">Overdue Defaulters</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} of {invoices.length} Invoices
          </span>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Resident Student</th>
                <th className="py-3 px-4">Fee Period</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Remaining Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">Loading invoices ledger...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">No invoices match selected criteria</td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.resident_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inv.registration_number} {inv.room_number ? `• Rm ${inv.room_number}` : ''}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{inv.title}</div>
                      <div className="text-[10px] text-slate-400">{inv.billing_period}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(inv.paid_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(inv.remaining_due)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.due_date)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="auto" statusText={inv.status}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.remaining_due > 0 && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 px-2 text-[11px]"
                            icon={<CreditCard className="w-3 h-3" />}
                            onClick={() => openPaymentModal(inv)}
                          >
                            Pay
                          </Button>
                        )}
                        {inv.payments.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px]"
                            icon={<Printer className="w-3 h-3" />}
                            onClick={async () => {
                              const rec = await feesApi.getReceipt(inv.payments[inv.payments.length - 1].receipt_number);
                              setReceiptData(rec);
                              setIsReceiptOpen(true);
                            }}
                          >
                            Receipt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Fee Payment"
        description={`Posting payment for ${targetInvoice?.resident_name} (${targetInvoice?.invoice_number})`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {payError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs">
              {payError}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between">
            <div>
              <div className="text-slate-500">Remaining Due:</div>
              <div className="text-base font-bold text-rose-600">{formatCurrency(targetInvoice?.remaining_due || 0)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Total Invoiced:</div>
              <div className="text-sm font-semibold text-slate-800">{formatCurrency(targetInvoice?.total_amount || 0)}</div>
            </div>
          </div>

          <Input
            label="Payment Amount (₹)"
            type="number"
            step="1"
            max={targetInvoice?.remaining_due}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
            helperText="Supports full or partial installment payment"
          />

          <Select
            label="Payment Mode"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="NET_BANKING">Net Banking (NEFT / RTGS / IMPS)</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="CASH">Cash (Accountant Counter)</option>
            <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
          </Select>

          <Input
            label="Transaction Reference / Cheque No."
            value={txnRef}
            onChange={(e) => setTxnRef(e.target.value)}
            required
          />

          <Input
            label="Remarks / Note"
            value={paymentRemarks}
            onChange={(e) => setPaymentRemarks(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Process Payment & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Batch Invoice Generation Modal */}
      <Modal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        title="Batch Invoice Generator"
        description="Generate periodic semester or monthly billing for active hostel residents"
      >
        <form onSubmit={handleBatchGenerate} className="space-y-4">
          <Input
            label="Invoice Title"
            value={batchTitle}
            onChange={(e) => setBatchTitle(e.target.value)}
            required
          />

          <Input
            label="Billing Period"
            value={batchPeriod}
            onChange={(e) => setBatchPeriod(e.target.value)}
            required
          />

          <Select
            label="Fee Head Template"
            value={selectedStructureId}
            onChange={(e) => setSelectedStructureId(e.target.value)}
            required
          >
            {feeStructures.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatCurrency(s.total_amount)} ({s.frequency})
              </option>
            ))}
          </Select>

          <Input
            label="Payment Due Date"
            type="date"
            value={batchDueDate}
            onChange={(e) => setBatchDueDate(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsBatchOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Generate Invoices
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Official Payment Receipt"
        maxWidth="lg"
      >
        {receiptData && (
          <div className="space-y-6 text-xs text-slate-800 p-2" id="printable-receipt">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">HOSTEL RESIDENTIAL SERVICES</h2>
              <p className="text-[11px] text-slate-500">University Enclave Accommodation Board</p>
              <div className="mt-2 inline-block px-3 py-1 bg-teal-50 border border-teal-200 rounded text-brand-800 font-mono font-bold text-xs">
                RECEIPT NO: {receiptData.receipt_number}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400">Student Name:</span>
                <div className="font-bold text-slate-900 text-sm">{receiptData.student_name}</div>
                <div className="text-slate-500 font-mono">Reg: {receiptData.registration_number}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Payment Date:</span>
                <div className="font-semibold text-slate-900">{formatDateTime(receiptData.payment_date)}</div>
                <div className="text-slate-500">{receiptData.hostel_block} • Room {receiptData.room_number}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Fee Particulars</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-medium">{receiptData.invoice_title}</td>
                    <td className="p-3 font-mono text-slate-500">{receiptData.invoice_number}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 text-sm">
                      {formatCurrency(receiptData.amount_paid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <div>Mode: <strong className="uppercase">{receiptData.payment_method}</strong></div>
                <div className="text-slate-500 font-mono text-[10px]">Txn: {receiptData.transaction_ref}</div>
                <div className="text-slate-400 text-[10px] mt-1">Recorded by: {receiptData.recorded_by}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Remaining Invoice Balance:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {formatCurrency(receiptData.remaining_invoice_due)}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Receipt
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsReceiptOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
