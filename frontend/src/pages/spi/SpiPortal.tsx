import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import { SpiDashboardLayout } from '../../layouts/SpiDashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { spiApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useDashboardSync } from '../../hooks/useDashboardSync';
import { resolveMediaUrl } from '../../lib/media';
import { ProofImage } from '../../components/common/ProofImage';

interface SpiPortalProps {
  onNavigateHome: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
  initialMenu?: string;
  approvals?: any[];
  onApprove?: (id: string, notes?: string) => void;
  onReject?: (id: string, reason: string) => void;
  auditLogs?: any[];
  staffAccounts?: any[];
  onToggleStaffStatus?: (id: number) => void;
  onAddStaffAccount?: (staff: any) => void;
  onResetPassword?: (id: number, email: string) => void;
  findings?: any[];
  onAddFinding?: (finding: any) => void;
  onToggleFindingStatus?: (id: number) => void;
  onDeleteFinding?: (id: number) => void;
  products?: any[];
  orders?: any[];
  stockItems?: any[];
}

export const SpiPortal: React.FC<SpiPortalProps> = ({
  onNavigateHome,
  onOpenAdmin,
  onLogout,
  initialMenu,
}) => {
  const { user } = useAuth();
  const [summarySubTab, setSummarySubTab] = useState<'metrics' | 'audit-log'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const m = new URLSearchParams(window.location.search).get('menu');
      if (p === '/spi/audit-log' || p === '/spi/log-aktivitas' || m === 'audit-log') {
        return 'audit-log';
      }
    }
    return 'metrics';
  });
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    let resolved = initialMenu;
    if (resolved === 'akun-role') resolved = 'pengguna';
    if (resolved === 'log-aktivitas' || resolved === 'laporan-audit' || resolved === 'persetujuan') resolved = 'ringkasan';
    if (resolved) return resolved;

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/spi/pesanan') return 'pesanan';
      if (path === '/spi/produk-stok') return 'produk-stok';
      if (path === '/spi/pengguna' || path === '/spi/akun-role') return 'pengguna';
      if (path === '/spi/audit-log' || path === '/spi/log-aktivitas') return 'ringkasan';
      if (path === '/spi/pengaturan-toko') return 'pengaturan-toko';

      const params = new URLSearchParams(window.location.search);
      const m = params.get('menu');
      if (m && ['ringkasan', 'pesanan', 'produk-stok', 'pengguna', 'audit-log', 'pengaturan-toko'].includes(m)) {
        return m === 'akun-role' ? 'pengguna' : m;
      }
    }
    return 'ringkasan';
  });

  const handleSelectMenu = (menuId: string) => {
    setActiveMenu(menuId);
    const pathMap: Record<string, string> = {
      ringkasan: '/spi',
      pesanan: '/spi/pesanan',
      'produk-stok': '/spi/produk-stok',
      pengguna: '/spi/pengguna',
      'audit-log': '/spi/audit-log',
      'pengaturan-toko': '/spi/pengaturan-toko',
    };
    const targetPath = pathMap[menuId] || '/spi';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Toast & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // =========================================================================
  // 1. DATA: RINGKASAN
  // =========================================================================
  const [summaryData, setSummaryData] = useState<{
    revenue: { today: number; days_7: number; days_30: number };
    orders_by_status: Record<string, number>;
    top_products: Array<{ product_name: string; product_id: number; total_sold: number; total_revenue: number }>;
    low_stock_products: Array<{ id: number; code: string; name: string; stock: number; price: number; category_slug: string; image?: string }>;
    new_customers_count: number;
    recent_customers: Array<{ id: number; name: string; email: string; phone?: string; status: string; created_at: string }>;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await spiApi.getSummary();
      if (res.success) {
        setSummaryData(res);
      }
    } catch (err: any) {
      console.error('Failed to load SPI summary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'ringkasan') {
      if (summarySubTab === 'audit-log') {
        fetchAuditLogs();
      } else {
        fetchSummary();
      }
    }
  }, [activeMenu, summarySubTab]);

  // =========================================================================
  // 2. DATA: PESANAN
  // =========================================================================
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  void loadingOrders;
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [orderStatusNotes, setOrderStatusNotes] = useState('');
  const [spiCourier, setSpiCourier] = useState('JNE Express (Berasuransi)');
  const [spiTrackingNumber, setSpiTrackingNumber] = useState('');
  const [spiPreviewProofUrl, setSpiPreviewProofUrl] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await spiApi.getOrders({
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        search: orderSearch.trim() || undefined,
        per_page: 30,
      });
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'pesanan') {
      fetchOrders();
    }
  }, [activeMenu, orderStatusFilter]);

  const prevSpiOrdersVersionRef = React.useRef<string | null>(null);

  // Real-time synchronization layer with 30s ETag polling (Tahap V2c & Tahap V3b)
  const { lastSyncLabel } = useDashboardSync({
    enabled: true,
    role: 'spi',
    intervalMs: 30000,
    onDataUpdated: (data) => {
      if (data.today_revenue !== undefined || data.pending_approvals_count !== undefined) {
        fetchSummary();
      }
      if (data.accounts_count !== undefined) {
        fetchUsers();
      }
      if ((data.orders_version && data.orders_version !== prevSpiOrdersVersionRef.current) || data.orders_count !== undefined) {
        if (data.orders_version) {
          prevSpiOrdersVersionRef.current = data.orders_version;
        }
        fetchOrders();
      }
    },
  });

  // Keep selectedOrder in sync when orders list is updated
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find(o => o.id === selectedOrder.id || o.order_number === selectedOrder.order_number);
      if (refreshed) {
        setSelectedOrder(refreshed);
      }
    }
  }, [orders]);

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newOrderStatus) return;

    if (newOrderStatus === 'SHIPPED') {
      if (!spiTrackingNumber.trim()) {
        showFeedback('error', 'Nomor resi pengiriman wajib diisi saat mengubah pesanan ke status SHIPPED.');
        return;
      }
    }

    setUpdatingOrderStatus(true);
    try {
      const payload: any = {
        order_status: newOrderStatus,
        notes: orderStatusNotes.trim() || undefined,
      };
      if (newOrderStatus === 'SHIPPED') {
        payload.tracking_number = spiTrackingNumber.trim();
        payload.courier = spiCourier.trim() || 'JNE Express';
      }
      const res = await spiApi.updateOrderStatus(selectedOrder.id, payload);
      if (res.success) {
        showFeedback('success', res.message || 'Status pesanan berhasil diperbarui.');
        setSelectedOrder(null);
        setNewOrderStatus('');
        setOrderStatusNotes('');
        setSpiTrackingNumber('');
        fetchOrders();
      }
    } catch (err: any) {
      showFeedback('error', err?.response?.data?.message || 'Gagal memperbarui status pesanan.');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // =========================================================================
  // 3. DATA: PRODUK & STOK
  // =========================================================================
  const [stockList, setStockList] = useState<any[]>([]);
  const [stockSearch, setStockSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);
  void loadingStock;
  const [stockModalProduct, setStockModalProduct] = useState<any | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>('');
  const [savingStock, setSavingStock] = useState(false);

  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const res = await spiApi.getStock({
        search: stockSearch.trim() || undefined,
        low_stock_only: lowStockOnly,
        per_page: 50,
      });
      if (res.success && res.data) {
        setStockList(res.data);
      }
    } catch (err) {
      console.error('Failed to load stock list', err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'produk-stok') {
      fetchStock();
    }
  }, [activeMenu, lowStockOnly]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct || stockDelta === 0 || !stockReason.trim()) return;
    setSavingStock(true);
    try {
      const res = await spiApi.adjustStock(stockModalProduct.id, {
        delta: stockDelta,
        reason: stockReason.trim(),
      });
      if (res.success) {
        showFeedback('success', res.message || 'Stok berhasil dikoreksi.');
        setStockModalProduct(null);
        setStockDelta(0);
        setStockReason('');
        fetchStock();
      }
    } catch (err: any) {
      showFeedback('error', err?.response?.data?.message || 'Gagal mengoreksi stok.');
    } finally {
      setSavingStock(false);
    }
  };

  // =========================================================================
  // 4. DATA: PENGGUNA & AKSES (SPI TIDAK BISA MENURUNKAN DIRINYA SENDIRI)
  // =========================================================================
  const [userList, setUserList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  void loadingUsers;

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await spiApi.getUsers({
        role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
        search: userSearch.trim() || undefined,
        per_page: 50,
      });
      if (res.success && res.data) {
        setUserList(res.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'pengguna') {
      fetchUsers();
    }
  }, [activeMenu, userRoleFilter]);

  const handleUpdateRole = async (targetUser: any, newRole: string) => {
    if (targetUser.role === newRole) return;
    try {
      const res = await spiApi.updateUserRole(targetUser.id, newRole);
      if (res.success) {
        showFeedback('success', res.message || 'Peran pengguna berhasil diubah.');
        fetchUsers();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengubah peran pengguna.';
      showFeedback('error', msg);
    }
  };

  const handleToggleUserStatus = async (targetUser: any) => {
    try {
      const res = await spiApi.toggleUserStatus(targetUser.id);
      if (res.success) {
        showFeedback('success', res.message || 'Status pengguna berhasil diubah.');
        fetchUsers();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengubah status pengguna.';
      showFeedback('error', msg);
    }
  };

  // =========================================================================
  // 5. DATA: AUDIT LOG (APPEND-ONLY)
  // =========================================================================
  const [auditLogList, setAuditLogList] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await spiApi.getAuditLogs({
        search: auditSearch.trim() || undefined,
        per_page: 50,
      });
      if (res.success && res.data) {
        setAuditLogList(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'audit-log') {
      fetchAuditLogs();
    }
  }, [activeMenu]);

  // =========================================================================
  // 6. DATA: PENGATURAN TOKO
  // =========================================================================
  const [settingsForm, setSettingsForm] = useState({
    store_name: '',
    contact_phone: '',
    bank_accounts: '',
    shipping_flat_cost: 0,
    payment_timeout_hours: 24,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  void loadingSettings;
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await spiApi.getSettings();
      if (res.success && res.data) {
        setSettingsForm({
          store_name: res.data.store_name || '',
          contact_phone: res.data.contact_phone || '',
          bank_accounts: res.data.bank_accounts || '',
          shipping_flat_cost: Number(res.data.shipping_flat_cost) || 0,
          payment_timeout_hours: Number(res.data.payment_timeout_hours) || 24,
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'pengaturan-toko') {
      fetchSettings();
    }
  }, [activeMenu]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await spiApi.updateSettings(settingsForm);
      if (res.success) {
        showFeedback('success', res.message || 'Pengaturan toko berhasil diperbarui.');
      }
    } catch (err: any) {
      showFeedback('error', err?.response?.data?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  // =========================================================================
  // S-3: MODAL EKSPOR EXCEL
  // =========================================================================
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportStatus, setExportStatus] = useState('all');
  const [exportCategory, setExportCategory] = useState('all');

  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleTriggerExcelExport = async () => {
    setDownloadingReport(true);
    try {
      await spiApi.downloadSalesReport({
        start_date: exportStartDate || undefined,
        end_date: exportEndDate || undefined,
        status: exportStatus !== 'all' ? exportStatus : undefined,
        category: exportCategory !== 'all' ? exportCategory : undefined,
      });
      setIsExportModalOpen(false);
      showFeedback('success', 'File Excel laporan penjualan berhasil diunduh.');
    } catch (err: any) {
      showFeedback('error', 'Gagal mengunduh laporan: ' + (err?.message || 'Error'));
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <SpiDashboardLayout
      activeMenuId={activeMenu}
      onSelectMenu={handleSelectMenu}
      userName={user?.name || 'Satuan Pengawas Internal'}
      userEmail={user?.email || 'owner.spi@cdepearls.com'}
      onNavigateHome={onNavigateHome}
      onOpenAdmin={onOpenAdmin}
      onLogout={onLogout}
    >
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border ${
            feedback.type === 'success'
              ? 'bg-[#E2F1E0] text-[#2B6330] border-[#2B6330]/30'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* =======================================================================
          1. MENU: RINGKASAN
         ======================================================================= */}
      {activeMenu === 'ringkasan' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageHeader
              title="Ringkasan Pusat Kendali SPI"
              description="Data metrik integritas transaksi, omzet database riil, produk terlaris, dan stok menipis CD'E Pearls Lombok."
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#4A5666] bg-[#F4F1EB] px-3 py-1.5 rounded-full border border-[#E6DDD0] inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{lastSyncLabel}</span>
              </span>
              <button
                type="button"
                onClick={fetchSummary}
                className="min-h-[42px] px-4 rounded-full border border-[#E6DDD0] text-[#12263A] hover:bg-[#F4F1EB] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all"
                title="Muat ulang data ringkasan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="min-h-[42px] px-5 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] inline-flex items-center gap-2 cursor-pointer shadow-md border border-[#D9B877]/40 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation (U-10: 5 Menu SPI dengan Audit Log sebagai sub-tab di Ringkasan) */}
          <div className="flex items-center gap-2 border-b border-[#E6DDD0] pb-2">
            <button
              type="button"
              onClick={() => setSummarySubTab('metrics')}
              className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                summarySubTab === 'metrics'
                  ? 'bg-[#12263A] text-[#D9B877] shadow-sm'
                  : 'bg-white text-[#4A5666] hover:bg-[#F4F1EB] border border-[#E6DDD0]'
              }`}
            >
              Metrik & Analisis
            </button>
            <button
              type="button"
              onClick={() => {
                setSummarySubTab('audit-log');
                fetchAuditLogs();
              }}
              className={`min-h-[38px] px-4 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                summarySubTab === 'audit-log'
                  ? 'bg-[#12263A] text-[#D9B877] shadow-sm'
                  : 'bg-white text-[#4A5666] hover:bg-[#F4F1EB] border border-[#E6DDD0]'
              }`}
            >
              Log Audit Forensik
            </button>
          </div>

          {summarySubTab === 'audit-log' ? (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <input
                    type="text"
                    placeholder="Cari pelaku, jenis aksi, IP address..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                    className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  className="min-h-[40px] px-4 rounded-full border border-[#E6DDD0] text-[#12263A] hover:bg-[#F4F1EB] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  <span>Segarkan Log</span>
                </button>
              </div>

              <DataTable>
                <thead>
                  <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                    <th className="py-3.5 px-4 text-left">Waktu &amp; Tanggal</th>
                    <th className="py-3.5 px-4 text-left">Pelaku &amp; Peran</th>
                    <th className="py-3.5 px-4 text-left">Aksi Sistem</th>
                    <th className="py-3.5 px-4 text-left">Target Objek</th>
                    <th className="py-3.5 px-4 text-left">Nilai Lama</th>
                    <th className="py-3.5 px-4 text-left">Nilai Baru</th>
                    <th className="py-3.5 px-4 text-left">Alamat IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
                  {auditLogList.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FBF8F3] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#4A5666] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#12263A]">{log.actor_name}</div>
                        <span className="text-[10px] text-[#4A5666] uppercase">{log.actor_role}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#12263A]">{log.action}</td>
                      <td className="py-3.5 px-4 text-[#4A5666] font-mono text-[11px]">
                        {log.target_type}:{log.target_id}
                      </td>
                      <td className="py-3.5 px-4 text-red-700 font-mono text-[11px] max-w-[140px] truncate" title={JSON.stringify(log.old_value)}>
                        {log.old_value ? JSON.stringify(log.old_value) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-mono text-[11px] max-w-[140px] truncate" title={JSON.stringify(log.new_value)}>
                        {log.new_value ? JSON.stringify(log.new_value) : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#4A5666] text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                  {auditLogList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#4A5666]">
                        Belum ada rekaman audit log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </DataTable>
            </div>
          ) : (
            <>
              {/* Revenue & Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Omzet Hari Ini"
              value={`Rp ${(summaryData?.revenue?.today || 0).toLocaleString('id-ID')}`}
              note="Transaksi Sah Database"
            />
            <StatCard
              label="Omzet 7 Hari Terakhir"
              value={`Rp ${(summaryData?.revenue?.days_7 || 0).toLocaleString('id-ID')}`}
              note="Akumulasi Mingguan"
            />
            <StatCard
              label="Omzet 30 Hari Terakhir"
              value={`Rp ${(summaryData?.revenue?.days_30 || 0).toLocaleString('id-ID')}`}
              note="Akumulasi Bulanan"
            />
            <StatCard
              label="Pelanggan Baru (30 Hari)"
              value={`${summaryData?.new_customers_count || 0} Akun`}
              note="Terdaftar Aktif"
            />
          </div>

          {/* 2-Columns: Pesanan per Status + Produk Terlaris */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Status Pesanan */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                <h3 className="font-serif text-lg font-semibold text-[#12263A]">
                  Jumlah Pesanan Berdasarkan Status
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveMenu('pesanan')}
                  className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
                >
                  Kelola Pesanan
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(summaryData?.orders_by_status || {}).map(([status, count]) => (
                  <div
                    key={status}
                    className="p-3.5 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0]/70 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-medium text-[#4A5666] uppercase truncate">{status}</span>
                    <span className="font-serif text-xl font-bold text-[#12263A] mt-1">{count}</span>
                  </div>
                ))}
                {(!summaryData?.orders_by_status || Object.keys(summaryData.orders_by_status).length === 0) && (
                  <div className="col-span-full py-6 text-center text-xs text-[#4A5666]">
                    Belum ada riwayat pesanan dalam database.
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Produk Terlaris */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                <h3 className="font-serif text-lg font-semibold text-[#12263A]">
                  5 Produk Mutiara Terlaris
                </h3>
                <span className="text-xs text-[#4A5666]">Berdasarkan Kuantitas Terjual</span>
              </div>
              <div className="mt-4 space-y-3">
                {summaryData?.top_products?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F4F1EB]/50 border border-[#E6DDD0]/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#12263A]">{item.product_name}</div>
                      <div className="text-[11px] text-[#4A5666] mt-0.5">
                        Terjual: <strong className="text-[#12263A]">{item.total_sold} unit</strong>
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-[#8A6A2F]">
                      Rp {Number(item.total_revenue).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
                {(!summaryData?.top_products || summaryData.top_products.length === 0) && (
                  <div className="py-6 text-center text-xs text-[#4A5666]">
                    Belum ada data penjualan produk.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stok Menipis (Alert Table) */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-lg font-semibold text-[#12263A]">
                  Peringatan Stok Menipis (Stok ≤ 3 Unit)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('produk-stok')}
                className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
              >
                Koreksi Stok di Menu Produk
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold bg-[#F4F1EB]/50">
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Produk Mutiara</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Harga</th>
                    <th className="py-2.5 px-3 text-center">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/60">
                  {summaryData?.low_stock_products?.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#FBF8F3]">
                      <td className="py-2.5 px-3 font-mono text-[#8A6A2F] font-bold">{prod.code}</td>
                      <td className="py-2.5 px-3 font-medium text-[#12263A]">
                        <div className="flex items-center gap-2">
                          {prod.image && (
                            <img
                              src={resolveMediaUrl(prod.image, '/images/placeholder_jewelry.svg')}
                              alt={prod.name}
                              className="w-7 h-7 rounded-md object-cover border border-[#E6DDD0] shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/placeholder_jewelry.svg';
                              }}
                            />
                          )}
                          <span>{prod.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#4A5666] capitalize">{prod.category_slug}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        Rp {Number(prod.price).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          {prod.stock} unit
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!summaryData?.low_stock_products || summaryData.low_stock_products.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-[#4A5666]">
                        ✓ Semua stok mutiara berada di batas aman (&gt; 3 unit).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* =======================================================================
          2. MENU: PESANAN (Daftar, Filter, Detail, Ubah Status State Machine)
         ======================================================================= */}
      {activeMenu === 'pesanan' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageHeader
              title="Pusat Kendali Pesanan Pelanggan"
              description="Pengawasan status alur pesanan (state machine), verifikasi pembayaran mutiara, dan rincian transaksi butik."
            />
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="min-h-[42px] px-5 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] inline-flex items-center gap-2 cursor-pointer shadow-md border border-[#D9B877]/40 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel Pesanan</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                placeholder="Cari nomor pesanan, nama pelanggan, telepon..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#4A5666]">Status:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'PENDING_PAYMENT', label: 'Menunggu Bayar' },
                { id: 'PROCESSING', label: 'Diproses' },
                { id: 'SHIPPED', label: 'Dikirim' },
                { id: 'COMPLETED', label: 'Selesai' },
                { id: 'CANCELLED', label: 'Dibatalkan' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(s.id)}
                  className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    orderStatusFilter === s.id
                      ? 'bg-[#12263A] text-white'
                      : 'bg-[#F4F1EB] text-[#4A5666] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">No. Pesanan</th>
                <th className="py-3.5 px-4 text-left">Waktu</th>
                <th className="py-3.5 px-4 text-left">Pelanggan</th>
                <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                <th className="py-3.5 px-4 text-center">Status Pesanan</th>
                <th className="py-3.5 px-4 text-center">Status Bayar</th>
                <th className="py-3.5 px-4 text-right">Tindakan SPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#8A6A2F]">
                    {ord.order_number}
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5666] whitespace-nowrap">
                    {new Date(ord.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#12263A]">{ord.customer_name}</div>
                    <div className="text-[11px] text-[#4A5666]">{ord.customer_phone || '-'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#12263A]">
                    Rp {Number(ord.total).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.order_status === 'COMPLETED'
                          ? 'bg-[#E2F1E0] text-[#2B6330]'
                          : ord.order_status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : ord.order_status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.order_status === 'PROCESSING'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.order_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.payment_status === 'PAID'
                          ? 'bg-[#E2F1E0] text-[#2B6330]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(ord);
                        setNewOrderStatus(ord.order_status);
                        setOrderStatusNotes('');
                        setSpiCourier(ord.courier || 'JNE Express (Berasuransi)');
                        setSpiTrackingNumber(ord.tracking_number || '');
                      }}
                      className="min-h-[34px] px-3.5 rounded-full bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian &amp; Status</span>
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#4A5666]">
                    Tidak ditemukan data pesanan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>

          {/* Modal Detail & Update Status */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-2xl bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#12263A]">
                      Rincian Pesanan #{selectedOrder.order_number}
                    </h3>
                    <p className="text-xs text-[#4A5666] mt-0.5">
                      Pelanggan: <strong className="text-[#12263A]">{selectedOrder.customer_name}</strong> ({selectedOrder.customer_phone})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-full hover:bg-[#F4F1EB] text-[#4A5666]"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs text-[#12263A] uppercase tracking-wider">
                    Daftar Barang Dipesan:
                  </h4>
                  <div className="divide-y divide-[#E6DDD0] border border-[#E6DDD0] rounded-xl overflow-hidden text-xs">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-[#FBF8F3] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#12263A]">{item.product_name}</div>
                          <div className="text-[11px] text-[#4A5666]">
                            {item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-[#8A6A2F]">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Financials */}
                <div className="p-3.5 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#4A5666]">Subtotal:</span>
                    <span>Rp {Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5666]">Ongkos Kirim:</span>
                    <span>Rp {Number(selectedOrder.shipping_cost || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A5666]">Diskon:</span>
                    <span>- Rp {Number(selectedOrder.discount_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E6DDD0] pt-1.5 font-bold text-sm text-[#12263A]">
                    <span>Total Pembayaran:</span>
                    <span className="text-[#8A6A2F]">Rp {Number(selectedOrder.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Audit Bukti Pembayaran (Read-Only untuk SPI) */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E6DDD0] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#12263A]">Audit Bukti Pembayaran (Read-Only)</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.payment_status === 'PAID' ? 'bg-[#E2F1E0] text-[#2B6330]' : 'bg-amber-100 text-amber-800'}`}>
                        Status Bayar: {selectedOrder.payment_status}
                      </span>
                    </div>
                    {selectedOrder.payments[0].proof_path && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setSpiPreviewProofUrl(`/api/v1/orders/${selectedOrder.id}/payments/${selectedOrder.payments[0].id}/proof`)}
                          className="px-3 py-1.5 rounded-lg bg-[#F4F1EB] hover:bg-[#EAE4D9] text-[#12263A] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-[#E6DDD0]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#8A6A2F]" />
                          <span>Lihat Berkas Bukti Transfer</span>
                        </button>
                        <span className="text-[11px] text-[#4A5666] truncate font-mono">
                          {selectedOrder.payments[0].proof_path}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* State Machine Update Form */}
                <form onSubmit={handleUpdateOrderStatus} className="space-y-3 pt-2 border-t border-[#E6DDD0] text-xs">
                  <h4 className="font-bold text-[#12263A] uppercase tracking-wider">
                    Ubah Status Pesanan (State Machine Logistik SPI)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#4A5666] mb-1 font-semibold">Pilih Status Baru:</label>
                      <select
                        value={newOrderStatus}
                        onChange={(e) => setNewOrderStatus(e.target.value)}
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-semibold text-[#12263A]"
                      >
                        <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu Bayar)</option>
                        <option value="PROCESSING">PROCESSING (Sedang Diproses/Dikemas)</option>
                        <option value="SHIPPED">SHIPPED (Dalam Pengiriman)</option>
                        <option value="COMPLETED">COMPLETED (Pesanan Selesai)</option>
                        <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#4A5666] mb-1 font-semibold">Catatan Otorisasi SPI:</label>
                      <input
                        type="text"
                        value={orderStatusNotes}
                        onChange={(e) => setOrderStatusNotes(e.target.value)}
                        placeholder="Contoh: Resi JNE telah diverifikasi valid"
                        className="w-full min-h-[42px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                      />
                    </div>
                  </div>

                  {/* Input Resi & Kurir saat SPI memilih status SHIPPED */}
                  {newOrderStatus === 'SHIPPED' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                      <div>
                        <label className="block text-[#12263A] mb-1 font-semibold">
                          Kurir Pengiriman <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={spiCourier}
                          onChange={(e) => setSpiCourier(e.target.value)}
                          placeholder="Contoh: JNE Express, J&T, SiCepat"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-blue-300 text-xs text-[#12263A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[#12263A] mb-1 font-semibold">
                          Nomor Resi Pengiriman <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={spiTrackingNumber}
                          onChange={(e) => setSpiTrackingNumber(e.target.value)}
                          placeholder="Contoh: JNE-9988221190"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-blue-300 text-xs font-mono font-bold text-[#12263A] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={updatingOrderStatus}
                      className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] cursor-pointer shadow-md border border-[#D9B877]/40"
                    >
                      {updatingOrderStatus ? 'Menyimpan...' : 'Terapkan Status Baru'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Preview Bukti Transfer untuk SPI */}
          {spiPreviewProofUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
              onClick={() => setSpiPreviewProofUrl(null)}
            >
              <div
                className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0] mb-3">
                  <h4 className="font-semibold text-sm text-[#12263A]">Audit Bukti Pembayaran</h4>
                  <button
                    type="button"
                    onClick={() => setSpiPreviewProofUrl(null)}
                    className="p-1 rounded-full hover:bg-[#F4F1EB] text-[#4A5666] cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#F4F1EB] rounded-2xl p-2">
                  <ProofImage
                    src={spiPreviewProofUrl}
                    orderId={selectedOrder?.id}
                    paymentId={selectedOrder?.payments?.[0]?.id}
                    proofPath={selectedOrder?.payments?.[0]?.proof_path}
                    alt="Bukti Transfer Penuh"
                    className="max-w-full max-h-[70vh] object-contain rounded-xl"
                    skeletonClassName="h-[50vh] w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          3. MENU: PRODUK DAN STOK (Lihat & Koreksi Stok Berlog)
         ======================================================================= */}
      {activeMenu === 'produk-stok' && (
        <div className="space-y-6">
          <PageHeader
            title="Pengawasan Fisik Produk &amp; Koreksi Stok"
            description="Koreksi stok mutiara secara presisi oleh SPI dengan pencatatan otomatis ke tabel stock_movements dan log audit."
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                placeholder="Cari nama perhiasan atau kode SKU..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStock()}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#12263A] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded text-[#12263A] focus:ring-[#D9B877]"
                />
                <span>Hanya Tampilkan Stok Menipis (≤ 3 Unit)</span>
              </label>
            </div>
          </div>

          {/* Stock Table */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">Kode SKU</th>
                <th className="py-3.5 px-4 text-left">Nama Produk Mutiara</th>
                <th className="py-3.5 px-4 text-left">Kategori &amp; Varietas</th>
                <th className="py-3.5 px-4 text-right">Harga Resmi</th>
                <th className="py-3.5 px-4 text-center">Stok On-Hand</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Tindakan SPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {stockList.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#8A6A2F]">
                    {prod.code}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#12263A]">
                    {prod.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#4A5666]">
                    <span className="capitalize">{prod.category_slug}</span> • {prod.pearl_variety || 'South Sea'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold">
                    Rp {Number(prod.price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold ${
                        prod.stock <= 0
                          ? 'bg-red-100 text-red-800'
                          : prod.stock <= 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#E2F1E0] text-[#2B6330]'
                      }`}
                    >
                      {prod.stock} unit
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.status === 'published'
                          ? 'bg-[#E2F1E0] text-[#2B6330]'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setStockModalProduct(prod);
                        setStockDelta(0);
                        setStockReason('');
                      }}
                      className="min-h-[34px] px-3.5 rounded-full bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Koreksi Stok</span>
                    </button>
                  </td>
                </tr>
              ))}
              {stockList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#4A5666]">
                    Tidak ditemukan data produk.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>

          {/* Modal Koreksi Stok */}
          {stockModalProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-md bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                  <h3 className="font-serif text-xl font-bold text-[#12263A]">
                    Koreksi Stok Fisik Mutiara
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(null)}
                    className="p-1 rounded-full text-[#4A5666] hover:bg-[#F4F1EB]"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] text-xs space-y-1">
                  <div className="font-bold text-[#12263A]">{stockModalProduct.name}</div>
                  <div className="text-[#4A5666]">Kode SKU: <strong className="font-mono text-[#8A6A2F]">{stockModalProduct.code}</strong></div>
                  <div className="text-[#4A5666]">Stok Saat Ini: <strong className="text-[#12263A]">{stockModalProduct.stock} unit</strong></div>
                </div>

                <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#12263A] mb-1">
                      Nilai Penyesuaian (Delta):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStockDelta((prev) => prev - 1)}
                        className="w-10 h-10 rounded-xl bg-[#F4F1EB] hover:bg-[#EDE6DA] text-[#12263A] flex items-center justify-center font-bold"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        required
                        value={stockDelta}
                        onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                        className="flex-1 min-h-[40px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-center font-mono font-bold text-sm text-[#12263A]"
                      />
                      <button
                        type="button"
                        onClick={() => setStockDelta((prev) => prev + 1)}
                        className="w-10 h-10 rounded-xl bg-[#F4F1EB] hover:bg-[#EDE6DA] text-[#12263A] flex items-center justify-center font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#4A5666] mt-1">
                      Stok akhir setelah penyesuaian:{' '}
                      <strong className="text-[#8A6A2F]">
                        {Math.max(0, stockModalProduct.stock + stockDelta)} unit
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#12263A] mb-1">
                      Alasan Koreksi (Wajib untuk Audit): <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                      placeholder="Contoh: Hasil stock opname brankas mutiara fisik butik Mataram"
                      className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStockModalProduct(null)}
                      className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingStock || stockDelta === 0 || !stockReason.trim()}
                      className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold hover:bg-[#1A3652] cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {savingStock ? 'Menyimpan...' : 'Simpan Koreksi Stok'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          4. MENU: PENGGUNA (Daftar, Ubah Peran, Bekukan; SPI Tidak Bisa Turunkan Dirinya Sendiri)
         ======================================================================= */}
      {activeMenu === 'pengguna' && (
        <div className="space-y-6">
          <PageHeader
            title="Pengawasan Akun Pengguna &amp; Hak Akses"
            description="Pengawasan RBAC, promosi peran admin/pelanggan, dan suspensi akun berisiko. Sesuai aturan tata kelola, SPI dilarang menurunkan dirinya sendiri."
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                placeholder="Cari nama pengguna, email, nomor HP..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4A5666]">Peran:</span>
              {(['all', 'admin', 'spi', 'user'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    userRoleFilter === r
                      ? 'bg-[#12263A] text-white'
                      : 'bg-[#F4F1EB] text-[#4A5666] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {r === 'all' ? 'Semua' : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">Nama &amp; Kontak</th>
                <th className="py-3.5 px-4 text-left">Email</th>
                <th className="py-3.5 px-4 text-left">Peran Saat Ini</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Ubah Peran</th>
                <th className="py-3.5 px-4 text-right">Tindakan Suspensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {userList.map((u) => {
                const isCurrentUser = user?.id && Number(user.id) === Number(u.id);
                const isActive = u.status === 'active';
                return (
                  <tr key={u.id} className="hover:bg-[#FBF8F3] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#12263A] flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#D9B877] text-[#12263A]">
                            Anda (SPI)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#4A5666]">{u.phone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#4A5666]">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'spi'
                            ? 'bg-[#12263A] text-[#D9B877]'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-[#E2F1E0] text-[#2B6330]' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Dibekukan'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-semibold text-[#12263A] cursor-pointer"
                        title={isCurrentUser ? 'SPI dilarang menurunkan dirinya sendiri' : 'Ubah peran'}
                      >
                        <option value="user">Pelanggan (user)</option>
                        <option value="admin">Admin Operasional</option>
                        <option value="spi">SPI (Pengawas)</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u)}
                        className={`min-h-[32px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'border border-red-300 text-red-700 hover:bg-red-50'
                            : 'bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652]'
                        }`}
                        title={isCurrentUser ? 'SPI tidak bisa membekukan dirinya sendiri' : 'Toggle status akun'}
                      >
                        {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{isActive ? 'Bekukan' : 'Aktifkan'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {userList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#4A5666]">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* =======================================================================
          5. MENU: AUDIT LOG (Siapa, Aksi, Kapan, IP; Append-Only)
         ======================================================================= */}
      {activeMenu === 'audit-log' && (
        <div className="space-y-6">
          <PageHeader
            title="Log Audit Forensik &amp; Jejak Rekam Sistem"
            description="Perekaman kronologis mutlak (append-only) seluruh aksi sistem: siapa, aksi, kapan, IP, nilai sebelum dan sesudah."
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                placeholder="Cari pelaku, jenis aksi, IP address..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={fetchAuditLogs}
              className="min-h-[40px] px-4 rounded-full border border-[#E6DDD0] text-[#12263A] hover:bg-[#F4F1EB] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>Segarkan Log</span>
            </button>
          </div>

          {/* Audit Logs Table */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4 text-left">Waktu &amp; Tanggal</th>
                <th className="py-3.5 px-4 text-left">Pelaku &amp; Peran</th>
                <th className="py-3.5 px-4 text-left">Aksi Sistem</th>
                <th className="py-3.5 px-4 text-left">Target Objek</th>
                <th className="py-3.5 px-4 text-left">Nilai Lama</th>
                <th className="py-3.5 px-4 text-left">Nilai Baru</th>
                <th className="py-3.5 px-4 text-left">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60 text-xs">
              {auditLogList.map((log) => (
                <tr key={log.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#4A5666] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#12263A]">{log.actor_name}</div>
                    <span className="text-[10px] text-[#4A5666] uppercase">{log.actor_role}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#12263A]">{log.action}</td>
                  <td className="py-3.5 px-4 text-[#4A5666] font-mono text-[11px]">
                    {log.target_type}:{log.target_id}
                  </td>
                  <td className="py-3.5 px-4 text-red-700 font-mono text-[11px] max-w-[140px] truncate" title={JSON.stringify(log.old_value)}>
                    {log.old_value ? JSON.stringify(log.old_value) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-mono text-[11px] max-w-[140px] truncate" title={JSON.stringify(log.new_value)}>
                    {log.new_value ? JSON.stringify(log.new_value) : '-'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#4A5666] text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
              {auditLogList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#4A5666]">
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* =======================================================================
          6. MENU: PENGATURAN TOKO (Nama, Kontak, Rekening, Biaya Kirim, Batas Bayar)
         ======================================================================= */}
      {activeMenu === 'pengaturan-toko' && (
        <div className="space-y-6">
          <PageHeader
            title="Pengaturan Parameter Toko &amp; Kebijakan Finansial"
            description="Konfigurasi parameter dasar operasional butik CD'E Pearls Lombok yang diawasi langsung oleh Satuan Pengawas Internal."
          />

          <div className="bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl">
            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div>
                <label htmlFor="store_name" className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                  Nama Resmi Toko / Butik <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="store_name" value={settingsForm.store_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                  placeholder="CD'E Pearls Lombok"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
              </div>

              <div>
                <label htmlFor="contact_phone" className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                  Nomor Kontak / WhatsApp Resmi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="contact_phone" value={settingsForm.contact_phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                  placeholder="081239887733"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
              </div>

              <div>
                <label htmlFor="bank_accounts" className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                  Daftar Rekening Bank untuk Transfer Manual <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  id="bank_accounts" value={settingsForm.bank_accounts}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_accounts: e.target.value })}
                  placeholder="BCA 056-8899-221 a.n CD'E Pearls Lombok; Mandiri 161-00-8877-112 a.n CD'E Pearls"
                  className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
                <p className="text-[11px] text-[#4A5666] mt-1">
                  Pisahkan rekening dengan tanda titik koma (;). Rekening ini muncul pada faktur pembayaran manual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shipping_flat_cost" className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                    Tarif Ongkir Standar Flat (Rp) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    id="shipping_flat_cost" value={settingsForm.shipping_flat_cost}
                    onChange={(e) => setSettingsForm({ ...settingsForm, shipping_flat_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-mono text-[#12263A] focus:outline-none focus:border-[#12263A]"
                  />
                </div>

                <div>
                  <label htmlFor="payment_timeout_hours" className="block font-semibold text-[#12263A] uppercase tracking-wider mb-1.5">
                    Batas Waktu Bayar Pesanan (Jam) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={168}
                    id="payment_timeout_hours" value={settingsForm.payment_timeout_hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, payment_timeout_hours: parseInt(e.target.value) || 24 })}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-mono text-[#12263A] focus:outline-none focus:border-[#12263A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6DDD0]">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] cursor-pointer shadow-md border border-[#D9B877]/40 inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D9B877]" />
                  <span>{savingSettings ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Toko'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL EKSPOR EXCEL (S-3)
         ======================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-[#E6DDD0] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#12263A] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#8A6A2F]" />
                <h3 className="font-serif text-xl font-bold text-[#12263A]">
                  Ekspor Laporan Penjualan Excel (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-full text-[#4A5666] hover:bg-[#F4F1EB]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4A5666]">
              Laporan terstruktur dengan 3 Sheet resmi (Ringkasan, Rincian Pesanan, Rincian Barang) yang dihasilkan secara streaming di server.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4A5666] font-semibold mb-1">Mulai Tanggal:</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>
                <div>
                  <label className="block text-[#4A5666] font-semibold mb-1">Sampai Tanggal:</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4A5666] font-semibold mb-1">Filter Status Pesanan:</label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                >
                  <option value="all">Semua Status</option>
                  <option value="COMPLETED">COMPLETED (Selesai)</option>
                  <option value="PROCESSING">PROCESSING (Diproses)</option>
                  <option value="SHIPPED">SHIPPED (Dikirim)</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu Bayar)</option>
                  <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#4A5666] font-semibold mb-1">Filter Kategori Produk:</label>
                <select
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full min-h-[40px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="kalung">Kalung</option>
                  <option value="gelang">Gelang</option>
                  <option value="cincin">Cincin</option>
                  <option value="anting">Anting</option>
                  <option value="liontin">Liontin</option>
                  <option value="bros">Bros</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DDD0]">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTriggerExcelExport}
                disabled={downloadingReport}
                className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] cursor-pointer shadow-md border border-[#D9B877]/40 inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#D9B877]" />
                <span>{downloadingReport ? "Mengunduh File..." : "Unduh File Excel (.xlsx)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SpiDashboardLayout>
  );
};
