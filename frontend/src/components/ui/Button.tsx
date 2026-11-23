import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'teal';
  size?: 'sm' | 'md' | 'lg' | 'pill';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg shadow-primary-500/20',
      secondary: 'bg-primary-800 text-white hover:bg-primary-900 border border-primary-700 shadow-sm',
      outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40',
      ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-primary-900/40',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
      glass: 'bg-white/70 hover:bg-white/90 text-primary-900 border border-white/50 backdrop-blur-md shadow-sm',
      teal: 'bg-[#0D4F4F] hover:bg-[#0A3A3A] text-white border border-[#155D3B] shadow-md',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2 rounded-xl gap-2',
      lg: 'text-base px-6 py-2.5 rounded-2xl gap-2.5',
      pill: 'text-xs px-5 py-2 rounded-full gap-2 uppercase tracking-wider font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
