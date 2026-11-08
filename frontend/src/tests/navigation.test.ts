import { describe, it, expect } from 'vitest';
import { routesManifest } from '../routes/manifest';

describe('Tahap V2c: Navigation & Route Integrity (/koleksi and /katalog)', () => {
  it('1. Rute /koleksi dan /katalog terdaftar dan keduanya mengarah ke komponen katalog yang sama', () => {
    const routeKoleksi = routesManifest.find((r) => r.path === '/koleksi');
    const routeKatalog = routesManifest.find((r) => r.path === '/katalog');

    expect(routeKoleksi).toBeDefined();
    expect(routeKatalog).toBeDefined();

    // Pastikan keduanya valid untuk public access
    expect(routeKoleksi?.allowedRoles).toContain('public');
    expect(routeKatalog?.allowedRoles).toContain('public');

    // Komponen tujuan sama (CatalogPage)
    expect(routeKoleksi?.component).toBe(routeKatalog?.component);
  });

  it('2. Seluruh rute esensial sistem terdaftar tanpa ada rute broken', () => {
    const essentialPaths = [
      '/',
      '/katalog',
      '/koleksi',
      '/masuk',
      '/daftar',
      '/checkout',
      '/akun',
      '/admin',
      '/spi',
      '/403',
      '/404',
      '/500',
    ];

    essentialPaths.forEach((path) => {
      const match = routesManifest.find((r) => r.path === path);
      expect(match, `Route ${path} must exist in routesManifest`).toBeDefined();
      expect(match?.component, `Component for ${path} must not be undefined`).toBeDefined();
    });
  });
});
