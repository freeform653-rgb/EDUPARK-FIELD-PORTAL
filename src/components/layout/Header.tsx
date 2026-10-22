import React from 'react';
import { Menu, RefreshCw, PlusCircle, Send, CreditCard, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileDrawer: () => void;
  onOpenAddStudent: () => void;
  onOpenCreateDispatch: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileDrawer,
  onOpenAddStudent,
  onOpenCreateDispatch,
  onSelectTab,
}) => {
  const { isLoading, refreshData, dateFilter, setDateFilter } = useApp();

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Admin Dashboard',
      subtitle: 'Real-time overview of field dispatches, collections, and student duty'
    },
    students: {
      title: 'Student Directory',
      subtitle: 'Manage student records, batch assignments, and active field statuses'
    },
    dispatches: {
      title: 'Field Dispatches',
      subtitle: 'Coordinate individual and team field destinations, calendar issuance, and excuses'
    },
    settle: {
      title: 'Settlement Management',
      subtitle: 'Process student returns, record cash & UPI collections, and reconcile calendars'
    },
    exports: {
      title: 'Reports & Exports',
      subtitle: 'Generate audit-ready registers, financial summaries, and inventory reports'
    },
  };

  const currentInfo = tabTitles[currentTab] || { title: 'Edupark Portal', subtitle: '' };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {currentInfo.title}
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 font-medium">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions & Date Filters */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Filter Pill for Dashboard */}
          {currentTab === 'dashboard' && (
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <span className="px-2 py-1 text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Period:</span>
              </span>
              {(['today', 'week', 'month', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    dateFilter === f
                      ? 'bg-white text-navy-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'all' ? 'All Time' : f}
                </button>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-navy-50 text-navy-800 hover:bg-navy-100 border border-navy-200/80 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-navy-700" />
              <span className="hidden sm:inline">Add Student</span>
            </button>

            <button
              onClick={onOpenCreateDispatch}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-skyblue-600 hover:bg-skyblue-700 text-white shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Dispatch</span>
            </button>

            {currentTab !== 'settle' && (
              <button
                onClick={() => onSelectTab('settle')}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Settlements</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              title="Refresh data"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-skyblue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
