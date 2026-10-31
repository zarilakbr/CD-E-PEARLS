import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-[44px] w-full rounded-full border border-[#E6DDD0] bg-[#F4F1EB] px-5 py-2.5 text-xs text-[#12263A] placeholder:text-[#4A5666]/60 focus-visible:outline-none focus-visible:border-[#12263A] focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#12263A] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
