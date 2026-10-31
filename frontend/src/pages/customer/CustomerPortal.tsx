import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { DashboardLayout, type DashboardMenuItem } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Stepper } from '../../components/common/Stepper';
import { ProductCard } from '../../components/common/ProductCard';
import { mockOrders, mockProducts, type MockOrder } from '../../data/mock';
import { authApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const getItemImage = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('cincin')) return '/images/cat_ring_silk.jpg';
  if (n.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
  if (n.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
  if (n.includes('butir') || n.includes('lepas')) return '/images/hero_pearl_dark_luxury.jpg';
  return '/images/hero_pearl_shell.jpg';
};

interface CustomerPortalProps {
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigate?: (tab: string) => void;
  onLogout: () => void;
  onAddToCart?: (productName: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onNavigateHome,
  onNavigateCatalog,
  onNavigate,
  onLogout,
  onAddToCart,
}) => {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState<string>('summary');

  // Customer Orders State
  const [orders] = useState<MockOrder[]>(mockOrders);
  const [orderStatusTab, setOrderStatusTab] = useState('Semua');
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  // Tracking Search State
  const [trackingQuery, setTrackingQuery] = useState('ORD-2026-081');
  const [searchedTrackingOrder, setSearchedTrackingOrder] = useState<MockOrder | null>(mockOrders[0]);

  // Wishlist State
  const [wishlistProducts, setWishlistProducts] = useState(mockProducts.slice(0, 4));

  // Addresses State
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Rumah',
      recipient: 'Siti Rahmawati',
      phone: '+62 812-3456-7890',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      district: 'Menteng',
      postalCode: '10310',
      fullAddress: 'Jl. Menteng Raya No. 45, RT 02 / RW 05',
      isPrimary: true,
    },
    {
      id: 2,
      label: 'Kantor',
      recipient: 'Siti Rahmawati (Divisi Legal)',
      phone: '+62 812-3456-7890',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12190',
      fullAddress: 'Gedung Menara Sudirman Lt. 18, Jl. Jend. Sudirman Kav. 60',
      isPrimary: false,
    },
  ]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
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

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Siti Rahmawati',
    email: user?.email || 'siti.rahma@gmail.com',
    phone: user?.phone || '+62 812-3456-7890',
    birthDate: '1992-05-14',
  });
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  // Sync profileData when user loads
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Logout Dialog State
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Sidebar Menu Items for Customer (Tunggal: tanpa menu keluar ganda di sidebar)
  const menuItems: DashboardMenuItem[] = [
    { id: 'summary', label: 'Ringkasan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'my_orders', label: 'Pesanan Saya', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.length },
    { id: 'shipping_status', label: 'Status Pengiriman', icon: <Truck className="w-4 h-4" /> },
    { id: 'wishlist', label: 'Koleksi Favorit', icon: <Heart className="w-4 h-4" />, badge: wishlistProducts.length },
    { id: 'addresses', label: 'Alamat', icon: <MapPin className="w-4 h-4" /> },
    { id: 'profile', label: 'Profil Akun', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const handleSelectMenu = (id: string) => {
    setActiveMenu(id);
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
        <div className="space-y-8 animate-in fade-in duration-300">
          <PageHeader
            title={`Halo, ${profileData.name}`}
            description="Selamat datang di akun pribadi perhiasan CD'E Pearls. Pantau pesanan aktif Anda dan koleksi mutiara favorit."
          />

          {/* 3 Kartu Ringkasan Pelanggan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              label="Pesanan Aktif"
              value={`${orders.filter(o => o.status === 'Dikirim' || o.status === 'Dikemas').length} Pesanan`}
              note="1 perhiasan dalam perjalanan pengiriman"
            />
            <StatCard
              label="Menunggu Pembayaran"
              value={`${orders.filter(o => o.status === 'Menunggu Pembayaran').length} Pesanan`}
              note="Batas transfer 24 jam"
            />
            <StatCard
              label="Koleksi Favorit"
              value={`${wishlistProducts.length} Perhiasan`}
              note="Tersimpan di wishlist Anda"
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

              <Stepper
                steps={[
                  { label: 'Dibayar', statusText: 'Selesai', date: '28 Okt, 15:00', completed: true },
                  { label: 'Dikemas', statusText: 'Selesai', date: '28 Okt, 16:30', completed: true },
                  { label: 'Dikirim', statusText: 'Sedang berjalan', date: '29 Okt, 09:15', completed: true, current: true },
                  { label: 'Diterima', statusText: 'Menunggu', date: 'Estimasi 30 Okt', completed: false },
                ]}
                trackingNumber={orders[0].trackingNumber}
                courier={orders[0].courier}
              />
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
      )}

      {/* ========================================================
          4.2 PESANAN SAYA
         ======================================================== */}
      {activeMenu === 'my_orders' && (
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
                          src={getItemImage(it.name)}
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
                  <button
                    type="button"
                    onClick={() => alert(`Membuka instruksi pembayaran untuk pesanan ${selectedOrder.id}`)}
                    className="min-h-[44px] px-8 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#D9B877]" />
                    <span>Bayar Sekarang</span>
                  </button>
                )}
              </div>
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
                    onAddToCart={() => onAddToCart?.(p.name)}
                    onToggleWishlist={() => {
                      setWishlistProducts(wishlistProducts.filter(item => item.id !== p.id));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setWishlistProducts(wishlistProducts.filter(item => item.id !== p.id))}
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
                      onClick={() => alert(`Ubah alamat ${addr.label}`)}
                      className="text-xs font-semibold text-[#12263A] hover:underline cursor-pointer"
                    >
                      Ubah
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Hapus alamat ini?')) {
                          setAddresses(addresses.filter(a => a.id !== addr.id));
                        }
                      }}
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  {!addr.isPrimary && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddresses(addresses.map(a => ({ ...a, isPrimary: a.id === addr.id })));
                      }}
                      className="text-xs font-semibold text-[#8A6A2F] hover:underline cursor-pointer"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Tambah Alamat */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-lg shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                    Tambah Alamat Baru
                  </h3>
                  <button type="button" onClick={() => setIsAddressModalOpen(false)}>✕</button>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] mb-1">Label Alamat</label>
                      <input
                        type="text"
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
                        placeholder="Siti Rahmawati"
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
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                      value={newAddress.fullAddress}
                      onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#E6DDD0]">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="min-h-[44px] px-5 rounded-full border border-[#12263A] text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newAddress.recipient && newAddress.fullAddress) {
                          setAddresses([
                            ...addresses,
                            {
                              id: Date.now(),
                              label: newAddress.label || 'Alamat',
                              recipient: newAddress.recipient,
                              phone: newAddress.phone || '+62 812-0000-0000',
                              province: 'DKI Jakarta',
                              city: newAddress.city || 'Jakarta',
                              district: 'Menteng',
                              postalCode: '10310',
                              fullAddress: newAddress.fullAddress,
                              isPrimary: addresses.length === 0,
                            },
                          ]);
                          setIsAddressModalOpen(false);
                        }
                      }}
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold"
                    >
                      Simpan Alamat
                    </button>
                  </div>
                </div>
              </div>
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
                    onClick={() => alert('Fitur ganti foto profil avatar X')}
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
            <div className="pt-6 border-t border-[#E6DDD0]">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                Kredensial
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                Keamanan &amp; Kata Sandi
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Kata Sandi Lama</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Kata Sandi Baru</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Konfirmasi Kata Sandi</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                </div>
              </div>
            </div>

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
