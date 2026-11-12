import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'gray';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40',
    gray: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 uppercase tracking-wider', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
