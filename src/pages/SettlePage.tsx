import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SettleModal } from '../components/settlement/SettleModal';
import { SettlementReceiptModal } from '../components/settlement/SettlementReceiptModal';
import { PopulatedSettlement, PopulatedAssignment, PopulatedDispatch, DateFilterType } from '../types/database';
import { formatCurrency, formatDisplayDate, matchesDateFilter } from '../lib/calculations';
import { exportToCsv, exportToExcel, exportToPdf, triggerPrint } from '../lib/export-utils';
import {
  CreditCard,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  FileText,
  MapPin,
  Receipt,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const SettlePage: React.FC = () => {
  const { settlements, dispatches, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [destinationFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'gpay' | 'both'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Individual' | 'Team'>('all');

  // Modal states
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PopulatedSettlement | null>(null);

  const [settleModalOpen, setSettleModalOpen] = useState<boolean>(false);
  const [selectedAssignmentToSettle, setSelectedAssignmentToSettle] = useState<PopulatedAssignment | null>(null);
  const [parentDispatchForSettle, setParentDispatchForSettle] = useState<PopulatedDispatch | null>(null);

  // Batches list
  const batchesList = useMemo(() => {
    const list = new Set<string>();
    settlements.forEach((s: PopulatedSettlement) => list.add(s.student.batch));
    return Array.from(list).sort();
  }, [settlements]);

  // Filtered Completed Settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s: PopulatedSettlement) => {
      const matchesSearch =
        s.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dispatch.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBatch = batchFilter === 'all' || s.student.batch === batchFilter;
      const matchesDest = !destinationFilter || s.dispatch.destination.toLowerCase().includes(destinationFilter.toLowerCase());
      const matchesDate = matchesDateFilter(s.settlement_date, dateFilter);
      const matchesType = typeFilter === 'all' || s.dispatch.dispatch_type === typeFilter;

      let matchesPayment = true;
      if (paymentFilter === 'cash') matchesPayment = s.cash_amount > 0 && s.gpay_amount === 0;
      if (paymentFilter === 'gpay') matchesPayment = s.gpay_amount > 0 && s.cash_amount === 0;
      if (paymentFilter === 'both') matchesPayment = s.cash_amount > 0 && s.gpay_amount > 0;

      return matchesSearch && matchesBatch && matchesDest && matchesDate && matchesType && matchesPayment;
    });
  }, [settlements, searchTerm, batchFilter, destinationFilter, dateFilter, typeFilter, paymentFilter]);

  // Summary Metrics for filtered completed settlements
  const summary = useMemo(() => {
    const totalCash = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + s.cash_amount, 0);
    const totalGPay = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + s.gpay_amount, 0);
    const totalCollected = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + s.total_collected, 0);
    const totalExpenses = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + s.expenses, 0);
    const netCollection = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + s.net_collection, 0);

    const calendarsIssued = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + (s.assignment.calendars_issued || 0), 0);
    const calendarsReturned = filteredSettlements.reduce((sum: number, s: PopulatedSettlement) => sum + (s.calendars_returned || 0), 0);
    const outstandingCalendars = Math.max(0, calendarsIssued - calendarsReturned);

    return {
      totalCash,
      totalGPay,
      totalCollected,
      totalExpenses,
      netCollection,
      calendarsIssued,
      calendarsReturned,
      outstandingCalendars,
    };
  }, [filteredSettlements]);

  // Pending settlements awaiting return
  const pendingAssignments = useMemo(() => {
    const list: { assignment: PopulatedAssignment; dispatch: PopulatedDispatch }[] = [];
    dispatches.forEach((d: PopulatedDispatch) => {
      if (d.status !== 'Cancelled') {
        d.assignments.forEach((a: PopulatedAssignment) => {
          if (a.assignment_status === 'Dispatched') {
            list.push({ assignment: a, dispatch: d });
          }
        });
      }
    });
    return list;
  }, [dispatches]);

  // Export Completed Settlements
  const exportColumns = [
    { header: 'Settlement ID', key: 'id' },
    { header: 'Student Name', key: 'student', format: (s: any) => s.full_name },
    { header: 'Batch', key: 'student', format: (s: any) => s.batch },
    { header: 'Destination', key: 'dispatch', format: (d: any) => d.destination },
    { header: 'Dispatch Date', key: 'dispatch', format: (d: any) => formatDisplayDate(d.dispatch_date) },
    { header: 'Settlement Date', key: 'settlement_date', format: (v: string) => formatDisplayDate(v) },
    { header: 'Cash (₹)', key: 'cash_amount', format: (v: number) => formatCurrency(v) },
    { header: 'GPay/UPI (₹)', key: 'gpay_amount', format: (v: number) => formatCurrency(v) },
    { header: 'Total Collected (₹)', key: 'total_collected', format: (v: number) => formatCurrency(v) },
    { header: 'Expenses (₹)', key: 'expenses', format: (v: number) => formatCurrency(v) },
    { header: 'Net Collection (₹)', key: 'net_collection', format: (v: number) => formatCurrency(v) },
    { header: 'Calendars Issued', key: 'assignment', format: (a: any) => a.calendars_issued },
    { header: 'Calendars Returned', key: 'calendars_returned' },
    {
      header: 'Outstanding Calendars',
      key: 'outstanding',
      format: (_: any, row: PopulatedSettlement) =>
        String(Math.max(0, (row.assignment.calendars_issued || 0) - (row.calendars_returned || 0)))
    },
  ];

  const handleExportCsv = () => {
    exportToCsv('Settlement_Register', exportColumns, filteredSettlements);
    showToast('Exported settlements to CSV.', 'success');
  };

  const handleExportExcel = () => {
    exportToExcel('Settlement_Register', exportColumns, filteredSettlements);
    showToast('Exported settlements to Excel.', 'success');
  };

  const handleExportPdf = () => {
    exportToPdf('Donation Settlement Register', exportColumns, filteredSettlements);
    showToast('Generated Settlement Register PDF.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs: Completed Settlements vs Pending Field Duty */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Completed Settlements ({settlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Field Duty ({pendingAssignments.length})</span>
        </button>
      </div>

      {activeTab === 'completed' ? (
        <>
          {/* Summary Cards Grid (8 Cards as requested in Spec) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cash</span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">{formatCurrency(summary.totalCash)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Physical currency</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total GPay / UPI</span>
              <span className="text-lg sm:text-xl font-extrabold text-skyblue-700">{formatCurrency(summary.totalGPay)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Digital transfers</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gross Collected</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700">{formatCurrency(summary.totalCollected)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Cash + GPay</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Expenses Deducted</span>
              <span className="text-lg sm:text-xl font-extrabold text-rose-600">{formatCurrency(summary.totalExpenses)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Travel & food</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Net Collection</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-800">{formatCurrency(summary.netCollection)}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Net cash deposited</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Calendars Issued</span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-800">{summary.calendarsIssued}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Given to students</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Calendars Returned</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600">{summary.calendarsReturned}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Back in inventory</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Outstanding Calendars</span>
              <span className="text-xl sm:text-2xl font-black text-amber-900">{summary.outstandingCalendars}</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Unreturned / distributed</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search settlement by student name, destination, or receipt ID..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={triggerPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Batches</option>
                {batchesList.map((b: string) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e: any) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Dates</option>
                <option value="today">Settled Today</option>
                <option value="week">Settled This Week</option>
                <option value="month">Settled This Month</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e: any) => setPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash Only</option>
                <option value="gpay">GPay / UPI Only</option>
                <option value="both">Both Cash & UPI</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="all">All Dispatches</option>
                <option value="Individual">Individual Only</option>
                <option value="Team">Team Only</option>
              </select>
            </div>
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-container">
            {filteredSettlements.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">No settlements found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust active filters or switch to "Pending Field Duty" tab to settle active dispatches.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Student & Batch</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Settled Date</th>
                      <th className="py-3 px-4 text-right">Cash</th>
                      <th className="py-3 px-4 text-right">GPay/UPI</th>
                      <th className="py-3 px-4 text-right">Gross Total</th>
                      <th className="py-3 px-4 text-right">Expenses</th>
                      <th className="py-3 px-4 text-right font-black text-emerald-800">Net Deposited</th>
                      <th className="py-3 px-4 text-center">Calendars</th>
                      <th className="py-3 px-4 text-right no-print">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSettlements.map((item: PopulatedSettlement) => {
                      const outstanding = Math.max(
                        0,
                        (item.assignment.calendars_issued || 0) - (item.calendars_returned || 0)
                      );
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            #{item.id.substring(0, 10)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{item.student.full_name}</p>
                            <p className="text-[10px] text-slate-500">{item.student.batch}</p>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            <p className="truncate max-w-xs">{item.dispatch.destination}</p>
                            <span className="text-[10px] text-purple-600 font-semibold">
                              {item.dispatch.dispatch_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDisplayDate(item.settlement_date)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatCurrency(item.cash_amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-skyblue-700">
                            {formatCurrency(item.gpay_amount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.total_collected)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            {formatCurrency(item.expenses)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                            {formatCurrency(item.net_collection)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-slate-700">
                              {item.calendars_returned} / {item.assignment.calendars_issued}
                            </span>
                            {outstanding > 0 && (
                              <span className="block text-[10px] font-bold text-amber-600">
                                {outstanding} out
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right no-print">
                            <button
                              onClick={() => {
                                setSelectedReceipt(item);
                                setReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-navy-900"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Summary Footer Row */}
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={4} className="py-3 px-4 uppercase text-[11px] tracking-wider">
                        Total Filtered Settlements ({filteredSettlements.length})
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(summary.totalCash)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(summary.totalGPay)}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        {formatCurrency(summary.totalCollected)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700">
                        {formatCurrency(summary.totalExpenses)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm">
                        {formatCurrency(summary.netCollection)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {summary.calendarsReturned} / {summary.calendarsIssued}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Pending Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-900">Students Currently in Field (Awaiting Settlement)</h3>
              <p className="text-xs text-amber-700">Click "Settle Now" to process their return and collections.</p>
            </div>
            <span className="px-3 py-1 bg-amber-200/80 text-amber-900 text-xs font-bold rounded-full">
              {pendingAssignments.length} Pending Returns
            </span>
          </div>

          {pendingAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">All student field returns are settled!</h3>
              <p className="text-xs text-slate-500 mt-1">There are no pending dispatches awaiting settlement.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAssignments.map(({ assignment, dispatch }) => (
                <div
                  key={assignment.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{assignment.student.full_name}</span>
                      <span className="text-xs text-slate-500">({assignment.student.batch})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {dispatch.dispatch_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {dispatch.destination}
                      </span>
                      <span>•</span>
                      <span>Date: {formatDisplayDate(dispatch.dispatch_date)}</span>
                      <span>•</span>
                      <span className="font-semibold text-skyblue-700">
                        {assignment.calendars_issued} Calendars Issued
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAssignmentToSettle(assignment);
                      setParentDispatchForSettle(dispatch);
                      setSettleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Settle Now</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settle Modal */}
      <SettleModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        assignment={selectedAssignmentToSettle}
        parentDispatch={parentDispatchForSettle}
      />

      {/* Receipt Modal */}
      <SettlementReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        settlement={selectedReceipt}
      />
    </div>
  );
};
