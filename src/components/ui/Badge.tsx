import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'violet' | 'outline';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15',
  secondary: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/10',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15',
  destructive: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15',
  outline: 'bg-white text-slate-600 ring-1 ring-inset ring-slate-900/10',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
