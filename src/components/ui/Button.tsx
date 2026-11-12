import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 focus:ring-emerald-500 border border-emerald-600/30',
    secondary:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/50 dark:border-emerald-800/50 focus:ring-emerald-500',
    outline:
      'bg-transparent border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:ring-emerald-500',
    ghost:
      'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 focus:ring-gray-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 focus:ring-rose-500 border border-rose-600/30',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
