import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SpiDashboardLayout } from '../layouts/SpiDashboardLayout';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../components/common/UserProfileDropdown', () => ({
  UserProfileDropdown: () => <div data-testid="user-profile-dropdown" />,
}));

describe('Tahap Latar Mutiara: DashboardLayout & SpiDashboardLayout .pearl-bg Verification', () => {
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

  it('1. DashboardLayout memuat kelas .pearl-bg dan fallback bg-[var(--bg-dash)]', async () => {
    await act(async () => {
      root.render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <DashboardLayout
              sidebarTitle="Menu Admin"
              menuItems={[{ id: 'test', label: 'Test Menu' }]}
              activeMenuId="test"
              onSelectMenu={() => {}}
              userRole="admin"
              userName="Admin CD'E"
              userEmail="admin@cdepearls.com"
            >
              <div data-testid="dashboard-content">Konten Dashboard</div>
            </DashboardLayout>
          </MemoryRouter>
        </HelmetProvider>
      );
    });

    const pearlElements = container.querySelectorAll('.pearl-bg');
    expect(pearlElements.length).toBeGreaterThanOrEqual(1);

    const outerWrapper = container.firstElementChild as HTMLElement;
    expect(outerWrapper).not.toBeNull();
    expect(outerWrapper.classList.contains('pearl-bg')).toBe(true);
    expect(outerWrapper.className).toContain('bg-[var(--bg-dash)]');

    const content = container.querySelector('[data-testid="dashboard-content"]');
    expect(content).not.toBeNull();
  });

  it('2. SpiDashboardLayout memuat kelas .pearl-bg dan fallback bg-[var(--bg-dash)]', async () => {
    await act(async () => {
      root.render(
        <HelmetProvider>
          <MemoryRouter initialEntries={['/spi']}>
            <SpiDashboardLayout
              activeMenuId="ringkasan"
              onSelectMenu={() => {}}
              userName="SPI Auditor"
              userEmail="spi@cdepearls.com"
            >
              <div data-testid="spi-content">Konten Audit SPI</div>
            </SpiDashboardLayout>
          </MemoryRouter>
        </HelmetProvider>
      );
    });

    const pearlElements = container.querySelectorAll('.pearl-bg');
    expect(pearlElements.length).toBeGreaterThanOrEqual(1);

    const outerWrapper = container.firstElementChild as HTMLElement;
    expect(outerWrapper).not.toBeNull();
    expect(outerWrapper.classList.contains('pearl-bg')).toBe(true);
    expect(outerWrapper.className).toContain('bg-[var(--bg-dash)]');

    const content = container.querySelector('[data-testid="spi-content"]');
    expect(content).not.toBeNull();
  });
});
