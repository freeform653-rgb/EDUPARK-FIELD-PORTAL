import React from 'react';
import { Modal } from '../ui/Modal';
import { PopulatedSettlement } from '../../types/database';
import { formatCurrency, formatDisplayDate } from '../../lib/calculations';
import { Printer, GraduationCap, CheckCircle2 } from 'lucide-react';

interface SettlementReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: PopulatedSettlement | null;
}

export const SettlementReceiptModal: React.FC<SettlementReceiptModalProps> = ({
  isOpen,
  onClose,
  settlement,
}) => {
  if (!settlement) return null;

  const handlePrint = () => {
    window.print();
  };

  const outstandingCalendars = Math.max(
    0,
    (settlement.assignment.calendars_issued || 0) - (settlement.calendars_returned || 0)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settlement Receipt"
      subtitle={`Receipt ID: ${settlement.id}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Printable Receipt Paper */}
        <div className="border border-slate-300 rounded-2xl p-6 bg-white shadow-xs space-y-5 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Edupark Field Portal</h3>
                <p className="text-[11px] text-slate-500">Official Donation Settlement Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SETTLED</span>
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{settlement.id}</p>
            </div>
          </div>

          {/* Student & Field Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Student Name</p>
              <p className="font-bold text-slate-900 text-sm">{settlement.student.full_name}</p>
              <p className="text-slate-500">{settlement.student.batch}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Field Destination</p>
              <p className="font-semibold text-slate-900">{settlement.dispatch.destination}</p>
              <p className="text-slate-500">Type: {settlement.dispatch.dispatch_type}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Dispatch Date</p>
              <p className="font-medium text-slate-800">{formatDisplayDate(settlement.dispatch.dispatch_date)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Settlement Date</p>
              <p className="font-medium text-slate-800">{formatDisplayDate(settlement.settlement_date)}</p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200">
              Collection Breakdown
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-3.5 py-2.5 flex justify-between items-center">
                <span className="text-slate-600">Cash Collections</span>
                <span className="font-mono font-semibold text-slate-900">{formatCurrency(settlement.cash_amount)}</span>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between items-center">
                <span className="text-slate-600">GPay / UPI Collections</span>
                <span className="font-mono font-semibold text-slate-900">{formatCurrency(settlement.gpay_amount)}</span>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between items-center bg-slate-50/50">
                <span className="font-semibold text-slate-800">Gross Total Collected</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(settlement.total_collected)}</span>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between items-center text-rose-700">
                <span>Deducted Expenses</span>
                <span className="font-mono font-semibold">- {formatCurrency(settlement.expenses)}</span>
              </div>
              <div className="px-3.5 py-3 flex justify-between items-center bg-emerald-50 text-emerald-900 font-bold text-sm">
                <span>Net Collection Deposited</span>
                <span className="font-mono text-base text-emerald-700">{formatCurrency(settlement.net_collection)}</span>
              </div>
            </div>
          </div>

          {/* Physical Calendar Reconciliation */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
            <p className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider">
              Physical Calendar Reconciliation
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Issued</span>
                <span className="font-bold text-slate-900">{settlement.assignment.calendars_issued}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Returned</span>
                <span className="font-bold text-emerald-600">{settlement.calendars_returned}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Distributed/Outstanding</span>
                <span className="font-bold text-amber-600">{outstandingCalendars}</span>
              </div>
            </div>
          </div>

          {settlement.notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold">Notes:</span> {settlement.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
              <span>Student Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-300 w-32 mx-auto mb-1"></div>
              <span>Authorized Admin Sign</span>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-black shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
