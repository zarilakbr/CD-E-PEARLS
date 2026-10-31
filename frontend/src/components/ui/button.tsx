import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6A2F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-[#12263A] text-white shadow-xs hover:bg-[#1A3652] hover:shadow-md hover:-translate-y-0.5',
        secondary:
          'border border-[#12263A] bg-transparent text-[#12263A] hover:bg-[#12263A]/5 hover:shadow-xs hover:-translate-y-0.5',
        gold:
          'bg-[#8A6A2F] text-white shadow-xs hover:bg-[#9E7A36] hover:shadow-md hover:-translate-y-0.5',
        goldLight:
          'bg-[#D9B877] text-[#12263A] font-bold shadow-xs hover:bg-[#e4ca93] hover:shadow-md hover:-translate-y-0.5',
        outline:
          'border border-[#E6DDD0] bg-white text-[#12263A] hover:border-[#12263A] hover:bg-[#F4F1EB] hover:-translate-y-0.5 shadow-2xs',
        ghost:
          'text-[#12263A] hover:bg-[#12263A]/5 hover:text-[#12263A]',
        destructive:
          'bg-red-600 text-white shadow-xs hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5',
      },
      size: {
        default: 'min-h-[44px] px-6 py-2.5 text-xs',
        sm: 'min-h-[36px] px-4 py-1.5 text-[11px]',
        lg: 'min-h-[48px] px-8 py-3 text-sm',
        icon: 'min-h-[44px] w-11 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
