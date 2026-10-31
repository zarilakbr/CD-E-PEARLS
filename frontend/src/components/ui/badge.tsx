import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#12263A] text-white shadow-2xs',
        gold: 'border-transparent bg-[#8A6A2F] text-white shadow-2xs',
        goldLight: 'border-[#D9B877]/40 bg-[#D9B877]/20 text-[#D9B877]',
        waiting: 'border-transparent bg-[#FBEFD5] text-[#7A5410]',
        packed: 'border-transparent bg-[#E1ECF7] text-[#1D4E7A]',
        shipped: 'border-transparent bg-[#DDF1EE] text-[#17625A]',
        completed: 'border-transparent bg-[#E2F1E0] text-[#2B6330]',
        cancelled: 'border-transparent bg-[#EAE8E4] text-[#6E6862]',
        outline: 'border-[#E6DDD0] bg-[#FBF8F3] text-[#12263A]',
        secondary: 'border-transparent bg-[#F4F1EB] text-[#4A5666]',
        destructive: 'border-transparent bg-[#FDE8E8] text-[#9B1C1C]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
