import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { useDashboardSync, type UseDashboardSyncOptions } from '../hooks/useDashboardSync';
import { apiClient } from '../lib/api';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

function SyncTestComponent(props: UseDashboardSyncOptions & { onHook?: (hook: any) => void }) {
  const hook = useDashboardSync(props);
  React.useEffect(() => {
    props.onHook?.(hook);
  }, [hook, props]);
  return <div data-testid="sync-label">{hook.lastSyncLabel}</div>;
}

describe('Tahap V2c: useDashboardSync (Polling Controls, Tab Visibility & Backoff)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.useRealTimers();
  });

  it('1. Hentikan polling saat tab tidak aktif (document.hidden = true)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ status: 304 });

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    await act(async () => {
      root.render(<SyncTestComponent enabled={true} role="admin" />);
    });

    expect(apiClient.get).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(120000);
    });

    expect(apiClient.get).not.toHaveBeenCalled();

    // Tab kembali aktif
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('2. Admin/SPI interval minimal 30 detik: tidak mengirim request sebelum 30 detik', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ status: 304 });

    await act(async () => {
      root.render(<SyncTestComponent enabled={true} role="admin" intervalMs={10000} />);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Di 10 detik belum ada polling kedua (min 30s)
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Di 30 detik baru polling kedua
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('3. Pelanggan interval minimal 60 detik: tidak mengirim request sebelum 60 detik', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ status: 304 });

    await act(async () => {
      root.render(<SyncTestComponent enabled={true} role="customer" intervalMs={10000} />);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Di 30 detik belum ada polling kedua
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Di 60 detik polling kedua berjalan
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('4. Hormati header Retry-After saat menerima HTTP 429', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {
        status: 429,
        headers: { 'retry-after': '90' },
      },
    });

    await act(async () => {
      root.render(<SyncTestComponent enabled={true} role="admin" intervalMs={30000} />);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Pada 30 detik biasa, belum boleh retry karena Retry-After = 90s
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    // Pada 90 detik, polling retry dieksekusi
    vi.mocked(apiClient.get).mockResolvedValueOnce({ status: 304 });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
