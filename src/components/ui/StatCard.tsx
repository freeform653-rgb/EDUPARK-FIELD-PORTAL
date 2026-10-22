import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'navy' | 'skyblue' | 'emerald' | 'amber' | 'rose' | 'slate';
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subtext,
  icon: Icon,
  variant = 'navy',
  tooltip
}) => {
  const variantStyles = {
    navy: {
      card: 'border-slate-200 hover:border-navy-300',
      iconBg: 'bg-navy-50 text-navy-800',
      badge: 'bg-navy-50 text-navy-800 border-navy-200',
    },
    skyblue: {
      card: 'border-slate-200 hover:border-skyblue-300',
      iconBg: 'bg-skyblue-50 text-skyblue-700',
      badge: 'bg-skyblue-50 text-skyblue-700 border-skyblue-200',
    },
    emerald: {
      card: 'border-slate-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      card: 'border-slate-200 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    rose: {
      card: 'border-slate-200 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-700',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    slate: {
      card: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      title={tooltip}
      className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between ${style.card}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
            {subValue && (
              <span className="text-xs font-medium text-slate-500">
                {subValue}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg} shadow-xs shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtext && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
