import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../lib/storage';
import { Student } from '../../types/database';
import { getLocalDateString } from '../../lib/calculations';
import {
  MapPin,
  Calendar,
  DollarSign,
  BookOpen,
  Users,
  Search,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Plus
} from 'lucide-react';

interface CreateDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedStudentAllocation {
  student: Student;
  calendars: number;
}

export const CreateDispatchModal: React.FC<CreateDispatchModalProps> = ({
  isOpen,
  onClose
}) => {
  const { students, dispatches, excuses, refreshData, showToast } = useApp();

  const [destination, setDestination] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(getLocalDateString());
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [defaultCalendars, setDefaultCalendars] = useState<number>(20);

  // Student search and selection
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedAllocations, setSelectedAllocations] = useState<SelectedStudentAllocation[]>([]);

  // Excused students section
  const [showExcusesSection, setShowExcusesSection] = useState<boolean>(false);
  const [excusesList, setExcusesList] = useState<{ studentId: string; reason: string }[]>([]);
  const [selectedExcuseStudentId, setSelectedExcuseStudentId] = useState<string>('');
  const [excuseReason, setExcuseReason] = useState<string>('Academic Examination');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setDestination('');
      setDispatchDate(getLocalDateString());
      setTargetAmount('');
      setDefaultCalendars(20);
      setSelectedAllocations([]);
      setExcusesList([]);
      setShowExcusesSection(false);
      setErrorMsg(null);
      setStudentSearch('');
    }
  }, [isOpen]);

  // Active students only
  const activeStudents = useMemo(() => {
    return students.filter(s => s.is_active);
  }, [students]);

  // Selected student IDs set for quick lookup
  const selectedStudentIds = useMemo(() => {
    return new Set(selectedAllocations.map(a => a.student.id));
  }, [selectedAllocations]);

  // Filtered available students for search dropdown
  const filteredAvailableStudents = useMemo(() => {
    return activeStudents.filter(s => {
      if (selectedStudentIds.has(s.id)) return false;
      const term = studentSearch.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(term) ||
        s.batch.toLowerCase().includes(term)
      );
    });
  }, [activeStudents, selectedStudentIds, studentSearch]);

  // Calculate Dispatch Type
  const dispatchType = selectedAllocations.length <= 1 ? 'Individual' : 'Team';

  // Total calendars across all assigned members
  const totalCalendarsAssigned = useMemo(() => {
    return selectedAllocations.reduce((sum, a) => sum + (Number(a.calendars) || 0), 0);
  }, [selectedAllocations]);

  const handleSelectStudent = (student: Student) => {
    // Check if student has excuse on selected date
    const hasExcuse = excuses.some(
      e => e.student_id === student.id && e.excuse_date === dispatchDate
    );
    if (hasExcuse) {
      setErrorMsg(`Warning: Student "${student.full_name}" is already EXCUSED on ${dispatchDate}.`);
      return;
    }

    // Check if student has dispatch on selected date
    const hasDispatch = dispatches.some(d => {
      if (d.dispatch_date !== dispatchDate || d.status === 'Cancelled') return false;
      return d.assignments.some(a => a.student_id === student.id);
    });

    if (hasDispatch) {
      setErrorMsg(`Warning: Student "${student.full_name}" is already assigned to another dispatch on ${dispatchDate}.`);
      return;
    }

    setErrorMsg(null);
    setSelectedAllocations(prev => [
      ...prev,
      { student, calendars: defaultCalendars }
    ]);
    setStudentSearch('');
  };

  const handleRemoveStudent = (studentId: string) => {
    setSelectedAllocations(prev => prev.filter(a => a.student.id !== studentId));
  };

  const handleUpdateStudentCalendars = (studentId: string, count: number) => {
    const safeCount = Math.max(0, isNaN(count) ? 0 : count);
    setSelectedAllocations(prev =>
      prev.map(a => (a.student.id === studentId ? { ...a, calendars: safeCount } : a))
    );
  };

  const handleAddExcuse = () => {
    if (!selectedExcuseStudentId) return;
    if (!excuseReason.trim()) return;

    if (selectedStudentIds.has(selectedExcuseStudentId)) {
      setErrorMsg('Cannot excuse a student who is currently selected for dispatch.');
      return;
    }

    if (excusesList.some(e => e.studentId === selectedExcuseStudentId)) {
      setErrorMsg('Student already added to excuse list.');
      return;
    }

    setExcusesList(prev => [
      ...prev,
      { studentId: selectedExcuseStudentId, reason: excuseReason.trim() }
    ]);
    setSelectedExcuseStudentId('');
    setErrorMsg(null);
  };

  const handleRemoveExcuse = (studentId: string) => {
    setExcusesList(prev => prev.filter(e => e.studentId !== studentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedDest = destination.trim();
    if (!trimmedDest) {
      setErrorMsg('Field destination is required.');
      return;
    }

    if (!dispatchDate) {
      setErrorMsg('Dispatch date is required.');
      return;
    }

    if (selectedAllocations.length === 0) {
      setErrorMsg('Please select at least one student for this dispatch.');
      return;
    }

    const allocationsPayload = selectedAllocations.map(a => ({
      studentId: a.student.id,
      calendarsIssued: Math.max(0, Math.floor(Number(a.calendars) || 0))
    }));

    try {
      setIsSubmitting(true);
      await StorageService.createDispatch(
        trimmedDest,
        dispatchDate,
        targetAmount ? parseFloat(targetAmount) : null,
        allocationsPayload,
        `Created on ${new Date().toLocaleDateString()}`,
        excusesList
      );

      showToast(
        `Dispatch created successfully as ${dispatchType} (${selectedAllocations.length} student${
          selectedAllocations.length > 1 ? 's' : ''
        }).`,
        'success'
      );
      await refreshData();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Field Dispatch"
      subtitle="Assign students to destination, allocate calendars, and record collection expectations"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Destination & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Destination / Field Area <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Green Valley Residency, Sector 4"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Dispatch Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
          </div>
        </div>

        {/* Allowance & Default Calendars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Allowance (₹) <span className="text-slate-400 font-normal">(Campus Cash for Travel & Food)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="e.g. 73, 89, 500 (Campus allowance for travel & food)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cash allowance given by campus for student travel, auto/bus fare, and food (any amount accepted).</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Default Calendars Per Student
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                value={defaultCalendars}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setDefaultCalendars(val);
                  setSelectedAllocations(prev => prev.map(a => ({ ...a, calendars: val })));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
          </div>
        </div>

        {/* Student Selection Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Students for Dispatch <span className="text-rose-500">*</span>
            </label>

            {/* Calculated Dispatch Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Calculated Classification:</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  dispatchType === 'Team'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {dispatchType} Dispatch ({selectedAllocations.length} student{selectedAllocations.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Search box for selecting students */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student by name or batch to assign..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
            />
          </div>

          {/* Dropdown list of filtered students */}
          {studentSearch.trim() && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100 custom-scrollbar">
              {filteredAvailableStudents.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">No matching available students.</p>
              ) : (
                filteredAvailableStudents.map(student => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{student.full_name}</span>
                      <span className="ml-2 text-slate-500">({student.batch})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      + Select
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Visible Selected Students with Per-Student Calendar Allotment */}
          {selectedAllocations.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">No students selected yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type in the search box above to add students. Exactly 1 student creates an Individual dispatch; 2 or more creates a Team.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {selectedAllocations.map((alloc) => (
                <div
                  key={alloc.student.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-skyblue-100 text-skyblue-700 flex items-center justify-center font-bold text-xs">
                      {alloc.student.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{alloc.student.full_name}</p>
                      <p className="text-[10px] text-slate-500">{alloc.student.batch}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Calendars:</span>
                      <input
                        type="number"
                        min="0"
                        value={alloc.calendars}
                        onChange={(e) =>
                          handleUpdateStudentCalendars(alloc.student.id, parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-semibold text-slate-900 focus:outline-none focus:border-skyblue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(alloc.student.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove student"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAllocations.length > 0 && (
            <div className="flex justify-between items-center text-xs px-2 pt-1 font-semibold text-slate-600">
              <span>Total Selected: {selectedAllocations.length}</span>
              <span>Total Physical Calendars Issued: {totalCalendarsAssigned}</span>
            </div>
          )}
        </div>

        {/* Optional Section: Excused Students */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowExcusesSection(!showExcusesSection)}
            className="text-xs font-semibold text-skyblue-600 hover:text-skyblue-700 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{showExcusesSection ? 'Hide Excused Students Section' : '+ Record Excused Students for this Date'}</span>
          </button>

          {showExcusesSection && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Record students who cannot participate in field duty on {dispatchDate} with an official reason.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <select
                    value={selectedExcuseStudentId}
                    onChange={(e) => setSelectedExcuseStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  >
                    <option value="">-- Choose Student to Excuse --</option>
                    {activeStudents
                      .filter(s => !selectedStudentIds.has(s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.batch})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={excuseReason}
                    onChange={(e) => setExcuseReason(e.target.value)}
                    placeholder="Excuse reason (e.g. Exam, Sick leave)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddExcuse}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Added excuses list */}
              {excusesList.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {excusesList.map(item => {
                    const student = students.find(s => s.id === item.studentId);
                    return (
                      <div
                        key={item.studentId}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-100 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{student?.full_name}</span>
                        <span className="text-slate-500 italic">Reason: {item.reason}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExcuse(item.studentId)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || selectedAllocations.length === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Dispatch...' : `Confirm & Dispatch (${dispatchType})`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
