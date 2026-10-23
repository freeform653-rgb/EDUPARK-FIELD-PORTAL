import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { exportToCsv, exportToExcel, exportToPdf, triggerPrint, ExportColumn } from '../lib/export-utils';
import {
  formatCurrency,
  formatDisplayDate,
  getLocalDateString,
  matchesDateFilter
} from '../lib/calculations';
import { STANDARD_BATCHES } from '../lib/storage';
import {
  DateFilterType,
  Student,
  PopulatedDispatch,
  PopulatedSettlement,
  PopulatedExcuse,
  PopulatedAssignment
} from '../types/database';
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  Users,
  Send,
  CreditCard,
  BookOpen,
  DollarSign,
  UserCheck
} from 'lucide-react';

type ReportType =
  | 'students'
  | 'dispatches'
  | 'student_history'
  | 'team_dispatches'
  | 'settlements'
  | 'cash_collection'
  | 'gpay_collection'
  | 'expenses'
  | 'net_collection'
  | 'excused'
  | 'calendar_inventory'
  | 'outstanding_settlement';

export const ExportsPage: React.FC = () => {
  const { students, dispatches, settlements, excuses, showToast } = useApp();

  const [selectedReport, setSelectedReport] = useState<ReportType>('settlements');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStart, setCustomStart] = useState<string>(getLocalDateString(new Date(Date.now() - 86400000 * 30)));
  const [customEnd, setCustomEnd] = useState<string>(getLocalDateString());
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [studentReportView, setStudentReportView] = useState<'daily' | 'summary'>('daily');

  // 12 Report Categories with descriptive meta
  const reportOptions: { id: ReportType; title: string; desc: string; icon: any }[] = [
    { id: 'students', title: '1. Student List', desc: 'Student directory with cohort & active status', icon: Users },
    { id: 'dispatches', title: '2. Dispatch Register', desc: 'Log of field dispatches, allowance, & calendars', icon: Send },
    { id: 'student_history', title: '3. Individual Student Report', desc: 'Gross total cash & GPay, settled total, and expenses by day, week, & all days', icon: Users },
    { id: 'team_dispatches', title: '4. Team Dispatch Report', desc: 'Team field coordination, member duty, & progress', icon: Send },
    { id: 'settlements', title: '5. Settlement Register', desc: 'Comprehensive financial settlement audit ledger', icon: CreditCard },
    { id: 'cash_collection', title: '6. Cash Collection Report', desc: 'Direct cash donations deposited from field visits', icon: DollarSign },
    { id: 'gpay_collection', title: '7. GPay / UPI Collection Report', desc: 'Digital QR and UPI transactions verified', icon: DollarSign },
    { id: 'expenses', title: '8. Expenses Report', desc: 'Transportation, meals, and authorized field costs', icon: DollarSign },
    { id: 'net_collection', title: '9. Net Collection Report', desc: 'Final net contributions deposited to campus treasury', icon: CreditCard },
    { id: 'excused', title: '10. Excused Students Report', desc: 'Exemptions recorded with dates, reasons, and approvals', icon: UserCheck },
    { id: 'calendar_inventory', title: '11. Calendar Inventory Report', desc: 'Physical calendars issued, returned, and outstanding', icon: BookOpen },
    { id: 'outstanding_settlement', title: '12. Outstanding Settlement Report', desc: 'Pending dispatches and unsettled field collections', icon: CreditCard },
  ];

  // Batches list featuring standard batches
  const batchesList = useMemo(() => {
    const set = new Set<string>(STANDARD_BATCHES);
    students.forEach((s: Student) => set.add(s.batch));
    return Array.from(set).sort();
  }, [students]);

  // Generate dataset and columns dynamically based on selected report
  const { data, columns, summaryRow, reportTitle } = useMemo(() => {
    let rawData: any[] = [];
    let cols: ExportColumn[] = [];
    let title = '';
    let summary: Record<string, string> | undefined = undefined;

    switch (selectedReport) {
      case 'students':
        title = 'Student Register Report';
        rawData = students.filter((s: Student) => {
          if (batchFilter !== 'all' && s.batch !== batchFilter) return false;
          return true;
        });
        cols = [
          { header: 'Student Name', key: 'full_name' },
          { header: 'Batch', key: 'batch' },
          { header: 'Phone Number', key: 'phone_number', format: (v: any) => v || 'N/A' },
          { header: 'Current Status', key: 'current_status', format: (v: any) => v || 'Available' },
          { header: 'Is Active', key: 'is_active', format: (v: any) => (v ? 'Active' : 'Archived') },
          { header: 'Registered On', key: 'created_at', format: (v: any) => formatDisplayDate(v?.substring(0, 10)) },
        ];
        break;

      case 'dispatches':
        title = 'Field Dispatch Register';
        rawData = dispatches.filter((d: PopulatedDispatch) => {
          if (!matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)) return false;
          if (destinationFilter && !d.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return false;
          return true;
        });
        cols = [
          { header: 'Dispatch ID', key: 'id' },
          { header: 'Destination', key: 'destination' },
          { header: 'Date', key: 'dispatch_date', format: (v: any) => formatDisplayDate(v) },
          { header: 'Type', key: 'dispatch_type' },
          { header: 'Students', key: 'total_students' },
          { header: 'Allowance (₹)', key: 'target_amount', format: (v: any) => formatCurrency(v) },
          { header: 'Calendars Issued', key: 'total_calendars_issued' },
          { header: 'Calendars Returned', key: 'total_calendars_returned' },
          { header: 'Total Collected', key: 'total_collected', format: (v: any) => formatCurrency(v) },
          { header: 'Status', key: 'status' },
        ];
        break;

      case 'student_history':
        title = studentReportView === 'summary'
          ? 'Individual Student Summary Report'
          : 'Individual Student Daily Financial & Settlement Report';

        if (studentReportView === 'summary') {
          // Consolidated Student Summary: Each row is an individual student with their gross cash, gpay, settled total, and expenses across the selected period
          const studentMap = new Map<string, {
            student: Student;
            dispatchesCount: number;
            cash: number;
            gpay: number;
            settled_total: number;
            expenses: number;
            net: number;
            allowance: number;
            calendars_issued: number;
            calendars_returned: number;
          }>();

          students.forEach((s: Student) => {
            if (studentFilter !== 'all' && s.id !== studentFilter) return;
            if (batchFilter !== 'all' && s.batch !== batchFilter) return;
            studentMap.set(s.id, {
              student: s,
              dispatchesCount: 0,
              cash: 0,
              gpay: 0,
              settled_total: 0,
              expenses: 0,
              net: 0,
              allowance: 0,
              calendars_issued: 0,
              calendars_returned: 0,
            });
          });

          dispatches.forEach((d: PopulatedDispatch) => {
            if (!matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)) return;
            if (destinationFilter && !d.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return;

            d.assignments.forEach((a: PopulatedAssignment) => {
              const entry = studentMap.get(a.student_id);
              if (entry) {
                entry.dispatchesCount += 1;
                entry.calendars_issued += a.calendars_issued || 0;
                entry.allowance += d.target_amount || 0;
                if (a.settlement) {
                  entry.cash += a.settlement.cash_amount || 0;
                  entry.gpay += a.settlement.gpay_amount || 0;
                  entry.settled_total += a.settlement.total_collected || 0;
                  entry.expenses += a.settlement.expenses || 0;
                  entry.net += a.settlement.net_collection || 0;
                  entry.calendars_returned += a.settlement.calendars_returned || 0;
                }
              }
            });
          });

          const summaryList = Array.from(studentMap.values())
            .filter(item => item.dispatchesCount > 0 || studentFilter === item.student.id)
            .map(item => ({
              student_name: item.student.full_name,
              batch: item.student.batch,
              dispatches_count: item.dispatchesCount,
              cash: item.cash,
              gpay: item.gpay,
              settled_total: item.settled_total,
              expenses: item.expenses,
              net: item.net,
              allowance: item.allowance,
              calendars_issued: item.calendars_issued,
              calendars_returned: item.calendars_returned,
              outstanding: Math.max(0, item.calendars_issued - item.calendars_returned),
            }));

          rawData = summaryList;
          cols = [
            { header: 'Student Name', key: 'student_name' },
            { header: 'Batch', key: 'batch' },
            { header: 'Dispatches', key: 'dispatches_count' },
            { header: 'Gross Cash (₹)', key: 'cash', format: (v: any) => formatCurrency(v) },
            { header: 'Gross GPay/UPI (₹)', key: 'gpay', format: (v: any) => formatCurrency(v) },
            { header: 'Settled Total (₹)', key: 'settled_total', format: (v: any) => formatCurrency(v) },
            { header: 'Expenses (₹)', key: 'expenses', format: (v: any) => formatCurrency(v) },
            { header: 'Net Deposited (₹)', key: 'net', format: (v: any) => formatCurrency(v) },
            { header: 'Allowance (₹)', key: 'allowance', format: (v: any) => formatCurrency(v) },
            { header: 'Calendars Issued', key: 'calendars_issued' },
            { header: 'Calendars Returned', key: 'calendars_returned' },
            { header: 'Outstanding', key: 'outstanding' },
          ];

          summary = {
            student_name: `Total: ${summaryList.length} Students`,
            batch: '',
            dispatches_count: String(summaryList.reduce((sum, r) => sum + r.dispatches_count, 0)),
            cash: formatCurrency(summaryList.reduce((sum, r) => sum + r.cash, 0)),
            gpay: formatCurrency(summaryList.reduce((sum, r) => sum + r.gpay, 0)),
            settled_total: formatCurrency(summaryList.reduce((sum, r) => sum + r.settled_total, 0)),
            expenses: formatCurrency(summaryList.reduce((sum, r) => sum + r.expenses, 0)),
            net: formatCurrency(summaryList.reduce((sum, r) => sum + r.net, 0)),
            allowance: formatCurrency(summaryList.reduce((sum, r) => sum + r.allowance, 0)),
            calendars_issued: String(summaryList.reduce((sum, r) => sum + r.calendars_issued, 0)),
            calendars_returned: String(summaryList.reduce((sum, r) => sum + r.calendars_returned, 0)),
            outstanding: String(summaryList.reduce((sum, r) => sum + r.outstanding, 0)),
          };
        } else {
          // Daily Breakdown: Every row is an individual student field visit on each day
          const rows: any[] = [];
          dispatches.forEach((d: PopulatedDispatch) => {
            if (!matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)) return;
            if (destinationFilter && !d.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return;

            d.assignments.forEach((a: PopulatedAssignment) => {
              if (studentFilter !== 'all' && a.student_id !== studentFilter) return;
              if (batchFilter !== 'all' && a.student.batch !== batchFilter) return;

              const cash = a.settlement?.cash_amount || 0;
              const gpay = a.settlement?.gpay_amount || 0;
              const settledTotal = a.settlement?.total_collected || 0;
              const expenses = a.settlement?.expenses || 0;
              const net = a.settlement?.net_collection || 0;

              rows.push({
                dispatch_date: d.dispatch_date,
                student_name: a.student.full_name,
                batch: a.student.batch,
                destination: d.destination,
                type: d.dispatch_type,
                cash: cash,
                gpay: gpay,
                settled_total: settledTotal,
                expenses: expenses,
                net: net,
                allowance: d.target_amount || 0,
                calendars: `${a.settlement?.calendars_returned || 0} / ${a.calendars_issued}`,
                status: a.assignment_status,
              });
            });
          });

          // Sort rows by dispatch date descending
          rows.sort((a, b) => b.dispatch_date.localeCompare(a.dispatch_date));

          rawData = rows;
          cols = [
            { header: 'Date', key: 'dispatch_date', format: (v: any) => formatDisplayDate(v) },
            { header: 'Student Name', key: 'student_name' },
            { header: 'Batch', key: 'batch' },
            { header: 'Destination', key: 'destination' },
            { header: 'Gross Cash (₹)', key: 'cash', format: (v: any) => formatCurrency(v) },
            { header: 'Gross GPay/UPI (₹)', key: 'gpay', format: (v: any) => formatCurrency(v) },
            { header: 'Settled Total (₹)', key: 'settled_total', format: (v: any) => formatCurrency(v) },
            { header: 'Expenses (₹)', key: 'expenses', format: (v: any) => formatCurrency(v) },
            { header: 'Net Deposited (₹)', key: 'net', format: (v: any) => formatCurrency(v) },
            { header: 'Allowance (₹)', key: 'allowance', format: (v: any) => formatCurrency(v) },
            { header: 'Calendars', key: 'calendars' },
            { header: 'Status', key: 'status' },
          ];

          summary = {
            dispatch_date: '',
            student_name: `Total: ${rows.length} Records`,
            batch: '',
            destination: '',
            cash: formatCurrency(rows.reduce((sum, r) => sum + r.cash, 0)),
            gpay: formatCurrency(rows.reduce((sum, r) => sum + r.gpay, 0)),
            settled_total: formatCurrency(rows.reduce((sum, r) => sum + r.settled_total, 0)),
            expenses: formatCurrency(rows.reduce((sum, r) => sum + r.expenses, 0)),
            net: formatCurrency(rows.reduce((sum, r) => sum + r.net, 0)),
            allowance: formatCurrency(rows.reduce((sum, r) => sum + r.allowance, 0)),
            calendars: '',
            status: '',
          };
        }
        break;

      case 'team_dispatches':
        title = 'Team Dispatch Report';
        rawData = dispatches.filter((d: PopulatedDispatch) => {
          if (d.dispatch_type !== 'Team') return false;
          if (!matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)) return false;
          if (destinationFilter && !d.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return false;
          return true;
        });
        cols = [
          { header: 'Dispatch ID', key: 'id' },
          { header: 'Destination', key: 'destination' },
          { header: 'Date', key: 'dispatch_date', format: (v: any) => formatDisplayDate(v) },
          {
            header: 'Team Members',
            key: 'assignments',
            format: (a: any[]) => Array.isArray(a) ? a.map(asgn => asgn?.student?.full_name || 'Member').join(', ') : 'N/A'
          },
          { header: 'Allowance (₹)', key: 'target_amount', format: (v: any) => formatCurrency(v) },
          { header: 'Settled Progress', key: 'settled_students', format: (v: any, r: any) => `${v || 0} of ${r?.total_students || 0} Settled` },
          { header: 'Calendars Issued', key: 'total_calendars_issued' },
          { header: 'Total Collected', key: 'total_collected', format: (v: any) => formatCurrency(v) },
          { header: 'Status', key: 'status' },
        ];
        break;

      case 'settlements':
      case 'cash_collection':
      case 'gpay_collection':
      case 'expenses':
      case 'net_collection':
        if (selectedReport === 'cash_collection') title = 'Cash Collection Report';
        else if (selectedReport === 'gpay_collection') title = 'GPay / UPI Collection Report';
        else if (selectedReport === 'expenses') title = 'Travel & Food Expenses Report';
        else if (selectedReport === 'net_collection') title = 'Net Campus Collection Report';
        else title = 'Comprehensive Settlement Register';

        rawData = settlements.filter((s: PopulatedSettlement) => {
          if (!matchesDateFilter(s.settlement_date, dateFilter, customStart, customEnd)) return false;
          if (batchFilter !== 'all' && s.student.batch !== batchFilter) return false;
          if (destinationFilter && !s.dispatch.destination.toLowerCase().includes(destinationFilter.toLowerCase())) return false;
          if (selectedReport === 'cash_collection' && s.cash_amount <= 0) return false;
          if (selectedReport === 'gpay_collection' && s.gpay_amount <= 0) return false;
          if (selectedReport === 'expenses' && s.expenses <= 0) return false;
          return true;
        });

        cols = [
          { header: 'Receipt ID', key: 'id' },
          { header: 'Student Name', key: 'student', format: (s: any) => s?.full_name || 'N/A' },
          { header: 'Batch', key: 'student', format: (s: any) => s?.batch || 'N/A' },
          { header: 'Destination', key: 'dispatch', format: (d: any) => d?.destination || 'N/A' },
          { header: 'Settlement Date', key: 'settlement_date', format: (v: any) => formatDisplayDate(v) },
          { header: 'Cash (₹)', key: 'cash_amount', format: (v: any) => formatCurrency(v) },
          { header: 'GPay/UPI (₹)', key: 'gpay_amount', format: (v: any) => formatCurrency(v) },
          { header: 'Total (₹)', key: 'total_collected', format: (v: any) => formatCurrency(v) },
          { header: 'Expenses (₹)', key: 'expenses', format: (v: any) => formatCurrency(v) },
          { header: 'Net Deposited (₹)', key: 'net_collection', format: (v: any) => formatCurrency(v) },
          { header: 'Returned Calendars', key: 'calendars_returned' },
        ];

        // Compute Financial Summary Row as string-safe values
        const totCash = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + s.cash_amount, 0);
        const totGpay = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + s.gpay_amount, 0);
        const totGross = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + s.total_collected, 0);
        const totExp = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + s.expenses, 0);
        const totNet = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + s.net_collection, 0);
        const totRet = rawData.reduce((sum: number, s: PopulatedSettlement) => sum + (s.calendars_returned || 0), 0);

        summary = {
          id: 'TOTALS',
          student: `${rawData.length} Settlements`,
          dispatch: '',
          settlement_date: '',
          cash_amount: formatCurrency(totCash),
          gpay_amount: formatCurrency(totGpay),
          total_collected: formatCurrency(totGross),
          expenses: formatCurrency(totExp),
          net_collection: formatCurrency(totNet),
          calendars_returned: String(totRet),
        };
        break;

      case 'excused':
        title = 'Excused Students Report';
        rawData = excuses.filter((e: PopulatedExcuse) => {
          if (!matchesDateFilter(e.excuse_date, dateFilter, customStart, customEnd)) return false;
          if (batchFilter !== 'all' && e.student.batch !== batchFilter) return false;
          return true;
        });
        cols = [
          { header: 'Student Name', key: 'student', format: (s: any) => s?.full_name || 'N/A' },
          { header: 'Batch', key: 'student', format: (s: any) => s?.batch || 'N/A' },
          { header: 'Date', key: 'excuse_date', format: (v: any) => formatDisplayDate(v) },
          { header: 'Reason', key: 'reason' },
          { header: 'Notes', key: 'notes', format: (v: any) => v || 'N/A' },
          { header: 'Recorded By', key: 'created_by' },
        ];
        break;

      case 'calendar_inventory':
        title = 'Physical Calendar Inventory Report';
        const invRows: any[] = [];
        dispatches.forEach((d: PopulatedDispatch) => {
          d.assignments.forEach((a: PopulatedAssignment) => {
            if (!matchesDateFilter(d.dispatch_date, dateFilter, customStart, customEnd)) return;
            const ret = a.settlement?.calendars_returned || 0;
            const out = Math.max(0, a.calendars_issued - ret);
            invRows.push({
              destination: d.destination,
              student_name: a.student.full_name,
              batch: a.student.batch,
              dispatch_date: d.dispatch_date,
              issued: a.calendars_issued,
              returned: ret,
              outstanding: out,
              status: a.assignment_status,
            });
          });
        });
        rawData = invRows;
        cols = [
          { header: 'Destination', key: 'destination' },
          { header: 'Student Name', key: 'student_name' },
          { header: 'Batch', key: 'batch' },
          { header: 'Date', key: 'dispatch_date', format: (v: any) => formatDisplayDate(v) },
          { header: 'Issued', key: 'issued' },
          { header: 'Returned', key: 'returned' },
          { header: 'Outstanding', key: 'outstanding' },
          { header: 'Status', key: 'status' },
        ];
        break;

      case 'outstanding_settlement':
        title = 'Outstanding Field Duty & Pending Settlement Report';
        const pendingRows: any[] = [];
        dispatches.forEach((d: PopulatedDispatch) => {
          if (d.status !== 'Cancelled') {
            d.assignments.forEach((a: PopulatedAssignment) => {
              if (a.assignment_status === 'Dispatched') {
                pendingRows.push({
                  student_name: a.student.full_name,
                  batch: a.student.batch,
                  destination: d.destination,
                  dispatch_date: d.dispatch_date,
                  type: d.dispatch_type,
                  calendars_issued: a.calendars_issued,
                  travel_advance: d.target_amount,
                });
              }
            });
          }
        });
        rawData = pendingRows;
        cols = [
          { header: 'Student Name', key: 'student_name' },
          { header: 'Batch', key: 'batch' },
          { header: 'Destination', key: 'destination' },
          { header: 'Dispatch Date', key: 'dispatch_date', format: (v: any) => formatDisplayDate(v) },
          { header: 'Type', key: 'type' },
          { header: 'Calendars Issued', key: 'calendars_issued' },
          { header: 'Allowance Given (₹)', key: 'travel_advance', format: (v: any) => formatCurrency(v) },
        ];
        break;
    }

    return { data: rawData, columns: cols, summaryRow: summary, reportTitle: title };
  }, [
    selectedReport,
    students,
    dispatches,
    settlements,
    excuses,
    dateFilter,
    customStart,
    customEnd,
    batchFilter,
    studentFilter,
    destinationFilter,
    studentReportView
  ]);

  const handleExportCsv = () => {
    exportToCsv(reportTitle, columns, data, summaryRow ? [summaryRow] : undefined);
    showToast(`Exported ${reportTitle} to CSV.`, 'success');
  };

  const handleExportExcel = () => {
    exportToExcel(reportTitle, columns, data, summaryRow ? [summaryRow] : undefined);
    showToast(`Exported ${reportTitle} to Excel.`, 'success');
  };

  const handleExportPdf = () => {
    exportToPdf(reportTitle, columns, data, `Filter: ${dateFilter} | Total Records: ${data.length}`);
    showToast(`Generated ${reportTitle} PDF.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Report Selection Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Select Report Template</h3>
        <p className="text-xs text-slate-500 mb-4">Choose from 12 official administrative registers and financial reports</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {reportOptions.map(rep => {
            const Icon = rep.icon;
            const isSelected = selectedReport === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-navy-950 text-white border-navy-950 shadow-md ring-2 ring-skyblue-500/20'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-skyblue-500/20 text-skyblue-400' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{rep.title}</p>
                  <p className={`text-[10px] mt-0.5 line-clamp-2 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {rep.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Export Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-skyblue-600 block">
              Active Report
            </span>
            <h2 className="text-lg font-bold text-slate-900">{reportTitle}</h2>
            <p className="text-xs text-slate-500">
              Showing {data.length} records matching current filter criteria
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-900 hover:bg-black text-white shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Days (All Time)</option>
            <option value="today">Today (Each Day)</option>
            <option value="week">This Week (Weekly)</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
          )}

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Batches</option>
            {batchesList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Student Filter Selector */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.batch})</option>
            ))}
          </select>

          <input
            type="text"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            placeholder="Filter destination..."
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-44"
          />

          {/* View Mode Toggle for Individual Student Report */}
          {selectedReport === 'student_history' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto">
              <button
                type="button"
                onClick={() => setStudentReportView('daily')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  studentReportView === 'daily'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Ledger (Each Day)
              </button>
              <button
                type="button"
                onClick={() => setStudentReportView('summary')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  studentReportView === 'summary'
                    ? 'bg-white text-navy-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Summary (Totals)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generated Report Data Table (Optimized for Print & Screen) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-container">
        {/* Printable Header - Only visible on Print */}
        <div className="hidden print:block p-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Edupark Field Portal</h2>
              <h3 className="text-base font-semibold text-slate-700">{reportTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Date Range: {dateFilter} | Generation: {formatDisplayDate(getLocalDateString())}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              Total Records: {data.length}
            </div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No records found for this report</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no matching entries under current filters. Add new records or adjust filters above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 w-12">#</th>
                  {columns.map(c => (
                    <th key={c.header} className="py-3 px-3.5 whitespace-nowrap">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                    {columns.map(c => {
                      const val = row[c.key];
                      let display = c.format ? c.format(val, row) : (val ?? '—');
                      if (typeof display === 'object' && display !== null) {
                        display = display.full_name || display.destination || '—';
                      }
                      return (
                        <td key={c.header} className="py-3 px-3.5 whitespace-nowrap">
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Financial Totals Row for financial reports */}
              {summaryRow && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td className="py-3 px-3.5 font-bold">TOTAL</td>
                    {columns.map(c => {
                      const cellVal = summaryRow[c.key] ?? '';
                      return (
                        <td key={c.header} className="py-3 px-3.5 whitespace-nowrap font-bold">
                          {String(cellVal)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
