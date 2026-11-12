import React from 'react';
import { cn } from '@/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 transition-all duration-150',
            'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 cursor-pointer',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            props.disabled && 'opacity-60 bg-gray-50 dark:bg-zinc-800/40 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-zinc-900 py-1">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
