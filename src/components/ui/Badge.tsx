import React from 'react';
import { StudentStatus, DispatchStatus, DispatchType } from '../../types/database';

export const StudentStatusBadge: React.FC<{ status?: StudentStatus }> = ({ status = 'Available' }) => {
  const styles: Record<StudentStatus, string> = {
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
    'Settlement Pending': 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    Excused: 'bg-rose-50 text-rose-700 border-rose-200',
    Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const dots: Record<StudentStatus, string> = {
    Available: 'bg-emerald-500',
    Dispatched: 'bg-amber-500 animate-pulse',
    'Settlement Pending': 'bg-amber-600',
    Excused: 'bg-rose-500',
    Inactive: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Available}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.Available}`} />
      {status}
    </span>
  );
};

export const DispatchStatusBadge: React.FC<{ status: DispatchStatus; detailText?: string }> = ({
  status,
  detailText
}) => {
  const styles: Record<DispatchStatus, string> = {
    Dispatched: 'bg-amber-50 text-amber-800 border-amber-200',
    'Settlement Pending': 'bg-sky-50 text-sky-800 border-sky-200',
    Settled: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[status]}`}
    >
      <span>{status}</span>
      {detailText && (
        <span className="text-[10px] font-normal opacity-80 border-l pl-1.5 border-current">
          {detailText}
        </span>
      )}
    </span>
  );
};

export const DispatchTypeBadge: React.FC<{ type: DispatchType }> = ({ type }) => {
  const isTeam = type === 'Team';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
        isTeam
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}
    >
      {type}
    </span>
  );
};
