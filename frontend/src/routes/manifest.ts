import React from 'react';

// Lazy-loaded or direct components
const PublicHomePage = React.lazy(() => import('../pages/site/PublicHomePage').then(m => ({ default: m.PublicHomePage })));
const CatalogPage = React.lazy(() => import('../pages/site/CatalogPage').then(m => ({ default: m.CatalogPage })));
const Studio3DPage = React.lazy(() => import('../pages/site/Studio3DPage').then(m => ({ default: m.Studio3DPage })));
const EducationPage = React.lazy(() => import('../pages/site/EducationPage').then(m => ({ default: m.EducationPage })));
const AboutPage = React.lazy(() => import('../pages/site/AboutPage').then(m => ({ default: m.AboutPage })));
const CartPage = React.lazy(() => import('../pages/site/CartPage').then(m => ({ default: m.CartPage })));
const WishlistPage = React.lazy(() => import('../pages/site/WishlistPage').then(m => ({ default: m.WishlistPage })));
const CheckoutPage = React.lazy(() => import('../pages/site/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CertificateCheckPage = React.lazy(() => import('../pages/site/CertificateCheckPage').then(m => ({ default: m.CertificateCheckPage })));
const OrderTrackingPage = React.lazy(() => import('../pages/site/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const ProductDetailPage = React.lazy(() => import('../pages/site/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ContactPage = React.lazy(() => import('../pages/site/ContactPage').then(m => ({ default: m.ContactPage })));
const TermsPage = React.lazy(() => import('../pages/site/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('../pages/site/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const HelpCenterPage = React.lazy(() => import('../pages/site/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));

// Auth Pages
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = React.lazy(() => import('../pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const GoogleCallbackPage = React.lazy(() => import('../pages/auth/GoogleCallbackPage').then(m => ({ default: m.GoogleCallbackPage })));

// Portals
const CustomerPortal = React.lazy(() => import('../pages/customer/CustomerPortal').then(m => ({ default: m.CustomerPortal })));
const AdminPortal = React.lazy(() => import('../pages/admin/AdminPortal').then(m => ({ default: m.AdminPortal })));
const SpiPortal = React.lazy(() => import('../pages/spi/SpiPortal').then(m => ({ default: m.SpiPortal })));

// System Error Pages
const AccessDeniedPage = React.lazy(() => import('../pages/common/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })));
const NotFoundPage = React.lazy(() => import('../pages/common/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ServerErrorPage = React.lazy(() => import('../pages/common/ServerErrorPage').then(m => ({ default: m.ServerErrorPage })));

export type AllowedRole = 'public' | 'guest' | 'user' | 'admin' | 'spi';

export interface RouteManifestItem {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles: AllowedRole[];
  titleKey: string;
  initialMenu?: string;
}

export const routesManifest: RouteManifestItem[] = [
  // 1. Rute Publik
  { path: '/', component: PublicHomePage, allowedRoles: ['public'], titleKey: 'Beranda' },
  { path: '/katalog', component: CatalogPage, allowedRoles: ['public'], titleKey: 'Koleksi Produk' },
  { path: '/koleksi', component: CatalogPage, allowedRoles: ['public'], titleKey: 'Koleksi Produk' },
  { path: '/studio', component: Studio3DPage, allowedRoles: ['public'], titleKey: 'Studio 3D Atelier' },
  { path: '/edukasi', component: EducationPage, allowedRoles: ['public'], titleKey: 'Edukasi Mutiara' },
  { path: '/tentang', component: AboutPage, allowedRoles: ['public'], titleKey: 'Tentang Kami' },
  { path: '/kontak', component: ContactPage, allowedRoles: ['public'], titleKey: 'Kontak Butik' },
  { path: '/kebijakan-privasi', component: PrivacyPage, allowedRoles: ['public'], titleKey: 'Kebijakan Privasi' },
  { path: '/syarat-ketentuan', component: TermsPage, allowedRoles: ['public'], titleKey: 'Syarat & Ketentuan' },
  { path: '/bantuan', component: HelpCenterPage, allowedRoles: ['public'], titleKey: 'Pusat Bantuan' },
  { path: '/cek-sertifikat', component: CertificateCheckPage, allowedRoles: ['public'], titleKey: 'Cek Sertifikat' },
  { path: '/lacak-pesanan', component: OrderTrackingPage, allowedRoles: ['public'], titleKey: 'Lacak Pesanan' },
  { path: '/keranjang', component: CartPage, allowedRoles: ['public'], titleKey: 'Keranjang Belanja' },
  { path: '/favorit', component: WishlistPage, allowedRoles: ['public'], titleKey: 'Koleksi Favorit' },
  { path: '/produk/:id', component: ProductDetailPage, allowedRoles: ['public'], titleKey: 'Detail Produk' },

  // 2. Rute Auth (Khusus Guest - dialihkan jika sudah login)
  { path: '/masuk', component: LoginPage, allowedRoles: ['guest'], titleKey: 'Masuk ke Akun' },
  { path: '/daftar', component: RegisterPage, allowedRoles: ['guest'], titleKey: 'Daftar Akun Koleksi' },
  { path: '/lupa-kata-sandi', component: ForgotPasswordPage, allowedRoles: ['guest'], titleKey: 'Atur Ulang Kata Sandi' },
  { path: '/atur-ulang-kata-sandi', component: ResetPasswordPage, allowedRoles: ['guest'], titleKey: 'Kata Sandi Baru' },
  { path: '/verifikasi-email', component: VerifyEmailPage, allowedRoles: ['public', 'user'], titleKey: 'Verifikasi Email' },
  { path: '/auth/google/callback', component: GoogleCallbackPage, allowedRoles: ['public'], titleKey: 'Autentikasi Google' },

  // 3. Rute Pelanggan (/akun publik untuk GuestAccountHub, sub-rute terproteksi untuk user)
  { path: '/checkout', component: CheckoutPage, allowedRoles: ['public', 'user', 'admin', 'spi'], titleKey: 'Checkout Pesanan' },
  { path: '/akun', component: CustomerPortal, allowedRoles: ['public', 'user'], titleKey: 'Dashboard Pelanggan', initialMenu: 'summary' },
  { path: '/akun/pesanan', component: CustomerPortal, allowedRoles: ['user'], titleKey: 'Pesanan Saya', initialMenu: 'orders' },
  { path: '/akun/status-pengiriman', component: CustomerPortal, allowedRoles: ['user'], titleKey: 'Status Pengiriman', initialMenu: 'tracking' },
  { path: '/akun/favorit', component: CustomerPortal, allowedRoles: ['user'], titleKey: 'Koleksi Favorit', initialMenu: 'wishlist' },
  { path: '/akun/alamat', component: CustomerPortal, allowedRoles: ['user'], titleKey: 'Daftar Alamat', initialMenu: 'addresses' },
  { path: '/akun/profil', component: CustomerPortal, allowedRoles: ['user'], titleKey: 'Profil Akun', initialMenu: 'profile' },

  // 4. Rute Admin Terproteksi (/admin/*)
  { path: '/admin', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Admin Dashboard', initialMenu: 'dashboard' },
  { path: '/admin/produk', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Manajemen Produk', initialMenu: 'products' },
  { path: '/admin/kategori', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Kategori Produk', initialMenu: 'categories' },
  { path: '/admin/pesanan', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Kelola Pesanan', initialMenu: 'orders' },
  { path: '/admin/pelanggan', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Data Pelanggan', initialMenu: 'customers' },
  { path: '/admin/stok', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Inventaris Stok', initialMenu: 'stock' },
  { path: '/admin/sertifikat', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Sertifikat Gemologi', initialMenu: 'certificates' },
  { path: '/admin/laporan', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Laporan Penjualan', initialMenu: 'reports' },
  { path: '/admin/pengaturan', component: AdminPortal, allowedRoles: ['admin'], titleKey: 'Pengaturan Sistem', initialMenu: 'settings' },

  // 5. Rute SPI Terproteksi (/spi/*)
  { path: '/spi', component: SpiPortal, allowedRoles: ['spi'], titleKey: 'SPI Ringkasan', initialMenu: 'ringkasan' },
  { path: '/spi/log-aktivitas', component: SpiPortal, allowedRoles: ['spi'], titleKey: 'Log Aktivitas SPI', initialMenu: 'log-aktivitas' },
  { path: '/spi/persetujuan', component: SpiPortal, allowedRoles: ['spi'], titleKey: 'Persetujuan SPI', initialMenu: 'persetujuan' },
  { path: '/spi/akun-role', component: SpiPortal, allowedRoles: ['spi'], titleKey: 'Akun & Role SPI', initialMenu: 'akun-role' },
  { path: '/spi/laporan-audit', component: SpiPortal, allowedRoles: ['spi'], titleKey: 'Laporan Audit SPI', initialMenu: 'laporan-audit' },

  // 6. Rute Sistem & Error
  { path: '/403', component: AccessDeniedPage, allowedRoles: ['public', 'user', 'admin', 'spi'], titleKey: 'Akses Ditolak' },
  { path: '/404', component: NotFoundPage, allowedRoles: ['public', 'user', 'admin', 'spi'], titleKey: 'Halaman Tidak Ditemukan' },
  { path: '/500', component: ServerErrorPage, allowedRoles: ['public', 'user', 'admin', 'spi'], titleKey: 'Kendala Sistem' },
  { path: '*', component: NotFoundPage, allowedRoles: ['public'], titleKey: 'Halaman Tidak Ditemukan' },
];
