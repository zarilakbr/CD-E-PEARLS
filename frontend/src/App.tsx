import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode, Suspense } from 'react';
import { AuthProvider, useAuth, type UserRole } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SiteLayout } from './layouts/SiteLayout';
import { PublicHomePage } from './pages/site/PublicHomePage';
import { CatalogPage } from './pages/site/CatalogPage';
import { CartPage } from './pages/site/CartPage';
import { AccessDeniedPage } from './pages/common/AccessDeniedPage';
import { ProductDetailModal } from './components/product/ProductDetailModal';
import { AuthModal } from './components/auth/AuthModal';

// Code-splitting via React.lazy
const Studio3DPage = React.lazy(() => import('./pages/site/Studio3DPage').then((m) => ({ default: m.Studio3DPage })));
const EducationPage = React.lazy(() => import('./pages/site/EducationPage').then((m) => ({ default: m.EducationPage })));
const AboutPage = React.lazy(() => import('./pages/site/AboutPage').then((m) => ({ default: m.AboutPage })));
const AdminPortal = React.lazy(() => import('./pages/admin/AdminPortal').then((m) => ({ default: m.AdminPortal })));
const SpiPortal = React.lazy(() => import('./pages/spi/SpiPortal').then((m) => ({ default: m.SpiPortal })));
const CustomerPortal = React.lazy(() => import('./pages/customer/CustomerPortal').then((m) => ({ default: m.CustomerPortal })));

import {
  mockProducts,
  mockOrders,
  mockStockItems,
  mockApprovals,
  mockSpiAuditLogs,
  mockStaffAccounts,
  mockSpiFindings,
  type MockProduct,
  type MockOrder,
  type MockStockItem,
  type MockApprovalItem,
  type MockSpiAuditLog,
  type MockStaffAccount,
  type MockSpiFinding,
} from './data/mock';

/**
 * =========================================================================================
 * PERHATIAN KEAMANAN SISTEM:
 * Pengecekan peran (Route Guard) di front-end ini menyelaraskan tampilan UI dengan server session.
 * Di lingkungan produksi, otorisasi RBAC (user/admin/spi) dan seluruh aksi sensitif telah
 * ditegakkan secara ketat di sisi backend Laravel API middleware.
 * =========================================================================================
 */

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
    console.error('CD\'E Pearls Runtime Error caught by boundary:', error, errorInfo);
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
  <div className="min-h-[60vh] bg-[#FBF8F3] flex flex-col items-center justify-center p-8 text-center">
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 rounded-full border-2 border-[#E6DDD0]" />
      <div className="absolute inset-0 rounded-full border-2 border-[#8A6A2F] border-t-transparent animate-spin" />
    </div>
    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F]">
      CD'E Pearls Lombok
    </span>
    <p className="text-xs text-[#4A5666] mt-1 font-light">
      Memuat modul atelier...
    </p>
  </div>
);

// Helper to resolve route from URL pathname
function getInitialTabFromLocation(): string {
  const path = window.location.pathname.toLowerCase();
  if (path === '/spi' || path.startsWith('/spi/')) return 'spi';
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
  if (path === '/akun' || path.startsWith('/akun/')) return 'akun';
  if (path === '/koleksi' || path === '/catalog') return 'catalog';
  if (path === '/studio') return 'studio';
  if (path === '/edukasi' || path === '/education') return 'education';
  if (path === '/tentang' || path === '/about') return 'about';
  if (path === '/keranjang' || path === '/cart') return 'keranjang';
  return 'home';
}

const tabToPathMap: Record<string, string> = {
  home: '/',
  catalog: '/koleksi',
  studio: '/studio',
  education: '/edukasi',
  about: '/tentang',
  keranjang: '/keranjang',
  akun: '/akun',
  admin: '/admin',
  spi: '/spi',
};

const AppContent: React.FC = () => {
  const {
    user,
    role,
    isAuthenticated,
    isLoading: isAuthLoading,
    logout,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<string>(() => getInitialTabFromLocation());
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartCount, setCartCount] = useState<number>(2);
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Centralized Live Data States (Shared across Admin & SPI)
  const [products, setProducts] = useState<MockProduct[]>(mockProducts);
  const [orders, setOrders] = useState<MockOrder[]>(mockOrders);
  const [stockItems, setStockItems] = useState<MockStockItem[]>(mockStockItems);
  const [approvals, setApprovals] = useState<MockApprovalItem[]>(mockApprovals);
  const [auditLogs, setAuditLogs] = useState<MockSpiAuditLog[]>(mockSpiAuditLogs);
  const [staffAccounts, setStaffAccounts] = useState<MockStaffAccount[]>(mockStaffAccounts);
  const [findings, setFindings] = useState<MockSpiFinding[]>(mockSpiFindings);

  // Check OAuth callback errors or notifications in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get('auth_error');
      if (authError === 'ROLE_NOT_PERMITTED') {
        setToastMessage('⚠️ Akun Google hanya untuk pelanggan butik. Akun staf (Admin & SPI) harus masuk menggunakan kredensial internal butik.');
        setTimeout(() => setToastMessage(null), 6000);
      } else if (authError === 'EMAIL_NOT_VERIFIED') {
        setToastMessage('⚠️ Alamat email Google Anda belum diverifikasi oleh Google.');
        setTimeout(() => setToastMessage(null), 5000);
      } else if (authError === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = params.get('retry_after') || 'beberapa';
        setToastMessage(`⚠️ Terlalu banyak percobaan. Harap tunggu ${retryAfter} detik.`);
        setTimeout(() => setToastMessage(null), 5000);
      } else if (authError === 'OAUTH_FAILED') {
        setToastMessage('⚠️ Autentikasi Google dibatalkan atau tidak selesai.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  }, []);

  // Synchronize browser history and popstate
  useEffect(() => {
    const onPopState = () => {
      const tab = getInitialTabFromLocation();
      setCurrentTab(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = (tab: string, categoryFilter?: string) => {
    setCurrentTab(tab);
    if (categoryFilter) {
      setSelectedCatalogCategory(categoryFilter);
    }
    const targetPath = tabToPathMap[tab] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderSearch = (query: string) => {
    setSearchQuery(query);
    handleNavigate('catalog');
  };

  const handleAddToCart = (productName: string) => {
    setCartCount((prev) => prev + 1);
    setToastMessage(`✓ ${productName} berhasil ditambahkan ke keranjang belanja.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectProduct = (product: MockProduct) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleLoginSuccess = (loginRole: UserRole, name: string) => {
    closeAuthModal();
    if (loginRole === 'spi') {
      handleNavigate('spi');
      setToastMessage(`🛡️ Selamat datang, ${name} (Portal SPI)`);
    } else if (loginRole === 'admin') {
      handleNavigate('admin');
      setToastMessage(`⚙️ Selamat datang, ${name} (Portal Admin)`);
    } else {
      handleNavigate('akun');
      setToastMessage(`✨ Selamat datang kembali, ${name}!`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = async () => {
    await logout();
    handleNavigate('home');
    setToastMessage('Anda telah keluar dari akun.');
    setTimeout(() => setToastMessage(null), 3000);
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

    // Record submission into SPI Audit Trail
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

    // 1. Mark approval as approved
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

    // 2. Execute business state modifications based on approval type
    if (item.type === 'KONFIRMASI_PEMBAYARAN') {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === item.targetId
            ? { ...o, status: 'Dikemas' as const }
            : o
        )
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
        prev.map((o) =>
          o.id === item.targetId
            ? { ...o, status: 'Dibatalkan' as const }
            : o
        )
      );
    }

    // 3. Record decision in SPI Audit Trail
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

  // Staff Account Management Handlers
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

  // Findings Handlers
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
          ? { ...f, status: f.status === 'Dalam Investigasi' ? ('Selesai' as const) : ('Dalam Investigasi' as const) }
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

  // =========================================================================
  // ROUTE GUARDS (Strict RBAC):
  // 1. /spi -> SPI role ONLY
  // 2. /admin -> Admin & SPI role ONLY
  // 3. /akun -> Customer & Authenticated ONLY
  // =========================================================================

  const effectiveRole: UserRole = role || 'user';

  // 1. SPI Route (/spi)
  if (currentTab === 'spi') {
    if (isAuthLoading) {
      return <PageSkeleton />;
    }

    if (!isAuthenticated || effectiveRole !== 'spi') {
      return (
        <>
          <AccessDeniedPage
            currentRole={effectiveRole}
            attemptedPath="/spi"
            onNavigateHome={() => handleNavigate('home')}
            onNavigateDashboard={() => handleNavigate(effectiveRole === 'admin' ? 'admin' : 'akun')}
            onOpenLogin={() => openAuthModal('login')}
            onLogout={handleLogout}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={closeAuthModal}
            onLoginSuccess={handleLoginSuccess}
            initialRole="spi"
            initialTab={authModalTab}
          />
        </>
      );
    }

    return (
      <Suspense fallback={<PageSkeleton />}>
        <SpiPortal
          onNavigateHome={() => handleNavigate('home')}
          onOpenAdmin={() => handleNavigate('admin')}
          onLogout={handleLogout}
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
          auditLogs={auditLogs}
          staffAccounts={staffAccounts}
          onToggleStaffStatus={handleToggleStaffStatus}
          onAddStaffAccount={(staffItem) => {
            setStaffAccounts((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                ...staffItem,
                status: 'Aktif',
                lastActive: 'Baru Dibuat',
              },
            ]);
            setToastMessage(`✓ Akun admin ${staffItem.name} berhasil ditambahkan oleh SPI.`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
          findings={findings}
          onAddFinding={handleAddFinding}
          onToggleFindingStatus={handleToggleFindingStatus}
          onDeleteFinding={handleDeleteFinding}
          products={products}
          orders={orders}
          stockItems={stockItems}
        />
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </Suspense>
    );
  }

  // 2. Admin Route (/admin)
  if (currentTab === 'admin') {
    if (isAuthLoading) {
      return <PageSkeleton />;
    }

    if (!isAuthenticated || (effectiveRole !== 'admin' && effectiveRole !== 'spi')) {
      return (
        <>
          <AccessDeniedPage
            currentRole={effectiveRole}
            attemptedPath="/admin"
            onNavigateHome={() => handleNavigate('home')}
            onNavigateDashboard={() => handleNavigate(effectiveRole === 'user' ? 'akun' : 'home')}
            onOpenLogin={() => openAuthModal('login')}
            onLogout={handleLogout}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={closeAuthModal}
            onLoginSuccess={handleLoginSuccess}
            initialRole="admin"
            initialTab={authModalTab}
          />
        </>
      );
    }

    return (
      <Suspense fallback={<PageSkeleton />}>
        <AdminPortal
          userRole={effectiveRole}
          onNavigateHome={() => handleNavigate('home')}
          onReturnToSpi={() => handleNavigate('spi')}
          onLogout={handleLogout}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          stockItems={stockItems}
          setStockItems={setStockItems}
          onAddApproval={handleAddApproval}
          onLogActivity={(action, target, oldValue, newValue) => {
            const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
            const maxLogId = auditLogs.length > 0 ? Math.max(...auditLogs.map((l) => l.id)) : 100;
            const newAudit: MockSpiAuditLog = {
              id: maxLogId + 1,
              timestamp: now,
              user: user?.name || 'Admin',
              role: effectiveRole,
              action,
              target,
              oldValue,
              newValue,
              status: 'Disetujui',
              ipAddress: '127.0.0.1',
            };
            setAuditLogs((prev) => [newAudit, ...prev]);
          }}
        />
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </Suspense>
    );
  }

  // 3. Customer Portal Route (/akun)
  if (currentTab === 'akun') {
    if (isAuthLoading) {
      return <PageSkeleton />;
    }

    if (!isAuthenticated) {
      return (
        <>
          <AccessDeniedPage
            currentRole={effectiveRole}
            attemptedPath="/akun"
            onNavigateHome={() => handleNavigate('home')}
            onNavigateDashboard={() => handleNavigate('home')}
            onOpenLogin={() => openAuthModal('login')}
            onLogout={handleLogout}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={closeAuthModal}
            onLoginSuccess={handleLoginSuccess}
            initialRole="user"
            initialTab={authModalTab}
          />
        </>
      );
    }

    return (
      <Suspense fallback={<PageSkeleton />}>
        <CustomerPortal
          onNavigateHome={() => handleNavigate('home')}
          onNavigateCatalog={() => handleNavigate('catalog')}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onAddToCart={handleAddToCart}
        />
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}
      </Suspense>
    );
  }

  // 4. Public Website Views wrapped in SiteLayout
  return (
    <SiteLayout
      currentTab={currentTab}
      onNavigate={handleNavigate}
      onSearch={handleHeaderSearch}
      cartCount={cartCount}
      wishlistCount={3}
      userRole={effectiveRole}
      onOpenLogin={() => openAuthModal('login')}
      onLogout={handleLogout}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Public Pages Switcher with Suspense */}
      <Suspense fallback={<PageSkeleton />}>
        {currentTab === 'home' && (
          <PublicHomePage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentTab === 'catalog' && (
          <CatalogPage
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
            initialCategory={selectedCatalogCategory}
            initialSearch={searchQuery}
          />
        )}

        {currentTab === 'studio' && (
          <Studio3DPage
            onAddToCart={(item) => handleAddToCart(item.name)}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'education' && (
          <EducationPage onNavigateCatalog={() => handleNavigate('catalog')} />
        )}

        {currentTab === 'about' && <AboutPage />}

        {currentTab === 'keranjang' && (
          <CartPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateCatalog={() => handleNavigate('catalog')}
          />
        )}
      </Suspense>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onLoginSuccess={handleLoginSuccess}
        initialRole={effectiveRole}
        initialTab={authModalTab}
      />
    </SiteLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
