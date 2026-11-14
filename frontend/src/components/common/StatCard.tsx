import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  deltaPercent?: string | number;
  sparklineData?: number[];
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  note,
  icon,
  trend,
  deltaPercent,
  sparklineData,
  className = '',
}) => {
  // Count-up display
  const [displayValue, setDisplayValue] = useState<string | number>(value ?? 0);

  useEffect(() => {
    setDisplayValue(value ?? 0);
  }, [value]);

  // Generate SVG path from sparklineData points (hanya bila data riil ada)
  const hasSparkline = Array.isArray(sparklineData) && sparklineData.length >= 2;
  const points = hasSparkline ? sparklineData : [];
  const minVal = points.length > 0 ? Math.min(...points) : 0;
  const maxVal = points.length > 0 ? Math.max(...points) : 1;
  const range = maxVal - minVal || 1;
  const width = 80;
  const height = 28;

  const pathCoordinates = points
    .map((pt, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((pt - minVal) / range) * (height - 6) - 3;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--surface)]/95 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 hover:border-[#D9B877] hover:shadow-lg hover:shadow-[#D9B877]/10 flex flex-col justify-between group',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
          {label}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[#D9B877]/40 text-[#8A6A2F] dark:text-[#D9B877] flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      {/* Main Value & Sparkline */}
      <div className="flex items-baseline justify-between my-1">
        <div className="font-serif text-3xl lg:text-4xl font-bold text-[var(--text)] tracking-tight transition-colors group-hover:text-[#8A6A2F] dark:group-hover:text-[#D9B877]">
          {displayValue}
        </div>

        {/* Subtle Luxury Sparkline (hanya jika data riil tersedia) */}
        {hasSparkline && (
          <div className="w-20 h-7 opacity-75 group-hover:opacity-100 transition-opacity">
            <svg width={width} height={height} className="overflow-visible">
              <path
                d={pathCoordinates}
                fill="none"
                stroke="#D9B877"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last dot */}
              {points.length > 0 && (
                <circle
                  cx={width}
                  cy={height - ((points[points.length - 1] - minVal) / range) * (height - 6) - 3}
                  r="3"
                  fill="#8A6A2F"
                />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Delta pill & note */}
      {(note || deltaPercent !== undefined) && (
        <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
          {deltaPercent !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                trend === 'up' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                trend === 'down' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                (!trend || trend === 'neutral') && 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]'
              )}
            >
              {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{deltaPercent}%</span>
            </span>
          )}

          {note && (
            <span className="text-[12px] text-[var(--text-2)] truncate ml-auto">
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
