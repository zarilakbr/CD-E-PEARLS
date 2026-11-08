import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWithClientCache,
  getCachedData,
  setCachedData,
  invalidateCacheKey,
  clearAllClientCache,
} from '../lib/clientCache';

describe('Tahap V2c: Client-Side Session Cache & Request Deduplication', () => {
  beforeEach(() => {
    clearAllClientCache();
    vi.clearAllMocks();
  });

  it('1. Deduplikasi: pemanggilan concurrent ke endpoint yang sama hanya memanggil fetcher 1 kali', async () => {
    let callCount = 0;
    const mockFetcher = vi.fn(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { id: 1, name: 'Koleksi Mutiara Air Laut' };
    });

    // Panggil 3 kali secara bersamaan (misal: AuthModal + LoginForm + RegisterForm)
    const [res1, res2, res3] = await Promise.all([
      fetchWithClientCache('test:concurrent', mockFetcher, 60000),
      fetchWithClientCache('test:concurrent', mockFetcher, 60000),
      fetchWithClientCache('test:concurrent', mockFetcher, 60000),
    ]);

    expect(callCount).toBe(1);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(res1).toEqual({ id: 1, name: 'Koleksi Mutiara Air Laut' });
    expect(res2).toEqual(res1);
    expect(res3).toEqual(res1);
  });

  it('2. Client Cache: pemanggilan berulang dalam rentang staleTime mengembalikan data dari cache', async () => {
    const mockFetcher = vi.fn(async () => {
      return [{ id: 10, slug: 'cincin-mutiara', name: 'Cincin Mutiara' }];
    });

    const first = await fetchWithClientCache('categories', mockFetcher, 180000);
    const second = await fetchWithClientCache('categories', mockFetcher, 180000);
    const third = await fetchWithClientCache('categories', mockFetcher, 180000);

    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });

  it('3. Invalidation: mutasi data menghapus cache terkait sehingga fetcher dipanggil ulang', async () => {
    let version = 1;
    const mockFetcher = vi.fn(async () => {
      return { version: version++ };
    });

    const v1 = await fetchWithClientCache('products:all', mockFetcher, 180000);
    expect(v1.version).toBe(1);
    expect(mockFetcher).toHaveBeenCalledTimes(1);

    // Hapus cache produk setelah admin menambah produk
    invalidateCacheKey('products');

    const v2 = await fetchWithClientCache('products:all', mockFetcher, 180000);
    expect(v2.version).toBe(2);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });

  it('4. Stale Time Expiry: data kedaluwarsa setelah melewati durasi staleTime', async () => {
    const mockFetcher = vi.fn(async () => ({ time: Date.now() }));

    await fetchWithClientCache('short-lived', mockFetcher, 10); // 10ms staleTime
    expect(mockFetcher).toHaveBeenCalledTimes(1);

    // Tunggu hingga kedaluwarsa
    await new Promise((r) => setTimeout(r, 25));

    await fetchWithClientCache('short-lived', mockFetcher, 10);
    expect(mockFetcher).toHaveBeenCalledTimes(2);
  });

  it('5. getCachedData & setCachedData beroperasi sesuai kontrak waktu', () => {
    setCachedData('sample:key', { ok: true });
    expect(getCachedData('sample:key', 5000)).toEqual({ ok: true });

    clearAllClientCache();
    expect(getCachedData('sample:key')).toBeNull();
  });
});

