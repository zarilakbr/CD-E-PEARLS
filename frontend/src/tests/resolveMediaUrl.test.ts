import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveMediaUrl, resolveWebpUrl, getApiOrigin } from '../lib/media';

describe('resolveMediaUrl helper', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    import.meta.env.VITE_API_URL = originalEnv.VITE_API_URL;
  });

  it('1. path relatif /storage/ diubah menjadi URL absolut berbasis origin API', () => {
    import.meta.env.VITE_API_URL = 'https://api.cdepearlslombok.id/api/v1';
    const result = resolveMediaUrl('/storage/products/baroque-ring.png');
    expect(result).toBe('https://api.cdepearlslombok.id/storage/products/baroque-ring.png');
  });

  it('2. path relatif storage/ tanpa garis miring awal juga ditangani dengan benar', () => {
    import.meta.env.VITE_API_URL = 'https://api.cdepearlslombok.id/api/v1';
    const result = resolveMediaUrl('storage/products/golden-necklace.jpg');
    expect(result).toBe('https://api.cdepearlslombok.id/storage/products/golden-necklace.jpg');
  });

  it('3. URL absolut (http:// dan https://) dibiarkan apa adanya tanpa perubahan', () => {
    const httpsUrl = 'https://images.unsplash.com/photo-1544005313?w=500';
    const httpUrl = 'http://example.com/cdn/pearl.png';

    expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);
    expect(resolveMediaUrl(httpUrl)).toBe(httpUrl);
  });

  it('4. Data URI dan blob URL dibiarkan apa adanya', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=';
    const blobUrl = 'blob:http://localhost:5173/550e8400-e29b-41d4-a716-446655440000';

    expect(resolveMediaUrl(dataUri)).toBe(dataUri);
    expect(resolveMediaUrl(blobUrl)).toBe(blobUrl);
  });

  it('5. null, undefined, string kosong atau whitespace mengembalikan fallback atau string kosong', () => {
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
    expect(resolveMediaUrl('')).toBe('');
    expect(resolveMediaUrl('   ')).toBe('');

    const placeholder = '/images/placeholder_jewelry.svg';
    expect(resolveMediaUrl(null, placeholder)).toBe(placeholder);
    expect(resolveMediaUrl(undefined, placeholder)).toBe(placeholder);
    expect(resolveMediaUrl('', placeholder)).toBe(placeholder);
    expect(resolveMediaUrl('   ', placeholder)).toBe(placeholder);
  });

  it('6. path aset lokal selain storage (/images/...) dibiarkan apa adanya', () => {
    expect(resolveMediaUrl('/images/placeholder_jewelry.svg')).toBe('/images/placeholder_jewelry.svg');
    expect(resolveMediaUrl('/images/hero_pearl_shell.jpg')).toBe('/images/hero_pearl_shell.jpg');
  });

  it('7. path berkas WebP pada /storage/ diselesaikan dengan benar', () => {
    import.meta.env.VITE_API_URL = 'https://api.cdepearlslombok.id/api/v1';
    const result = resolveMediaUrl('/storage/products/pearl-earrings.webp');
    expect(result).toBe('https://api.cdepearlslombok.id/storage/products/pearl-earrings.webp');
  });

  it('8. resolveWebpUrl menghasilkan URL WebP yang valid dan terselesaikan', () => {
    import.meta.env.VITE_API_URL = 'https://api.cdepearlslombok.id/api/v1';

    // File jpg dikonversi ke webp
    expect(resolveWebpUrl('/storage/products/item.jpg')).toBe(
      'https://api.cdepearlslombok.id/storage/products/item.webp'
    );

    // File png dikonversi ke webp
    expect(resolveWebpUrl('/storage/products/item.png')).toBe(
      'https://api.cdepearlslombok.id/storage/products/item.webp'
    );

    // File webp tetap webp
    expect(resolveWebpUrl('/storage/products/item.webp')).toBe(
      'https://api.cdepearlslombok.id/storage/products/item.webp'
    );

    // Null mengembalikan fallback
    expect(resolveWebpUrl(null, '/images/placeholder.webp')).toBe('/images/placeholder.webp');
  });

  it('9. getApiOrigin memotong /api/v1, /api/v1/, atau trailing slash', () => {
    import.meta.env.VITE_API_URL = 'https://api.cdepearlslombok.id/api/v1/';
    expect(getApiOrigin()).toBe('https://api.cdepearlslombok.id');

    import.meta.env.VITE_API_URL = 'http://127.0.0.1:8000/api/v1';
    expect(getApiOrigin()).toBe('http://127.0.0.1:8000');

    import.meta.env.VITE_API_URL = 'http://127.0.0.1:8000/api';
    expect(getApiOrigin()).toBe('http://127.0.0.1:8000');
  });
});
