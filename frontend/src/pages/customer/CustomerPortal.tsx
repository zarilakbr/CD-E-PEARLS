import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Heart,
  MapPin,
  User as UserIcon,
  LogOut,
  Search,
  MessageCircle,
  Plus,
  Trash2,
  CreditCard,
  ChevronRight,
  Package,
  CheckCircle2,
  RotateCcw,
  HelpCircle,
  Settings,
  Upload,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { DashboardLayout, type DashboardMenuItem } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProofImage } from '../../components/common/ProofImage';
import { getLatestPayment } from '../../lib/paymentUtils';
import { Stepper } from '../../components/common/Stepper';
import { ProductCard } from '../../components/common/ProductCard';
import type { MockOrder, MockNotification } from '../../types/models';
import { authApi, apiClient, addressApi, orderApi, notificationApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { GuestAccountHub } from './GuestAccountHub';
import { SiteLayout } from '../../layouts/SiteLayout';
import { useDashboardSync } from '../../hooks/useDashboardSync';
import { resolveMediaUrl } from '../../lib/media';

const getItemImage = (itemOrName?: any) => {
  if (typeof itemOrName === 'object' && itemOrName !== null) {
    if (itemOrName.image) return resolveMediaUrl(itemOrName.image, '/images/placeholder_jewelry.svg');
    if (itemOrName.product?.image) return resolveMediaUrl(itemOrName.product.image, '/images/placeholder_jewelry.svg');
  }
  return '/images/placeholder_jewelry.svg';
};

interface CustomerPortalProps {
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigate?: (tab: string) => void;
  onLogout: () => void;
  onAddToCart?: (productName: string) => void;
  initialMenu?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onNavigateHome,
  onNavigateCatalog,
  onNavigate,
  onLogout,
  onAddToCart,
  initialMenu,
}) => {
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState<string>(() => {
    if (initialMenu) return initialMenu === 'orders' ? 'my_orders' : initialMenu;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path === '/akun/pesanan') return 'my_orders';
    if (path === '/akun/status-pengiriman') return 'shipping_status';
    if (path === '/akun/notifikasi') return 'notifications';
    if (path === '/akun/favorit') return 'wishlist';
    if (path === '/akun/alamat') return 'addresses';
    if (path === '/akun/profil') return 'profile';
    return 'summary';
  });

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu === 'orders' ? 'my_orders' : initialMenu);
    }
  }, [initialMenu]);

  // Notifications State (Tahap V3b)
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const loadNotifications = React.useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await notificationApi.getNotifications();
      const list = Array.isArray(res) ? res : res?.data || [];
      setNotifications(list);
      setUnreadNotificationsCount(list.filter((n: MockNotification) => !n.read_at).length);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const handleMarkAsRead = async (id: number | string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      toast.success('Notifikasi ditandai sudah dibaca.');
    } catch (err) {
      toast.error('Gagal memperbarui status notifikasi.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadNotificationsCount(0);
      toast.success('Semua notifikasi ditandai sudah dibaca.');
    } catch (err) {
      toast.error('Gagal memperbarui notifikasi.');
    }
  };

  const handleDeleteNotification = async (id: number | string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadNotificationsCount((prev) => {
        const target = notifications.find((n) => n.id === id);
        return target && !target.read_at ? Math.max(0, prev - 1) : prev;
      });
      toast.success('Notifikasi berhasil dihapus.');
    } catch (err) {
      toast.error('Gagal menghapus notifikasi.');
    }
  };

  const handleClearAllNotifications = async () => {
    if (!window.confirm('Hapus semua riwayat notifikasi dari akun Anda?')) return;
    try {
      await notificationApi.clearNotifications();
      setNotifications([]);
      setUnreadNotificationsCount(0);
      toast.success('Semua notifikasi berhasil dibersihkan.');
    } catch (err) {
      toast.error('Gagal membersihkan notifikasi.');
    }
  };

  // Customer Orders State
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [orderStatusTab, setOrderStatusTab] = useState('Semua');
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  // Tracking Search State
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedTrackingOrder, setSearchedTrackingOrder] = useState<MockOrder | null>(null);

  // Wishlist & Cart Context
  const { wishlist, toggleWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlistProducts = wishlist;

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: 'Rumah',
    recipient: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    postalCode: '',
    fullAddress: '',
  });

  // Proof of Payment & Order Action State
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: '',
  });
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const prevCustomerOrdersVersionRef = React.useRef<string | null>(null);

  // Load customer orders from server
  const loadCustomerOrders = React.useCallback(() => {
    if (!user) return;
    apiClient.get('/user/orders')
      .then((res) => {
        const ords = res.data?.data || res.data;
        if (Array.isArray(ords)) {
          const mappedOrders: MockOrder[] = ords.map((o: any) => {
            const rawPayment = getLatestPayment(o.payments);
            const pStatus = (o.payment_status || rawPayment?.status || 'WAITING_PAYMENT').toUpperCase();
            const oStatus = (o.order_status || 'PENDING').toUpperCase();

            let displayStatus: MockOrder['status'] = 'Menunggu Pembayaran';
            if (oStatus === 'CANCELLED') {
              displayStatus = 'Dibatalkan';
            } else if (oStatus === 'DELIVERED' || oStatus === 'COMPLETED') {
              displayStatus = 'Selesai';
            } else if (oStatus === 'SHIPPED') {
              displayStatus = 'Dikirim';
            } else if (oStatus === 'PROCESSING') {
              displayStatus = 'Dikemas';
            } else if (pStatus === 'PAYMENT_REVIEW') {
              displayStatus = 'Menunggu Verifikasi';
            } else if (pStatus === 'PAID') {
              displayStatus = 'Lunas & Diproses';
            } else {
              displayStatus = 'Menunggu Pembayaran';
            }

            return {
              id: o.order_number || `#ORD-${o.id}`,
              rawId: o.id,
              orderNumber: o.order_number,
              date: o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
              customerName: o.customer_name || user?.name || 'Pelanggan Butik',
              customerEmail: o.customer_email || user?.email || '',
              customerPhone: o.customer_phone || '',
              shippingAddress: o.customer_address || '',
              city: o.city || 'Indonesia',
              productSummary: o.items?.map((it: any) => it.product?.name || it.product_name).join(', ') || 'Perhiasan Mutiara',
              items: (o.items || []).map((it: any) => ({
                productId: it.product_id,
                name: it.product?.name || it.product_name || 'Mutiara Lombok',
                pearlSize: it.pearl_size || '12 mm',
                metal: it.metal || 'Emas 18K',
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
              })),
              subtotal: Number(o.subtotal || o.total) || 0,
              shippingCost: Number(o.shipping_cost) || 0,
              insuranceCost: Number(o.insurance_cost) || 0,
              total: Number(o.total) || 0,
              paymentMethod: o.payment_method || 'TRANSFER_BANK',
              paymentStatus: pStatus,
              orderStatus: oStatus,
              notes: o.notes || '',
              rejectionReason: rawPayment?.notes || o.notes || '',
              paymentProofPath: rawPayment?.proof_path || '',
              paymentProofUrl: rawPayment ? `/api/v1/orders/${o.id}/payments/${rawPayment.id}/proof` : undefined,
              payments: o.payments || [],
              status: displayStatus,
              trackingNumber: o.tracking_number,
              courier: o.courier || 'JNE Express (Berasuransi)',
              timeline: (o.status_histories || []).map((h: any) => ({
                status: h.status,
                date: h.created_at ? new Date(h.created_at).toLocaleString('id-ID') : '',
                description: h.notes || '',
                completed: true,
              })),
            };
          });
          setOrders(mappedOrders);
        }
      })
      .catch(() => {});
  }, [user]);

  // Real-time synchronization layer with 60s ETag polling (Tahap V2c & Tahap V3b)
  const { lastSyncLabel } = useDashboardSync({
    enabled: !!user,
    role: 'customer',
    intervalMs: 60000,
    onStatusChange: (_newStatus, _oldStatus, _latestOrder) => {
      loadCustomerOrders();
    },
    onDataUpdated: (data) => {
      if (data.orders_version && data.orders_version !== prevCustomerOrdersVersionRef.current) {
        prevCustomerOrdersVersionRef.current = data.orders_version;
        loadCustomerOrders();
      } else if (data.latest_order) {
        loadCustomerOrders();
      }
    },
  });

  // Keep selectedOrder in sync when orders list is updated via polling
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find(o => o.id === selectedOrder.id || (selectedOrder.rawId && o.rawId === selectedOrder.rawId));
      if (refreshed) {
        setSelectedOrder(refreshed);
      }
    }
  }, [orders]);

  // Load customer shipping addresses
  const loadAddresses = React.useCallback(() => {
    if (!user) return;
    addressApi.getAddresses()
      .then((adds) => {
        if (Array.isArray(adds)) {
          setAddresses(adds);
        }
      })
      .catch(() => {});
  }, [user]);

  // Load live customer data from API
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: '',
      });

      loadCustomerOrders();
      loadAddresses();
      refreshWishlist();
      loadNotifications();
    }
  }, [user, loadCustomerOrders, loadAddresses, refreshWishlist, loadNotifications]);

  useEffect(() => {
    if (activeMenu === 'notifications') {
      loadNotifications();
    }
  }, [activeMenu, loadNotifications]);

  // Logout Dialog State
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Sidebar Menu Items for Customer (Tunggal: tanpa menu keluar ganda di sidebar)
  const menuItems: DashboardMenuItem[] = [
    { id: 'summary', label: 'Ringkasan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'my_orders', label: 'Pesanan Saya', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.length },
    { id: 'shipping_status', label: 'Status Pengiriman', icon: <Truck className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifikasi', icon: <Bell className="w-4 h-4" />, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
    { id: 'wishlist', label: 'Koleksi Favorit', icon: <Heart className="w-4 h-4" />, badge: wishlistProducts.length },
    { id: 'addresses', label: 'Alamat', icon: <MapPin className="w-4 h-4" /> },
    { id: 'profile', label: 'Profil Akun', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const handleSelectMenu = (id: string) => {
    setActiveMenu(id);
    const pathMap: Record<string, string> = {
      summary: '/akun',
      my_orders: '/akun/pesanan',
      orders: '/akun/pesanan',
      shipping_status: '/akun/status-pengiriman',
      tracking: '/akun/status-pengiriman',
      notifications: '/akun/notifikasi',
      wishlist: '/akun/favorit',
      addresses: '/akun/alamat',
      profile: '/akun/profil',
    };
    const targetPath = pathMap[id] || '/akun';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase().includes(trackingQuery.toLowerCase()) ||
        o.trackingNumber?.toLowerCase().includes(trackingQuery.toLowerCase())
    );
    setSearchedTrackingOrder(found || null);
  };

  // Address Actions (API-backed)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.recipient.trim() || !newAddress.fullAddress.trim()) {
      toast.error('Nama penerima dan alamat lengkap wajib diisi.');
      return;
    }
    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, {
          label: newAddress.label || 'Rumah',
          recipient_name: newAddress.recipient,
          phone: newAddress.phone || '+62 812-0000-0000',
          address_line: newAddress.fullAddress,
          city: newAddress.city || 'Indonesia',
          province: newAddress.province || '-',
          postal_code: newAddress.postalCode || '83115',
        });
        toast.success('Alamat berhasil diperbarui.');
      } else {
        await addressApi.createAddress({
          label: newAddress.label || 'Rumah',
          recipient_name: newAddress.recipient,
          phone: newAddress.phone || '+62 812-0000-0000',
          address_line: newAddress.fullAddress,
          city: newAddress.city || 'Indonesia',
          province: newAddress.province || '-',
          postal_code: newAddress.postalCode || '83115',
          is_default: addresses.length === 0,
        });
        toast.success('Alamat baru berhasil ditambahkan.');
      }
      setIsAddressModalOpen(false);
      setEditingAddress(null);
      setNewAddress({
        label: 'Rumah',
        recipient: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        postalCode: '',
        fullAddress: '',
      });
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan alamat.');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Hapus alamat ini dari buku alamat?')) return;
    try {
      await addressApi.deleteAddress(id);
      toast.success('Alamat pengiriman telah dihapus.');
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus alamat.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      toast.success('Alamat utama berhasil diperbarui.');
      loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menetapkan alamat utama.');
    }
  };

  // Order Actions (API-backed)
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!confirm(`Apakah Anda yakin ingin membatalkan pesanan ${selectedOrder.id}?`)) return;
    setIsCancellingOrder(true);
    try {
      const res = await orderApi.cancelOrder(selectedOrder.id);
      toast.success(res.message || 'Pesanan berhasil dibatalkan dan stok dikembalikan.');
      loadCustomerOrders();
      setSelectedOrder((prev) => prev ? { ...prev, status: 'Dibatalkan' } : null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan.');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !proofFile) {
      toast.error('Mohon pilih berkas foto bukti transfer terlebih dahulu.');
      return;
    }
    setIsUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append('proof_image', proofFile);
      if (proofNotes.trim()) {
        fd.append('notes', proofNotes.trim());
      }
      const res = await orderApi.uploadProof(selectedOrder.id, fd);
      toast.success(res.message || 'Bukti transfer berhasil diunggah. Kami akan memverifikasi pembayaran Anda.');
      setIsProofModalOpen(false);
      setProofFile(null);
      setProofNotes('');
      loadCustomerOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Password Security Action (API-backed)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordUpdateMessage('Kata sandi lama dan baru wajib diisi.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordUpdateMessage('Kata sandi baru minimal 12 karakter.');
      return;
    }
    if (newPassword !== newPasswordConfirmation) {
      setPasswordUpdateMessage('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordUpdateMessage(null);
    try {
      await authApi.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      });
      setPasswordUpdateMessage('Kata sandi Anda berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      toast.success('Kata sandi berhasil diperbarui.');
      setTimeout(() => setPasswordUpdateMessage(null), 4000);
    } catch (err: any) {
      setPasswordUpdateMessage(err.response?.data?.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <SiteLayout
        currentTab="akun"
        onNavigate={(tab) => {
          if (tab === 'home') onNavigateHome();
          else if (tab === 'catalog') onNavigateCatalog();
          else if (onNavigate) onNavigate(tab);
        }}
      >
        <GuestAccountHub />
      </SiteLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarTitle="Akun Saya"
      menuItems={menuItems}
      activeMenuId={activeMenu}
      onSelectMenu={handleSelectMenu}
      userRole="user"
      userName={profileData.name}
      userEmail={profileData.email}
      onNavigateHome={onNavigateHome}
      websiteNavLinks={[
        { id: 'home', label: 'Home' },
        { id: 'catalog', label: 'Koleksi Produk' },
        { id: 'studio', label: 'Studio 3D' },
        { id: 'education', label: 'Edukasi Mutiara' },
        { id: 'about', label: 'Tentang Kami' },
      ]}
      onNavigateWebsite={(tab) => {
        if (tab === 'home') onNavigateHome();
        else if (tab === 'catalog') onNavigateCatalog();
        else if (onNavigate) onNavigate(tab);
      }}
      onLogout={() => setIsLogoutDialogOpen(true)}
    >
      {/* ========================================================
          4.1 RINGKASAN
         ======================================================== */}
      {activeMenu === 'summary' && (
        <>
          {/* MOBILE MARKETPLACE SUMMARY (< lg) - TAHAP Q8 */}
          <div className="lg:hidden space-y-4 pb-24 animate-in fade-in duration-300">
            {/* Foto profil kecil + nama + email + status keanggotaan (Emas/Perak) */}
            <div className="bg-white dark:bg-[#12263A] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D9B877] shrink-0 shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-[var(--text)] truncate">{profileData.name}</h3>
                  <p className="text-xs text-[var(--text-2)] truncate">{profileData.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#D9B877]/20 text-[#8A6A2F] dark:text-[#D9B877] border border-[#D9B877]/30 shrink-0 ml-2">
                Member Emas
              </span>
            </div>

            <div className="flex items-center justify-between px-2 text-[11px] text-[var(--text-2)]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {lastSyncLabel}
              </span>
            </div>

            {/* Lima status pesanan ala marketplace: Belum bayar, Dikemas, Dikirim, Selesai, Retur */}
            <div className="bg-white dark:bg-[#12263A] border border-[var(--border)] rounded-2xl p-3 shadow-2xs">
              <div className="text-[12px] font-semibold text-[var(--text)] mb-2 px-1">
                Status Pesanan
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Belum bayar', icon: CreditCard, count: orders.filter(o => o.status === 'Menunggu Pembayaran').length, tab: 'Menunggu Pembayaran' },
                  { label: 'Dikemas', icon: Package, count: orders.filter(o => o.status === 'Dikemas').length, tab: 'Dikemas' },
                  { label: 'Dikirim', icon: Truck, count: orders.filter(o => o.status === 'Dikirim').length, tab: 'Dikirim' },
                  { label: 'Selesai', icon: CheckCircle2, count: orders.filter(o => o.status === 'Selesai').length, tab: 'Selesai' },
                  { label: 'Retur', icon: RotateCcw, count: 0, tab: 'Semua' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOrderStatusTab(item.tab);
                        handleSelectMenu('my_orders');
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[var(--bg-dash)] transition-colors relative cursor-pointer"
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5 text-[#8A6A2F] dark:text-[#D9B877]" />
                        {item.count > 0 && (
                          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#BA4E4E] text-white text-[10px] font-bold flex items-center justify-center">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] mt-1.5 text-[var(--text-2)] font-medium truncate w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pesanan aktif terakhir (maksimal 2 kartu ringkas dengan status, foto kecil, tombol 'Lacak', 'Ulas', 'Beli lagi') */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[var(--text)]">Pesanan Terakhir</span>
                <button
                  type="button"
                  onClick={() => handleSelectMenu('my_orders')}
                  className="text-xs text-[#8A6A2F] dark:text-[#D9B877] font-semibold hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              {orders.length === 0 && (
                <div className="bg-white dark:bg-[#12263A] border border-[var(--border)] rounded-2xl p-6 text-center shadow-2xs">
                  <p className="text-xs text-[var(--text-2)]">Belum ada pesanan aktif</p>
                </div>
              )}

              {orders.slice(0, 2).map((ord) => (
                <div key={ord.id} className="bg-white dark:bg-[#12263A] border border-[var(--border)] rounded-2xl p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--border)]">
                    <span className="font-mono text-[var(--text-2)]">{ord.id}</span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <div className="flex gap-3 items-center">
                    <img
                      src={getItemImage(ord.items[0])}
                      alt={ord.items[0]?.name || ''}
                      className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text)] line-clamp-1">{ord.items[0]?.name}</p>
                      <p className="text-xs font-bold text-[#8A6A2F] dark:text-[#D9B877] mt-0.5">Rp {ord.total.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(ord);
                        handleSelectMenu('my_orders');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-dash)] transition-colors"
                    >
                      Lacak
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success(`Ulasan untuk pesanan ${ord.id} dibuka`);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-dash)] transition-colors"
                    >
                      Ulas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onAddToCart) onAddToCart(ord.items[0]?.name);
                        toast.success(`✓ Ditambahkan ke keranjang belanja`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#D9B877] text-[#12263A] text-xs font-semibold hover:bg-[#E5C98F] transition-colors"
                    >
                      Beli lagi
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tautan baris: Alamat Tersimpan, Pengaturan Akun, Bantuan, Keluar */}
            <div className="bg-white dark:bg-[#12263A] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)] overflow-hidden shadow-2xs">
              {[
                { label: 'Alamat Tersimpan', icon: MapPin, onClick: () => handleSelectMenu('addresses') },
                { label: 'Pengaturan Akun', icon: Settings, onClick: () => handleSelectMenu('profile') },
                { label: 'Bantuan', icon: HelpCircle, onClick: () => { window.location.href = '/bantuan'; } },
                { label: 'Keluar', icon: LogOut, onClick: () => setIsLogoutDialogOpen(true), isDanger: true },
              ].map((row, idx) => {
                const Icon = row.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={row.onClick}
                    className={`w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-xs font-medium transition-colors hover:bg-[var(--bg-dash)] cursor-pointer ${
                      row.isDanger ? 'text-[#BA4E4E]' : 'text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{row.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP SUMMARY (lg:block) */}
          <div className="hidden lg:block space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <PageHeader
                title={`Halo, ${profileData.name}`}
                description="Selamat datang di akun pribadi perhiasan CD'E Pearls. Pantau pesanan aktif Anda dan koleksi mutiara favorit."
              />
              <span className="text-[11px] font-medium text-[#4A5666] bg-[#F4F1EB] px-3 py-1.5 rounded-full border border-[#E6DDD0] inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{lastSyncLabel}</span>
              </span>
            </div>

          {/* 3 Kartu Ringkasan Pelanggan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              label="Pesanan Aktif"
              value={`${orders.filter(o => o.status === 'Dikirim' || o.status === 'Dikemas').length} Pesanan`}
              note={orders.filter(o => o.status === 'Dikirim' || o.status === 'Dikemas').length > 0 ? `${orders.filter(o => o.status === 'Dikirim' || o.status === 'Dikemas').length} perhiasan dalam pengiriman` : 'Tidak ada pengiriman aktif'}
            />
            <StatCard
              label="Menunggu Pembayaran"
              value={`${orders.filter(o => o.status === 'Menunggu Pembayaran').length} Pesanan`}
              note={orders.filter(o => o.status === 'Menunggu Pembayaran').length > 0 ? 'Batas transfer 24 jam' : 'Semua tagihan lunas'}
            />
            <StatCard
              label="Koleksi Favorit"
              value={`${wishlistProducts.length} Perhiasan`}
              note={wishlistProducts.length > 0 ? 'Tersimpan di wishlist Anda' : 'Belum ada mutiara tersimpan'}
            />
          </div>

          {/* Panel Lacak Pesanan (4 Tahap Stepper) */}
          {orders[0] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                    Pelacak Logistik
                  </span>
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                    Lacak Pesanan Terkini {orders[0].id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu('shipping_status')}
                  className="text-xs font-semibold text-[#8A6A2F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Riwayat Perjalanan Lengkap</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const s = orders[0].status;
                const isPaid = s !== 'Menunggu Pembayaran';
                const isProcessing = s === 'Dikemas' || s === 'Dikirim' || s === 'Selesai';
                const isShipped = s === 'Dikirim' || s === 'Selesai';
                const isDelivered = s === 'Selesai';

                const steps = [
                  { label: 'Dibayar', statusText: isPaid ? 'Tuntas' : 'Menunggu', completed: isPaid, current: !isPaid },
                  { label: 'Dikemas', statusText: isProcessing ? 'Tuntas' : (isPaid ? 'Sedang diproses' : 'Menunggu'), completed: isProcessing, current: isPaid && !isProcessing },
                  { label: 'Dikirim', statusText: isShipped ? 'Tuntas' : (isProcessing ? 'Sedang dikirim' : 'Menunggu'), completed: isShipped, current: isProcessing && !isShipped },
                  { label: 'Diterima', statusText: isDelivered ? 'Tuntas' : 'Menunggu', completed: isDelivered, current: isShipped && !isDelivered },
                ];

                return (
                  <Stepper
                    steps={steps}
                    trackingNumber={orders[0].trackingNumber || '-'}
                    courier={orders[0].courier || 'Kurir Rekanan'}
                  />
                );
              })()}
            </div>
          )}

          {/* Dua Kolom: Profil Saya & Riwayat Pesanan Ringkas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profil Saya (1 Col) */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Data Akun
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                  Profil Saya
                </h3>

                <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-[#E6DDD0]">
                  <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-[#D9B877] shrink-0 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-[#12263A]">{profileData.name}</h4>
                    <span className="text-xs text-[#4A5666]">{profileData.email}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#4A5666]">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-[#12263A]">WhatsApp</span>
                    <span>{profileData.phone}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-[#12263A]">Alamat Utama</span>
                    <span>{addresses[0]?.fullAddress}, {addresses[0]?.city}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMenu('profile')}
                className="mt-6 w-full min-h-[44px] rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A] hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                Ubah Profil Akun
              </button>
            </div>

            {/* Riwayat Pesanan Ringkas (2 Cols) */}
            <div className="lg:col-span-2 bg-white border border-[#E6DDD0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                      Transaksi
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                      Riwayat Pesanan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('my_orders')}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E6DDD0] text-[#4A5666]">
                        <th className="py-2.5 px-3">No. Pesanan</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Produk</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DDD0]/60">
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[#4A5666]">
                            Belum ada riwayat pesanan.
                          </td>
                        </tr>
                      )}
                      {orders.slice(0, 3).map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => {
                            setSelectedOrder(o);
                            setActiveMenu('my_orders');
                          }}
                          className="hover:bg-[#F4F1EB] cursor-pointer"
                        >
                          <td className="py-3 px-3 font-mono font-medium text-[#12263A]">{o.id}</td>
                          <td className="py-3 px-3 text-[#4A5666]">{o.date}</td>
                          <td className="py-3 px-3 text-[#12263A] font-medium truncate max-w-[180px]">{o.productSummary}</td>
                          <td className="py-3 px-3 font-serif font-semibold text-[#12263A]">Rp {o.total.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-3"><StatusBadge status={o.status} size="sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Koleksi Favorit: 4 kartu gambar X, nama, harga */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Wishlist
                </span>
                <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                  Koleksi Favorit Anda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('wishlist')}
                className="text-xs font-semibold text-[#8A6A2F] hover:underline"
              >
                Lihat Semua ({wishlistProducts.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {wishlistProducts.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  category={p.category}
                  variety={p.variety}
                  grade={p.grade}
                  pearlSize={p.pearlSize}
                  metal={p.metal}
                  price={p.price}
                  formattedPrice={p.formattedPrice}
                  isWishlisted={true}
                  onAddToCart={() => onAddToCart?.(p.name)}
                />
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      {/* ========================================================
          4.2 PESANAN SAYA
         ======================================================== */}
      {(activeMenu === 'my_orders' || activeMenu === 'orders') && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Pesanan Saya"
            description="Daftar seluruh pesanan perhiasan mutiara Anda, rincian pembayaran, dan tautan invoice resmi."
          />

          {selectedOrder ? (
            /* Detail Pesanan Pelanggan */
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8 space-y-6 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6DDD0]">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline mb-1 cursor-pointer"
                  >
                    ← Kembali ke daftar pesanan
                  </button>
                  <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#12263A]">
                    Rincian Pesanan {selectedOrder.id}
                  </h2>
                  <span className="text-xs text-[#4A5666]">Dipesan pada {selectedOrder.date}</span>
                </div>
                <div>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              {/* Linimasa Status Pesanan 5 Tahap */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF8F3] border border-[#E6DDD0] space-y-3">
                <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Linimasa Status Pesanan
                </h4>
                {selectedOrder.status === 'Dibatalkan' ? (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    ✕ Pesanan ini telah dibatalkan. {selectedOrder.notes ? `Catatan: ${selectedOrder.notes}` : ''}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { step: 1, label: 'Menunggu Bayar', active: selectedOrder.status === 'Menunggu Pembayaran', done: selectedOrder.paymentStatus !== 'WAITING_PAYMENT' || selectedOrder.status !== 'Menunggu Pembayaran' },
                      { step: 2, label: 'Verifikasi', active: selectedOrder.paymentStatus === 'PAYMENT_REVIEW' || selectedOrder.status === 'Menunggu Verifikasi', done: ['Lunas & Diproses', 'Dikemas', 'Dikirim', 'Selesai'].includes(selectedOrder.status) },
                      { step: 3, label: 'Diproses / Lunas', active: selectedOrder.status === 'Lunas & Diproses' || selectedOrder.status === 'Dikemas', done: ['Dikirim', 'Selesai'].includes(selectedOrder.status) },
                      { step: 4, label: 'Dikirim (Resi)', active: selectedOrder.status === 'Dikirim', done: selectedOrder.status === 'Selesai' },
                      { step: 5, label: 'Selesai', active: selectedOrder.status === 'Selesai', done: selectedOrder.status === 'Selesai' },
                    ].map((st) => (
                      <div
                        key={st.step}
                        className={`p-2.5 rounded-xl border transition-all ${
                          st.active
                            ? 'bg-[#12263A] text-[#D9B877] border-[#12263A] font-bold shadow-xs'
                            : st.done
                            ? 'bg-[#E2F1E0] text-[#2B6330] border-[#C3E4C0] font-medium'
                            : 'bg-white text-[#8A95A5] border-[#E6DDD0]'
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wider mb-0.5">Langkah {st.step}</div>
                        <div className="text-xs truncate">{st.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Banner Penolakan Pembayaran (Jika Ada) */}
                {selectedOrder.status === 'Menunggu Pembayaran' && (selectedOrder.rejectionReason || selectedOrder.notes?.toLowerCase().includes('ditolak')) && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>⚠️ Bukti Pembayaran Sebelumnya Ditolak</span>
                    </p>
                    <p className="text-[11px] text-red-700">
                      Alasan: <strong>{selectedOrder.rejectionReason || selectedOrder.notes}</strong>
                    </p>
                    <p className="text-[11px] text-red-600">
                      Silakan unggah ulang bukti transfer yang jelas dan sesuai nominal tagihan melalui tombol di bawah.
                    </p>
                  </div>
                )}

                {/* Info Verifikasi Sedang Berjalan */}
                {(selectedOrder.paymentStatus === 'PAYMENT_REVIEW' || selectedOrder.status === 'Menunggu Verifikasi') && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <p className="font-semibold">✓ Bukti Transfer Telah Diterima</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Tim kasir butik kami sedang memverifikasi mutasi bank. Status pesanan akan otomatis berganti ke "Diproses" setelah diverifikasi.
                    </p>
                  </div>
                )}

                {/* Berkas Bukti Transfer Pelanggan (jika ada) */}
                {selectedOrder.paymentProofUrl && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E6DDD0] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#12263A]">Bukti Transfer Pembayaran</span>
                      <span className="text-[11px] text-[#8A6A2F]">
                        {selectedOrder.paymentStatus === 'PAID' ? '✓ Telah Terverifikasi' : 'Sedang Ditinjau'}
                      </span>
                    </div>
                    <div className="w-28 h-28 rounded-lg overflow-hidden border border-[#E6DDD0] bg-[#12263A] shadow-xs">
                      <ProofImage
                        src={selectedOrder.paymentProofUrl}
                        orderId={selectedOrder.id}
                        paymentId={getLatestPayment(selectedOrder.payments)?.id}
                        proofPath={selectedOrder.paymentProofPath}
                        alt="Bukti Transfer Anda"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Info Pengiriman & Resi */}
                {selectedOrder.status === 'Dikirim' && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">🚚 Pesanan Sedang Dikirim</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Kurir: <strong>{selectedOrder.courier || 'JNE Express'}</strong>
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-700">Nomor Resi: </span>
                      <strong className="font-mono text-sm text-[#12263A] bg-white px-2.5 py-1 rounded-md border border-blue-300">
                        {selectedOrder.trackingNumber || '-'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Daftar Item Perhiasan
                </h4>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0]">
                    <div className="flex items-center gap-3">
                      <div className="w-13 h-13 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                        <img
                          src={getItemImage(it)}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="font-serif font-semibold text-[#12263A] text-base">{it.name}</h5>
                        <p className="text-xs text-[#4A5666]">{it.pearlSize} • {it.metal}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#4A5666]">{it.quantity} barang</span>
                      <div className="font-serif font-bold text-base text-[#12263A]">
                        Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alamat & Ringkasan Pembayaran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E6DDD0]">
                <div>
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-1">
                    Alamat Pengantaran
                  </h4>
                  <p className="text-sm font-semibold text-[#12263A]">{selectedOrder.customerName}</p>
                  <p className="text-xs text-[#4A5666] mt-0.5">{selectedOrder.shippingAddress}, {selectedOrder.city}</p>
                  <p className="text-xs text-[#4A5666] mt-0.5">{selectedOrder.customerPhone}</p>
                </div>

                <div>
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-1">
                    Ringkasan Pembayaran
                  </h4>
                  <div className="text-xs space-y-1 text-[#4A5666]">
                    <div className="flex justify-between"><span>Metode:</span><span className="font-medium text-[#12263A]">{selectedOrder.paymentMethod}</span></div>
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span>Asuransi Pengiriman:</span><span>Rp {selectedOrder.insuranceCost.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between pt-2 border-t border-[#E6DDD0] text-sm font-bold text-[#12263A]">
                      <span>Total Tagihan:</span>
                      <span className="font-serif text-lg">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi: Bayar Sekarang & WhatsApp */}
              <div className="pt-6 border-t border-[#E6DDD0] flex flex-wrap items-center justify-between gap-3">
                <a
                  href={`https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20ingin%20menanyakan%20pesanan%20${selectedOrder.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-6 rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#F4F1EB] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#8A6A2F]" />
                  <span>Hubungi via WhatsApp</span>
                </a>

                {selectedOrder.status === 'Menunggu Pembayaran' && (
                  <div className="flex items-center gap-2">
                    {/* Batalkan hanya jika WAITING_PAYMENT */}
                    {selectedOrder.paymentStatus === 'WAITING_PAYMENT' && (
                      <button
                        type="button"
                        onClick={handleCancelOrder}
                        disabled={isCancellingOrder}
                        className="min-h-[44px] px-5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isCancellingOrder ? 'Membatalkan...' : 'Batalkan Pesanan'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsProofModalOpen(true)}
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#D9B877]" />
                      <span>{selectedOrder.rejectionReason ? 'Unggah Ulang Bukti Bayar' : 'Unggah Bukti Bayar'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Unggah Bukti Bayar */}
              {isProofModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                  <div className="bg-white border border-[#E6DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                          Unggah Bukti Pembayaran
                        </h3>
                        <p className="text-xs text-[#4A5666] mt-0.5">
                          Pesanan {selectedOrder.id} • Total Rp {selectedOrder.total.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProofModalOpen(false);
                          setProofFile(null);
                          setProofNotes('');
                        }}
                        className="text-[#4A5666] hover:text-[#12263A] text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUploadProofSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#12263A] mb-1.5">
                          Foto Bukti Transfer (JPG, PNG, atau WebP, maks. 5 MB) *
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProofFile(e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-[#4A5666] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#12263A] file:text-white hover:file:bg-[#1A3652] cursor-pointer"
                        />
                        {proofFile && (
                          <p className="text-[11px] text-[#8A6A2F] mt-1 font-medium">
                            ✓ Berkas terpilih: {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#12263A] mb-1.5">
                          Catatan / Referensi Transfer (Opsional)
                        </label>
                        <textarea
                          rows={2}
                          value={proofNotes}
                          onChange={(e) => setProofNotes(e.target.value)}
                          placeholder="Contoh: Transfer via m-BCA a.n. Siti Rahma"
                          className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                        />
                      </div>

                      <div className="pt-3 border-t border-[#E6DDD0] flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProofModalOpen(false);
                            setProofFile(null);
                            setProofNotes('');
                          }}
                          className="min-h-[42px] px-5 rounded-full border border-[#12263A] text-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isUploadingProof || !proofFile}
                          className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingProof ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tabel Daftar Pesanan */
            <div>
              {/* Tab status */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {['Semua', 'Menunggu Pembayaran', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setOrderStatusTab(tab)}
                    className={`min-h-[38px] px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      orderStatusTab === tab
                        ? 'bg-[#12263A] text-white'
                        : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <DataTable>
                <thead>
                  <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                    <th className="py-3.5 px-4">No. Pesanan</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Perhiasan</th>
                    <th className="py-3.5 px-4">Total Belanja</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/60">
                  {orders
                    .filter(o => orderStatusTab === 'Semua' ? true : o.status === orderStatusTab)
                    .map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-[#F4F1EB]/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-[#12263A]">{order.id}</td>
                        <td className="py-3.5 px-4 text-xs text-[#4A5666]">{order.date}</td>
                        <td className="py-3.5 px-4 font-medium text-[#12263A] truncate max-w-[220px]">{order.productSummary}</td>
                        <td className="py-3.5 px-4 font-serif font-semibold text-[#12263A]">
                          Rp {order.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-xs font-semibold text-[#8A6A2F] hover:underline">Detail →</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </DataTable>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4.3 STATUS PENGIRIMAN
         ======================================================== */}
      {activeMenu === 'shipping_status' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Lacak Pengiriman Pesanan"
            description="Pantau posisi paket perhiasan mutiara Anda yang dikirim melalui kurir berasuransi khusus."
          />

          {/* Kolom Cari: Masukkan Nomor Pesanan atau Nomor Resi */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 max-w-2xl">
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block mb-2">
              Pencarian Resi &amp; Pesanan
            </span>
            <form onSubmit={handleSearchTracking} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Masukkan no. pesanan misal #[ORD-2026-081] atau no. resi JNE"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
                <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer shrink-0"
              >
                Lacak
              </button>
            </form>
          </div>

          {searchedTrackingOrder ? (
            <div className="space-y-6">
              {/* Stepper 4 Tahap */}
              <Stepper
                steps={[
                  { label: 'Dibayar', statusText: 'Selesai', date: '28 Okt, 15:00', completed: true },
                  { label: 'Dikemas', statusText: 'Selesai', date: '28 Okt, 16:30', completed: true },
                  { label: 'Dikirim', statusText: 'Sedang berjalan', date: '29 Okt, 09:15', completed: true, current: true },
                  { label: 'Diterima', statusText: 'Menunggu', date: 'Estimasi 30 Okt', completed: false },
                ]}
                trackingNumber={searchedTrackingOrder.trackingNumber}
                courier={searchedTrackingOrder.courier}
              />

              {/* Daftar Riwayat Perjalanan (Tanggal, Lokasi, Keterangan) */}
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6">
                <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Log Manifest Logistik
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                  Riwayat Perjalanan Pengiriman
                </h3>

                <div className="relative pl-6 space-y-6 border-l-2 border-[#E6DDD0] ml-3">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#8A6A2F] ring-4 ring-[#F4F1EB]" />
                    <span className="text-xs text-[#8A6A2F] font-bold">29 Okt 2026, 09:15 WITA</span>
                    <h4 className="font-semibold text-sm text-[#12263A] mt-0.5">Diserahkan ke Kurir Logistik [Mataram]</h4>
                    <p className="text-xs text-[#4A5666]">Paket perhiasan berbalut kotak segel anti-rusak telah diterima agen JNE Mataram.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#12263A] ring-4 ring-[#F4F1EB]" />
                    <span className="text-xs text-[#4A5666]">28 Okt 2026, 16:30 WITA</span>
                    <h4 className="font-semibold text-sm text-[#12263A] mt-0.5">Pemeriksaan Gemologi &amp; Pengemasan [Atelier Sire]</h4>
                    <p className="text-xs text-[#4A5666]">Pemasangan sertifikat keaslian dan pembungkusan beludru premium.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#12263A] ring-4 ring-[#F4F1EB]" />
                    <span className="text-xs text-[#4A5666]">28 Okt 2026, 15:00 WITA</span>
                    <h4 className="font-semibold text-sm text-[#12263A] mt-0.5">Verifikasi Pembayaran Berhasil</h4>
                    <p className="text-xs text-[#4A5666]">Transaksi pesanan #[ORD-2026-081] terkonfirmasi lunas.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto mb-3 flex items-center justify-center text-[#8A6A2F]">
                <Truck className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-[#12263A]">Nomor resi atau pesanan tidak ditemukan.</p>
              <p className="text-xs text-[#4A5666] mt-1">Pastikan format nomor yang Anda masukkan sudah sesuai.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4.4 KOLEKSI FAVORIT
         ======================================================== */}
      {activeMenu === 'wishlist' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Koleksi Favorit"
            description="Daftar mahakarya perhiasan mutiara yang Anda tandai untuk pertimbangan pembelian berikutnya."
            actions={
              <button
                type="button"
                onClick={onNavigateCatalog}
                className="min-h-[44px] px-6 rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A] hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Jelajahi Koleksi Lengkap
              </button>
            }
          />

          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {wishlistProducts.map((p) => (
                <div key={p.id} className="relative group">
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    category={p.category}
                    variety={p.variety}
                    grade={p.grade}
                    pearlSize={p.pearlSize}
                    metal={p.metal}
                    price={p.price}
                    formattedPrice={p.formattedPrice}
                    isWishlisted={true}
                    onAddToCart={() => addToCart(p)}
                    onToggleWishlist={() => toggleWishlist(p)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(p)}
                    className="w-full mt-2 min-h-[36px] rounded-full text-xs text-red-700 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus dari Favorit</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Keadaan Kosong: teks & tombol */
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto mb-4 flex items-center justify-center text-[#8A6A2F]">
                <Heart className="w-9 h-9 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                Belum ada koleksi favorit
              </h3>
              <p className="text-xs text-[#4A5666] mt-2 mb-6">
                Tandai perhiasan mutiara yang Anda impikan dengan menekan ikon hati pada halaman katalog.
              </p>
              <button
                type="button"
                onClick={onNavigateCatalog}
                className="min-h-[44px] px-8 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
              >
                Lihat Koleksi Produk
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4.5 ALAMAT
         ======================================================== */}
      {activeMenu === 'addresses' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Daftar Alamat Pengiriman"
            description="Kelola tujuan pengantaran paket perhiasan resmi CD'E Pearls."
            actions={
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Alamat</span>
              </button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  addr.isPrimary ? 'border-[#8A6A2F] ring-2 ring-[#8A6A2F]/15' : 'border-[#E6DDD0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F1EB] text-[#12263A] border border-[#E6DDD0]">
                      {addr.label}
                    </span>
                    {addr.isPrimary && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#E2F1E0] text-[#2B6330]">
                        Alamat Utama
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-base text-[#12263A]">{addr.recipient}</h4>
                  <p className="text-xs text-[#4A5666] mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-[#4A5666] mt-2 leading-relaxed">
                    {addr.fullAddress}, Kec. {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E6DDD0] flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(addr);
                        setNewAddress({
                          label: addr.label || 'Rumah',
                          recipient: addr.recipient || '',
                          phone: addr.phone || '',
                          province: addr.province || '-',
                          city: addr.city || '',
                          district: addr.district || '-',
                          postalCode: addr.postalCode || '83115',
                          fullAddress: addr.fullAddress || '',
                        });
                        setIsAddressModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#12263A] hover:underline cursor-pointer"
                    >
                      Ubah
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  {!addr.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Tambah/Ubah Alamat */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-lg shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                    {editingAddress ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      setEditingAddress(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] mb-1">Label Alamat</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Rumah, Kantor"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] mb-1">Nama Penerima</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Lengkap Penerima"
                        value={newAddress.recipient}
                        onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] mb-1">Nomor Telepon / WA</label>
                      <input
                        type="text"
                        required
                        placeholder="+62 812..."
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] mb-1">Kota / Kabupaten</label>
                      <input
                        type="text"
                        required
                        placeholder="Jakarta Pusat"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                      value={newAddress.fullAddress}
                      onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#E6DDD0]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddressModalOpen(false);
                        setEditingAddress(null);
                      }}
                      className="min-h-[44px] px-5 rounded-full border border-[#12263A] text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652]"
                    >
                      {editingAddress ? 'Simpan Perubahan' : 'Tambah Alamat'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4.5b NOTIFIKASI SAYA (Tahap V3b)
         ======================================================== */}
      {activeMenu === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <PageHeader
              title="Notifikasi Saya"
              description="Pembaruan status pesanan, pembayaran, pengiriman, dan informasi atelier resmi."
            />
            <div className="flex items-center gap-2">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="min-h-[40px] px-4 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  className="min-h-[40px] px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Semua</span>
                </button>
              )}
            </div>
          </div>

          {isLoadingNotifications ? (
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-12 text-center text-[#4A5666] text-sm">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F1EB] text-[#12263A] flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6 text-[#A08A5B]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#12263A]">Belum Ada Notifikasi</h3>
              <p className="text-xs text-[#4A5666] max-w-sm mx-auto">
                Pembaruan status pesanan, verifikasi pembayaran, dan resi pengiriman Anda akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    notif.read_at ? 'border-[#E6DDD0] opacity-80' : 'border-[#D9B877] shadow-xs bg-[#FBF8F3]/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.read_at ? 'bg-[#F4F1EB] text-[#4A5666]' : 'bg-[#12263A] text-[#D9B877]'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#12263A]">{notif.title}</h4>
                        {!notif.read_at && (
                          <span className="w-2 h-2 rounded-full bg-[#D9B877] inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-[#4A5666] mt-0.5 leading-relaxed">{notif.message}</p>
                      {notif.created_at && (
                        <p className="text-[11px] text-[#A08A5B] mt-1.5 font-mono">
                          {new Date(notif.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!notif.read_at && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F4F1EB] hover:bg-[#E6DDD0] text-[#12263A] cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(notif.id)}
                      title="Hapus Notifikasi"
                      className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4.6 PROFIL AKUN
         ======================================================== */}
      {activeMenu === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Profil Akun"
            description="Perbarui informasi data diri dan kata sandi keamanan Anda."
          />

          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8 max-w-xl space-y-6">
            {/* Bagian Data Diri */}
            <div>
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                Data Pribadi
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                Informasi Pelanggan
              </h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D9B877] shrink-0 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => toast.success('Foto profil disinkronkan dengan akun pelanggan Anda.')}
                    className="min-h-[38px] px-4 rounded-full border border-[#12263A] text-xs font-semibold text-[#12263A] hover:bg-[#F4F1EB]"
                  >
                    Ganti Foto
                  </button>
                  <span className="block text-[11px] text-[#4A5666] mt-1">Format JPG atau PNG</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian Keamanan */}
            <form onSubmit={handleUpdatePassword} className="pt-6 border-t border-[#E6DDD0]">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                Kredensial
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                Keamanan &amp; Kata Sandi
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Kata Sandi Baru (Min. 12 Karakter)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Konfirmasi Kata Sandi</label>
                    <input
                      type="password"
                      required
                      value={newPasswordConfirmation}
                      onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                </div>

                {passwordUpdateMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    passwordUpdateMessage.includes('berhasil')
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {passwordUpdateMessage}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="min-h-[40px] px-5 rounded-full border border-[#12263A] text-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB] disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                  </button>
                </div>
              </div>
            </form>

            {profileSaveMessage && (
              <div className="p-3 mb-4 rounded-xl bg-[#8A6A2F]/10 border border-[#8A6A2F]/30 text-xs text-[#8A6A2F] font-semibold">
                {profileSaveMessage}
              </div>
            )}

            {/* Tombol: Simpan Perubahan (utama) & Batal */}
            <div className="pt-4 border-t border-[#E6DDD0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveMenu('summary')}
                className="min-h-[44px] px-6 rounded-full border border-[#12263A] text-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authApi.updateProfile({
                      name: profileData.name,
                      phone: profileData.phone,
                    });
                    setProfileSaveMessage('Perubahan profil berhasil disimpan ke server.');
                    setTimeout(() => setProfileSaveMessage(null), 3500);
                  } catch (err: any) {
                    setProfileSaveMessage(err.response?.data?.message || 'Gagal menyimpan profil.');
                  }
                }}
                className="min-h-[44px] px-7 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4.7 KELUAR (Dialog Konfirmasi Kecil)
         ======================================================== */}
      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-2xl font-semibold text-[#12263A] mb-2">
              Keluar dari akun?
            </h3>
            <p className="text-xs text-[#4A5666] mb-6">
              Anda perlu masuk kembali untuk mengakses keranjang belanja dan riwayat pesanan Anda.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutDialogOpen(false)}
                className="min-h-[44px] flex-1 rounded-full border border-[#12263A] text-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutDialogOpen(false);
                  onLogout();
                }}
                className="min-h-[44px] flex-1 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
