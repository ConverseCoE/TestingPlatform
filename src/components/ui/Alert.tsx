import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
}

const alertVariants: Record<
  NonNullable<AlertProps['variant']>,
  { container: string; icon: React.ReactNode }
> = {
  info: {
    container: 'bg-blue-50/80 text-blue-900 ring-blue-600/15',
    icon: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
  },
  success: {
    container: 'bg-emerald-50/80 text-emerald-900 ring-emerald-600/15',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
  },
  warning: {
    container: 'bg-amber-50/80 text-amber-900 ring-amber-600/15',
    icon: <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
  },
  destructive: {
    container: 'bg-rose-50/80 text-rose-900 ring-rose-600/15',
    icon: <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
  },
};

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  const cfg = alertVariants[variant];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl p-3.5 text-sm shadow-sm ring-1 ring-inset',
        cfg.container,
        className
      )}
      {...props}
    >
      {cfg.icon}
      <div className="flex-1 space-y-0.5">
        {title && <div className="font-semibold leading-snug">{title}</div>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
