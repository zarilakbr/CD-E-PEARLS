import React, { act } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SiteLayout } from '../layouts/SiteLayout';
import { Footer } from '../components/layout/Footer';
import { MobileMarketplaceHome } from '../components/home/MobileMarketplaceHome';
import { GuestAccountHub } from '../pages/customer/GuestAccountHub';
import { RouteGuard } from '../routes/RouteGuard';
import { AuthContext, type AuthContextType, type UserResponse } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { buildSitemapXml, isPrivateNoindexPath } from '../lib/seo';
import '../lib/i18n';

describe('Tahap V9: Pengujian Fitur Lengkap', () => {
  let container: HTMLDivElement;
  let root: Root;

  const createMockAuth = (isAuthenticated: boolean, user: UserResponse | null = null): AuthContextType => ({
    user,
    role: user?.role || null,
    isLoading: false,
    isAuthenticated,
    isAuthModalOpen: false,
    authModalTab: 'login',
    openAuthModal: vi.fn(),
    closeAuthModal: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refetchUser: vi.fn(),
  });

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    sessionStorage.clear();

    if (!globalThis.IntersectionObserver) {
      globalThis.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }

    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }

    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('1024px') || query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // (a) Tidak ada teks "Studio 3D" di navbar, footer, beranda, dan GuestAccountHub saat belum login
  describe('(a) Ketiadaan teks "Studio 3D" untuk pengunjung belum login', () => {
    it('1. Tidak ada teks "Studio 3D" di navbar desktop saat belum login', async () => {
      const auth = createMockAuth(false, null);
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/']}>
            <AuthContext.Provider value={auth}>
              <ThemeProvider>
                <SiteLayout currentTab="home" onNavigate={() => {}}>
                  <div>Konten</div>
                </SiteLayout>
              </ThemeProvider>
            </AuthContext.Provider>
          </MemoryRouter>
        );
      });

      const nav = container.querySelector('nav');
      expect(nav).not.toBeNull();
      expect(nav?.textContent).not.toContain('Studio 3D');
      expect(nav?.textContent).not.toContain('Studio 3D Atelier');
    });

    it('2. Tidak ada teks "Studio 3D" di Footer saat belum login', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/']}>
            <Footer onNavigate={() => {}} />
          </MemoryRouter>
        );
      });

      expect(container.textContent).not.toContain('Studio 3D');
      expect(container.textContent).not.toContain('Studio 3D Atelier');
    });

    it('3. Tidak ada teks "Studio 3D" di beranda mobile (MobileMarketplaceHome) saat belum login', async () => {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/']}>
            <MobileMarketplaceHome onSelectProduct={() => {}} onAddToCart={() => {}} />
          </MemoryRouter>
        );
      });

      expect(container.textContent).not.toContain('Studio 3D');
      expect(container.textContent).not.toContain('Desain Kustom Studio 3D');
    });

    it('4. Tidak ada baris menu "Studio 3D" di GuestAccountHub saat belum login', async () => {
      const auth = createMockAuth(false, null);
      await act(async () => {
        root.render(
          <HelmetProvider>
            <MemoryRouter initialEntries={['/akun']}>
              <AuthContext.Provider value={auth}>
                <ThemeProvider>
                  <GuestAccountHub />
                </ThemeProvider>
              </AuthContext.Provider>
            </MemoryRouter>
          </HelmetProvider>
        );
      });

      expect(container.textContent).not.toContain('Studio 3D');
    });
  });

  // (b) /studio mengarahkan tamu ke login
  describe('(b) Rute terproteksi /studio mengarahkan tamu ke login', () => {
    it('mengarahkan tamu yang membuka /studio ke halaman /masuk?next=%2Fstudio', async () => {
      const auth = createMockAuth(false, null);

      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/studio']}>
            <AuthContext.Provider value={auth}>
              <Routes>
                <Route
                  path="/studio"
                  element={
                    <RouteGuard allowedRoles={['user']}>
                      <div>Pratinjau Interaktif 3D Canvas</div>
                    </RouteGuard>
                  }
                />
                <Route path="/masuk" element={<div>Halaman Masuk ke Akun</div>} />
              </Routes>
            </AuthContext.Provider>
          </MemoryRouter>
        );
      });

      // Teks formulir login harus tampil karena RouteGuard mengalihkan ke /masuk?next=%2Fstudio
      expect(container.textContent).toContain('Halaman Masuk ke Akun');
      expect(container.textContent).not.toContain('Pratinjau Interaktif 3D Canvas');
    });
  });

  // (c) Pemilih bahasa tidak ada untuk tamu dan ada saat login
  describe('(c) Kontrol bahasa hanya untuk pengguna login', () => {
    it('1. Pemilih bahasa TIDAK ADA di DOM saat belum login (tamu)', async () => {
      const auth = createMockAuth(false, null);
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/']}>
            <AuthContext.Provider value={auth}>
              <ThemeProvider>
                <SiteLayout currentTab="home" onNavigate={() => {}}>
                  <div>Konten</div>
                </SiteLayout>
              </ThemeProvider>
            </AuthContext.Provider>
          </MemoryRouter>
        );
      });

      const langButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
        ['ID', 'EN'].includes(b.textContent?.trim() || '')
      );
      expect(langButtons).toHaveLength(0);
    });

    it('2. Pemilih bahasa MUNCUL di DOM saat pengguna sudah login', async () => {
      const mockUser: UserResponse = {
        id: 1,
        uuid: 'usr-1',
        name: 'Ahmad User',
        email: 'ahmad@example.com',
        role: 'user',
        status: 'active',
      };
      const auth = createMockAuth(true, mockUser);
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/']}>
            <AuthContext.Provider value={auth}>
              <ThemeProvider>
                <SiteLayout currentTab="home" onNavigate={() => {}}>
                  <div>Konten</div>
                </SiteLayout>
              </ThemeProvider>
            </AuthContext.Provider>
          </MemoryRouter>
        );
      });

      const langButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
        ['ID', 'EN'].includes(b.textContent?.trim() || '')
      );
      expect(langButtons.length).toBeGreaterThanOrEqual(2);
      expect(langButtons.some((b) => b.textContent?.trim() === 'ID')).toBe(true);
      expect(langButtons.some((b) => b.textContent?.trim() === 'EN')).toBe(true);
    });
  });

  // (d) ThemeProvider tanpa nilai tersimpan menghasilkan light walau matchMedia dark, dan nilai 'system' lama menjadi light
  describe('(d) ThemeProvider default terang (light) dan sanitasi sistem lama', () => {
    const TestThemeConsumer: React.FC = () => {
      const { theme, resolvedTheme } = useTheme();
      return (
        <div data-testid="theme-consumer">
          <span data-testid="theme-mode">{theme}</span>
          <span data-testid="theme-resolved">{resolvedTheme}</span>
        </div>
      );
    };

    it('1. ThemeProvider tanpa nilai tersimpan menghasilkan light walau matchMedia dark', async () => {
      // Mock matchMedia agar mengembalikan dark
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-color-scheme: dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      await act(async () => {
        root.render(
          <ThemeProvider>
            <TestThemeConsumer />
          </ThemeProvider>
        );
      });

      const modeEl = container.querySelector('[data-testid="theme-mode"]');
      const resolvedEl = container.querySelector('[data-testid="theme-resolved"]');
      expect(modeEl?.textContent).toBe('light');
      expect(resolvedEl?.textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('2. Nilai "system" lama di localStorage diperlakukan sebagai light', async () => {
      localStorage.setItem('cde_theme', 'system');

      await act(async () => {
        root.render(
          <ThemeProvider>
            <TestThemeConsumer />
          </ThemeProvider>
        );
      });

      const modeEl = container.querySelector('[data-testid="theme-mode"]');
      const resolvedEl = container.querySelector('[data-testid="theme-resolved"]');
      expect(modeEl?.textContent).toBe('light');
      expect(resolvedEl?.textContent).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  // (e) /studio tidak ada di sitemap dan ditandai noindex
  describe('(e) /studio di sitemap dan noindex', () => {
    it('1. /studio tidak ada dalam sitemap XML', () => {
      const xml = buildSitemapXml([]);
      expect(xml).not.toContain('/studio');
      expect(xml).not.toContain('<loc>https://cdepearlslombok.id/studio</loc>');
    });

    it('2. /studio terdeteksi sebagai rute privat noindex', () => {
      expect(isPrivateNoindexPath('/studio')).toBe(true);
    });
  });
});
