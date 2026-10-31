import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'circle' | 'pill';
}

/**
 * Skeleton Loader untuk CD'E Pearls.
 * Mengikuti nuansa mutiara: latar abu-krem #EDE6DA, border #D9CFBF halus,
 * dengan efek denyut shimmer (animate-pulse) yang tenang.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const variantClasses = {
    default: 'rounded-lg bg-[#EDE6DA]',
    card: 'rounded-2xl bg-white border border-[#E6DDD0] p-5 shadow-2xs',
    circle: 'rounded-full bg-[#EDE6DA]',
    pill: 'rounded-full bg-[#EDE6DA]',
  };

  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse', variantClasses[variant], className)}
      {...props}
    />
  );
};

/**
 * Skeleton khusus Kartu Produk CD'E Pearls (240-260px image + metadata + button)
 */
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-white border border-[#E6DDD0] rounded-2xl p-4 lg:p-5 flex flex-col justify-between animate-pulse',
        className
      )}
    >
      <div>
        {/* Gambar placeholder 240px */}
        <div className="w-full h-[240px] sm:h-[260px] rounded-xl bg-[#EDE6DA] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>

        {/* Kategori & Judul */}
        <div className="mt-4 space-y-2">
          <div className="h-3 w-20 rounded-full bg-[#EDE6DA]" />
          <div className="h-5 w-3/4 rounded-lg bg-[#EDE6DA]" />
          <div className="h-3.5 w-1/2 rounded-full bg-[#EDE6DA]/70" />
        </div>
      </div>

      {/* Harga & Tombol Pil */}
      <div className="mt-6 pt-3 border-t border-[#E6DDD0]/70 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="h-2.5 w-10 rounded-full bg-[#EDE6DA]" />
          <div className="h-5 w-24 rounded-lg bg-[#EDE6DA]" />
        </div>
        <div className="h-10 w-28 rounded-full bg-[#EDE6DA]" />
      </div>
    </div>
  );
};

/**
 * Skeleton Baris Tabel (Data Table Row Skeleton)
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-[#E6DDD0] animate-pulse">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-4 px-4">
          <div className="h-4 rounded-full bg-[#EDE6DA]" style={{ width: `${60 + (idx % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
};

