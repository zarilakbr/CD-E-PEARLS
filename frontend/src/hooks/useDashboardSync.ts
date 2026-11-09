import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

export interface SyncData {
  role: 'user' | 'admin' | 'spi';
  user_id?: number;
  server_time: string;
  max_updated_at?: string;
  orders_count?: number;
  active_orders_count?: number;
  pending_payment_count?: number;
  latest_order?: {
    id: number | string;
    order_number: string;
    order_status: string;
    payment_status: string;
    tracking_number?: string;
    courier?: string;
    updated_at?: string;
  } | null;
  unread_notifications?: number;
  accounts_count?: number;
  customers_count?: number;
  accounts_version?: string;
  orders_version?: string;
  profile_version?: string;
  total_orders?: number;
  pending_orders?: number;
  processing_orders?: number;
  low_stock_count?: number;
  pending_approvals_count?: number;
  today_revenue?: number;
  orders_by_status?: Record<string, number>;
  latest_audit_id?: number;
}

export interface UseDashboardSyncOptions {
  enabled?: boolean;
  intervalMs?: number;
  role?: 'admin' | 'spi' | 'customer' | 'user';
  onStatusChange?: (newStatus: string, oldStatus?: string, latestOrder?: any) => void;
  onDataUpdated?: (data: SyncData) => void;
}

const MIN_INTERVAL_ADMIN_SPI_MS = 30000; // 30 seconds
const MIN_INTERVAL_CUSTOMER_MS = 60000;  // 60 seconds
const MAX_BACKOFF_MS = 300000;           // 5 minutes

export function useDashboardSync(options: UseDashboardSyncOptions = {}) {
  const {
    enabled = true,
    intervalMs,
    role = 'admin',
    onStatusChange,
    onDataUpdated,
  } = options;

  // Enforce minimum polling interval: 30s (SPI/admin), 60s (customer/user)
  const isCustomerRole = role === 'customer' || role === 'user';
  const minInterval = isCustomerRole ? MIN_INTERVAL_CUSTOMER_MS : MIN_INTERVAL_ADMIN_SPI_MS;
  const envInterval = Number(import.meta.env.VITE_SYNC_INTERVAL_MS);
  const effectiveBaseInterval = envInterval > 0
    ? envInterval
    : Math.max(intervalMs || minInterval, minInterval);

  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const etagRef = useRef<string | null>(null);
  const prevOrderRef = useRef<{ orderNumber?: string; status?: string } | null>(null);
  const backoffCountRef = useRef<number>(0);
  const retryAfterRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isExecutingRef = useRef<boolean>(false);

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onDataUpdatedRef = useRef(onDataUpdated);
  onDataUpdatedRef.current = onDataUpdated;

  // Second ticker to update "diperbarui X detik lalu"
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncTime) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastSyncTime]);

  const executeSync = useCallback(async () => {
    // 1. Guard against disabled sync, hidden tab, or concurrent in-flight requests
    if (!enabled) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isExecutingRef.current) return;

    try {
      isExecutingRef.current = true;
      setIsSyncing(true);

      const headers: Record<string, string> = {};
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }

      const res = await apiClient.get('/sync/status', {
        headers,
        validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
      });

      if (!isMountedRef.current) return;

      // Reset exponential backoff on successful server response
      backoffCountRef.current = 0;
      retryAfterRef.current = null;
      setLastSyncTime(Date.now());
      setSecondsAgo(0);

      if (res.status === 304) {
        // Not modified (0 payload transferred, ETag matched)
        return;
      }

      if (res.status === 200 && res.data?.data) {
        const data: SyncData = res.data.data;
        const newEtag = res.headers?.etag || res.headers?.ETag;
        if (newEtag) {
          etagRef.current = newEtag;
        }

        // Detect status transitions for customer orders
        if (data.latest_order) {
          const currentNum = data.latest_order.order_number;
          const currentStatus = data.latest_order.order_status;

          if (
            prevOrderRef.current &&
            prevOrderRef.current.orderNumber === currentNum &&
            prevOrderRef.current.status !== currentStatus
          ) {
            toast.info(`Status pesanan ${currentNum} kini: ${currentStatus}`, {
              duration: 5000,
            });
            onStatusChangeRef.current?.(currentStatus, prevOrderRef.current.status, data.latest_order);
          }

          prevOrderRef.current = {
            orderNumber: currentNum,
            status: currentStatus,
          };
        }

        setSyncData(data);
        onDataUpdatedRef.current?.(data);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const isRateLimited = err?.response?.status === 429;
      const retryHeader = err?.response?.headers?.['retry-after'] || err?.response?.headers?.['Retry-After'];

      if (retryHeader) {
        const retrySec = parseInt(retryHeader, 10);
        if (!isNaN(retrySec) && retrySec > 0) {
          retryAfterRef.current = Math.min(retrySec * 1000, MAX_BACKOFF_MS);
        }
      }

      // Exponential backoff capped at 5 minutes
      backoffCountRef.current = Math.min(backoffCountRef.current + 1, 6);
      if (isRateLimited) {
        console.warn('[Sync] Rate limited (429), applying backoff/retry-after.');
      }
    } finally {
      isExecutingRef.current = false;
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [enabled]);

  // Polling loop with visibility checking, tab pause, and exponential backoff
  useEffect(() => {
    isMountedRef.current = true;
    let isActive = true;

    const scheduleNext = () => {
      if (!isActive) return;
      // Stop scheduling while tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;

      let computedInterval: number;
      if (retryAfterRef.current !== null) {
        computedInterval = retryAfterRef.current;
        retryAfterRef.current = null;
      } else if (backoffCountRef.current > 0) {
        const backoffMultiplier = Math.pow(2, backoffCountRef.current);
        computedInterval = Math.min(effectiveBaseInterval * backoffMultiplier, MAX_BACKOFF_MS);
      } else {
        computedInterval = effectiveBaseInterval;
      }

      timerRef.current = setTimeout(async () => {
        await executeSync();
        scheduleNext();
      }, computedInterval);
    };

    // Run initial sync and then schedule subsequent poll
    const runInitialSync = async () => {
      await executeSync();
      scheduleNext();
    };

    if (typeof document === 'undefined' || !document.hidden) {
      runInitialSync();
    }

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        // Tab went to background: cancel any pending timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Tab brought to foreground: immediately trigger fresh sync and restart schedule
        runInitialSync();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isActive = false;
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [executeSync, effectiveBaseInterval]);

  const lastSyncLabel = secondsAgo <= 2 ? 'Baru saja' : `Diperbarui ${secondsAgo} detik lalu`;

  return {
    syncData,
    lastSyncTime,
    secondsAgo,
    lastSyncLabel,
    isSyncing,
    refetch: executeSync,
  };
}
