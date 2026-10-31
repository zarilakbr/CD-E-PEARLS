import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
  trend = 'neutral',
  deltaPercent,
  sparklineData = [20, 32, 28, 45, 40, 60, 75],
  className = '',
}) => {
  // Count-up display
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Generate SVG path from sparklineData points
  const points = sparklineData.length > 0 ? sparklineData : [10, 25, 20, 38, 30, 50, 65];
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
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
      className={`relative overflow-hidden bg-white/95 backdrop-blur-sm border border-[#E6DDD0] rounded-2xl p-5 lg:p-6 transition-all duration-300 hover:border-[#D9B877] hover:shadow-lg hover:shadow-[#D9B877]/10 flex flex-col justify-between group ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F]">
          {label}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4F1EB] to-[#EAE3D2] border border-[#D9B877]/40 text-[#8A6A2F] flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      {/* Main Value & Sparkline */}
      <div className="flex items-baseline justify-between my-1">
        <div className="font-['Cormorant_Garamond',serif] text-3xl lg:text-4xl font-bold text-[#12263A] tracking-tight transition-colors group-hover:text-[#8A6A2F]">
          {displayValue}
        </div>

        {/* Subtle Luxury Sparkline */}
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
      </div>

      {/* Delta pill & note */}
      {(note || deltaPercent !== undefined) && (
        <div className="mt-2.5 pt-2 border-t border-[#F4F1EB] flex items-center justify-between text-xs">
          {deltaPercent !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : trend === 'down'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{deltaPercent}%</span>
            </span>
          )}

          {note && (
            <span className="text-[12px] text-[#4A5666] truncate ml-auto">
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
