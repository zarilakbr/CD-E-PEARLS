import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  className,
  children,
  ...props
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const onValueChange = controlledOnValueChange || setUncontrolledValue;

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex min-h-[44px] items-center justify-start rounded-full bg-[#F4F1EB] p-1.5 text-[#4A5666] border border-[#E6DDD0]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const isSelected = ctx?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => ctx?.onValueChange(value)}
        className={cn(
          'inline-flex min-h-[36px] items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6A2F] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          isSelected
            ? 'bg-[#12263A] text-white shadow-xs font-bold'
            : 'text-[#4A5666] hover:text-[#12263A] hover:bg-white/60',
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (ctx?.value !== value) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'mt-2 focus-visible:outline-none animate-in fade-in-50 duration-300 slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
