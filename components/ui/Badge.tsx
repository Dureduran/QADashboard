import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: "bg-slate-700 text-slate-100",
    success: "bg-emerald-900/50 text-emerald-300 border border-emerald-800",
    warning: "bg-amber-900/50 text-amber-300 border border-amber-800",
    destructive: "bg-red-900/50 text-red-300 border border-red-800",
    outline: "text-slate-400 border border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};