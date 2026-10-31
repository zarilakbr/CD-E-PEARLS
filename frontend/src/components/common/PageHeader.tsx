import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  badge,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[32px] md:text-[38px] font-semibold text-[#12263A] tracking-tight leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-[15px] text-[#4A5666] font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
