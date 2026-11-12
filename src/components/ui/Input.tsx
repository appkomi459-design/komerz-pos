import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 transition-all duration-150',
              'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
              icon ? 'pl-10 pr-4' : 'px-4',
              'py-2.5',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              props.disabled && 'opacity-60 bg-gray-50 dark:bg-zinc-800/40 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
