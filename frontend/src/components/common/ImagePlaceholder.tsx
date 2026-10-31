import React, { useState } from 'react';

interface ImagePlaceholderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  label?: string;
  aspectRatio?: string;
  shape?: 'rectangle' | 'circle';
  src?: string;
  alt?: string;
}

/**
 * ImagePlaceholder: Menampilkan gambar riil jika src tersedia,
 * dengan fallback elegan ke placeholder abu-krem tanda silang X (#EDE6DA, border #D9CFBF, garis #B9AC96).
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  className = '',
  width,
  height,
  label,
  aspectRatio,
  shape = 'rectangle',
  src,
  alt,
}) => {
  const isCircle = shape === 'circle';
  const [hasError, setHasError] = useState(false);

  // Jika src ada dan tidak error, tampilkan gambar asli
  if (src && !hasError) {
    return (
      <div
        style={{
          width: width !== undefined ? width : undefined,
          height: height !== undefined ? height : undefined,
          aspectRatio: aspectRatio,
        }}
        className={`relative overflow-hidden bg-[#EDE6DA] border border-[#D9CFBF] select-none ${
          isCircle ? 'rounded-full' : 'rounded-xl'
        } ${className}`}
      >
        <img
          src={src}
          alt={alt || label || "CD'E Pearls Luxury"}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label || 'Gambar placeholder (X)'}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        aspectRatio: aspectRatio,
      }}
      className={`relative overflow-hidden bg-[#EDE6DA] border border-[#D9CFBF] select-none flex items-center justify-center ${
        isCircle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
    >
      {/* Diagonal crossing lines (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          stroke="#B9AC96"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="100"
          y1="0"
          x2="0"
          y2="100"
          stroke="#B9AC96"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {label && (
        <span className="relative z-10 px-2 py-1 text-[11px] font-medium tracking-wider text-[#4A5666] bg-[#EDE6DA]/90 border border-[#D9CFBF] rounded-full shadow-xs">
          {label}
        </span>
      )}
    </div>
  );
};
