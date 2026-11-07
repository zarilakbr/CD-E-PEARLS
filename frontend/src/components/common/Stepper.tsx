import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  number?: number;
  label: string;
  statusText?: string; // e.g. "Selesai", "Sedang berjalan", "Menunggu"
  date?: string;
  completed?: boolean;
  current?: boolean;
}

interface StepperProps {
  steps: StepItem[];
  trackingNumber?: string;
  courier?: string;
  insuranceNote?: boolean;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  trackingNumber,
  courier,
  insuranceNote = true,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E6DDD0] rounded-2xl p-6 md:p-8 ${className}`}>
      {/* Step Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Connecting bar for desktop */}
        <div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-[2px] bg-[#E6DDD0] -z-0" />

        {steps.map((step, idx) => {
          const stepNumber = step.number ?? idx + 1;
          const isCompleted = step.completed;
          const isCurrent = step.current;

          let circleBg = 'bg-[#EDE6DA] text-[#4A5666] border-[#D9CFBF]';
          let badgeBg = 'bg-[#EDE6DA] text-[#4A5666]';
          let statusLabel = step.statusText || 'Menunggu';

          if (isCompleted && !isCurrent) {
            circleBg = 'bg-[#12263A] text-white border-[#12263A]';
            badgeBg = 'bg-[#E2F1E0] text-[#2B6330]';
            statusLabel = step.statusText || 'Tuntas';
          } else if (isCurrent) {
            circleBg = 'bg-[#D9B877] text-[#12263A] border-[#8A6A2F] ring-4 ring-[#D9B877]/20';
            badgeBg = 'bg-[#E1ECF7] text-[#1D4E7A]';
            statusLabel = step.statusText || 'Sedang berjalan';
          }

          return (
            <div
              key={idx}
              className="flex md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-3 relative z-10"
            >
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all ${circleBg}`}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  stepNumber
                )}
              </div>

              <div className="flex-1 md:flex-initial">
                <h4 className="font-medium text-[#12263A] text-[15px]">{step.label}</h4>
                <div className="flex flex-wrap items-center gap-1.5 md:justify-center mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeBg}`}>
                    {statusLabel}
                  </span>
                  {step.date && (
                    <span className="text-[12px] text-[#4A5666]">{step.date}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courier & Tracking Details */}
      {(trackingNumber || courier) && (
        <div className="mt-8 pt-6 border-t border-[#E6DDD0] grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FBF8F3] p-4 rounded-xl">
          <div>
            <span className="text-[12px] uppercase tracking-[0.16em] text-[#8A6A2F] font-semibold">
              Kurir Pengiriman
            </span>
            <div className="font-medium text-[#12263A] text-[15px] mt-0.5">
              {courier || '[Nama Kurir]'}
            </div>
          </div>
          <div>
            <span className="text-[12px] uppercase tracking-[0.16em] text-[#8A6A2F] font-semibold">
              Nomor Resi
            </span>
            <div className="font-mono text-[#12263A] text-[15px] font-medium mt-0.5 select-all">
              {trackingNumber || '#[Nomor Resi]'}
            </div>
          </div>
        </div>
      )}

      {insuranceNote && (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-[#8A6A2F]">
          <span className="w-2 h-2 rounded-full bg-[#8A6A2F]" />
          <span>Pengiriman berasuransi penuh dengan garansi keamanan hingga ke alamat penerima.</span>
        </div>
      )}
    </div>
  );
};
