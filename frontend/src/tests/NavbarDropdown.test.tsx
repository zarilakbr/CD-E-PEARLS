import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SiteLayout } from '../layouts/SiteLayout';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { catalogApi } from '../lib/api';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    catalogApi: {
      ...actual.catalogApi,
      getCategories: vi.fn(),
    },
  };
});

describe('Tahap V7: Navbar Dropdown Koleksi Produk, Menu Kontak, dan Bahasa Indonesia', () => {
  let container: HTMLDivElement;
  let root: Root;

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
    vi.mocked(catalogApi.getCategories).mockResolvedValue([]);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const mockCategories = [
    { id: 1, name: 'Kalung Mutiara', slug: 'kalung-mutiara' },
    { id: 2, name: 'Cincin Solitaire', slug: 'cincin-solitaire' },
    { id: 3, name: 'Anting Drop', slug: 'anting-drop' },
  ];

  it('1. Merender navbar desktop: memuat teks Beranda, Koleksi Produk, Studio 3D, Edukasi Mutiara, Tentang Kami, Kontak', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const desktopNav = container.querySelector('nav');
    expect(desktopNav).not.toBeNull();

    const navText = desktopNav?.textContent || '';
    expect(navText).toContain('Beranda');
    expect(navText).toContain('Koleksi Produk');
    expect(navText).toContain('Studio 3D');
    expect(navText).toContain('Edukasi Mutiara');
    expect(navText).toContain('Tentang Kami');
    expect(navText).toContain('Kontak');
  });

  it('2. Memastikan teks "Home" dan "Studio 3D Atelier" TIDAK muncul pada navbar desktop', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const desktopNav = container.querySelector('nav');
    const navText = desktopNav?.textContent || '';

    // Memastikan tidak ada sisa bahasa Inggris
    expect(navText).not.toContain('Home');
    expect(navText).not.toContain('Studio 3D Atelier');
  });

  it('3. Item "Koleksi Produk" memiliki atribut aksesibilitas yang tepat (aria-haspopup dan aria-expanded)', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const triggerBtn = container.querySelector('#nav-koleksi-produk') as HTMLButtonElement;
    expect(triggerBtn).not.toBeNull();
    expect(triggerBtn.getAttribute('aria-haspopup')).toBe('menu');
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');

    // Chevron down icon ada di dalam trigger
    const svgChevron = triggerBtn.querySelector('svg');
    expect(svgChevron).not.toBeNull();
  });

  it('4. Dropdown terbuka saat di-hover dan memuat "Semua Koleksi" serta setiap kategori dari API publik', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValue(mockCategories);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    // Tunggu category fetch selesai
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const triggerBtn = container.querySelector('#nav-koleksi-produk') as HTMLButtonElement;
    const dropdownWrapper = triggerBtn?.parentElement as HTMLElement;
    expect(dropdownWrapper).not.toBeNull();

    // Trigger hover (mouseenter / mouseover)
    await act(async () => {
      dropdownWrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      triggerBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    const menu = container.querySelector('div[role="menu"]') as HTMLDivElement;
    expect(menu).not.toBeNull();

    const menuText = menu.textContent || '';
    expect(menuText).toContain('Semua Koleksi');
    expect(menuText).toContain('Kalung Mutiara');
    expect(menuText).toContain('Cincin Solitaire');
    expect(menuText).toContain('Anting Drop');

    // Trigger button aria-expanded menjadi true
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('5. Klik label "Koleksi Produk" memicu onNavigate("catalog")', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);
    const onNavigateSpy = vi.fn();

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={onNavigateSpy}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const triggerBtn = container.querySelector('#nav-koleksi-produk') as HTMLButtonElement;
    await act(async () => {
      triggerBtn.click();
    });

    expect(onNavigateSpy).toHaveBeenCalledWith('catalog');
  });

  it('6. Klik tombol "Kontak" memicu onNavigate("contact")', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);
    const onNavigateSpy = vi.fn();

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={onNavigateSpy}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const contactButtons = Array.from(container.querySelectorAll('nav button')).filter(
      (btn) => btn.textContent?.trim() === 'Kontak'
    );
    expect(contactButtons.length).toBeGreaterThan(0);

    await act(async () => {
      (contactButtons[0] as HTMLButtonElement).click();
    });

    expect(onNavigateSpy).toHaveBeenCalledWith('contact');
  });

  it('7. Menekan tombol Escape atau klik di luar menutup dropdown menu', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce(mockCategories);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const triggerBtn = container.querySelector('#nav-koleksi-produk') as HTMLButtonElement;
    const dropdownWrapper = triggerBtn?.parentElement as HTMLElement;
    // Buka dropdown via hover / mouseover
    await act(async () => {
      dropdownWrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      triggerBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(container.querySelector('div[role="menu"]')).not.toBeNull();

    // Tekan tombol Escape
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('div[role="menu"]')).toBeNull();

    // Buka kembali
    await act(async () => {
      dropdownWrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      triggerBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(container.querySelector('div[role="menu"]')).not.toBeNull();

    // Klik di luar dropdown
    await act(async () => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(container.querySelector('div[role="menu"]')).toBeNull();
  });

  it('8. Fallback: Jika API kategori gagal (reject) atau kosong, dropdown tetap aman dan menampilkan "Semua Koleksi"', async () => {
    vi.mocked(catalogApi.getCategories).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <ThemeProvider>
              <SiteLayout currentTab="home" onNavigate={() => {}}>
                <div>Konten</div>
              </SiteLayout>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const triggerBtn = container.querySelector('#nav-koleksi-produk') as HTMLButtonElement;
    const dropdownWrapper = triggerBtn?.parentElement as HTMLElement;
    await act(async () => {
      dropdownWrapper.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      triggerBtn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    const menu = container.querySelector('div[role="menu"]') as HTMLDivElement;
    expect(menu).not.toBeNull();

    const menuText = menu.textContent || '';
    expect(menuText).toContain('Semua Koleksi');
    // Tidak melempar error dan tidak ada kategori buatan
    expect(menuText).not.toContain('Kalung Mutiara');
  });
});
