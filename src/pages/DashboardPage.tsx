import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/ui/StatCard';
import { ExcusesModal } from '../components/excuses/ExcusesModal';
import { StudentModal } from '../components/students/StudentModal';
import { CreateDispatchModal } from '../components/dispatches/CreateDispatchModal';
import { formatCurrency } from '../lib/calculations';
import {
  Users,
  Send,
  DollarSign,
  UserCheck,
  CreditCard,
  Calendar,
  TrendingUp,
  PlusCircle,
  Activity,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardPageProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const {
    metrics,
    auditLogs,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    settlements
  } = useApp();

  const [excusesModalOpen, setExcusesModalOpen] = useState<boolean>(false);
  const [studentModalOpen, setStudentModalOpen] = useState<boolean>(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);

  // Chart data: Collections by Batch
  const batchData = React.useMemo(() => {
    const map = new Map<string, number>();
    settlements.forEach((s: any) => {
      const b = s.student.batch || 'Other';
      map.set(b, (map.get(b) || 0) + s.net_collection);
    });
    return Array.from(map.entries()).map(([batch, amount]) => ({
      batch,
      amount,
    }));
  }, [settlements]);

  // Payment Breakdown for Pie Chart
  const paymentBreakdown = React.useMemo(() => {
    const totalCash = settlements.reduce((sum: number, s: any) => sum + s.cash_amount, 0);
    const totalGpay = settlements.reduce((sum: number, s: any) => sum + s.gpay_amount, 0);
    return [
      { name: 'Cash Collections', value: totalCash, color: '#0f172a' },
      { name: 'GPay / UPI Collections', value: totalGpay, color: '#0284c7' },
    ];
  }, [settlements]);

  return (
    <div className="space-y-6">
      {/* Date Filter & Control Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Operations Overview</h2>
          <p className="text-xs text-slate-500">Live analytics derived directly from registered database records</p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <span className="px-2 py-1 text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Range:</span>
            </span>
            {(['today', 'week', 'month', 'custom', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  dateFilter === f
                    ? 'bg-white text-navy-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'All Time' : f}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 PRIMARY SPEC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dispatched Students */}
        <StatCard
          label="Dispatched Students"
          value={metrics?.dispatchedStudentsCount || 0}
          subValue="students"
          subtext="Unique students currently assigned to active unsettled field dispatches"
          icon={Send}
          variant="amber"
          tooltip="Unique students active in the field right now"
        />

        {/* Card 2: Total Amount Collected */}
        <StatCard
          label="Total Amount Collected"
          value={formatCurrency(metrics?.totalAmountCollected || 0)}
          subtext={`Settled collections (Target expected: ${formatCurrency(metrics?.pendingAmountTarget || 0)})`}
          icon={DollarSign}
          variant="emerald"
          tooltip="Gross money confirmed through completed settlements"
        />

        {/* Card 3: Excused Students */}
        <div onClick={() => setExcusesModalOpen(true)} className="cursor-pointer">
          <StatCard
            label="Excused Students"
            value={metrics?.excusedStudentsCount || 0}
            subValue="students"
            subtext="Exempted from field duty for selected period (Click to view)"
            icon={UserCheck}
            variant="rose"
            tooltip="Students with verified medical/exam leave"
          />
        </div>

        {/* Card 4: Total Students */}
        <div onClick={() => onNavigateTab('students')} className="cursor-pointer">
          <StatCard
            label="Total Registered Students"
            value={metrics?.totalActiveStudents || 0}
            subValue="active"
            subtext="Total active students registered in database"
            icon={Users}
            variant="navy"
            tooltip="All active students available for field duty"
          />
        </div>
      </div>

      {/* SECONDARY OPERATIONAL & FINANCIAL METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Dispatches
          </span>
          <span className="text-lg font-extrabold text-slate-800">
            {metrics?.totalActiveDispatches || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Destinations ongoing</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Settlements
          </span>
          <span className="text-lg font-extrabold text-emerald-700">
            {metrics?.completedSettlementsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Finalized returns</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Pending Settlements
          </span>
          <span className="text-lg font-extrabold text-amber-600">
            {metrics?.pendingSettlementsCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting deposit</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Calendars Issued
          </span>
          <span className="text-lg font-extrabold text-slate-800">
            {metrics?.calendarsIssued || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Physical copies</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Calendars Returned
          </span>
          <span className="text-lg font-extrabold text-emerald-600">
            {metrics?.calendarsReturned || 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Back in inventory</span>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            Outstanding Calendars
          </span>
          <span className="text-lg font-extrabold text-amber-900">
            {metrics?.calendarsOutstanding || 0}
          </span>
          <span className="text-[10px] text-amber-700 block mt-0.5">Unreturned / in field</span>
        </div>
      </div>

      {/* FINANCIAL HIGHLIGHT BANNER: GROSS - EXPENSES = NET COLLECTION */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-skyblue-400">
            Campus Treasury Reconciled Net Collection
          </p>
          <div className="flex items-baseline justify-center md:justify-start gap-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatCurrency(metrics?.netCollection || 0)}
            </span>
            <span className="text-xs text-slate-400">
              (Gross {formatCurrency(metrics?.totalAmountCollected || 0)} − Expenses {formatCurrency(metrics?.totalExpenses || 0)})
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setStudentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-skyblue-400" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setDispatchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-skyblue-600 hover:bg-skyblue-700 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Create Dispatch</span>
          </button>

          <button
            onClick={() => onNavigateTab('settle')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>View Settlements</span>
          </button>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Collections by Batch Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Net Collections by Academic Batch</h3>
              <p className="text-xs text-slate-500">Contribution per cohort across completed settlements</p>
            </div>
            <TrendingUp className="w-4 h-4 text-skyblue-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="batch" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Net Collection']} />
                <Bar dataKey="amount" fill="#0284c7" radius={[6, 6, 0, 0]} name="Net Collection (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Breakdown</h3>
              <p className="text-xs text-slate-500">Cash vs digital UPI collections</p>
            </div>
            <PieIcon className="w-4 h-4 text-navy-800" />
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            {paymentBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY / AUDIT LOG SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-skyblue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Administrative Activity</h3>
          </div>
          <span className="text-xs text-slate-400">Audit trail log</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.slice(0, 6).map((log: any) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {log.action.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 truncate">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {log.details ? JSON.stringify(log.details).substring(0, 70) : log.entity_type}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Excuses Modal */}
      <ExcusesModal
        isOpen={excusesModalOpen}
        onClose={() => setExcusesModalOpen(false)}
      />

      {/* Student Modal */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      />

      {/* Dispatch Modal */}
      <CreateDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
      />
    </div>
  );
};
