import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { FileText, Download, RefreshCw, AlertCircle } from 'lucide-react';

export interface UseProofBlobUrlOptions {
  src?: string | null;
  orderId?: string | number | null;
  paymentId?: string | number | null;
  proofPath?: string | null;
}

export interface UseProofBlobUrlResult {
  blobUrl: string | null;
  isPdf: boolean;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  contentType: string | null;
}

export function resolveProofEndpoint(options: UseProofBlobUrlOptions): string | null {
  if (options.src && options.src.trim().length > 0) {
    let s = options.src.trim();
    if (s.startsWith('/api/v1/')) {
      s = s.slice('/api/v1'.length);
    }
    return s;
  }
  if (options.orderId != null && options.paymentId != null) {
    return `/orders/${options.orderId}/payments/${options.paymentId}/proof`;
  }
  return null;
}

export function useProofBlobUrl(
  options: UseProofBlobUrlOptions | string | null | undefined
): UseProofBlobUrlResult {
  const opts: UseProofBlobUrlOptions =
    typeof options === 'string' ? { src: options } : options || {};
  const endpoint = resolveProofEndpoint(opts);
  const proofPath = opts.proofPath || opts.src || '';

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  const activeUrlRef = useRef<string | null>(null);

  const retry = useCallback(() => {
    setReloadCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    // Revoke URL dari request sebelumnya bila ada
    if (activeUrlRef.current) {
      try {
        window.URL.revokeObjectURL(activeUrlRef.current);
      } catch {
        // no-op
      }
      activeUrlRef.current = null;
    }

    if (!endpoint) {
      setBlobUrl(null);
      setIsPdf(false);
      setIsLoading(false);
      setError(null);
      setContentType(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(endpoint, { responseType: 'blob' })
      .then((res) => {
        if (!isMounted) return;

        const blob = res.data as Blob;
        const headerType =
          res.headers &&
          (res.headers['content-type'] || res.headers['Content-Type']);
        const type = (
          blob.type ||
          (typeof headerType === 'string' ? headerType : '')
        ).toLowerCase();
        setContentType(type);

        const isPdfDetected =
          type.includes('pdf') ||
          proofPath.toLowerCase().endsWith('.pdf') ||
          endpoint.toLowerCase().endsWith('.pdf');
        setIsPdf(isPdfDetected);

        try {
          const url = window.URL.createObjectURL(blob);
          activeUrlRef.current = url;
          setBlobUrl(url);
        } catch (e: any) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (activeUrlRef.current) {
        try {
          window.URL.revokeObjectURL(activeUrlRef.current);
        } catch {
          // no-op
        }
        activeUrlRef.current = null;
      }
    };
  }, [endpoint, reloadCounter, proofPath]);

  return { blobUrl, isPdf, isLoading, error, retry, contentType };
}

export interface ProofImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  orderId?: string | number | null;
  paymentId?: string | number | null;
  proofPath?: string | null;
  alt?: string;
  className?: string;
  skeletonClassName?: string;
  errorClassName?: string;
  pdfClassName?: string;
  onLoaded?: () => void;
}

export const ProofImage: React.FC<ProofImageProps> = ({
  src,
  orderId,
  paymentId,
  proofPath,
  alt = 'Bukti Transfer Pembayaran',
  className = '',
  skeletonClassName = '',
  errorClassName = '',
  pdfClassName = '',
  onLoaded,
  onClick,
  ...imgProps
}) => {
  const { blobUrl, isPdf, isLoading, error, retry } = useProofBlobUrl({
    src,
    orderId,
    paymentId,
    proofPath,
  });

  if (isLoading) {
    return (
      <div
        data-testid="proof-skeleton"
        className={`flex flex-col items-center justify-center bg-[var(--surface-2)] animate-pulse text-[var(--text-2)] p-4 rounded-lg select-none ${skeletonClassName || className || 'h-36 w-full'}`}
      >
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--text-2)] mb-1" />
        <span className="text-[11px] font-medium text-[var(--text-2)]">Memuat bukti transfer...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="proof-error"
        className={`flex flex-col items-center justify-center p-3 text-center bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg text-[var(--danger-text)] text-xs gap-1.5 ${errorClassName || className || 'h-36 w-full'}`}
      >
        <div className="flex items-center gap-1 font-semibold text-[var(--danger-text)]">
          <AlertCircle className="w-4 h-4 text-[var(--danger-text)] shrink-0" />
          <span>Bukti tidak dapat dimuat</span>
        </div>
        <p className="text-[10px] text-[var(--danger-text)]/90">
          Gagal mengambil berkas transfer atau sesi Anda telah kedaluwarsa.
        </p>
        <button
          type="button"
          data-testid="proof-retry-btn"
          onClick={(e) => {
            e.stopPropagation();
            retry();
          }}
          className="mt-1 px-3 py-1 text-[11px] font-semibold bg-[var(--surface)] border border-[var(--danger-border)] rounded-full shadow-xs hover:bg-[var(--danger-bg)] text-[var(--danger-text)] inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div
        data-testid="proof-pdf"
        className={`flex flex-col items-center justify-center p-4 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg text-[var(--warning-text)] text-xs gap-2 select-none ${pdfClassName || className || 'h-36 w-full'}`}
        onClick={onClick}
      >
        <FileText className="w-8 h-8 text-[#8A6A2F] dark:text-[#D9B877]" />
        <span className="font-semibold text-center text-xs text-[var(--text)]">Berkas Bukti Transfer (PDF)</span>
        {blobUrl && (
          <a
            href={blobUrl}
            download={`bukti-transfer-${orderId || 'pesanan'}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#12263A] dark:bg-[#D9B877] hover:bg-[#1A3652] dark:hover:bg-[#E5C98F] text-white dark:text-[#0B1622] rounded-full text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D9B877] dark:text-[#0B1622]" />
            <span>Unduh Berkas PDF</span>
          </a>
        )}
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div
        data-testid="proof-empty"
        className={`flex items-center justify-center bg-[var(--surface-2)] text-[var(--text-2)] p-4 rounded-lg text-xs ${className || 'h-36 w-full'}`}
      >
        <span>Belum ada berkas bukti transfer</span>
      </div>
    );
  }

  return (
    <img
      data-testid="proof-image"
      src={blobUrl}
      alt={alt}
      className={className}
      onLoad={onLoaded}
      onClick={onClick}
      {...imgProps}
    />
  );
};

export default ProofImage;
