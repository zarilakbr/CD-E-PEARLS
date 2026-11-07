import React, { useState, Component, type ErrorInfo, type ReactNode, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { SiteLayout } from './layouts/SiteLayout';
import { ProductDetailModal } from './components/product/ProductDetailModal';
import { RouteGuard } from './routes/RouteGuard';
import { BottomTabBar } from './components/common/BottomTabBar';
import { Toaster } from 'sonner';

// Code-splitting via React.lazy
const PublicHomePage = React.lazy(() => import('./pages/site/PublicHomePage').then((m) => ({ default: m.PublicHomePage })));
const CatalogPage = React.lazy(() => import('./pages/site/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const CartPage = React.lazy(() => import('./pages/site/CartPage').then((m) => ({ default: m.CartPage })));
const WishlistPage = React.lazy(() => import('./pages/site/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CheckoutPage = React.lazy(() => import('./pages/site/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CertificateCheckPage = React.lazy(() => import('./pages/site/CertificateCheckPage').then((m) => ({ default: m.CertificateCheckPage })));
const OrderTrackingPage = React.lazy(() => import('./pages/site/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })));
const ProductDetailPage = React.lazy(() => import('./pages/site/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const Studio3DPage = React.lazy(() => import('./pages/site/Studio3DPage').then((m) => ({ default: m.Studio3DPage })));
const EducationPage = React.lazy(() => import('./pages/site/EducationPage').then((m) => ({ default: m.EducationPage })));
const AboutPage = React.lazy(() => import('./pages/site/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = React.lazy(() => import('./pages/site/ContactPage').then((m) => ({ default: m.ContactPage })));
const TermsPage = React.lazy(() => import('./pages/site/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('./pages/site/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const HelpCenterPage = React.lazy(() => import('./pages/site/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })));

// Auth Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const GoogleCallbackPage = React.lazy(() => import('./pages/auth/GoogleCallbackPage').then((m) => ({ default: m.GoogleCallbackPage })));

// Portals
const AdminPortal = React.lazy(() => import('./pages/admin/AdminPortal').then((m) => ({ default: m.AdminPortal })));
const SpiPortal = React.lazy(() => import('./pages/spi/SpiPortal').then((m) => ({ default: m.SpiPortal })));
const CustomerPortal = React.lazy(() => import('./pages/customer/CustomerPortal').then((m) => ({ default: m.CustomerPortal })));

// Error Pages
import { AccessDeniedPage } from './pages/common/AccessDeniedPage';
const NotFoundPage = React.lazy(() => import('./pages/common/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ServerErrorPage = React.lazy(() => import('./pages/common/ServerErrorPage').then((m) => ({ default: m.ServerErrorPage })));

import type {
  MockProduct,
  MockOrder,
  MockStockItem,
  MockApprovalItem,
  MockSpiAuditLog,
  MockStaffAccount,
  MockSpiFinding,
} from './types/models';

// Error Boundary to prevent blank page crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CD'E Pearls Runtime Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF8F3] text-[#12263A] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md p-8 bg-white border border-[#E6DDD0] rounded-2xl shadow-md space-y-4">
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              CD'E Pearls Atelier
            </span>
            <h1 className="font-serif text-3xl font-semibold text-[#12263A]">
              Memuat Ulang Tampilan...
            </h1>
            <p className="text-xs text-[#4A5666] leading-relaxed">
              Sedang menyelaraskan komponen mutiara. Silakan tekan tombol di bawah untuk memulihkan halaman.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Luxury loading skeleton during lazy chunk loading
const PageSkeleton: React.FC = () => (
  <div className="min-h-[60vh] bg-[#FBF8F3] dark:bg-[#0D1C2B] flex flex-col items-center justify-center p-8 text-center">
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-[#E6DDD0] dark:border-white/10" />
      <div className="absolute inset-0 rounded-full border-2 border-[#8A6A2F] border-t-transparent animate-spin" />
    </div>
    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F]">
      CD'E Pearls Lombok
    </span>
    <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1 font-light">
      Memuat modul atelier...
    </p>
  </div>
);

// Wrapper for public boutique layout
const PublicBoutiqueLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();
  const { wishlist } = useWishlist();
  const { logout } = useAuth();

  const getActiveTab = () => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p.startsWith('/katalog')) return 'catalog';
    if (p.startsWith('/studio')) return 'studio';
    if (p.startsWith('/edukasi')) return 'education';
    if (p.startsWith('/tentang')) return 'about';
    return 'home';
  };

  const handleNavigate = (tab: string) => {
    const pathMap: Record<string, string> = {
      home: '/',
      catalog: '/katalog',
      studio: '/studio',
      customizer: '/studio',
      education: '/edukasi',
      about: '/tentang',
      keranjang: '/keranjang',
      cart: '/keranjang',
      favorit: '/favorit',
      akun: '/akun',
      customer: '/akun',
      admin: '/admin',
      spi: '/spi',
      faq: '/bantuan',
      contact: '/kontak',
    };
    navigate(pathMap[tab] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    navigate(`/katalog?search=${encodeURIComponent(q)}`);
  };

  const cartCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <SiteLayout
      currentTab={getActiveTab()}
      onNavigate={handleNavigate}
      onSearch={handleSearch}
      cartCount={cartCount}
      wishlistCount={wishlist.length}
      onLogout={async () => {
        await logout();
        navigate('/');
      }}
    >
      <Outlet />
    </SiteLayout>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  // Selected Product Modal preview from catalog
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Centralized Live Data States (Shared across Admin & SPI)
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [stockItems, setStockItems] = useState<MockStockItem[]>([]);
  const [approvals, setApprovals] = useState<MockApprovalItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<MockSpiAuditLog[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<MockStaffAccount[]>([]);
  const [findings, setFindings] = useState<MockSpiFinding[]>([]);

  const handleAddToCart = (productName: string) => {
    setToastMessage(`✓ ${productName} berhasil ditambahkan ke keranjang belanja.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectProduct = (product: MockProduct) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  // SPI Approval System Handlers
  const handleAddApproval = (approvalData: Omit<MockApprovalItem, 'id' | 'requestDate' | 'status'>) => {
    const newId = `APV-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newApproval: MockApprovalItem = {
      ...approvalData,
      id: newId,
      requestDate: now,
      status: 'Menunggu Persetujuan',
    };
    setApprovals((prev) => [newApproval, ...prev]);

    const maxLogId = auditLogs.length > 0 ? Math.max(...auditLogs.map((l) => l.id)) : 100;
    const newAudit: MockSpiAuditLog = {
      id: maxLogId + 1,
      timestamp: now,
      user: user?.name || 'Admin Operasional',
      role: 'admin',
      action: `Pengajuan ${approvalData.type}`,
      target: approvalData.target,
      oldValue: approvalData.oldValue || '-',
      newValue: approvalData.newValue || '-',
      status: 'Perlu Review',
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    setToastMessage(`✓ Pengajuan ${approvalData.type} berhasil diajukan ke SPI.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (id: string, notes?: string) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Disetujui' as const,
              reviewedBy: user?.name || 'SPI Auditor',
              reviewedDate: now,
              reviewNotes: notes || 'Disetujui oleh Satuan Pengawas Internal.',
            }
          : a
      )
    );

    if (item.type === 'KONFIRMASI_PEMBAYARAN') {
      setOrders((prev) =>
        prev.map((o) => (o.id === item.targetId ? { ...o, status: 'Dikemas' as const } : o))
      );
    } else if (item.type === 'PERUBAHAN_HARGA' && item.payload?.productId) {
      const newPrice = Number(item.payload.newPrice);
      setProducts((prev) =>
        prev.map((p) => (p.id === item.payload?.productId ? { ...p, price: newPrice } : p))
      );
    } else if (item.type === 'HAPUS_PRODUK' && item.payload?.productId) {
      setProducts((prev) => prev.filter((p) => p.id !== item.payload?.productId));
    } else if (item.type === 'PENYESUAIAN_STOK' && item.payload?.stockId) {
      const targetQty = Number(item.payload.targetQty);
      setStockItems((prev) =>
        prev.map((s) =>
          s.id === item.payload?.stockId
            ? {
                ...s,
                stock: targetQty,
                status: targetQty === 0 ? 'Habis' : targetQty <= 5 ? 'Menipis' : 'Aman',
              }
            : s
        )
      );
    } else if (item.type === 'PEMBATALAN_PESANAN') {
      setOrders((prev) =>
        prev.map((o) => (o.id === item.targetId ? { ...o, status: 'Dibatalkan' as const } : o))
      );
    }

    const maxLogId = auditLogs.length > 0 ? Math.max(...auditLogs.map((l) => l.id)) : 100;
    const auditEntry: MockSpiAuditLog = {
      id: maxLogId + 1,
      timestamp: now,
      user: user?.name || 'SPI Auditor',
      role: 'spi',
      action: `Persetujuan Disetujui: ${item.type}`,
      target: item.target,
      oldValue: item.oldValue || '-',
      newValue: item.newValue || 'Disetujui',
      status: 'Disetujui',
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setToastMessage(`✓ Pengajuan [${item.id}] berhasil DISETUJUI oleh SPI.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReject = (id: string, reason: string) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Ditolak' as const,
              reviewedBy: user?.name || 'SPI Auditor',
              reviewedDate: now,
              reviewNotes: reason,
            }
          : a
      )
    );

    const maxLogId = auditLogs.length > 0 ? Math.max(...auditLogs.map((l) => l.id)) : 100;
    const auditEntry: MockSpiAuditLog = {
      id: maxLogId + 1,
      timestamp: now,
      user: user?.name || 'SPI Auditor',
      role: 'spi',
      action: `Persetujuan Ditolak: ${item.type}`,
      target: item.target,
      oldValue: item.oldValue || '-',
      newValue: `Ditolak: ${reason}`,
      status: 'Ditolak',
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setToastMessage(`✗ Pengajuan [${item.id}] DITOLAK oleh SPI.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStaffStatus = (id: number) => {
    const staff = staffAccounts.find((s) => s.id === id);
    if (!staff) return;

    const newStatus = staff.status === 'Aktif' ? 'Dibekukan' : 'Aktif';
    setStaffAccounts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus as 'Aktif' | 'Dibekukan' } : s))
    );

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const maxLogId = auditLogs.length > 0 ? Math.max(...auditLogs.map((l) => l.id)) : 100;
    setAuditLogs((prev) => [
      {
        id: maxLogId + 1,
        timestamp: now,
        user: user?.name || 'SPI',
        role: 'spi',
        action: newStatus === 'Dibekukan' ? 'Pembekuan Akun Staf' : 'Pengaktifan Akun Staf',
        target: `${staff.name} (${staff.email})`,
        oldValue: `Status: ${staff.status}`,
        newValue: `Status: ${newStatus}`,
        status: 'Disetujui',
        ipAddress: '127.0.0.1',
      },
      ...prev,
    ]);

    setToastMessage(`✓ Akun ${staff.name} berhasil diubah menjadi: ${newStatus}.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddFinding = (findingData: Omit<MockSpiFinding, 'id' | 'date'>) => {
    const maxId = findings.length > 0 ? Math.max(...findings.map((f) => f.id)) : 0;
    const now = new Date().toISOString().split('T')[0];
    const newFinding: MockSpiFinding = {
      ...findingData,
      id: maxId + 1,
      date: now,
    };
    setFindings((prev) => [newFinding, ...prev]);
    setToastMessage(`✓ Temuan audit [${newFinding.code}] berhasil dicatatkan.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFindingStatus = (id: number) => {
    setFindings((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: f.status === 'Dalam Investigasi' ? ('Selesai' as const) : ('Dalam Investigasi' as const),
            }
          : f
      )
    );
    setToastMessage('✓ Status tindak lanjut temuan audit diperbarui.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteFinding = (id: number) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
    setToastMessage('✓ Temuan audit dihapus.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <Suspense fallback={<PageSkeleton />}>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-2xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
        />
      )}

      <Routes>
        {/* ========================================================
            1. RUTE PUBLIK BOUTIQUE (DILENGKAPI DENGAN SITELAYOUT)
           ======================================================== */}
        <Route element={<PublicBoutiqueLayout />}>
          <Route
            path="/"
            element={
              <PublicHomePage
                onNavigate={(tab) => {
                  if (tab === 'catalog') navigate('/katalog');
                  else if (tab === 'customizer' || tab === 'studio') navigate('/studio');
                  else if (tab === 'education') navigate('/edukasi');
                  else if (tab === 'about') navigate('/tentang');
                  else if (tab === 'cart') navigate('/keranjang');
                  else if (tab === 'customer' || tab === 'akun') navigate('/akun');
                  else if (tab === 'admin') navigate('/admin');
                  else if (tab === 'spi') navigate('/spi');
                  else navigate('/');
                }}
                onAddToCart={handleAddToCart}
                onSelectProduct={handleSelectProduct}
              />
            }
          />
          <Route
            path="/katalog"
            element={
              <CatalogPage
                products={products}
                onAddToCart={handleAddToCart}
                onSelectProduct={handleSelectProduct}
              />
            }
          />
          <Route path="/studio" element={<Studio3DPage onAddToCart={handleAddToCart} />} />
          <Route path="/edukasi" element={<EducationPage />} />
          <Route path="/tentang" element={<AboutPage />} />
          <Route path="/kontak" element={<ContactPage />} />
          <Route path="/kebijakan-privasi" element={<PrivacyPage />} />
          <Route path="/syarat-ketentuan" element={<TermsPage />} />
          <Route path="/bantuan" element={<HelpCenterPage />} />
          <Route path="/cek-sertifikat" element={<CertificateCheckPage />} />
          <Route path="/lacak-pesanan" element={<OrderTrackingPage />} />
          <Route
            path="/keranjang"
            element={
              <CartPage
                onNavigateCatalog={() => navigate('/katalog')}
                onNavigateCheckout={() => navigate('/checkout')}
              />
            }
          />
          <Route path="/favorit" element={<WishlistPage />} />
          <Route path="/produk/:id" element={<ProductDetailPage />} />
        </Route>

        {/* ========================================================
            2. RUTE AUTHENTICATION KHUSUS (AUTHLAYOUT)
           ======================================================== */}
        <Route
          path="/masuk"
          element={
            <RouteGuard allowedRoles={['guest']}>
              <LoginPage />
            </RouteGuard>
          }
        />
        <Route
          path="/daftar"
          element={
            <RouteGuard allowedRoles={['guest']}>
              <RegisterPage />
            </RouteGuard>
          }
        />
        <Route
          path="/lupa-kata-sandi"
          element={
            <RouteGuard allowedRoles={['guest']}>
              <ForgotPasswordPage />
            </RouteGuard>
          }
        />
        <Route
          path="/atur-ulang-kata-sandi"
          element={
            <RouteGuard allowedRoles={['guest']}>
              <ResetPasswordPage />
            </RouteGuard>
          }
        />
        <Route
          path="/verifikasi-email"
          element={
            <RouteGuard allowedRoles={['public', 'user']}>
              <VerifyEmailPage />
            </RouteGuard>
          }
        />
        <Route
          path="/auth/google/callback"
          element={
            <RouteGuard allowedRoles={['public']}>
              <GoogleCallbackPage />
            </RouteGuard>
          }
        />

        {/* ========================================================
            3. RUTE CHECKOUT TERPROTEKSI
           ======================================================== */}
        <Route
          path="/checkout"
          element={
            <RouteGuard allowedRoles={['public', 'user', 'admin', 'spi']}>
              <CheckoutPage />
            </RouteGuard>
          }
        />

        {/* ========================================================
            4. RUTE PORTAL PELANGGAN (/akun/*)
           ======================================================== */}
        {[
          { path: '/akun', menu: 'summary' },
          { path: '/akun/pesanan', menu: 'orders' },
          { path: '/akun/status-pengiriman', menu: 'tracking' },
          { path: '/akun/favorit', menu: 'wishlist' },
          { path: '/akun/alamat', menu: 'addresses' },
          { path: '/akun/profil', menu: 'profile' },
        ].map(({ path, menu }) => (
          <Route
            key={path}
            path={path}
            element={
              <RouteGuard allowedRoles={path === '/akun' ? ['public', 'user'] : ['user']}>
                <CustomerPortal
                  initialMenu={menu}
                  onNavigateHome={() => navigate('/')}
                  onNavigateCatalog={() => navigate('/katalog')}
                  onNavigate={(tab) => navigate(`/${tab}`)}
                  onLogout={async () => {
                    await logout();
                    navigate('/');
                  }}
                  onAddToCart={handleAddToCart}
                />
              </RouteGuard>
            }
          />
        ))}

        {/* ========================================================
            5. RUTE PORTAL ADMIN (/admin/*)
           ======================================================== */}
        {[
          { path: '/admin', menu: 'dashboard' },
          { path: '/admin/produk', menu: 'products' },
          { path: '/admin/kategori', menu: 'categories' },
          { path: '/admin/pesanan', menu: 'orders' },
          { path: '/admin/pelanggan', menu: 'customers' },
          { path: '/admin/stok', menu: 'stock' },
          { path: '/admin/sertifikat', menu: 'certificates' },
          { path: '/admin/laporan', menu: 'reports' },
          { path: '/admin/pengaturan', menu: 'settings' },
        ].map(({ path, menu }) => (
          <Route
            key={path}
            path={path}
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdminPortal
                  initialMenu={menu}
                  onNavigateHome={() => navigate('/')}
                  onLogout={async () => {
                    await logout();
                    navigate('/');
                  }}
                  products={products}
                  setProducts={setProducts}
                  orders={orders}
                  setOrders={setOrders}
                  stockItems={stockItems}
                  setStockItems={setStockItems}
                  onAddApproval={handleAddApproval}
                />
              </RouteGuard>
            }
          />
        ))}

        {/* ========================================================
            6. RUTE PORTAL SPI (/spi/*)
           ======================================================== */}
        {[
          { path: '/spi', menu: 'ringkasan' },
          { path: '/spi/log-aktivitas', menu: 'log-aktivitas' },
          { path: '/spi/persetujuan', menu: 'persetujuan' },
          { path: '/spi/akun-role', menu: 'akun-role' },
          { path: '/spi/laporan-audit', menu: 'laporan-audit' },
        ].map(({ path, menu }) => (
          <Route
            key={path}
            path={path}
            element={
              <RouteGuard allowedRoles={['spi']}>
                <SpiPortal
                  initialMenu={menu}
                  onNavigateHome={() => navigate('/')}
                  onOpenAdmin={() => navigate('/admin')}
                  onLogout={async () => {
                    await logout();
                    navigate('/');
                  }}
                  approvals={approvals}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  auditLogs={auditLogs}
                  staffAccounts={staffAccounts}
                  onToggleStaffStatus={handleToggleStaffStatus}
                  findings={findings}
                  onAddFinding={handleAddFinding}
                  onToggleFindingStatus={handleToggleFindingStatus}
                  onDeleteFinding={handleDeleteFinding}
                  products={products}
                  orders={orders}
                  stockItems={stockItems}
                />
              </RouteGuard>
            }
          />
        ))}

        {/* ========================================================
            7. RUTE SISTEM (403, 404, 500, WILDCARD)
           ======================================================== */}
        <Route
          path="/403"
          element={
            <AccessDeniedPage
              currentRole={role || 'user'}
              attemptedPath="/terlarang"
              onNavigateHome={() => navigate('/')}
              onNavigateDashboard={() =>
                navigate(role === 'admin' ? '/admin' : role === 'spi' ? '/spi' : '/akun')
              }
              onOpenLogin={async () => {
                await logout();
                navigate('/masuk');
              }}
              onLogout={async () => {
                await logout();
                navigate('/');
              }}
            />
          }
        />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <BottomTabBar />
      <Toaster position="top-center" richColors />
    </Suspense>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
