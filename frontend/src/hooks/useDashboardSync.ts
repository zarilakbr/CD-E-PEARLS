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
  onStatusChange?: (newStatus: string, oldStatus?: string, latestOrder?: any) => void;
  onDataUpdated?: (data: SyncData) => void;
}

const DEFAULT_POLL_INTERVAL_MS = 10000; // 10 seconds

export function useDashboardSync(options: UseDashboardSyncOptions = {}) {
  const {
    enabled = true,
    intervalMs = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || DEFAULT_POLL_INTERVAL_MS,
    onStatusChange,
    onDataUpdated,
  } = options;

  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const etagRef = useRef<string | null>(null);
  const prevOrderRef = useRef<{ orderNumber?: string; status?: string } | null>(null);
  const backoffCountRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Second ticker to update "diperbarui X detik lalu"
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncTime) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastSyncTime]);

  const executeSync = useCallback(async () => {
    if (!enabled || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
      return;
    }

    try {
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

      // Reset backoff on successful server response
      backoffCountRef.current = 0;
      setLastSyncTime(Date.now());
      setSecondsAgo(0);

      if (res.status === 304) {
        // Not modified (0 payload transferred)
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
            onStatusChange?.(currentStatus, prevOrderRef.current.status, data.latest_order);
          }

          prevOrderRef.current = {
            orderNumber: currentNum,
            status: currentStatus,
          };
        }

        setSyncData(data);
        onDataUpdated?.(data);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      // Exponential backoff up to 60 seconds on rate limit (429) or network failure
      const isRateLimited = err?.response?.status === 429;
      backoffCountRef.current = Math.min(backoffCountRef.current + 1, 5);
      if (isRateLimited) {
        console.warn('[Sync] Rate limited, applying backoff multiplier.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [enabled, onStatusChange, onDataUpdated]);

  // Polling loop with visibility checking and backoff
  useEffect(() => {
    isMountedRef.current = true;
    let isActive = true;

    const scheduleNext = () => {
      if (!isActive) return;
      const backoffMultiplier = Math.pow(1.5, backoffCountRef.current);
      const computedInterval = Math.min(intervalMs * backoffMultiplier, 60000);

      timerRef.current = setTimeout(async () => {
        await executeSync();
        scheduleNext();
      }, computedInterval);
    };

    // Run initial sync
    executeSync();
    scheduleNext();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab brought to foreground: immediately trigger fresh sync
        executeSync();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isActive = false;
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [executeSync, intervalMs]);

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

