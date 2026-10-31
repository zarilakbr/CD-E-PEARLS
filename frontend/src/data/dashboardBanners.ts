export interface DashboardBannerConfig {
  desktopWebp: string;
  mobileWebp: string;
  fallbackJpg: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

export const DASHBOARD_BANNERS: Record<'user' | 'admin' | 'spi', DashboardBannerConfig> = {
  user: {
    desktopWebp: '/images/hero_pearl_shell.webp',
    mobileWebp: '/images/hero_pearl_shell-mobile.webp',
    fallbackJpg: '/images/hero_pearl_shell.jpg',
    defaultTitle: 'Portal Pelanggan Butik',
    defaultSubtitle: 'Koleksi Mahakarya & Riwayat Sertifikasi Gemologi Mutiara Lombok',
  },
  admin: {
    desktopWebp: '/images/terroir_pearl_plate_left.webp',
    mobileWebp: '/images/terroir_pearl_plate_left-mobile.webp',
    fallbackJpg: '/images/terroir_pearl_plate_left.jpg',
    defaultTitle: 'Panel Operasional Toko & Atelier',
    defaultSubtitle: 'Pengelolaan Katalog, Mutasi Stok Mutiara, dan Verifikasi Transaksi',
  },
  spi: {
    desktopWebp: '/images/featured_pearl_dark_luxury.webp',
    mobileWebp: '/images/featured_pearl_dark_luxury-mobile.webp',
    fallbackJpg: '/images/featured_pearl_dark_luxury.jpg',
    defaultTitle: 'Portal Satuan Pengawas Internal (SPI)',
    defaultSubtitle: 'Otorisasi Terpusat, Integritas Transaksi & Audit Forensik Katalog',
  },
};

