import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../lib/storage';
import { Student } from '../../types/database';
import { User, Layers, Phone, AlertCircle } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const { students, refreshData, showToast } = useApp();
  const [fullName, setFullName] = useState<string>('');
  const [batch, setBatch] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Suggested batches from existing database records
  const existingBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.full_name);
      setBatch(studentToEdit.batch);
      setPhone(studentToEdit.phone_number || '');
    } else {
      setFullName('');
      setBatch(existingBatches[0] || 'Batch 2025-A');
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

    // Check accidental duplicate
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
        showToast(`Student "${trimmedName}" registered successfully.`, 'success');
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
      subtitle="Ensure accurate batch information for field dispatch coordination"
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
              placeholder="e.g. Aisha Rahman"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
          </div>
        </div>

        {/* Batch */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Batch / Academic Cohort <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              list="batch-suggestions"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g. Batch 2025-A"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
            />
            <datalist id="batch-suggestions">
              {existingBatches.map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Select from existing batches or enter a new one.</p>
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
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : studentToEdit ? 'Update Student' : 'Register Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
