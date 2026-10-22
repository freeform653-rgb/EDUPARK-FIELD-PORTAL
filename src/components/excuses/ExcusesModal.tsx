import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../lib/storage';
import { formatDisplayDate, getLocalDateString } from '../../lib/calculations';
import { UserCheck, Trash2, AlertCircle, Plus, Calendar, User, FileText } from 'lucide-react';

interface ExcusesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcusesModal: React.FC<ExcusesModalProps> = ({ isOpen, onClose }) => {
  const { students, excuses, refreshData, showToast } = useApp();

  const [studentId, setStudentId] = useState<string>('');
  const [excuseDate, setExcuseDate] = useState<string>(getLocalDateString());
  const [reason, setReason] = useState<string>('Medical Leave');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeStudents = students.filter(s => s.is_active);

  const handleRecordExcuse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!studentId) {
      setErrorMsg('Please select a student.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a reason for excuse.');
      return;
    }

    try {
      setIsSubmitting(true);
      await StorageService.recordExcuse(studentId, excuseDate, reason, notes);
      showToast('Student excuse recorded successfully.', 'success');
      setStudentId('');
      setNotes('');
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record excuse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExcuse = async (id: string, name: string) => {
    if (window.confirm(`Remove excuse record for ${name}?`)) {
      try {
        await StorageService.deleteExcuse(id);
        showToast('Excuse record deleted.', 'info');
        await refreshData();
      } catch (err: any) {
        showToast(err.message || 'Error deleting excuse.', 'error');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excused Students Register"
      subtitle="Manage official exemptions from field donation duty"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Record New Excuse Form */}
        <form onSubmit={handleRecordExcuse} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-skyblue-600" />
            <span>Record New Exemption</span>
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student</label>
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose Student --</option>
                {activeStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.batch})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Excuse Date</label>
              <input
                type="date"
                required
                value={excuseDate}
                onChange={(e) => setExcuseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
              >
                <option value="Medical Leave / Illness">Medical Leave / Illness</option>
                <option value="University Semester Exam">University Semester Exam</option>
                <option value="Academic Department Duty">Academic Department Duty</option>
                <option value="Family / Personal Emergency">Family / Personal Emergency</option>
                <option value="Campus Special Event">Campus Special Event</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Authority Approval</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dean letter submitted"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-navy-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Recording...' : 'Record Excuse'}
            </button>
          </div>
        </form>

        {/* Existing Excuses List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Active Exemption Records ({excuses.length})
          </h4>
          {excuses.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No student exemptions recorded.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {excuses.map(exc => (
                <div
                  key={exc.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{exc.student.full_name}</span>
                      <span className="text-[10px] text-slate-500">({exc.student.batch})</span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Date:</strong> {formatDisplayDate(exc.excuse_date)} •{' '}
                      <span className="text-rose-700 font-medium">{exc.reason}</span>
                    </p>
                    {exc.notes && <p className="text-[11px] text-slate-400 italic">"{exc.notes}"</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteExcuse(exc.id, exc.student.full_name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove exemption"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
