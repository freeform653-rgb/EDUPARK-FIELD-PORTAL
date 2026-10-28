import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService, STANDARD_BATCHES } from '../../lib/storage';
import { Student } from '../../types/database';
import { User, Layers, Phone, AlertCircle, Trash2 } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
  onDeleteStudent?: (student: Student) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onDeleteStudent,
}) => {
  const { students, refreshData, showToast } = useApp();
  const [fullName, setFullName] = useState<string>('');
  const [batch, setBatch] = useState<string>(STANDARD_BATCHES[0]);
  const [phone, setPhone] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available batches list prioritizing standard batches: plus one A, plus one B, Batch 13
  const availableBatches = Array.from(
    new Set([...STANDARD_BATCHES, ...students.map(s => s.batch).filter(Boolean)])
  );

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.full_name);
      setBatch(studentToEdit.batch);
      setPhone(studentToEdit.phone_number || '');
    } else {
      setFullName('');
      setBatch(STANDARD_BATCHES[0]);
      setPhone('');
    }
    setErrorMsg(null);
  }, [studentToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedBatch = batch.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!trimmedBatch) {
      setErrorMsg('Batch is required.');
      return;
    }

    const isDuplicate = students.some(
      s =>
        s.full_name.toLowerCase() === trimmedName.toLowerCase() &&
        s.batch.toLowerCase() === trimmedBatch.toLowerCase() &&
        s.id !== studentToEdit?.id
    );

    if (isDuplicate) {
      setErrorMsg(`A student named "${trimmedName}" is already registered in ${trimmedBatch}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (studentToEdit) {
        await StorageService.updateStudent(studentToEdit.id, trimmedName, trimmedBatch, trimmedPhone || undefined);
        showToast(`Student "${trimmedName}" updated successfully.`, 'success');
      } else {
        await StorageService.addStudent(trimmedName, trimmedBatch, trimmedPhone || undefined);
        showToast(`Student "${trimmedName}" registered in ${trimmedBatch} successfully.`, 'success');
      }
      await refreshData();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? 'Edit Student Details' : 'Register New Student'}
      subtitle="Select academic batch (10 standard cohorts available)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Muhammed Bilal"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
          </div>
        </div>

        {/* Batch Selection Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Academic Batch / Cohort <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
            <select
              required
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all cursor-pointer"
            >
              <option value="" disabled>-- Select academic batch --</option>
              {availableBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Quick Click Badges for Standard Batches */}
          <div className="mt-2.5">
            <span className="text-[11px] text-slate-500 font-medium block mb-1">Quick select:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STANDARD_BATCHES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBatch(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    batch === b
                      ? 'bg-skyblue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
          <div>
            {studentToEdit && onDeleteStudent && (
              <button
                type="button"
                onClick={() => onDeleteStudent(studentToEdit)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Student</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : studentToEdit ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
