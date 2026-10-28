import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CreateDispatchModal } from '../components/dispatches/CreateDispatchModal';
import { EditDispatchModal } from '../components/dispatches/EditDispatchModal';
import { SettleModal } from '../components/settlement/SettleModal';
import { DispatchStatusBadge, DispatchTypeBadge } from '../components/ui/Badge';
import { PopulatedDispatch, PopulatedAssignment, PopulatedSettlement, DateFilterType } from '../types/database';
import { formatCurrency, formatDisplayDate, matchesDateFilter } from '../lib/calculations';
import { exportToCsv, exportToExcel, exportToPdf, triggerPrint } from '../lib/export-utils';
import {
  Send,
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  FileText,
  CreditCard,
  CheckCircle2,
  MapPin,
  User,
  Edit3
} from 'lucide-react';

export const DispatchesPage: React.FC = () => {
  const { dispatches, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');

  const [expandedDispatchIds, setExpandedDispatchIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editDispatchModalOpen, setEditDispatchModalOpen] = useState<boolean>(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<PopulatedDispatch | null>(null);

  // Settle modal state
  const [settleModalOpen, setSettleModalOpen] = useState<boolean>(false);
  const [selectedAssignmentToSettle, setSelectedAssignmentToSettle] = useState<PopulatedAssignment | null>(null);
  const [parentDispatchForSettle, setParentDispatchForSettle] = useState<PopulatedDispatch | null>(null);
  const [settlementToEdit, setSettlementToEdit] = useState<PopulatedSettlement | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedDispatchIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenSettle = (assignment: PopulatedAssignment, dispatch: PopulatedDispatch) => {
    setSettlementToEdit(null);
    setSelectedAssignmentToSettle(assignment);
    setParentDispatchForSettle(dispatch);
    setSettleModalOpen(true);
  };

  const handleOpenEditDispatch = (dispatch: PopulatedDispatch) => {
    setDispatchToEdit(dispatch);
    setEditDispatchModalOpen(true);
  };

  const handleOpenEditSettlement = (assignment: PopulatedAssignment, dispatch: PopulatedDispatch) => {
    if (!assignment.settlement) return;
    const popSettlement: PopulatedSettlement = {
      ...assignment.settlement,
      assignment,
      student: assignment.student,
      dispatch,
    };
    setSettlementToEdit(popSettlement);
    setSelectedAssignmentToSettle(assignment);
    setParentDispatchForSettle(dispatch);
    setSettleModalOpen(true);
  };

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d: PopulatedDispatch) => {
      const matchesSearch =
        d.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.assignments.some((a: PopulatedAssignment) => a.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
      const matchesType = selectedType === 'all' || d.dispatch_type === selectedType;
      const matchesDate = matchesDateFilter(d.dispatch_date, dateFilter);

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [dispatches, searchTerm, selectedStatus, selectedType, dateFilter]);

  // Export columns
  const exportColumns = [
    { header: 'Dispatch ID', key: 'id' },
    { header: 'Destination', key: 'destination' },
    { header: 'Date', key: 'dispatch_date', format: (v: string) => formatDisplayDate(v) },
    { header: 'Type', key: 'dispatch_type' },
    {
      header: 'Assigned Students',
      key: 'assignments',
      format: (a: PopulatedAssignment[]) => a.map(asgn => asgn.student.full_name).join('; ')
    },
    { header: 'Allowance (₹)', key: 'target_amount', format: (v: number) => formatCurrency(v) },
    { header: 'Calendars Issued', key: 'total_calendars_issued' },
    { header: 'Calendars Returned', key: 'total_calendars_returned' },
    { header: 'Total Collected (₹)', key: 'total_collected', format: (v: number) => formatCurrency(v) },
    { header: 'Net Collection (₹)', key: 'net_collection', format: (v: number) => formatCurrency(v) },
    { header: 'Status', key: 'status' },
  ];

  const handleExportCsv = () => {
    exportToCsv('Dispatch_Register', exportColumns, filteredDispatches);
    showToast('Exported dispatches to CSV.', 'success');
  };

  const handleExportExcel = () => {
    exportToExcel('Dispatch_Register', exportColumns, filteredDispatches);
    showToast('Exported dispatches to Excel.', 'success');
  };

  const handleExportPdf = () => {
    exportToPdf('Field Dispatch Register', exportColumns, filteredDispatches);
    showToast('Generated Dispatch Register PDF.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by destination or assigned student..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dispatch</span>
            </button>

            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Print Dispatch Register"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Export to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Download PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Settlement Pending">Settlement Pending</option>
            <option value="Settled">Settled</option>
          </select>

          {/* Dispatch Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
          >
            <option value="all">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Team">Team</option>
          </select>
        </div>
      </div>

      {/* Dispatches List */}
      <div className="space-y-4 print-container">
        {filteredDispatches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
            <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No dispatches found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no field dispatches matching your active filters. Click "Create Dispatch" to launch a new collection team.
            </p>
          </div>
        ) : (
          filteredDispatches.map((dispatch: PopulatedDispatch) => {
            const isExpanded = expandedDispatchIds.has(dispatch.id);
            const isTeam = dispatch.dispatch_type === 'Team';
            const progressRatio = `${dispatch.settled_students} of ${dispatch.total_students} Settled`;

            return (
              <div
                key={dispatch.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Dispatch Summary Header Card */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Destination & Meta */}
                    {/* Student Name Highlighted & Place To The Side */}
                    <div className="space-y-2 min-w-0">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <DispatchTypeBadge type={dispatch.dispatch_type} />
                        <DispatchStatusBadge
                          status={dispatch.status}
                          detailText={isTeam ? progressRatio : undefined}
                        />
                        <span className="text-xs text-slate-400 font-mono">#{dispatch.id}</span>
                        <button
                          onClick={() => handleOpenEditDispatch(dispatch)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-skyblue-700 bg-slate-100 hover:bg-skyblue-50 transition-colors"
                          title="Edit dispatch details & calendars"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Dispatch</span>
                        </button>
                      </div>

                      {/* Main Headline: Highlighted Student Name(s) + Place on the side */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                        {isTeam ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {dispatch.assignments.map((asgn) => (
                              <span
                                key={asgn.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-slate-900 border-2 border-amber-300 shadow-xs text-xs sm:text-sm font-extrabold"
                              >
                                <User className="w-3.5 h-3.5 text-amber-700" />
                                <span>{asgn.student.full_name}</span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white text-amber-900 border border-amber-200">
                                  {asgn.student.batch}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          dispatch.assignments[0] && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-slate-900 border-2 border-amber-300 shadow-xs text-sm sm:text-base font-black">
                                <User className="w-4 h-4 text-amber-700" />
                                <span>{dispatch.assignments[0].student.full_name}</span>
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {dispatch.assignments[0].student.batch}
                              </span>
                            </div>
                          )
                        )}

                        {/* Place placed to the side */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 shadow-2xs">
                          <MapPin className="w-3.5 h-3.5 text-skyblue-600 shrink-0" />
                          <span>{dispatch.destination}</span>
                        </div>
                      </div>

                      {/* Meta Information row */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDisplayDate(dispatch.dispatch_date)}
                        </span>
                        <span>•</span>
                        <span>
                          {dispatch.total_students} Assigned Student{dispatch.total_students > 1 ? 's' : ''}
                        </span>
                        {dispatch.target_amount && (
                          <>
                            <span>•</span>
                            <span className="text-slate-700 font-medium">
                              Allowance: <strong className="text-slate-900 font-extrabold">{formatCurrency(dispatch.target_amount)}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Financial / Calendars Pill */}
                      <div className="grid grid-cols-2 gap-4 text-right text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Calendars</span>
                          <span className="font-bold text-slate-800">
                            {dispatch.total_calendars_returned} / {dispatch.total_calendars_issued}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Collected</span>
                          <span className="font-extrabold text-emerald-700">
                            {formatCurrency(dispatch.total_collected)}
                          </span>
                        </div>
                      </div>

                      {/* Expand / Actions */}
                      <div className="flex items-center gap-2">
                        {isTeam ? (
                          <button
                            onClick={() => toggleExpand(dispatch.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <span>Team Members ({dispatch.total_students})</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          // For individual dispatch, show direct Settle or Settled badge + Edit
                          dispatch.assignments[0] && (
                            dispatch.assignments[0].assignment_status === 'Settled' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Settled</span>
                                </span>
                                <button
                                  onClick={() => handleOpenEditSettlement(dispatch.assignments[0], dispatch)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                                  title="Edit settlement amounts"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenSettle(dispatch.assignments[0], dispatch)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Settle</span>
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Team Member Breakdown */}
                {isTeam && isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-200 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Team Member Assignments & Individual Settlements
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dispatch.assignments.map((asgn: PopulatedAssignment) => {
                        const isSettled = asgn.assignment_status === 'Settled';
                        return (
                          <div
                            key={asgn.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isSettled
                                ? 'bg-white border-emerald-200 shadow-xs'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-xs truncate bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                  {asgn.student.full_name}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{asgn.student.batch}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isSettled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {asgn.assignment_status}
                              </span>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Calendars</span>
                                <span className="font-semibold text-slate-700">
                                  {isSettled
                                    ? `${asgn.settlement?.calendars_returned || 0} / ${asgn.calendars_issued}`
                                    : `${asgn.calendars_issued} issued`}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block">Collected</span>
                                <span className="font-bold text-slate-900">
                                  {isSettled ? formatCurrency(asgn.settlement?.total_collected) : '—'}
                                </span>
                              </div>

                              <div>
                                {!isSettled ? (
                                  <button
                                    onClick={() => handleOpenSettle(asgn, dispatch)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                                  >
                                    Settle
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-emerald-600">
                                      ✓ Done
                                    </span>
                                    <button
                                      onClick={() => handleOpenEditSettlement(asgn, dispatch)}
                                      className="p-1 rounded text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                                      title="Edit settlement"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Dispatch Modal */}
      <CreateDispatchModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Edit Dispatch Modal */}
      <EditDispatchModal
        isOpen={editDispatchModalOpen}
        onClose={() => {
          setEditDispatchModalOpen(false);
          setDispatchToEdit(null);
        }}
        dispatch={dispatchToEdit}
      />

      {/* Settle Assignment Modal */}
      <SettleModal
        isOpen={settleModalOpen}
        onClose={() => {
          setSettleModalOpen(false);
          setSelectedAssignmentToSettle(null);
          setParentDispatchForSettle(null);
          setSettlementToEdit(null);
        }}
        assignment={selectedAssignmentToSettle}
        parentDispatch={parentDispatchForSettle}
        settlementToEdit={settlementToEdit}
      />
    </div>
  );
};
