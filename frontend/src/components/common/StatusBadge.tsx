import React from 'react';

export type BadgeStatusType =
  | 'Menunggu Pembayaran'
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
  let bg = '#EAE8E4';
  let text = '#6E6862';

  switch (status) {
    case 'Menunggu Pembayaran':
    case 'Menipis':
    case 'Perlu Review':
      bg = '#FBEFD5';
      text = '#7A5410';
      break;

    case 'Dikemas':
      bg = '#E1ECF7';
      text = '#1D4E7A';
      break;

    case 'Dikirim':
      bg = '#DDF1EE';
      text = '#17625A';
      break;

    case 'Selesai':
    case 'Aman':
    case 'Aktif':
    case 'Disetujui':
      bg = '#E2F1E0';
      text = '#2B6330';
      break;

    case 'Dibatalkan':
    case 'Nonaktif':
      bg = '#EAE8E4';
      text = '#6E6862';
      break;

    case 'Habis':
    case 'Ditolak':
      bg = '#FDE8E8';
      text = '#9B1C1C';
      break;

    default:
      bg = '#EDE6DA';
      text = '#4A5666';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-[11px] font-medium'
      : 'px-3.5 py-1 text-xs font-semibold';

  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className={`inline-flex items-center justify-center rounded-full tracking-wide select-none ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 opacity-80" style={{ backgroundColor: text }} />
      {status}
    </span>
  );
};
