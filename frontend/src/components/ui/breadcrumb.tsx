import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItemData {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItemData[];
  separator?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  className,
  children,
  ...props
}) => {
  const defaultSeparator = separator || (
    <ChevronRight className="w-3.5 h-3.5 text-[#B9AC96] shrink-0 rtl:rotate-180" />
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('w-full select-none py-2', className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-[13px] text-[#4A5666]">
        {items ? (
          items.map((item, index) => {
            const isLast = index === items.length - 1 || item.isCurrent;
            return (
              <React.Fragment key={index}>
                <li className="inline-flex items-center">
                  {isLast ? (
                    <span
                      aria-current="page"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#12263A]"
                    >
                      {item.icon}
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDE6DA] text-[#8A6A2F] border border-[#D9CFBF]">
                          {item.badge}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-[#8A6A2F] font-medium cursor-pointer"
                    >
                      {item.icon}
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4F1EB] text-[#4A5666] border border-[#E6DDD0]">
                          {item.badge}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  )}
                </li>

                {!isLast && (
                  <li aria-hidden="true" className="shrink-0 flex items-center">
                    {defaultSeparator}
                  </li>
                )}
              </React.Fragment>
            );
          })
        ) : (
          children
        )}
      </ol>
    </nav>
  );
};

export const BreadcrumbItem = ({
  className,
  children,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn('inline-flex items-center gap-1.5', className)} {...props}>
    {children}
  </li>
);

export const BreadcrumbLink = ({
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    className={cn(
      'inline-flex items-center gap-1.5 transition-colors hover:text-[#8A6A2F] font-medium text-[#4A5666] cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </a>
);

export const BreadcrumbPage = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-current="page"
    className={cn('inline-flex items-center gap-1.5 font-semibold text-[#12263A]', className)}
    {...props}
  >
    {children}
  </span>
);

export const BreadcrumbSeparator = ({
  className,
  children,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li
    aria-hidden="true"
    className={cn('shrink-0 flex items-center text-[#B9AC96]', className)}
    {...props}
  >
    {children || <ChevronRight className="w-3.5 h-3.5" />}
  </li>
);

