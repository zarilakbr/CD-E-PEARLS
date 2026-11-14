import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeStatusType =
  | 'Menunggu Pembayaran'
  | 'Menunggu Verifikasi'
  | 'Lunas & Diproses'
  | 'Dikemas'
  | 'Dikirim'
  | 'Selesai'
  | 'Dibatalkan'
  | 'Aman'
  | 'Menipis'
  | 'Habis'
  | 'Aktif'
  | 'Nonaktif'
  | 'Disetujui'
  | 'Perlu Review'
  | 'Ditolak'
  | string;

interface StatusBadgeProps {
  status: BadgeStatusType;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  let badgeClass = 'badge-status-neutral border border-[var(--neutral-badge-border)]';

  switch (status) {
    case 'Menunggu Pembayaran':
    case 'Menunggu Verifikasi':
    case 'Menipis':
    case 'Perlu Review':
      badgeClass = 'badge-status-warning border border-[var(--warning-border)]';
      break;

    case 'Lunas & Diproses':
    case 'Dikemas':
    case 'Dikirim':
      badgeClass = 'badge-status-info border border-[var(--info-border)]';
      break;

    case 'Selesai':
    case 'Aman':
    case 'Aktif':
    case 'Disetujui':
      badgeClass = 'badge-status-success border border-[var(--success-border)]';
      break;

    case 'Dibatalkan':
    case 'Nonaktif':
      badgeClass = 'badge-status-neutral border border-[var(--neutral-badge-border)]';
      break;

    case 'Habis':
    case 'Ditolak':
      badgeClass = 'badge-status-danger border border-[var(--danger-border)]';
      break;

    default:
      badgeClass = 'badge-status-neutral border border-[var(--neutral-badge-border)]';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[11px] font-medium'
      : 'px-3.5 py-1 text-xs font-semibold';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full tracking-wide select-none',
        badgeClass,
        sizeClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 opacity-80 bg-current shrink-0" />
      {status}
    </span>
  );
};

export default StatusBadge;
