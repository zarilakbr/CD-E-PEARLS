import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StoreMap } from '../components/common/StoreMap';
import { STORE_CONTACT } from '../lib/seo';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Tahap V6: StoreMap Component & Links Verification', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
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
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('1. merender iframe peta dengan URL embed, loading lazy, dan referrerPolicy yang benar', async () => {
    await act(async () => {
      root.render(<StoreMap />);
    });

    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.title).toBe("Lokasi CD'E Pearls Lombok");
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer-when-downgrade');

    expect(decodeURIComponent(iframe.src)).toContain(`https://www.google.com/maps?q=${STORE_CONTACT.mapsEmbedQuery}&output=embed`);
    expect(iframe.className).toContain('h-[280px]');
    expect(iframe.className).toContain('md:h-[380px]');
  });

  it('2. merender dua tombol (Buka di Google Maps dan Petunjuk Arah) dengan href benar dan min-h-[44px]', async () => {
    await act(async () => {
      root.render(<StoreMap />);
    });

    const openLink = container.querySelector('[data-testid="store-map-open-link"]') as HTMLAnchorElement;
    const directionsLink = container.querySelector('[data-testid="store-map-directions-link"]') as HTMLAnchorElement;

    expect(openLink).not.toBeNull();
    expect(openLink.textContent).toContain('Buka di Google Maps');
    expect(openLink.href).toBe(STORE_CONTACT.mapsUrl);
    expect(openLink.target).toBe('_blank');
    expect(openLink.rel).toBe('noopener noreferrer');
    expect(openLink.className).toContain('min-h-[44px]');

    expect(directionsLink).not.toBeNull();
    expect(directionsLink.textContent).toContain('Petunjuk Arah');
    expect(decodeURIComponent(directionsLink.href)).toContain(`https://www.google.com/maps/dir/?api=1&destination=${STORE_CONTACT.mapsEmbedQuery}`);
    expect(directionsLink.target).toBe('_blank');
    expect(directionsLink.rel).toBe('noopener noreferrer');
    expect(directionsLink.className).toContain('min-h-[44px]');
  });

  it('3. mendukung kustomisasi props mapsUrl dan mapsEmbedQuery', async () => {
    const customUrl = 'https://maps.app.goo.gl/customShortLink123';
    const customQuery = '-8.5833,116.1167';

    await act(async () => {
      root.render(
        <StoreMap mapsUrl={customUrl} mapsEmbedQuery={customQuery} className="custom-test-class" />
      );
    });

    const containerDiv = container.querySelector('[data-testid="store-map-container"]');
    expect(containerDiv?.className).toContain('custom-test-class');

    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain(encodeURIComponent(customQuery));

    const openLink = container.querySelector('[data-testid="store-map-open-link"]') as HTMLAnchorElement;
    expect(openLink.href).toBe(customUrl);

    const directionsLink = container.querySelector('[data-testid="store-map-directions-link"]') as HTMLAnchorElement;
    expect(directionsLink.href).toContain(encodeURIComponent(customQuery));
  });

  it('4. aman pada layar sempit (360px) dan menggunakan token tema dinamis tanpa warna tetap', async () => {
    container.style.width = '360px';

    await act(async () => {
      root.render(<StoreMap />);
    });

    const containerDiv = container.querySelector('[data-testid="store-map-container"]') as HTMLElement;
    expect(containerDiv.className).toContain('w-full');
    expect(containerDiv.className).toContain('max-w-full');

    const iframeWrapper = containerDiv.firstElementChild as HTMLElement;
    expect(iframeWrapper.className).toContain('overflow-hidden');
    expect(iframeWrapper.className).toContain('border-[var(--border)]');

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('border-[var(--border)]');
      expect(link.className).toContain('bg-[var(--surface-muted)]');
      expect(link.className).toContain('text-[var(--text)]');
      expect(link.className).not.toContain('bg-white');
    });
  });

  it('5. Footer merender tautan teks "Lihat di Google Maps" dengan href ke mapsUrl', async () => {
    const { Footer } = await import('../components/layout/Footer');

    await act(async () => {
      root.render(<Footer onNavigate={() => {}} />);
    });

    const mapsLink = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent?.includes('Lihat di Google Maps')
    );

    expect(mapsLink).toBeDefined();
    expect(mapsLink?.href).toBe(STORE_CONTACT.mapsUrl);
    expect(mapsLink?.target).toBe('_blank');
    expect(mapsLink?.rel).toBe('noopener noreferrer');
  });

  it('6. GuestAccountHub menampilkan hanya "Versi 1" tanpa hash commit atau dependensi version.json', async () => {
    const { GuestAccountHub } = await import('../pages/customer/GuestAccountHub');
    const { MemoryRouter } = await import('react-router-dom');
    const { ThemeProvider } = await import('../context/ThemeContext');
    const { HelmetProvider } = await import('react-helmet-async');

    await act(async () => {
      root.render(
        <HelmetProvider>
          <ThemeProvider>
            <MemoryRouter>
              <GuestAccountHub />
            </MemoryRouter>
          </ThemeProvider>
        </HelmetProvider>
      );
    });

    const versionEl = container.querySelector('[data-testid="app-version"]');
    expect(versionEl).not.toBeNull();
    expect(versionEl?.textContent?.trim()).toBe('Versi 1');
    expect(versionEl?.textContent).not.toContain('54b3095');
    expect(versionEl?.textContent).not.toContain('tahap-q3');
  });
});
