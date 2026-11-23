import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-sky-100 text-sky-800 border-sky-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    teal: 'bg-[#0D4F4F]/20 text-[#0D4F4F] dark:text-primary-300 border-[#0D4F4F]/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold rounded-full uppercase tracking-wider',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full',
  };

  return (
    <span
      className={cn('inline-flex items-center justify-center border font-medium', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
