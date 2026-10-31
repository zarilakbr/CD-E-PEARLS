import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#12263A]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => onOpenChange(false)}
      />
      {/* Content Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E6DDD0] bg-white p-6 sm:p-8 shadow-2xl text-[#12263A] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-5 top-5 rounded-full p-2 text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A] transition-colors cursor-pointer"
        >
          <X size={20} />
          <span className="sr-only">Tutup</span>
        </button>
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left border-b border-[#E6DDD0] pb-4 mb-5',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'font-serif text-2xl font-medium leading-snug tracking-tight text-[#12263A]',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-[#4A5666] leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-5 border-t border-[#E6DDD0] mt-6 gap-2 sm:gap-0',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
