import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'teal' | 'flat' | 'outline';
  isHoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', isHoverable = false, children, ...props }, ref) => {
    const variants = {
      glass: 'bg-white/80 dark:bg-[#0A2F2F]/80 backdrop-blur-md border border-white/50 dark:border-primary-800/40 shadow-glass rounded-2xl',
      teal: 'bg-[#0D4F4F] text-white border border-[#155D3B]/40 shadow-xl rounded-2xl',
      flat: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl',
      outline: 'bg-transparent border-2 border-slate-200 dark:border-primary-800/60 rounded-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          isHoverable && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-hover',
          'p-5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
