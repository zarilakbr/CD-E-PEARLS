import React from 'react';
import { cn } from '../../lib/utils';

export interface BouncingDotsLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'navy' | 'lightGold' | 'white';
  label?: string;
}

export const BouncingDotsLoader: React.FC<BouncingDotsLoaderProps> = ({
  size = 'md',
  variant = 'gold',
  label,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const dotColorClasses = {
    gold: 'bg-[#8A6A2F] shadow-[0_0_8px_rgba(138,106,47,0.35)]',
    navy: 'bg-[#12263A] shadow-[0_0_8px_rgba(18,38,58,0.25)]',
    lightGold: 'bg-[#D9B877] shadow-[0_0_10px_rgba(217,184,119,0.5)]',
    white: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-2', className)}
      {...props}
    >
      <div className="flex space-x-2 justify-center items-center h-8">
        <span className="sr-only">{label || 'Memuat data...'}</span>
        <div
          className={cn(
            sizeClasses[size],
            dotColorClasses[variant],
            'rounded-full animate-bounce [animation-delay:-0.3s]'
          )}
        />
        <div
          className={cn(
            sizeClasses[size],
            dotColorClasses[variant],
            'rounded-full animate-bounce [animation-delay:-0.15s]'
          )}
        />
        <div
          className={cn(
            sizeClasses[size],
            dotColorClasses[variant],
            'rounded-full animate-bounce'
          )}
        />
      </div>

      {label && (
        <span className="text-xs font-medium tracking-wider text-[#4A5666] animate-pulse font-sans">
          {label}
        </span>
      )}
    </div>
  );
};

