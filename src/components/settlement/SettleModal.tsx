import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../lib/storage';
import { PopulatedAssignment, Dispatch } from '../../types/database';
import {
  calculateTotalCollected,
  calculateNetCollection,
  calculateOutstandingCalendars,
  formatCurrency,
  formatDisplayDate,
  getLocalDateString
} from '../../lib/calculations';
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Receipt,
  User,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PopulatedAssignment | null;
  parentDispatch: Dispatch | null;
  onSettledSuccess?: () => void;
}

export const SettleModal: React.FC<SettleModalProps> = ({
  isOpen,
  onClose,
  assignment,
  parentDispatch,
  onSettledSuccess
}) => {
  const { refreshData, showToast } = useApp();

  const [cashCollected, setCashCollected] = useState<string>('');
  const [gpayCollected, setGpayCollected] = useState<string>('');
  const [calendarsReturned, setCalendarsReturned] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('0');
  const [settlementDate, setSettlementDate] = useState<string>(getLocalDateString());
  const [notes, setNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const calendarsIssued = assignment?.calendars_issued || 0;

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen && assignment) {
      setCashCollected('');
      setGpayCollected('');
      setCalendarsReturned(String(assignment.calendars_issued || 0));
      setExpenses('0');
      setSettlementDate(getLocalDateString());
      setNotes('');
      setErrorMsg(null);
      setWarningMsg(null);
    }
  }, [isOpen, assignment]);

  // Live Calculations
  const numericCash = parseFloat(cashCollected) || 0;
  const numericGpay = parseFloat(gpayCollected) || 0;
  const numericExpenses = parseFloat(expenses) || 0;
  const numericReturned = parseInt(calendarsReturned) || 0;

  const totalCollected = useMemo(() => {
    return calculateTotalCollected(numericCash, numericGpay);
  }, [numericCash, numericGpay]);

  const netCollection = useMemo(() => {
    return calculateNetCollection(totalCollected, numericExpenses);
  }, [totalCollected, numericExpenses]);

  const outstandingCalendars = useMemo(() => {
    return calculateOutstandingCalendars(calendarsIssued, numericReturned);
  }, [calendarsIssued, numericReturned]);

  // Validation warnings on live inputs
  useEffect(() => {
    if (numericReturned > calendarsIssued) {
      setErrorMsg(`Returned calendars (${numericReturned}) cannot exceed issued quantity (${calendarsIssued}).`);
    } else {
      setErrorMsg(null);
    }

    if (netCollection < 0) {
      setWarningMsg('Warning: Net collection is negative (expenses exceed total collected money).');
    } else if (parentDispatch?.target_amount && numericExpenses > parentDispatch.target_amount) {
      setWarningMsg(`Note: Incurred expenses (${formatCurrency(numericExpenses)}) exceed the campus allowance (${formatCurrency(parentDispatch.target_amount)}).`);
    } else {
      setWarningMsg(null);
    }
  }, [numericReturned, calendarsIssued, netCollection, numericExpenses, parentDispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    if (numericReturned < 0 || !Number.isInteger(numericReturned)) {
      setErrorMsg('Calendars returned must be a non-negative integer.');
      return;
    }

    if (numericReturned > calendarsIssued) {
      setErrorMsg(`Calendars returned cannot exceed ${calendarsIssued}.`);
      return;
    }

    if (numericCash < 0 || numericGpay < 0 || numericExpenses < 0) {
      setErrorMsg('Financial values cannot be negative numbers.');
      return;
    }

    if (netCollection < 0 && !window.confirm('Net collection is negative! Do you still want to authorize this settlement?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await StorageService.createSettlement(
        assignment.id,
        numericCash,
        numericGpay,
        numericReturned,
        numericExpenses,
        settlementDate,
        notes
      );

      showToast(
        `Settlement recorded for ${assignment.student.full_name}: Net ${formatCurrency(netCollection)}.`,
        'success'
      );
      await refreshData();
      if (onSettledSuccess) onSettledSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment || !parentDispatch) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Student Assignment"
      subtitle="Reconcile collection cash, UPI, returned physical calendars, and travel expenses"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Read-Only Context Information Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-slate-400 block font-medium">Student Name:</span>
            <span className="font-bold text-slate-900 text-sm">{assignment.student.full_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Batch:</span>
            <span className="font-semibold text-slate-800">{assignment.student.batch}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Dispatch Type:</span>
            <span className="font-semibold text-purple-700">{parentDispatch.dispatch_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Destination:</span>
            <span className="font-semibold text-slate-800 truncate block">{parentDispatch.destination}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Dispatch Date:</span>
            <span className="font-semibold text-slate-800">{formatDisplayDate(parentDispatch.dispatch_date)}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Calendars Issued:</span>
            <span className="font-extrabold text-skyblue-700 text-sm">{calendarsIssued}</span>
          </div>
          {parentDispatch.target_amount ? (
            <div>
              <span className="text-slate-400 block font-medium">Campus Allowance:</span>
              <span className="font-extrabold text-emerald-700 text-sm">{formatCurrency(parentDispatch.target_amount)}</span>
            </div>
          ) : null}
        </div>

        {/* Error and Warning Banners */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}
        {warningMsg && !errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Financial Inputs: Cash & GPay/UPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Cash Collected (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Physical currency collected.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              GPay / UPI Collected (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={gpayCollected}
                onChange={(e) => setGpayCollected(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Digital QR / UPI transfer.</p>
          </div>
        </div>

        {/* Calendars Returned & Expenses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Physical Calendars Returned <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                max={calendarsIssued}
                required
                value={calendarsReturned}
                onChange={(e) => setCalendarsReturned(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Max allowable: {calendarsIssued} (issued to this student).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Expenses Deducted (₹) <span className="text-slate-400 font-normal">(Auto / food)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Travel, refreshments, or supplies.</p>
          </div>
        </div>

        {/* Live Calculation Preview Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-950 to-slate-900 text-white shadow-md space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Real-Time Calculation Preview
          </p>
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Collected</span>
              <span className="text-base sm:text-lg font-bold text-white">
                {formatCurrency(totalCollected)}
              </span>
              <span className="text-[10px] text-slate-400 block">Cash + GPay</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Net Collection</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                {formatCurrency(netCollection)}
              </span>
              <span className="text-[10px] text-slate-400 block">Total - Expenses</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Outstanding</span>
              <span className="text-base sm:text-lg font-bold text-amber-400">
                {outstandingCalendars}
              </span>
              <span className="text-[10px] text-slate-400 block">Unreturned Calendars</span>
            </div>
          </div>
        </div>

        {/* Settlement Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Settlement Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Settlement Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by coordinator, bill attached"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500"
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
            disabled={isSubmitting || !!errorMsg}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Settlement...' : 'Confirm & Finalize Settlement'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
