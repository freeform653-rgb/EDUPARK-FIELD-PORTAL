import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentModal } from '../components/students/StudentModal';
import { StudentStatusBadge } from '../components/ui/Badge';
import { StorageService } from '../lib/storage';
import { exportToCsv, exportToExcel, exportToPdf, triggerPrint } from '../lib/export-utils';
import { Student } from '../types/database';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Printer,
  FileSpreadsheet,
  FileText,
  Edit2,
  UserX,
  UserCheck,
  Phone,
  Layers,
  Send,
  Clock
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { students, refreshData, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'batch' | 'recent'>('name');

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Student summary cards
  const summary = useMemo(() => {
    const total = students.length;
    const active = students.filter((s: Student) => s.is_active).length;
    const batches = new Set(students.map((s: Student) => s.batch)).size;
    const dispatched = students.filter((s: Student) => s.current_status === 'Dispatched').length;
    const pending = students.filter((s: Student) => s.current_status === 'Settlement Pending').length;
    return { total, active, batches, dispatched, pending };
  }, [students]);

  // Unique batches
  const batchesList = useMemo(() => {
    return Array.from(new Set(students.map((s: Student) => s.batch))).sort();
  }, [students]);

  // Filtered & sorted student list
  const filteredStudents = useMemo(() => {
    return students
      .filter((s: Student) => {
        const matchesSearch =
          s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Boolean(s.phone_number) && s.phone_number!.includes(searchTerm));

        const matchesBatch = selectedBatch === 'all' || s.batch === selectedBatch;
        const matchesStatus = selectedStatus === 'all' || s.current_status === selectedStatus;

        return matchesSearch && matchesBatch && matchesStatus;
      })
      .sort((a: Student, b: Student) => {
        if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
        if (sortBy === 'batch') return a.batch.localeCompare(b.batch);
        if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [students, searchTerm, selectedBatch, selectedStatus, sortBy]);

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setStudentToEdit(student);
    setModalOpen(true);
  };

  const handleToggleActive = async (student: Student) => {
    try {
      if (student.is_active) {
        if (
          window.confirm(
            `Are you sure you want to deactivate "${student.full_name}"? Their past dispatches and collection records will be preserved.`
          )
        ) {
          await StorageService.deactivateStudent(student.id, 'Deactivated by admin');
          showToast(`Student "${student.full_name}" has been deactivated.`, 'info');
        }
      } else {
        await StorageService.activateStudent(student.id);
        showToast(`Student "${student.full_name}" reactivated.`, 'success');
      }
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Error updating student status', 'error');
    }
  };

  // Export handlers
  const exportColumns = [
    { header: 'Serial No', key: 'serial', format: (_: any, __: any, idx?: number) => String((idx || 0) + 1) },
    { header: 'Student Name', key: 'full_name' },
    { header: 'Batch', key: 'batch' },
    { header: 'Phone Number', key: 'phone_number', format: (v: any) => v || 'N/A' },
    { header: 'Current Status', key: 'current_status', format: (v: any) => v || 'Available' },
    { header: 'Active', key: 'is_active', format: (v: any) => (v ? 'Yes' : 'Archived') },
  ];

  const handleExportCsv = () => {
    const dataWithIndex = filteredStudents.map((s: Student, i: number) => ({ ...s, serial: i + 1 }));
    exportToCsv('Student_Register', exportColumns, dataWithIndex);
    showToast('Exported student list to CSV.', 'success');
  };

  const handleExportExcel = () => {
    const dataWithIndex = filteredStudents.map((s: Student, i: number) => ({ ...s, serial: i + 1 }));
    exportToExcel('Student_Register', exportColumns, dataWithIndex);
    showToast('Exported student list to Excel format.', 'success');
  };

  const handleExportPdf = () => {
    const dataWithIndex = filteredStudents.map((s: Student, i: number) => ({ ...s, serial: i + 1 }));
    exportToPdf(
      'Student Register',
      exportColumns,
      dataWithIndex,
      selectedBatch !== 'all' ? `Batch: ${selectedBatch}` : 'All Batches'
    );
    showToast('Generated student list PDF.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-navy-50 text-navy-800 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered Students</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{summary.total}</p>
            <p className="text-[10px] text-slate-400">{summary.active} currently active</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-skyblue-50 text-skyblue-700 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batches / Cohorts</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{summary.batches}</p>
            <p className="text-[10px] text-slate-400">Enrolled academic groups</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Dispatched</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{summary.dispatched}</p>
            <p className="text-[10px] text-slate-400">Currently in the field</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Settlement</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{summary.pending}</p>
            <p className="text-[10px] text-slate-400">Awaiting money return</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Export Buttons */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, batch, or phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Print Student Directory"
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

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Batch Selector */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
          >
            <option value="all">All Batches</option>
            {batchesList.map((b: string) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Settlement Pending">Settlement Pending</option>
            <option value="Excused">Excused</option>
            <option value="Inactive">Inactive / Archived</option>
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-skyblue-500"
            >
              <option value="name">Full Name (A-Z)</option>
              <option value="batch">Batch Name</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table & Responsive List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-container">
        {/* Printable Header */}
        <div className="hidden print:block p-4 border-b">
          <h2 className="text-xl font-bold">Edupark Field Portal — Student Directory</h2>
          <p className="text-xs text-slate-600">
            Filter: {selectedBatch === 'all' ? 'All Batches' : selectedBatch} | Total: {filteredStudents.length} Students
          </p>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedBatch !== 'all' || selectedStatus !== 'all'
                ? 'Try clearing active search or batch filters to see registered students.'
                : 'Click "Add Student" above to register your first student into the portal.'}
            </p>
            {(searchTerm || selectedBatch !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBatch('all');
                  setSelectedStatus('all');
                }}
                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-14">#</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((student: Student, idx: number) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !student.is_active ? 'opacity-60 bg-slate-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{student.full_name}</span>
                        {!student.is_active && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {student.batch}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {student.phone_number ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.phone_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StudentStatusBadge status={student.current_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit student"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(student)}
                          title={student.is_active ? 'Deactivate / Archive' : 'Reactivate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.is_active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {student.is_active ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        studentToEdit={studentToEdit}
      />
    </div>
  );
};
