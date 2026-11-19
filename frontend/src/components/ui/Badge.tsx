import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'emerald' | 'sky' | 'amber' | 'rose' | 'slate' | 'teal';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | 'auto';
  statusText?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'slate',
  statusText,
  ...props
}) => {
  let activeVariant: BadgeVariant = variant === 'auto' ? 'slate' : variant;
  
  if (variant === 'auto' || statusText) {
    const text = (statusText || (typeof children === 'string' ? children : '')).toUpperCase();
    if (['AVAILABLE', 'PAID', 'PRESENT', 'APPROVED', 'SUCCESS', 'ACTIVE', 'RESOLVED', 'CLOSED', 'AUTHENTIC'].includes(text)) {
      activeVariant = 'emerald';
    } else if (['OCCUPIED', 'IN_PROGRESS', 'PARTIALLY_PAID', 'CHECKED_OUT', 'CHECKED_IN'].includes(text)) {
      activeVariant = 'sky';
    } else if (['PENDING', 'LATE_ENTRY', 'WAITING'].includes(text)) {
      activeVariant = 'amber';
    } else if (['MAINTENANCE', 'OVERDUE', 'ABSENT', 'REJECTED', 'FAILED', 'HIGH', 'EMERGENCY', 'SUSPENDED', 'INVALID'].includes(text)) {
      activeVariant = 'rose';
    } else {
      activeVariant = 'slate';
    }
  }

  const variantClasses: Record<BadgeVariant, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    sky: "bg-sky-50 text-sky-700 border-sky-200/80",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80",
    rose: "bg-rose-50 text-rose-700 border-rose-200/80",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    teal: "bg-teal-50 text-teal-800 border-teal-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        variantClasses[activeVariant],
        className
      )}
      {...props}
    >
      {children || statusText}
    </span>
  );
};
