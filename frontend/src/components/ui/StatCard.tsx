import React from 'react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  subtitle,
  className,
  badge
}) => {
  return (
    <div className={cn("bg-white border border-slate-200/90 rounded-lg p-5 shadow-card hover:border-slate-300 transition-colors", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-700">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge}
      </div>
      {(change || subtitle) && (
        <div className="mt-2 flex items-center text-xs">
          {change && (
            <span
              className={cn(
                "font-semibold mr-1.5",
                isPositive === true ? "text-emerald-600" : isPositive === false ? "text-rose-600" : "text-slate-600"
              )}
            >
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
