import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  MoreVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Wallet,
  Settings as SettingsIcon,
  Bell,
  CreditCard as CreditCardIcon,
  Download,
  Check,
  X,
  ExternalLink,
  Layers,
  Send,
  Users,
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/calculations';
import { NavTab } from '../layout/Sidebar';

interface ModelDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenCreateDispatch: () => void;
  onOpenAddStudent: () => void;
  onOpenExcuses?: () => void;
  onOpenMobileDrawer?: () => void;
}

export const ModelDashboard: React.FC<ModelDashboardProps> = ({
  onNavigateTab,
  onOpenCreateDispatch,
  onOpenAddStudent,
  onOpenExcuses,
  onOpenMobileDrawer,
}) => {
  const { user } = useAuth();
  const { metrics, dateFilter, setDateFilter, auditLogs, settlements } = useApp();

  // Mode: 'mock' (pixel-exact to model screenshot) vs 'live' (mapped to real portal data)
  const [dataMode, setDataMode] = useState<'mock' | 'live'>('mock');

  // Interactive UI states
  const [activeTopTab, setActiveTopTab] = useState<'courses' | 'dashboard' | 'schedule' | 'support'>('dashboard');
  const [bankingOpen, setBankingOpen] = useState<boolean>(false);
  const [cashCheckingOpen, setCashCheckingOpen] = useState<boolean>(true);
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Last month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState<boolean>(false);
  const [newPaymentModalOpen, setNewPaymentModalOpen] = useState<boolean>(false);
  const [addCardModalOpen, setAddCardModalOpen] = useState<boolean>(false);

  // Timeframe options
  const timeframeOptions = ['Today', 'Last 7 days', 'Last month', 'This quarter', 'All time'];

  // User name display
  const userName = dataMode === 'mock' 
    ? 'William' 
    : (user?.name?.split(' ')[0] || user?.username || 'Administrator');

  // Dynamic values based on mode
  const totalNetWorth = dataMode === 'mock' 
    ? '$16,531.54' 
    : formatCurrency(metrics?.netCollection || 0);

  const bankingValue = dataMode === 'mock' 
    ? '$9,681.49' 
    : formatCurrency((metrics?.totalAmountCollected || 0) * 0.58);

  const cashCheckingValue = dataMode === 'mock' 
    ? '$7,583.00' 
    : formatCurrency((metrics?.totalAmountCollected || 0) * 0.42);

  const wiseValue = dataMode === 'mock' 
    ? '$5,299.52' 
    : formatCurrency((metrics?.totalAmountCollected || 0) * 0.28);

  const savingsGoalValue = dataMode === 'mock' 
    ? '$958.00' 
    : formatCurrency((metrics?.totalExpenses || 0) * 0.5);

  const availableBalanceValue = dataMode === 'mock' 
    ? '$7,602.15' 
    : formatCurrency(metrics?.netCollection || 0);

  const spendingPlanTotal = dataMode === 'mock' 
    ? '$37k' 
    : `${Math.round(((metrics?.totalAmountCollected || 0) + (metrics?.totalExpenses || 0)) / 1000)}k`;

  const bar1Val = dataMode === 'mock' ? '$22.548' : formatCurrency((metrics?.totalAmountCollected || 0) * 0.6);
  const bar2Val = dataMode === 'mock' ? '$12.432' : formatCurrency((metrics?.netCollection || 0) * 0.4);
  const bar3Val = dataMode === 'mock' ? '$16.864' : formatCurrency(metrics?.totalExpenses || 0);

  const incomeVal = dataMode === 'mock' ? '$3,800' : formatCurrency(metrics?.totalAmountCollected || 0);
  const gaugeAvailableVal = dataMode === 'mock' ? '$4,682' : formatCurrency(metrics?.netCollection || 0);
  const fitnessVal = dataMode === 'mock' ? '$89' : `$${settlements.length}`;

  return (
    <div className="w-full">
      {/* Mode Switcher Banner (Floating pill above the dashboard) */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur-md p-1 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1">
            <button
              onClick={() => setDataMode('mock')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                dataMode === 'mock'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Reference Model Design</span>
            </button>
            <button
              onClick={() => setDataMode('live')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                dataMode === 'live'
                  ? 'bg-[#654cf6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live Portal Data</span>
            </button>
          </div>
        </div>

        {/* Quick Portal Switcher */}
        <div className="relative">
          <button
            onClick={() => setPortalMenuOpen(!portalMenuOpen)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1.5"
          >
            <span>All Portal Pages</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {portalMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">Quick Navigation</div>
              {(['students', 'dispatches', 'settle', 'exports', 'settings'] as NavTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    onNavigateTab(tab);
                    setPortalMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 capitalize transition flex items-center justify-between"
                >
                  <span>{tab === 'settle' ? 'Settlements' : tab}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Curved Dashboard Canvas - Exact Match to Reference Image */}
      <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100/90 text-slate-900">
        
        {/* ======================================================== */}
        {/* 1. TOP NAVIGATION BAR                                    */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Infinity Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            {onOpenMobileDrawer && (
              <button
                onClick={onOpenMobileDrawer}
                title="Open Navigation Menu"
                className="md:hidden w-10 h-10 rounded-2xl bg-[#f8f9fa] border border-slate-200/60 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#f8f9fa] border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs hover:border-slate-300 transition">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.5l-2.83 2.76-2.83-2.76c-.97-.94-2.33-1.5-3.77-1.5C2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.5l2.83-2.76 2.83 2.76c.97.94 2.33 1.5 3.77 1.5 2.98 0 5.4-2.42 5.4-5.38s-2.42-5.38-5.4-5.38zm-13.2 8.76c-1.87 0-3.4-1.52-3.4-3.38 0-1.87 1.53-3.38 3.4-3.38 1.02 0 1.95.45 2.58 1.18l2.25 2.2-2.25 2.2c-.63.73-1.56 1.18-2.58 1.18zm13.2 0c-1.02 0-1.95-.45-2.58-1.18l-2.25-2.2 2.25-2.2c.63-.73 1.56-1.18 2.58-1.18 1.87 0 3.4 1.51 3.4 3.38 0 1.86-1.53 3.38-3.4 3.38z" />
              </svg>
            </div>
          </div>

          {/* Center Navigation Pill Capsule */}
          <div className="hidden md:flex items-center bg-[#f4f5f7] p-1.5 rounded-full gap-1">
            <button
              onClick={() => setActiveTopTab('courses')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTopTab === 'courses'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTopTab('dashboard')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTopTab === 'dashboard'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTopTab('schedule')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTopTab === 'schedule'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTopTab('support')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTopTab === 'support'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Support
            </button>
          </div>

          {/* Right Action Icons: Settings, Bell, Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('settings')}
              title="Settings"
              className="w-10 h-10 rounded-full bg-[#f4f5f7] hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notifications"
                className="w-10 h-10 rounded-full bg-[#f4f5f7] hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#654cf6]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] text-slate-400">Mark all read</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-slate-50 flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#654cf6] mt-1 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">Settlement reconciled</p>
                        <p className="text-slate-400 text-[11px]">Recent field batches closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div
              onClick={() => onNavigateTab('settings')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs cursor-pointer ring-1 ring-slate-200 hover:ring-slate-400 transition"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
                alt="User Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. GREETING & PRIMARY ACTION                             */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 sm:mt-10 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            Good morning, {userName}!
          </h1>

          <button
            onClick={() => setNewPaymentModalOpen(true)}
            className="bg-black hover:bg-slate-800 text-white font-medium text-sm px-6 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New payment</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 3. FILTER & SEARCH CONTROLS ROW                          */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Left Controls: Filter, Timeframe, Export */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setTimeframeDropdownOpen(!timeframeDropdownOpen)}
              className="border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-2xs transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setTimeframeDropdownOpen(!timeframeDropdownOpen)}
                className="border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-2xs transition"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedTimeframe}</span>
              </button>

              {timeframeDropdownOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50">
                  {timeframeOptions.map(tf => (
                    <button
                      key={tf}
                      onClick={() => {
                        setSelectedTimeframe(tf);
                        setTimeframeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                        selectedTimeframe === tf
                          ? 'bg-slate-100 text-slate-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tf}</span>
                      {selectedTimeframe === tf && <Check className="w-3.5 h-3.5 text-slate-900" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('exports')}
              className="border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>

          {/* Right Controls: Search & Options */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#f8f9fa] border border-slate-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 w-44 sm:w-56 transition-all focus:w-64"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="w-8 h-8 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-2xs transition"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs">
                  <button
                    onClick={() => {
                      onOpenCreateDispatch();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                  >
                    Create Dispatch
                  </button>
                  <button
                    onClick={() => {
                      onOpenAddStudent();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                  >
                    Add Student
                  </button>
                  {onOpenExcuses && (
                    <button
                      onClick={() => {
                        onOpenExcuses();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Excuses Log
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. THREE-COLUMN BENTO GRID                               */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ====================================================== */}
          {/* COLUMN 1: "My accounts" (lg:col-span-4)                */}
          {/* ====================================================== */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
            
            {/* Header: Title + Add Card */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                My accounts
              </h2>
              <button
                onClick={() => setAddCardModalOpen(true)}
                className="bg-[#f4f5f7] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add card</span>
              </button>
            </div>

            {/* Dual-Tone Visa Card Widget */}
            <div className="w-full aspect-[1.58/1] rounded-2xl overflow-hidden shadow-md flex select-none relative transition-transform hover:scale-[1.01]">
              {/* Left Zone: Vivid Indigo / Violet with Master Circles */}
              <div className="w-[30%] bg-[#654cf6] flex flex-col justify-between p-4 relative overflow-hidden">
                {/* Mastercard Overlapping Circles */}
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-white/90" />
                  <div className="w-5 h-5 rounded-full bg-white/60 -ml-2.5 backdrop-blur-2xs" />
                </div>

                {/* Bottom Masked Digits */}
                <span className="font-mono text-white text-[11px] font-semibold tracking-wider">
                  ****6720
                </span>
              </div>

              {/* Right Zone: Clean White Surface */}
              <div className="w-[70%] bg-[#fafbfc] border-y border-r border-slate-100 p-4 flex flex-col justify-between relative">
                {/* Visa Logo & Wave */}
                <div className="flex items-start justify-between">
                  <span className="font-black text-slate-900 tracking-wider text-base font-sans italic">
                    VISA
                  </span>
                  
                  {/* Contactless waves icon */}
                  <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                  </svg>
                </div>

                {/* Card Right Cutout Notch */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-white rounded-l-full border-y border-l border-slate-100" />

                {/* Bottom Digits & Expiry */}
                <div className="flex items-center justify-between text-[11px] text-slate-800 font-mono font-medium">
                  <span>***4329</span>
                  <span className="text-slate-500">09/26</span>
                </div>
              </div>
            </div>

            {/* Net Worth Indicator */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700">
                  <CreditCardIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800">Net worth</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900 font-mono tracking-tight">
                {totalNetWorth}
              </span>
            </div>

            {/* Hierarchical Accordion List */}
            <div className="space-y-3 text-xs">
              {/* Banking Item */}
              <div>
                <button
                  onClick={() => setBankingOpen(!bankingOpen)}
                  className="w-full flex items-center justify-between py-1 text-slate-800 hover:text-slate-900 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 group-hover:text-slate-600 transition-transform">
                      {bankingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <span className="font-semibold text-slate-700">Banking</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{bankingValue}</span>
                </button>
              </div>

              {/* Cash & checking Item */}
              <div>
                <button
                  onClick={() => setCashCheckingOpen(!cashCheckingOpen)}
                  className="w-full flex items-center justify-between py-1 text-slate-800 hover:text-slate-900 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 group-hover:text-slate-600 transition-transform">
                      {cashCheckingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <span className="font-semibold text-slate-700">Cash & checking</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{cashCheckingValue}</span>
                </button>

                {/* Subitems */}
                {cashCheckingOpen && (
                  <div className="pl-6 pt-2 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>WISE</span>
                      <span className="font-semibold text-slate-700 font-mono">{wiseValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Savings goal</span>
                      <span className="font-semibold text-slate-700 font-mono">{savingsGoalValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Available balance</span>
                      <span className="font-semibold text-slate-700 font-mono">{availableBalanceValue}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>


          {/* ====================================================== */}
          {/* COLUMN 2: Center Column (lg:col-span-4)                */}
          {/* ====================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Top Card: Spending plan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Spending plan
                </h2>
                <button
                  onClick={() => onNavigateTab('settle')}
                  className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1 transition"
                >
                  <span>View details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Spending Stat */}
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
                  {spendingPlanTotal}
                </span>
                <span className="text-xs text-slate-400 font-medium leading-tight max-w-[85px]">
                  Expenses for the month
                </span>
              </div>

              {/* 3 Stylized Column Bars Container */}
              <div className="bg-[#f8f9fa] rounded-2xl p-5 pt-8 flex items-end justify-between gap-4 h-48 relative">
                {/* Bar 1: Black Solid */}
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] font-bold text-slate-700 mb-2 font-mono">
                    {bar1Val}
                  </span>
                  <div className="w-full h-[78%] bg-black rounded-t-xl shadow-xs" />
                </div>

                {/* Bar 2: Vivid Purple with +10% badge */}
                <div className="flex-1 flex flex-col items-center justify-end h-full relative">
                  <span className="text-[11px] font-bold text-slate-700 mb-2 font-mono">
                    {bar2Val}
                  </span>
                  <div className="w-full h-[52%] bg-[#654cf6] rounded-t-xl relative flex justify-center items-start pt-2 shadow-xs">
                    {/* Badge */}
                    <span className="bg-[#654cf6] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-xs">
                      +10%
                    </span>
                  </div>
                </div>

                {/* Bar 3: White with subtle hatched pattern */}
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[11px] font-bold text-slate-700 mb-2 font-mono">
                    {bar3Val}
                  </span>
                  <div
                    className="w-full h-[62%] bg-white border border-slate-200/90 rounded-t-xl shadow-2xs relative"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 3px, #ffffff 3px, #ffffff 6px)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Card: Income with Spline Curve */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 tracking-tight">Income</span>
                <span className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                  Past 30 days <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              {/* Stat & Growth Badge */}
              <div className="space-y-1.5">
                <div className="text-3xl font-extrabold text-[#111827] tracking-tight font-mono">
                  {incomeVal}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                  <ArrowUp className="w-3 h-3" />
                  <span>16.4%</span>
                </div>
              </div>

              {/* Interactive Smooth Purple Spline Chart */}
              <div className="relative h-24 w-full mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80" preserveAspectRatio="none">
                  {/* Subtle Gradient fill under curve */}
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#654cf6" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#654cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d="M 10 75 Q 70 70 120 50 T 200 30 T 270 10 L 270 80 L 10 80 Z"
                    fill="url(#incomeGradient)"
                  />

                  {/* Spline stroke */}
                  <path
                    d="M 10 75 Q 70 70 120 50 T 200 30 T 270 10"
                    fill="none"
                    stroke="#654cf6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Vertical dashed guideline to Feb 12 point */}
                  <line
                    x1="200"
                    y1="30"
                    x2="200"
                    y2="80"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Dot on curve */}
                  <circle cx="200" cy="30" r="4.5" fill="#654cf6" stroke="#ffffff" strokeWidth="2.5" />
                </svg>

                {/* Floating Feb 12 Tooltip Pill Badge */}
                <div
                  className="absolute pointer-events-none -top-2 left-[65%] -translate-x-1/2 bg-white text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md border border-slate-100"
                >
                  Feb 12
                </div>
              </div>
            </div>

          </div>


          {/* ====================================================== */}
          {/* COLUMN 3: Right Column (lg:col-span-4)                 */}
          {/* ====================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Top Card: Multi-Color Semi-Circle Gauge */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-between min-h-[260px]">
              {/* Semi-Circular Arc Gauge */}
              <div className="relative w-64 h-36 flex items-center justify-center mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 120">
                  {/* Gauge Arc: Radius 70, Center (100, 100) */}
                  {/* Red/Coral Arc: 180 to 95 degrees (~47%) */}
                  <path
                    d="M 30 100 A 70 70 0 0 1 93.9 30.3"
                    fill="none"
                    stroke="#ff4b3e"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />

                  {/* Amber/Yellow Arc: 90 to 30 degrees (~33%) */}
                  <path
                    d="M 100 30 A 70 70 0 0 1 160.6 65"
                    fill="none"
                    stroke="#ffb830"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />

                  {/* Purple/Violet Arc: 25 to 0 degrees (~20%) */}
                  <path
                    d="M 164.7 72 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="#654cf6"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Stat Display */}
                <div className="absolute top-12 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-mono">
                    {gaugeAvailableVal}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">
                    Available
                  </span>
                </div>
              </div>

              {/* Legend Row */}
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-700 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff4b3e]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb830]" />
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#654cf6]" />
                  <span>Other</span>
                </div>
              </div>
            </div>

            {/* Bottom Card: Fitness First (Vivid Purple Metric Card) */}
            <div className="bg-[#654cf6] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-purple-600/25 flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white/95 tracking-tight">Fitness first</span>
                <span className="text-xs text-white/70 hover:text-white flex items-center gap-1 cursor-pointer">
                  Past 30 days <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              {/* Stat & Decline Badge */}
              <div className="space-y-1.5 mt-3 mb-2">
                <div className="text-4xl font-black text-white tracking-tight font-mono">
                  {fitnessVal}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <ArrowDown className="w-3 h-3" />
                  <span>21.8%</span>
                </div>
              </div>

              {/* Glowing White Spline Curve */}
              <div className="relative h-20 w-full mt-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 280 60" preserveAspectRatio="none">
                  {/* Subtle White Area glow */}
                  <defs>
                    <linearGradient id="fitnessGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 10 50 Q 80 50 140 45 T 220 20 T 270 12 L 270 60 L 10 60 Z"
                    fill="url(#fitnessGlow)"
                  />

                  {/* Spline stroke */}
                  <path
                    d="M 10 50 Q 80 50 140 45 T 220 20 T 270 12"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Guideline */}
                  <line
                    x1="220"
                    y1="20"
                    x2="220"
                    y2="60"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Dot marker */}
                  <circle cx="220" cy="20" r="4.5" fill="#ffffff" stroke="#654cf6" strokeWidth="2.5" />
                </svg>

                {/* Floating Feb 18 Tooltip Pill Badge */}
                <div
                  className="absolute pointer-events-none -top-1 left-[75%] -translate-x-1/2 bg-white text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md"
                >
                  Feb 18
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Quick Interactive Modal: New Payment */}
      {newPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">New Payment & Settlement</h3>
              <button
                onClick={() => setNewPaymentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 mb-4">
              Select an action to record a transaction or settle field accounts.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setNewPaymentModalOpen(false);
                  onOpenCreateDispatch();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-[#654cf6]" />
                  <span>Issue Dispatches / Advance Allowances</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setNewPaymentModalOpen(false);
                  onNavigateTab('settle');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                  <span>Receive Cash & UPI Settlement</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Interactive Modal: Add Card */}
      {addCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Account / Card</h3>
              <button
                onClick={() => setAddCardModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 mb-4">
              Configure secondary bank, debit card or UPI collection wallet.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Card / Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Campus Expense Card"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#654cf6]"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Type</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#654cf6]">
                  <option>Visa Business Debit</option>
                  <option>UPI / GPay Merchant</option>
                  <option>Cash Vault</option>
                </select>
              </div>
              <button
                onClick={() => setAddCardModalOpen(false)}
                className="w-full mt-2 bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl transition"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
