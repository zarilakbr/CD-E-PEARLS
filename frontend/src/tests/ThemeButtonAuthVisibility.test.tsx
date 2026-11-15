import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SiteLayout } from '../layouts/SiteLayout';
import { GuestAccountHub } from '../pages/customer/GuestAccountHub';
import { ThemeContext, type ThemeMode } from '../context/ThemeContext';
import { AuthContext, type AuthContextType, type UserResponse } from '../context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Tahap V8: Visibilitas Tombol Tema Khusus Pengguna Login', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockToggleTheme = vi.fn();
  const mockSetTheme = vi.fn();

  const mockThemeContextValue = {
    theme: 'light' as ThemeMode,
    resolvedTheme: 'light' as const,
    setTheme: mockSetTheme,
    toggleTheme: mockToggleTheme,
  };

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

  it('1. Pengunjung belum login: tombol switch tema TIDAK ADA di DOM navbar desktop', async () => {
    const unauthAuth = createMockAuth(false, null);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthContext.Provider value={unauthAuth}>
            <ThemeContext.Provider value={mockThemeContextValue}>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    // Verifikasi tombol switch tema tidak dirender di DOM sama sekali
    const themeSwitch = container.querySelector('button[role="switch"]');
    expect(themeSwitch).toBeNull();

    // Verifikasi aria-label ganti tema tidak ada
    const switchThemeByLabel = container.querySelector('button[aria-label="Ganti tema tampilan"]');
    expect(switchThemeByLabel).toBeNull();
  });

  it('2. Pengunjung belum login: kontrol pilihan bahasa ID | EN TIDAK ADA di DOM navbar (Tahap V9)', async () => {
    const unauthAuth = createMockAuth(false, null);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthContext.Provider value={unauthAuth}>
            <ThemeContext.Provider value={mockThemeContextValue}>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    const langGroup = container.querySelector('div[role="group"][aria-label="Pilih Bahasa"]');
    expect(langGroup).toBeNull();
  });

  it('3. Pengguna login: tombol switch tema MUNCUL di DOM dan memanggil toggleTheme saat diklik', async () => {
    const mockUser: UserResponse = {
      id: 1,
      uuid: 'usr-1',
      name: 'Budi Santoso',
      email: 'budi@example.com',
      role: 'user',
      status: 'active',
    };
    const authAuth = createMockAuth(true, mockUser);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthContext.Provider value={authAuth}>
            <ThemeContext.Provider value={mockThemeContextValue}>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    });

    // Verifikasi tombol switch tema dirender
    const themeSwitch = container.querySelector('button[role="switch"]') as HTMLButtonElement;
    expect(themeSwitch).not.toBeNull();
    expect(themeSwitch.getAttribute('aria-label')?.toLowerCase()).toBe('ganti tema tampilan');

    // Klik tombol tema dan verifikasi toggleTheme dipanggil
    await act(async () => {
      themeSwitch.click();
    });
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);

    // Bahasa ID dan EN juga tetap ada untuk pengguna login
    const langButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
      ['ID', 'EN'].includes(b.textContent?.trim() || '')
    );
    expect(langButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('4. GuestAccountHub belum login: pengatur tema dan bahasa TIDAK ADA di DOM (Tahap V9)', async () => {
    const unauthAuth = createMockAuth(false, null);

    await act(async () => {
      root.render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/akun']}>
            <AuthContext.Provider value={unauthAuth}>
              <ThemeContext.Provider value={mockThemeContextValue}>
                <GuestAccountHub />
              </ThemeContext.Provider>
            </AuthContext.Provider>
          </MemoryRouter>
        </HelmetProvider>
      );
    });

    // Tidak ada "Pilih Tema"
    const themeChooser = container.querySelector('div[role="group"][aria-label="Pilih Tema"]');
    expect(themeChooser).toBeNull();
    expect(container.textContent).not.toContain('Tema Tampilan');

    // Tidak ada Pemilih Bahasa untuk tamu (Tahap V9)
    const langGroup = container.querySelector('div[role="group"][aria-label="Pilih Bahasa"]');
    expect(langGroup).toBeNull();
  });

  it('5. GuestAccountHub saat terautentikasi: pengatur tema MUNCUL di DOM', async () => {
    const mockUser: UserResponse = {
      id: 2,
      uuid: 'usr-2',
      name: 'Dewi Lestari',
      email: 'dewi@example.com',
      role: 'user',
      status: 'active',
    };
    const authAuth = createMockAuth(true, mockUser);

    await act(async () => {
      root.render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/akun']}>
            <AuthContext.Provider value={authAuth}>
              <ThemeContext.Provider value={mockThemeContextValue}>
                <GuestAccountHub />
              </ThemeContext.Provider>
            </AuthContext.Provider>
          </MemoryRouter>
        </HelmetProvider>
      );
    });

    // Pengatur tema tampil jika terautentikasi
    const themeChooser = container.querySelector('div[role="group"][aria-label="Pilih Tema"]');
    expect(themeChooser).not.toBeNull();
    expect(container.textContent).toContain('Tema Tampilan');
  });
});
