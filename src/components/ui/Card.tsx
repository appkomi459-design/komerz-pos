import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-zinc-800/80 shadow-sm p-6',
        hover && 'hover:shadow-md hover:border-gray-200 dark:hover:border-zinc-700/80 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={cn('text-lg font-bold text-gray-900 dark:text-zinc-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-gray-500 dark:text-zinc-400 mt-1', className)} {...props}>
      {children}
    </p>
  );
};
