import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../lib/storage';
import { PopulatedDispatch } from '../../types/database';
import {
  MapPin,
  Calendar,
  DollarSign,
  BookOpen,
  User,
  AlertCircle,
  FileText,
  Save
} from 'lucide-react';

interface EditDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: PopulatedDispatch | null;
}

export const EditDispatchModal: React.FC<EditDispatchModalProps> = ({
  isOpen,
  onClose,
  dispatch,
}) => {
  const { refreshData, showToast } = useApp();

  const [destination, setDestination] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [studentAllocations, setStudentAllocations] = useState<
    { assignmentId: string; studentId: string; studentName: string; batch: string; calendars: number }[]
  >([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (dispatch && isOpen) {
      setDestination(dispatch.destination || '');
      setDispatchDate(dispatch.dispatch_date || '');
      setTargetAmount(dispatch.target_amount !== null && dispatch.target_amount !== undefined ? String(dispatch.target_amount) : '');
      setNotes(dispatch.notes || '');
      setStudentAllocations(
        dispatch.assignments.map(a => ({
          assignmentId: a.id,
          studentId: a.student_id,
          studentName: a.student.full_name,
          batch: a.student.batch,
          calendars: a.calendars_issued,
        }))
      );
      setErrorMsg(null);
    }
  }, [dispatch, isOpen]);

  const handleUpdateCalendars = (assignmentId: string, count: number) => {
    const safeCount = Math.max(0, isNaN(count) ? 0 : count);
    setStudentAllocations(prev =>
      prev.map(a => (a.assignmentId === assignmentId ? { ...a, calendars: safeCount } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatch) return;
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

    if (studentAllocations.length === 0) {
      setErrorMsg('At least one student must be assigned.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedAllowance = targetAmount.trim() === '' ? null : parseFloat(targetAmount);

      await StorageService.updateDispatch(
        dispatch.id,
        trimmedDest,
        dispatchDate,
        parsedAllowance,
        studentAllocations.map(a => ({
          assignmentId: a.assignmentId,
          studentId: a.studentId,
          calendarsIssued: Math.max(0, Math.floor(Number(a.calendars) || 0))
        })),
        notes
      );

      showToast(`Dispatch #${dispatch.id.substring(0, 8)} updated successfully.`, 'success');
      await refreshData();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dispatch) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Dispatch Details"
      subtitle={`Editing Dispatch #${dispatch.id} (${dispatch.dispatch_type})`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Destination & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Field Destination <span className="text-rose-500">*</span>
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
                placeholder="e.g. Kozhikode Town Center"
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

        {/* Allowance (Accepts Any Number / Digit) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Campus Allowance (₹) <span className="text-slate-400 font-normal">(Any Rupee Amount: e.g. 73, 89, 500)</span>
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
              placeholder="e.g. 73, 89, 250, 500"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cash allowance given by campus for student travel, auto/bus fare, and food.</p>
        </div>

        {/* Assigned Students & Calendars Allocation */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Student Calendar Allocations ({studentAllocations.length})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {studentAllocations.map((alloc) => (
              <div
                key={alloc.assignmentId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{alloc.studentName}</p>
                    <span className="text-[10px] text-slate-500 font-medium">{alloc.batch}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Calendars:</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={alloc.calendars}
                    onChange={(e) => handleUpdateCalendars(alloc.assignmentId, parseInt(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Notes / Special Instructions
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Route details, vehicle info, or special permissions..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
