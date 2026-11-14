import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  pagination?: React.ReactNode;
  title?: string;
  actionControl?: React.ReactNode;
  showDensityToggle?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  children,
  className = '',
  pagination,
  title,
  actionControl,
  showDensityToggle = true,
}) => {
  const [isCompact, setIsCompact] = useState(false);

  return (
    <div
      className={cn(
        'w-full max-w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm text-[var(--text)]',
        className
      )}
    >
      {/* Table Toolbar if title or actions provided */}
      {(title || actionControl || showDensityToggle) && (
        <div className="px-4 sm:px-6 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h3 className="font-serif text-base font-semibold text-[var(--text)]">
              {title}
            </h3>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {actionControl}

            {showDensityToggle && (
              <button
                type="button"
                onClick={() => setIsCompact(!isCompact)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Alihkan kepadatan tabel (kompak / normal)"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#8A6A2F] dark:text-[#D9B877]" />
                <span className="text-[11px]">{isCompact ? 'Kompak' : 'Nyaman'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden px-3.5 py-1.5 text-[11px] text-[var(--text-2)] bg-[var(--surface-2)]/80 border-b border-[var(--border)] flex items-center justify-between select-none">
        <span>Geser horizontal untuk kolom lengkap</span>
        <span className="text-xs opacity-75 font-semibold">➔</span>
      </div>

      {/* Sticky Table Body Container */}
      <div className="w-full overflow-x-auto max-h-[640px] custom-scrollbar">
        <table
          className={cn(
            'w-full text-left border-collapse',
            isCompact
              ? 'text-[12px] [&_td]:py-2.5 [&_th]:py-2.5'
              : 'text-[13px] [&_td]:py-3.5 [&_th]:py-3.5',
            '[&_tr]:transition-colors [&_tbody_tr:hover]:bg-[var(--surface-2)]/70',
            '[&_th]:sticky [&_th]:top-0 [&_th]:bg-[var(--surface-muted)] [&_th]:z-10 [&_th]:font-semibold [&_th]:text-[var(--text)] [&_th]:border-b [&_th]:border-[var(--border)]',
            '[&_td]:border-b [&_td]:border-[var(--border-muted)]'
          )}
        >
          {children}
        </table>
      </div>

      {pagination && (
        <div className="border-t border-[var(--border)] px-4 sm:px-6 py-3.5 bg-[var(--surface-2)]/60 flex items-center justify-between text-xs text-[var(--text-2)]">
          {pagination}
        </div>
      )}
    </div>
  );
};

export default DataTable;
