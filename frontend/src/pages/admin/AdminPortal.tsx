import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  Award,
  BarChart3,
  Settings,
  Plus,
  Search,
  Download,
  Upload,
  Pencil,
  Trash2,
  Eye,
  FileText,
  ArrowRight,
  MessageCircle,
  Check,
  X,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardLayout, type DashboardMenuItem } from '../../layouts/DashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProductFormModal } from '../../components/admin/ProductFormModal';
import { APPROVAL_RULES } from '../../config/approvalRules';
import { reportApi, apiClient, catalogApi, resolveMediaUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useDashboardSync } from '../../hooks/useDashboardSync';
import type {
  MockProduct,
  MockOrder,
  MockCategory,
  MockCertificate,
  MockStockItem,
  MockStockMovement,
  MockCustomer,
  MockApprovalItem,
} from '../../types/models';

const bestsellers: Array<{ rank: number; name: string; category: string; sold: number; revenue: number }> = [];

const getAdminProductImage = (category?: string, name?: string) => {
  const str = ((category || '') + ' ' + (name || '')).toLowerCase();
  if (str.includes('cincin')) return '/images/placeholder_jewelry.svg';
  if (str.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
  if (str.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
  if (str.includes('butir') || str.includes('lepas')) return '/images/hero_pearl_dark_luxury.jpg';
  return '/images/hero_pearl_shell.jpg';
};

const getCustomerAvatar = (id: number) => {
  const avatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  ];
  return avatars[(id - 1) % avatars.length];
};

interface AdminPortalProps {
  userRole?: 'admin' | 'spi' | 'user';
  onNavigateHome: () => void;
  onReturnToSpi?: () => void;
  onLogout: () => void;
  products?: MockProduct[];
  setProducts?: React.Dispatch<React.SetStateAction<MockProduct[]>>;
  orders?: MockOrder[];
  setOrders?: React.Dispatch<React.SetStateAction<MockOrder[]>>;
  stockItems?: MockStockItem[];
  setStockItems?: React.Dispatch<React.SetStateAction<MockStockItem[]>>;
  onAddApproval?: (approval: Omit<MockApprovalItem, 'id' | 'requestDate' | 'status'>) => void;
  onLogActivity?: (action: string, target: string, oldValue: string, newValue: string) => void;
  initialMenu?: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  userRole = 'admin',
  onNavigateHome,
  onReturnToSpi,
  onLogout,
  products: propProducts,
  setProducts: propSetProducts,
  orders: propOrders,
  setOrders: propSetOrders,
  stockItems: propStockItems,
  setStockItems: propSetStockItems,
  onAddApproval,
  onLogActivity,
  initialMenu,
}) => {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    if (initialMenu) return initialMenu;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin/produk') return 'products';
      if (path === '/admin/kategori') return 'categories';
      if (path === '/admin/pesanan') return 'orders';
      if (path === '/admin/pelanggan') return 'customers';
      if (path === '/admin/stok') return 'stock';
      if (path === '/admin/sertifikat') return 'certificates';
      if (path === '/admin/laporan') return 'reports';
      if (path === '/admin/pengaturan') return 'settings';

      const params = new URLSearchParams(window.location.search);
      const m = params.get('menu');
      if (m && ['dashboard', 'products', 'categories', 'orders', 'customers', 'stock', 'certificates', 'reports', 'settings'].includes(m)) {
        return m;
      }
    }
    return 'dashboard';
  });

  React.useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu);
    }
  }, [initialMenu]);

  const handleSelectAdminMenu = (menuId: string) => {
    setActiveMenu(menuId);
    const pathMap: Record<string, string> = {
      dashboard: '/admin',
      products: '/admin/produk',
      categories: '/admin/kategori',
      orders: '/admin/pesanan',
      customers: '/admin/pelanggan',
      stock: '/admin/stok',
      certificates: '/admin/sertifikat',
      reports: '/admin/laporan',
      settings: '/admin/pengaturan',
    };
    const targetPath = pathMap[menuId] || '/admin';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Products state (CRUD)
  const [internalProducts, setInternalProducts] = useState<MockProduct[]>([]);
  const products = propProducts || internalProducts;
  const setProducts = propSetProducts || setInternalProducts;
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('Semua');
  const [productVarietyFilter, setProductVarietyFilter] = useState('Semua');
  const [productGradeFilter, setProductGradeFilter] = useState('Semua');
  const [productStatusFilter, setProductStatusFilter] = useState('Semua');
  const [isProductSlideOverOpen, setIsProductSlideOverOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<MockProduct> | null>(null);
  const [productToDelete, setProductToDelete] = useState<MockProduct | null>(null);

  // Live Dashboard Statistics from API
  const [dashboardStats, setDashboardStats] = useState<{
    total_revenue: number;
    total_orders: number;
    pending_orders?: number;
    total_products: number;
    total_customers?: number;
    total_pearl_stock: number;
    pending_approvals: number;
    revenue_trend: Array<{ date: string; label: string; revenue: number; orders_count: number }>;
    category_stats: Array<{ name: string; products_count: number }>;
  } | null>(null);

  const liveSalesChartData = dashboardStats?.revenue_trend && dashboardStats.revenue_trend.length > 0
    ? dashboardStats.revenue_trend.map((r) => ({
        date: r.label || r.date,
        sales: r.revenue,
        orders: r.orders_count,
      }))
    : [];

  const liveCategorySalesData = dashboardStats?.category_stats && dashboardStats.category_stats.length > 0
    ? dashboardStats.category_stats.map((c) => ({
        category: c.name,
        sales: c.products_count,
      }))
    : [];

  // Categories state (Full CRUD)
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubtitle, setNewCatSubtitle] = useState('');
  const [editingCategory, setEditingCategory] = useState<MockCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<MockCategory | null>(null);

  // Orders state
  const [internalOrders, setInternalOrders] = useState<MockOrder[]>([]);
  const orders = propOrders || internalOrders;
  const setOrders = propSetOrders || setInternalOrders;
  const [orderStatusTab, setOrderStatusTab] = useState('Semua');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);
  const [inputResi, setInputResi] = useState('');
  const [inputCourier, setInputCourier] = useState('JNE Express (Berasuransi)');

  // Customers state
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);

  // Stock state (CRUD Adjustments & Movement Audit)
  const [internalStockItems, setInternalStockItems] = useState<MockStockItem[]>([]);
  const stockItems = propStockItems || internalStockItems;
  const setStockItems = propSetStockItems || setInternalStockItems;
  const [stockMovements, setStockMovements] = useState<MockStockMovement[]>([]);
  void setStockMovements;
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<MockStockItem | null>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState(1);
  const [stockAdjustNotes, setStockAdjustNotes] = useState('');

  // Certificates state (Full CRUD: Issue, Preview/Print, Revoke)
  const [certificates, setCertificates] = useState<MockCertificate[]>([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newCertProduct, setNewCertProduct] = useState('');
  const [newCertLab, setNewCertLab] = useState('Laboratorium Gemologi Independen');
  const [newCertGrade, setNewCertGrade] = useState('AAA - Mirror Luster');
  const [newCertPearlSize, setNewCertPearlSize] = useState('11-12 mm');
  const [selectedCertPreview, setSelectedCertPreview] = useState<MockCertificate | null>(null);
  const [certToDelete, setCertToDelete] = useState<MockCertificate | null>(null);

  const loadedTabs = React.useRef<Set<string>>(new Set());

  const loadDashboardStats = React.useCallback(() => {
    apiClient.get('/admin/dashboard')
      .then((res) => {
        if (res.data?.data) {
          setDashboardStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const loadProducts = React.useCallback(() => {
    apiClient.get('/admin/products?per_page=100')
      .then((res) => {
        const items = res.data?.data || res.data;
        if (Array.isArray(items)) {
          const mapped: MockProduct[] = items.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category?.name || 'Kalung Mutiara',
            categorySlug: item.category_slug || 'kalung-mutiara',
            variety: item.varietas || 'South Sea',
            grade: item.grade || 'AAA',
            pearlSize: item.ukuran_mm ? `${item.ukuran_mm} mm` : '12 mm',
            metal: item.logam || 'Emas 18K',
            weight: item.berat || '5.0 gr',
            bentuk: item.bentuk || 'Bulat',
            colorGroup: item.kelompok_warna || 'emas',
            colorVariant: item.varian_warna || 'Champagne',
            price: Number(item.price) || 0,
            formattedPrice: `Rp ${Number(item.price).toLocaleString('id-ID')}`,
            stock: Number(item.stock) || 0,
            status: (item.status === 'published' ? 'Aktif' : 'Nonaktif') as 'Aktif' | 'Nonaktif',
            description: item.description || '',
            image: resolveMediaUrl(item.image, '/images/placeholder_jewelry.svg'),
            images: Array.isArray(item.images)
              ? item.images.map((img: any) =>
                  typeof img === 'string'
                    ? resolveMediaUrl(img)
                    : { ...img, url: resolveMediaUrl(img.url) }
                )
              : item.images,
          }));
          setProducts(mapped);

          const derivedStock: MockStockItem[] = mapped.map((p) => ({
            id: p.id,
            productName: p.name,
            sku: (p as any).code || `SKU-${p.id}`,
            stock: p.stock,
            minLimit: 2,
            status: p.stock === 0 ? 'Habis' : p.stock <= 2 ? 'Menipis' : 'Aman',
          }));
          setStockItems(derivedStock);
        }
      })
      .catch(() => {});
  }, []);

  const loadOrders = React.useCallback(() => {
    apiClient.get('/orders?per_page=100')
      .then((res) => {
        const ords = res.data?.data || res.data;
        if (Array.isArray(ords)) {
          const mappedOrders: MockOrder[] = ords.map((o: any) => ({
            id: o.order_number || `#ORD-${o.id}`,
            date: o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            customerName: o.customer_name || 'Pelanggan Butik',
            customerEmail: o.customer_email || o.user?.email || '',
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
            status: o.order_status === 'DELIVERED' ? 'Selesai' : o.order_status === 'SHIPPED' ? 'Dikirim' : o.order_status === 'PROCESSING' ? 'Dikemas' : o.order_status === 'CANCELLED' ? 'Dibatalkan' : 'Menunggu Pembayaran',
            trackingNumber: o.tracking_number,
            courier: o.courier || 'JNE Express (Berasuransi)',
            timeline: (o.status_histories || []).map((h: any) => ({
              status: h.status,
              date: h.created_at ? new Date(h.created_at).toLocaleString('id-ID') : '',
              description: h.notes || '',
              completed: true,
            })),
          }));
          setOrders(mappedOrders);
        }
      })
      .catch(() => {});
  }, []);

  const loadCustomers = React.useCallback(() => {
    apiClient.get('/admin/customers?per_page=100')
      .then((res) => {
        const custs = res.data?.data || res.data;
        if (Array.isArray(custs)) {
          const mappedCustomers: MockCustomer[] = custs.map((c: any) => ({
            id: c.id,
            name: c.name || 'Pelanggan',
            email: c.email || '',
            phone: c.phone || '',
            city: c.city || 'Indonesia',
            totalOrders: c.orders_count || 0,
            totalSpend: Number(c.orders_sum_total) || 0,
            joinDate: c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '',
            addresses: [],
          }));
          setCustomers(mappedCustomers);
        }
      })
      .catch(() => {});
  }, []);

  const loadCategories = React.useCallback(() => {
    catalogApi.getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) {
          const mappedCats: MockCategory[] = cats.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            subtitle: cat.subtitle || 'Koleksi Mutiara Air Laut Lombok',
            slug: cat.slug,
            productsCount: cat.products_count || 0,
            order: cat.order || cat.id,
            status: 'Aktif',
          }));
          setCategories(mappedCats);
        }
      })
      .catch(() => {});
  }, []);

  const loadCertificates = React.useCallback(() => {
    apiClient.get('/admin/certificates?per_page=100')
      .then((res) => {
        const certs = res.data?.data || res.data;
        if (Array.isArray(certs)) {
          const mappedCerts: MockCertificate[] = certs.map((c: any) => ({
            id: c.id,
            certNumber: c.nomor || c.cert_number,
            productName: c.product?.name || 'Mutiara South Sea Lombok',
            issuingLab: c.lab || 'Laboratorium Gemologi Independen',
            grade: c.grade || 'AAA - Mirror Luster',
            pearlSize: c.ukuran_mm ? `${c.ukuran_mm} mm` : '11-12 mm',
            issueDate: c.tanggal_terbit ? new Date(c.tanggal_terbit).toLocaleDateString('id-ID') : '',
            pdfFileUrl: c.pdf_file_url || '',
          }));
          setCertificates(mappedCerts);
        }
      })
      .catch(() => {});
  }, []);

  // Lazy tab loader: Muat data setiap tab HANYA saat tab dibuka
  React.useEffect(() => {
    if (activeMenu === 'dashboard') {
      if (!loadedTabs.current.has('dashboard')) {
        loadedTabs.current.add('dashboard');
        loadDashboardStats();
      }
    } else if (activeMenu === 'products' || activeMenu === 'stock') {
      if (!loadedTabs.current.has('products')) {
        loadedTabs.current.add('products');
        loadProducts();
        loadCategories();
      }
    } else if (activeMenu === 'orders') {
      if (!loadedTabs.current.has('orders')) {
        loadedTabs.current.add('orders');
        loadOrders();
      }
    } else if (activeMenu === 'customers') {
      if (!loadedTabs.current.has('customers')) {
        loadedTabs.current.add('customers');
        loadCustomers();
      }
    } else if (activeMenu === 'categories') {
      if (!loadedTabs.current.has('categories')) {
        loadedTabs.current.add('categories');
        loadCategories();
      }
    } else if (activeMenu === 'certificates') {
      if (!loadedTabs.current.has('certificates')) {
        loadedTabs.current.add('certificates');
        loadCertificates();
      }
    }
  }, [activeMenu, loadDashboardStats, loadProducts, loadOrders, loadCustomers, loadCategories, loadCertificates]);

  // Real-time synchronization layer with 30s ETag polling (Tahap V2c)
  const { lastSyncLabel } = useDashboardSync({
    enabled: true,
    role: 'admin',
    intervalMs: 30000,
    onDataUpdated: (data) => {
      if (data.total_orders !== undefined) {
        if (loadedTabs.current.has('orders')) {
          loadOrders();
        }
        if (loadedTabs.current.has('dashboard')) {
          loadDashboardStats();
        }
      }
      if (data.low_stock_count !== undefined && loadedTabs.current.has('products')) {
        loadProducts();
      }
      if (data.accounts_count !== undefined && loadedTabs.current.has('customers')) {
        loadCustomers();
      }
    },
  });


  // Reports state
  const [reportPeriod, setReportPeriod] = useState('30 hari');

  // Settings state
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');

  // SPI Approval Workflow States (Aksi Sensitif Diajukan ke SPI)
  const [isPaymentApprovalModalOpen, setIsPaymentApprovalModalOpen] = useState(false);
  const [paymentApprovalOrder, setPaymentApprovalOrder] = useState<MockOrder | null>(null);
  const [paymentApprovalNotes, setPaymentApprovalNotes] = useState('');

  const [isPriceApprovalModalOpen, setIsPriceApprovalModalOpen] = useState(false);
  const [priceApprovalProduct, setPriceApprovalProduct] = useState<{
    product: Partial<MockProduct>;
    oldPrice: number;
    newPrice: number;
  } | null>(null);
  const [priceApprovalNotes, setPriceApprovalNotes] = useState('');

    const [deleteProductCandidate, setDeleteProductCandidate] = useState<MockProduct | null>(null);
  const [deleteProductNotes, setDeleteProductNotes] = useState('');

  const [isCancelOrderApprovalModalOpen, setIsCancelOrderApprovalModalOpen] = useState(false);
  const [cancelOrderCandidate, setCancelOrderCandidate] = useState<MockOrder | null>(null);
  const [cancelOrderNotes, setCancelOrderNotes] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showAdminToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sidebar Menu Items (Standard 9 for Admin: /admin eksklusif untuk peran Admin)
  const menuItems: DashboardMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Produk', icon: <Package className="w-4 h-4" />, badge: products.length },
    { id: 'categories', label: 'Kategori', icon: <Layers className="w-4 h-4" /> },
    { id: 'orders', label: 'Pesanan', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.filter(o => o.status === 'Menunggu Pembayaran' || o.status === 'Dikemas').length },
    { id: 'customers', label: 'Pelanggan', icon: <Users className="w-4 h-4" /> },
    { id: 'stock', label: 'Stok', icon: <Boxes className="w-4 h-4" />, badge: stockItems.filter(s => s.status !== 'Aman').length },
    { id: 'certificates', label: 'Sertifikat', icon: <Award className="w-4 h-4" /> },
    { id: 'reports', label: 'Laporan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (productData: Partial<MockProduct>, photoFiles?: File[]) => {
    let savedProductData: any = null;
    try {
      const formData = new FormData();
      formData.append('name', productData.name || '');
      formData.append('description', productData.description || '');
      formData.append('category_slug', productData.categorySlug || 'kalung-mutiara');
      formData.append('varietas', productData.variety || 'South Sea');
      formData.append('grade', productData.grade || 'AAA');
      formData.append('ukuran_mm', productData.pearlSize ? productData.pearlSize.replace(/[^0-9.]/g, '') : '12.0');
      formData.append('berat', productData.weight || '5.0 gr');
      formData.append('bentuk', productData.bentuk || 'Bulat');
      formData.append('kelompok_warna', productData.colorGroup || 'emas');
      formData.append('varian_warna', productData.colorVariant || 'Emas Champagne');
      formData.append('price', String(productData.price || 0));
      formData.append('stock', String(productData.stock || 0));
      formData.append('status', productData.status === 'Nonaktif' ? 'draft' : 'published');

      if (photoFiles && photoFiles.length > 0) {
        photoFiles.forEach((f) => formData.append('photos[]', f));
      }

      let res;
      if (productData.id && typeof productData.id === 'number' && productData.id < 1000000000) {
        formData.append('_method', 'PUT');
        res = await apiClient.post(`/admin/products/${productData.id}`, formData);
      } else {
        res = await apiClient.post('/admin/products', formData);
      }
      if (res?.data?.data) {
        savedProductData = res.data.data;
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    if (savedProductData) {
      const newProd: MockProduct = {
        id: savedProductData.id,
        name: savedProductData.name,
        category: savedProductData.category?.name || productData.category || 'Kalung Mutiara',
        categorySlug: savedProductData.category_slug || productData.categorySlug || 'kalung-mutiara',
        variety: savedProductData.varietas || productData.variety || 'South Sea',
        grade: savedProductData.grade || productData.grade || 'AAA',
        pearlSize: savedProductData.ukuran_mm ? `${savedProductData.ukuran_mm} mm` : productData.pearlSize || '12 mm',
        metal: savedProductData.logam || productData.metal || 'Emas 18K',
        weight: savedProductData.berat || productData.weight || '5.0 gr',
        bentuk: savedProductData.bentuk || productData.bentuk || 'Bulat',
        colorGroup: savedProductData.kelompok_warna || productData.colorGroup || 'emas',
        colorVariant: savedProductData.varian_warna || productData.colorVariant || 'Emas Champagne',
        price: Number(savedProductData.price) || Number(productData.price) || 0,
        formattedPrice: `Rp ${(Number(savedProductData.price) || Number(productData.price) || 0).toLocaleString('id-ID')}`,
        stock: Number(savedProductData.stock) !== undefined ? Number(savedProductData.stock) : Number(productData.stock) || 0,
        status: (savedProductData.status === 'published' ? 'Aktif' : 'Nonaktif') as 'Aktif' | 'Nonaktif',
        description: savedProductData.description || productData.description || '',
        image: resolveMediaUrl(savedProductData.image || productData.image, '/images/placeholder_jewelry.svg'),
        images: savedProductData.images || productData.images,
      };

      if (productData.id && typeof productData.id === 'number' && productData.id < 1000000000) {
        setProducts((prev) => prev.map((p) => (p.id === newProd.id ? newProd : p)));
      } else {
        setProducts((prev) => [newProd, ...prev]);
      }
      showAdminToast(`✓ Produk "${newProd.name}" berhasil disimpan.`);
    } else {
      // Local fallback
      const newProd: MockProduct = {
        id: productData.id || Date.now(),
        name: productData.name || '[Nama produk]',
        category: productData.category || 'Kalung Mutiara',
        categorySlug: productData.categorySlug || 'kalung-mutiara',
        variety: productData.variety || 'South Sea',
        grade: productData.grade || 'AAA',
        pearlSize: productData.pearlSize || '12 mm',
        metal: productData.metal || 'Emas 18K',
        weight: productData.weight || '5.0 gr',
        bentuk: productData.bentuk || 'Bulat',
        colorGroup: productData.colorGroup || 'emas',
        colorVariant: productData.colorVariant || 'Emas Champagne',
        price: Number(productData.price) || 15000000,
        formattedPrice: `Rp ${(Number(productData.price) || 15000000).toLocaleString('id-ID')}`,
        stock: Number(productData.stock) || 5,
        status: (productData.status as 'Aktif' | 'Nonaktif') || 'Aktif',
        description: productData.description || 'Deskripsi perhiasan mutiara Lombok...',
        image: resolveMediaUrl(productData.image, '/images/placeholder_jewelry.svg'),
        images: productData.images,
      };
      if (productData.id) {
        setProducts((prev) => prev.map((p) => (p.id === productData.id ? newProd : p)));
      } else {
        setProducts((prev) => [newProd, ...prev]);
      }
      showAdminToast(`✓ Produk "${newProd.name}" berhasil disimpan.`);
    }
    setIsProductSlideOverOpen(false);
    setEditingProduct(null);
  };

  const handleDeactivateProduct = async (productToDeact: MockProduct) => {
    try {
      await apiClient.delete(`/admin/products/${productToDeact.id}`);
    } catch (e) {
      console.warn('Deactivate warning:', e);
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productToDeact.id ? { ...p, status: 'Nonaktif' as const } : p))
    );
    showAdminToast(`✓ Produk "${productToDeact.name}" berhasil dinonaktifkan.`);
  };

    // Submit Price Change Approval to SPI (atau Eksekusi Langsung oleh SPI)
  const submitPriceChangeApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceApprovalProduct || !priceApprovalNotes.trim()) return;

    const diffPercent = ((priceApprovalProduct.newPrice - priceApprovalProduct.oldPrice) / priceApprovalProduct.oldPrice) * 100;
    const sign = diffPercent > 0 ? '+' : '';

    if (userRole === 'spi') {
      const updatedPrice = priceApprovalProduct.newPrice;
      const formatted = `Rp ${updatedPrice.toLocaleString('id-ID')}`;
      setProducts(prev =>
        prev.map(p =>
          p.id === priceApprovalProduct.product.id
            ? ({ ...p, ...priceApprovalProduct.product, price: updatedPrice, formattedPrice: formatted } as MockProduct)
            : p
        )
      );
      onLogActivity?.(
        'Perubahan Harga Produk',
        priceApprovalProduct.product.name || 'Produk',
        `Harga: Rp ${priceApprovalProduct.oldPrice.toLocaleString('id-ID')}`,
        `Harga: ${formatted} (${sign}${diffPercent.toFixed(1)}%) - Alasan: ${priceApprovalNotes.trim()} [Dieksekusi langsung oleh SPI]`
      );
      setIsPriceApprovalModalOpen(false);
      setPriceApprovalProduct(null);
      setEditingProduct(null);
      showAdminToast('✓ Perubahan harga telah disetujui & dieksekusi langsung oleh SPI.');
      return;
    }

    onAddApproval?.({
      type: 'PERUBAHAN_HARGA',
      title: `Perubahan Harga Produk >${APPROVAL_RULES.PRICE_CHANGE_PERCENT_THRESHOLD}%`,
      target: priceApprovalProduct.product.name || 'Produk',
      targetId: priceApprovalProduct.product.id,
      requestedBy: 'Budi Santoso (Admin)',
      notes: priceApprovalNotes.trim(),
      oldValue: `Harga: Rp ${priceApprovalProduct.oldPrice.toLocaleString('id-ID')}`,
      newValue: `Harga: Rp ${priceApprovalProduct.newPrice.toLocaleString('id-ID')} (${sign}${diffPercent.toFixed(1)}%)`,
      payload: {
        productId: priceApprovalProduct.product.id,
        newPrice: priceApprovalProduct.newPrice,
        newFormattedPrice: `Rp ${priceApprovalProduct.newPrice.toLocaleString('id-ID')}`,
        productData: priceApprovalProduct.product,
      },
    });

    setIsPriceApprovalModalOpen(false);
    setPriceApprovalProduct(null);
    setEditingProduct(null);
    showAdminToast('✓ Pengajuan perubahan harga telah diteruskan ke SPI untuk persetujuan.');
  };

  // Submit Delete Product Approval to SPI (atau Eksekusi Langsung oleh SPI)
  const submitDeleteProductApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteProductCandidate || !deleteProductNotes.trim()) return;

    if (userRole === 'spi') {
      setProducts(prev => prev.filter(p => p.id !== deleteProductCandidate.id));
      onLogActivity?.(
        'Penghapusan Produk',
        deleteProductCandidate.name,
        `Status: Tersedia (Stok: ${deleteProductCandidate.stock}, Harga: ${deleteProductCandidate.formattedPrice})`,
        `Dihapus Permanen - Alasan: ${deleteProductNotes.trim()} [Dieksekusi langsung oleh SPI]`
      );
      setDeleteProductCandidate(null);
      setDeleteProductNotes('');
      showAdminToast('✓ Produk berhasil dihapus dari katalog langsung oleh SPI.');
      return;
    }

    onAddApproval?.({
      type: 'HAPUS_PRODUK',
      title: 'Penghapusan Produk dari Katalog',
      target: deleteProductCandidate.name,
      targetId: deleteProductCandidate.id,
      requestedBy: 'Budi Santoso (Admin)',
      notes: deleteProductNotes.trim(),
      oldValue: `Status: Tersedia (Stok: ${deleteProductCandidate.stock}, Harga: ${deleteProductCandidate.formattedPrice})`,
      newValue: 'Status: Dihapus Permanen dari Katalog',
      payload: {
        productId: deleteProductCandidate.id,
        productName: deleteProductCandidate.name,
      },
    });

    setDeleteProductCandidate(null);
    setDeleteProductNotes('');
    showAdminToast('✓ Pengajuan hapus produk telah diteruskan ke SPI untuk persetujuan.');
  };

  // Submit Payment Confirmation Approval to SPI (atau Eksekusi Langsung oleh SPI)
  const submitPaymentApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentApprovalOrder || !paymentApprovalNotes.trim()) return;

    if (userRole === 'spi') {
      setOrders(prev =>
        prev.map(o => (o.id === paymentApprovalOrder.id ? { ...o, status: 'Dikemas' as const } : o))
      );
      onLogActivity?.(
        'Konfirmasi Pembayaran Lunas',
        `Pesanan ${paymentApprovalOrder.id}`,
        `Status: ${paymentApprovalOrder.status} (${paymentApprovalOrder.paymentMethod})`,
        `Status: Dikemas - Alasan: ${paymentApprovalNotes.trim()} [Dieksekusi langsung oleh SPI]`
      );
      setIsPaymentApprovalModalOpen(false);
      setPaymentApprovalOrder(null);
      setPaymentApprovalNotes('');
      showAdminToast('✓ Pembayaran pesanan diverifikasi lunas & dieksekusi langsung oleh SPI.');
      return;
    }

    onAddApproval?.({
      type: 'KONFIRMASI_PEMBAYARAN',
      title: 'Konfirmasi Pelunasan Pembayaran Transfer Manual',
      target: `Pesanan ${paymentApprovalOrder.id}`,
      targetId: paymentApprovalOrder.id,
      requestedBy: 'Budi Santoso (Admin)',
      notes: paymentApprovalNotes.trim(),
      oldValue: `Status: ${paymentApprovalOrder.status} (${paymentApprovalOrder.paymentMethod})`,
      newValue: 'Status: Dikemas (Telah Diverifikasi Lunas)',
      payload: {
        orderId: paymentApprovalOrder.id,
        newStatus: 'Dikemas',
        paymentMethodDetail: `${paymentApprovalOrder.paymentMethod} (Disetujui SPI)`,
      },
    });

    setIsPaymentApprovalModalOpen(false);
    setPaymentApprovalOrder(null);
    setPaymentApprovalNotes('');
    showAdminToast('✓ Pengajuan konfirmasi pembayaran dikirim ke SPI untuk disetujui.');
  };

  // Submit Cancel Order Approval to SPI (atau Eksekusi Langsung oleh SPI)
  const submitCancelOrderApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrderCandidate || !cancelOrderNotes.trim()) return;

    if (userRole === 'spi') {
      setOrders(prev =>
        prev.map(o => (o.id === cancelOrderCandidate.id ? { ...o, status: 'Dibatalkan' as const } : o))
      );
      onLogActivity?.(
        'Pembatalan Pesanan',
        `Pesanan ${cancelOrderCandidate.id}`,
        `Status: ${cancelOrderCandidate.status}`,
        `Status: Dibatalkan - Alasan: ${cancelOrderNotes.trim()} [Dieksekusi langsung oleh SPI]`
      );
      setIsCancelOrderApprovalModalOpen(false);
      setCancelOrderCandidate(null);
      setCancelOrderNotes('');
      showAdminToast('✓ Pesanan berhasil dibatalkan langsung oleh SPI.');
      return;
    }

    onAddApproval?.({
      type: 'PEMBATALAN_PESANAN',
      title: 'Pembatalan Pesanan Pelanggan',
      target: `Pesanan ${cancelOrderCandidate.id}`,
      targetId: cancelOrderCandidate.id,
      requestedBy: 'Budi Santoso (Admin)',
      notes: cancelOrderNotes.trim(),
      oldValue: `Status: ${cancelOrderCandidate.status} (Total: Rp ${cancelOrderCandidate.total.toLocaleString('id-ID')})`,
      newValue: 'Status: Dibatalkan',
      payload: {
        orderId: cancelOrderCandidate.id,
        newStatus: 'Dibatalkan',
      },
    });

    setIsCancelOrderApprovalModalOpen(false);
    setCancelOrderCandidate(null);
    setCancelOrderNotes('');
    showAdminToast('✓ Pengajuan pembatalan pesanan dikirim ke SPI untuk otorisasi.');
  };

  // Submit Stock Adjustment Approval to SPI (atau Eksekusi Langsung oleh SPI)
  const submitStockAdjustmentApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem || !stockAdjustNotes.trim()) return;

    const diff = stockAdjustQty - selectedStockItem.stock;
    const sign = diff > 0 ? '+' : '';

    if (userRole === 'spi') {
      const targetQty = stockAdjustQty;
      setStockItems(prev =>
        prev.map(s =>
          s.id === selectedStockItem.id
            ? {
                ...s,
                stock: targetQty,
                status: targetQty === 0 ? 'Habis' : targetQty <= 5 ? 'Menipis' : 'Aman',
              }
            : s
        )
      );
      onLogActivity?.(
        'Penyesuaian Manual Stok Gudang',
        selectedStockItem.productName,
        `Stok: ${selectedStockItem.stock} butir`,
        `Stok: ${targetQty} butir (${sign}${diff} butir) - Alasan: ${stockAdjustNotes.trim()} [Dieksekusi langsung oleh SPI]`
      );
      setIsAdjustStockOpen(false);
      setSelectedStockItem(null);
      setStockAdjustNotes('');
      showAdminToast('✓ Penyesuaian stok berhasil diterapkan langsung oleh SPI.');
      return;
    }

    onAddApproval?.({
      type: 'PENYESUAIAN_STOK',
      title: 'Penyesuaian Manual Stok Gudang',
      target: selectedStockItem.productName,
      targetId: selectedStockItem.id,
      requestedBy: 'Budi Santoso (Admin)',
      notes: stockAdjustNotes.trim(),
      oldValue: `Stok: ${selectedStockItem.stock} butir`,
      newValue: `Stok: ${stockAdjustQty} butir (${sign}${diff} butir)`,
      payload: {
        stockId: selectedStockItem.id,
        newStock: stockAdjustQty,
        qtyChange: diff,
        type: diff > 0 ? 'Masuk' : 'Keluar',
      },
    });

    setIsAdjustStockOpen(false);
    setSelectedStockItem(null);
    setStockAdjustNotes('');
    showAdminToast('✓ Pengajuan penyesuaian stok manual dikirim ke antrean Persetujuan SPI.');
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = (newStatus: MockOrder['status']) => {
    if (!selectedOrder) return;
    const updated: MockOrder = {
      ...selectedOrder,
      status: newStatus,
      trackingNumber: inputResi || selectedOrder.trackingNumber,
      courier: inputCourier || selectedOrder.courier,
    };
    setSelectedOrder(updated);
    setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? updated : o)));
    showAdminToast(`✓ Status pesanan ${selectedOrder.id} diperbarui menjadi "${newStatus}".`);
  };

  // Handle Issue Certificate
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertNumber.trim()) return;
    const newCert: MockCertificate = {
      id: Date.now(),
      certNumber: newCertNumber.trim(),
      productName: newCertProduct,
      issuingLab: newCertLab,
      grade: newCertGrade,
      pearlSize: newCertPearlSize,
      issueDate: '29 Okt 2026',
      pdfFileUrl: `#[PDF-${newCertNumber.trim()}]`,
    };
    setCertificates(prev => [newCert, ...prev]);
    setNewCertNumber('');
    setIsCertModalOpen(false);
  };

  // Handle Delete Certificate
  const handleConfirmDeleteCert = () => {
    if (certToDelete) {
      setCertificates(prev => prev.filter(c => c.id !== certToDelete.id));
      setCertToDelete(null);
    }
  };

  // Handle Category Create
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: MockCategory = {
      id: Date.now(),
      name: newCatName.trim(),
      subtitle: newCatSubtitle.trim() || 'Koleksi Perhiasan Mutiara Samudera',
      slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
      productsCount: 0,
      order: categories.length + 1,
      status: 'Aktif',
    };
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatSubtitle('');
    setIsCategoryModalOpen(false);
    showAdminToast(`✓ Kategori "${newCat.name}" berhasil dibuat.`);
  };

  // Handle Category Update
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name.trim()) return;
    setCategories(prev =>
      prev.map(c => (c.id === editingCategory.id ? editingCategory : c))
    );
    setIsCategoryEditModalOpen(false);
    setEditingCategory(null);
    showAdminToast(`✓ Kategori "${editingCategory.name}" berhasil diperbarui.`);
  };

  // Handle Category Delete
  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      showAdminToast(`✓ Kategori "${categoryToDelete.name}" telah dihapus.`);
      setCategoryToDelete(null);
    }
  };

  return (
    <DashboardLayout
      sidebarTitle={userRole === 'spi' ? 'Menu Operasional (Akses SPI)' : 'Menu Operasional Admin'}
      menuItems={menuItems}
      activeMenuId={activeMenu}
      onSelectMenu={handleSelectAdminMenu}
      userRole={userRole}
      userName={user?.name || (userRole === 'spi' ? 'Hj. Baiq Ratna Sari' : 'Budi Santoso (Admin Toko)')}
      userEmail={user?.email || (userRole === 'spi' ? 'owner.spi@cdepearls.com' : 'admin@cdepearls.com')}
      onSearch={(q) => {
        setProductSearch(q);
        setOrderSearch(q);
      }}
      onNavigateHome={onNavigateHome}
      onLogout={onLogout}
    >
      {/* Top Banner Strip jika Admin dibuka dalam mode SPI (Super Admin) */}
      {userRole === 'spi' && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-[#12263A] text-[#D9B877] border border-[#D9B877]/40 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#D9B877] text-[#12263A]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="font-serif text-sm block">Mode SPI: Akses Penuh</span>
              <span className="text-[11px] text-white/80 font-normal">
                Sebagai super-admin, aksi sensitif akan dieksekusi langsung dan dicatat ke Log Aktivitas.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onReturnToSpi) onReturnToSpi();
              else window.location.href = '/spi';
            }}
            className="min-h-[38px] px-4 rounded-full bg-[#D9B877] text-[#12263A] hover:bg-[#E5C78A] transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <span>Kembali ke Panel SPI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* ========================================================
          3.1 DASHBOARD (Ringkasan Toko)
         ======================================================== */}
      {activeMenu === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <PageHeader
            title="Ringkasan Toko"
            description="Pantau metrik penjualan utama, pesanan terkini, dan stok atelier mutiara secara real-time."

            actions={
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-medium text-[#4A5666] bg-[#F4F1EB] px-3 py-1.5 rounded-full border border-[#E6DDD0] inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lastSyncLabel}</span>
                </span>
                <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'Kalung Mutiara',
                    variety: 'South Sea Pearl',
                    grade: 'AAA',
                    pearlSize: '11-12 mm',
                    metal: 'Emas 18K',
                    price: 15000000,
                    stock: 5,
                    status: 'Aktif',
                  });
                  setIsProductSlideOverOpen(true);
                }}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-[14px] font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
              </div>
            }
          />

          {/* 4 StatCards (2 kolom di mobile, 4 kolom di desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <StatCard
              label="Total Penjualan"
              value={`Rp ${(dashboardStats?.total_revenue || 0).toLocaleString('id-ID')}`}
              note={`${dashboardStats?.total_orders ?? orders.length} transaksi tercatat`}
            />
            <StatCard
              label="Pesanan Baru"
              value={`${dashboardStats?.pending_orders ?? orders.filter(o => o.status === 'Menunggu Pembayaran' || o.status === 'Dikemas').length} Pesanan`}
              note={`${dashboardStats?.total_orders ?? orders.length} total pesanan masuk`}
            />
            <StatCard
              label="Produk Aktif"
              value={`${dashboardStats?.total_products ?? products.filter(p => p.status === 'Aktif').length} Item`}
              note="Semua grade bersertifikat resmi"
            />
            <StatCard
              label="Pelanggan"
              value={`${dashboardStats?.total_customers ?? customers.length} Akun`}
              note={(dashboardStats?.total_customers ?? customers.length) > 0 ? `${dashboardStats?.total_customers ?? customers.length} pelanggan terdaftar` : 'Belum ada pelanggan'}
            />
          </div>

          {/* Grafik Penjualan (Panel lebar dengan periode) */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Tren Keuangan
                </span>
                <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                  Grafik Penjualan Harian
                </h3>
              </div>

              {/* Pilihan Periode */}
              <div className="flex items-center gap-2 bg-[#F4F1EB] p-1 rounded-full border border-[#E6DDD0]">
                {['7 Hari Terakhir', '30 Hari', 'Bulan Ini'].map((p, idx) => (
                  <button
                    key={p}
                    type="button"
                    className={`min-h-[36px] px-4 rounded-full text-xs font-semibold transition-all ${
                      idx === 0
                        ? 'bg-[#12263A] text-white shadow-xs'
                        : 'text-[#4A5666] hover:text-[#12263A]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="w-full h-[180px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveSalesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" vertical={false} />
                  <XAxis dataKey="date" stroke="#4A5666" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#4A5666"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Penjualan']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E6DDD0',
                      borderRadius: '12px',
                      color: '#12263A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#12263A"
                    strokeWidth={3}
                    dot={{ fill: '#D9B877', r: 5, stroke: '#12263A', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#8A6A2F' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dua Panel Bawah: Stok Menipis & Pesanan Terbaru */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Stok Menipis (1 Col) */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                    Inventaris Kritis
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBEFD5] text-[#7A5410]">
                    Perlu Restock
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                  Stok Menipis
                </h3>

                <div className="space-y-3">
                  {stockItems.length === 0 && (
                    <p className="text-xs text-[#4A5666] py-6 text-center">
                      Semua stok perhiasan dalam kondisi aman.
                    </p>
                  )}
                  {stockItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-medium text-[#12263A] truncate">
                          {item.productName}
                        </h4>
                        <span className="text-[11px] text-[#4A5666]">{item.sku}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif text-base font-semibold text-[#12263A]">
                          {item.stock} unit
                        </span>
                        <div>
                          <StatusBadge status={item.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMenu('stock')}
                className="mt-6 w-full min-h-[44px] rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A] hover:text-white transition-all text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Kelola Seluruh Stok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel Pesanan Terbaru (2 Cols) */}
            <div className="lg:col-span-2 bg-white border border-[#E6DDD0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                      Aktivitas Penjualan
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                      Pesanan Terbaru
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('orders')}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat semua pesanan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-medium">
                        <th className="py-2.5 px-3">No. Pesanan</th>
                        <th className="py-2.5 px-3">Pelanggan</th>
                        <th className="py-2.5 px-3">Produk</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DDD0]/60">
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[#4A5666]">
                            Belum ada transaksi pesanan terbaru.
                          </td>
                        </tr>
                      )}
                      {orders.slice(0, 5).map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveMenu('orders');
                          }}
                          className="hover:bg-[#F4F1EB]/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-medium text-[#12263A]">
                            {order.id}
                          </td>
                          <td className="py-3 px-3 text-[#12263A] font-medium">
                            {order.customerName}
                          </td>
                          <td className="py-3 px-3 text-[#4A5666] truncate max-w-[180px]">
                            {order.productSummary}
                          </td>
                          <td className="py-3 px-3 font-serif font-semibold text-[#12263A]">
                            Rp {order.total.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={order.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3.2 PRODUK
         ======================================================== */}
      {activeMenu === 'products' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Katalog Produk"
            description="Kelola koleksi perhiasan mutiara air laut selatan, penentuan harga, grade gemologi, dan status tayang."
            actions={
              <button
                type="button"
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'Kalung Mutiara',
                    variety: 'South Sea Pearl',
                    grade: 'AAA',
                    pearlSize: '11-12 mm',
                    metal: 'Emas 18K',
                    price: 15000000,
                    stock: 5,
                    status: 'Aktif',
                  });
                  setIsProductSlideOverOpen(true);
                }}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            }
          />

          {/* Toolbar: Kolom Cari, Filter Kategori, Varietas, Grade, Status */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Cari nama produk atau SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Kategori */}
            <select
              aria-label="Filter Kategori" value={productCatFilter}
              onChange={(e) => setProductCatFilter(e.target.value)}
              className="min-h-[44px] px-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-medium text-[#12263A] focus:outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Filter Varietas */}
            <select
              aria-label="Filter Varietas" value={productVarietyFilter}
              onChange={(e) => setProductVarietyFilter(e.target.value)}
              className="min-h-[44px] px-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-medium text-[#12263A] focus:outline-none"
            >
              <option value="Semua">Semua Varietas</option>
              <option value="South Sea Pearl">South Sea Pearl</option>
              <option value="Golden South Sea">Golden South Sea</option>
              <option value="Tahitian Black Pearl">Tahitian Black Pearl</option>
            </select>

            {/* Filter Grade */}
            <select
              aria-label="Filter Grade" value={productGradeFilter}
              onChange={(e) => setProductGradeFilter(e.target.value)}
              className="min-h-[44px] px-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-medium text-[#12263A] focus:outline-none"
            >
              <option value="Semua">Semua Grade</option>
              <option value="AAA">Grade AAA</option>
              <option value="AA+">Grade AA+</option>
            </select>

            {/* Filter Status */}
            <select
              aria-label="Filter Status" value={productStatusFilter}
              onChange={(e) => setProductStatusFilter(e.target.value)}
              className="min-h-[44px] px-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-medium text-[#12263A] focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Tabel Produk (Thumbnail X 48px, Nama, Kategori, Varietas, Grade, Logam, Harga, Stok, Status, Aksi) */}
          <DataTable
            pagination={
              <div className="flex items-center justify-between w-full text-xs text-[#4A5666]">
                <span>Menampilkan 1-{products.length} dari {products.length} produk</span>
                <div className="flex gap-2">
                  <button type="button" disabled className="px-3 py-1.5 rounded-full border border-[#E6DDD0] opacity-50 cursor-not-allowed">Sebelumnya</button>
                  <button type="button" className="px-3 py-1.5 rounded-full bg-[#12263A] text-white font-semibold">1</button>
                  <button type="button" disabled className="px-3 py-1.5 rounded-full border border-[#E6DDD0] opacity-50 cursor-not-allowed">Selanjutnya</button>
                </div>
              </div>
            }
          >
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4">Foto X</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Varietas</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-4">Logam</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Stok</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60">
              {products
                .filter(p => productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) : true)
                .filter(p => productCatFilter !== 'Semua' ? p.category === productCatFilter : true)
                .filter(p => productVarietyFilter !== 'Semua' ? p.variety === productVarietyFilter : true)
                .filter(p => productGradeFilter !== 'Semua' ? p.grade === productGradeFilter : true)
                .filter(p => productStatusFilter !== 'Semua' ? p.status === productStatusFilter : true)
                .map((product) => (
                  <tr key={product.id} className="hover:bg-[#F4F1EB]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                        <img
                          src={resolveMediaUrl(product.image) || getAdminProductImage(product.category, product.name)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getAdminProductImage(product.category, product.name);
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#12263A] max-w-[200px] truncate">{product.name}</div>
                      <span className="text-[11px] text-[#4A5666]">{product.pearlSize}</span>
                    </td>
                    <td className="py-3 px-4 text-[#4A5666]">{product.category}</td>
                    <td className="py-3 px-4 text-xs font-medium text-[#12263A]">{product.variety}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F1EB] text-[#8A6A2F] border border-[#E6DDD0]">
                        {product.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4A5666]">{product.metal}</td>
                    <td className="py-3 px-4 font-serif font-semibold text-[#12263A]">
                      {product.formattedPrice}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${product.stock <= 2 ? 'text-[#9B1C1C]' : 'text-[#12263A]'}`}>
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={product.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsProductSlideOverOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#12263A] hover:bg-[#F4F1EB] transition-colors"
                          title="Ubah Produk"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivateProduct(product)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Nonaktifkan Produk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </DataTable>

          {/* Form Modal Tambah/Ubah Produk (Satu Komponen Terpadu) */}
          <ProductFormModal
            isOpen={isProductSlideOverOpen}
            onClose={() => {
              setIsProductSlideOverOpen(false);
              setEditingProduct(null);
            }}
            product={editingProduct}
            onSave={handleSaveProduct}
          />
        </div>
      )}

      {/* ========================================================
          3.3 KATEGORI
         ======================================================== */}
      {activeMenu === 'categories' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Kategori Perhiasan"
            description="Daftar 5 kategori resmi perhiasan mutiara air laut selatan sesuai struktur etalase website."
            actions={
              <button
                type="button"
                onClick={() => {
                  setNewCatName('');
                  setNewCatSubtitle('');
                  setIsCategoryModalOpen(true);
                }}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kategori</span>
              </button>
            }
          />

          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4">Foto</th>
                <th className="py-3.5 px-4">Nama Kategori</th>
                <th className="py-3.5 px-4">Subjudul</th>
                <th className="py-3.5 px-4">Jumlah Produk</th>
                <th className="py-3.5 px-4">Urutan Tampil</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#F4F1EB]/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                      <img
                        src={getAdminProductImage(cat.name)}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#12263A]">{cat.name}</td>
                  <td className="py-3 px-4 text-xs text-[#4A5666]">{cat.subtitle}</td>
                  <td className="py-3 px-4 font-semibold text-[#12263A]">{cat.productsCount} Produk</td>
                  <td className="py-3 px-4 text-xs text-[#4A5666] font-mono">#{cat.order}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={cat.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...cat });
                          setIsCategoryEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#12263A] hover:bg-[#F4F1EB] transition-colors"
                        title="Ubah Kategori"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {/* Modal Form Tambah Kategori */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                    Tambah Kategori Baru
                  </h3>
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-full hover:bg-[#F4F1EB]">
                    <X className="w-5 h-5 text-[#4A5666]" />
                  </button>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Nama Kategori
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bros Mutiara"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Subjudul / Keterangan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pin Bros Emas 18K Samudera"
                      value={newCatSubtitle}
                      onChange={(e) => setNewCatSubtitle(e.target.value)}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Banner Ilustrasi Kategori
                    </label>
                    <div className="h-[90px] rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] relative">
                      <img
                        src="/images/hero_pearl_shell.jpg"
                        alt="Banner Kategori"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-white text-xs font-medium">Pratinjau Banner Koleksi</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E6DDD0]">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="min-h-[44px] px-5 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652]"
                    >
                      Simpan Kategori
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Form Ubah Kategori */}
          {isCategoryEditModalOpen && editingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                    Ubah Data Kategori
                  </h3>
                  <button type="button" onClick={() => setIsCategoryEditModalOpen(false)} className="p-1 rounded-full hover:bg-[#F4F1EB]">
                    <X className="w-5 h-5 text-[#4A5666]" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Nama Kategori
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Subjudul
                    </label>
                    <input
                      type="text"
                      value={editingCategory.subtitle}
                      onChange={(e) => setEditingCategory({ ...editingCategory, subtitle: e.target.value })}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                        Urutan Tampil
                      </label>
                      <input
                        type="number"
                        value={editingCategory.order}
                        onChange={(e) => setEditingCategory({ ...editingCategory, order: Number(e.target.value) })}
                        className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={editingCategory.status}
                        onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E6DDD0]">
                    <button
                      type="button"
                      onClick={() => setIsCategoryEditModalOpen(false)}
                      className="min-h-[44px] px-5 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652]"
                    >
                      Perbarui Kategori
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3.4 PESANAN
         ======================================================== */}
      {activeMenu === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Kelola Pesanan"
            description="Pantau alur transaksi, verifikasi bukti transfer, pencetakan resi berasuransi, dan pembaruan status logistik."
          />

          {/* Tab Status Pesanan */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E6DDD0] pb-3">
            {['Semua', 'Menunggu Pembayaran', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'].map((tab) => {
              const isActive = orderStatusTab === tab;
              const count = tab === 'Semua' ? orders.length : orders.filter(o => o.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setOrderStatusTab(tab)}
                  className={`min-h-[40px] px-4 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#12263A] text-white shadow-xs'
                      : 'bg-white text-[#4A5666] border border-[#E6DDD0] hover:bg-[#F4F1EB]'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-[#D9B877] text-[#12263A]' : 'bg-[#EDE6DA] text-[#4A5666]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail Pesanan (Jika sedang dibuka) */}
          {selectedOrder ? (
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8 space-y-6 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6DDD0]">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs font-semibold text-[#8A6A2F] hover:underline flex items-center gap-1 mb-1 cursor-pointer"
                  >
                    ← Kembali ke daftar pesanan
                  </button>
                  <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#12263A]">
                    Detail Pesanan {selectedOrder.id}
                  </h2>
                  <span className="text-xs text-[#4A5666]">Dibuat pada {selectedOrder.date}</span>
                </div>
                <div>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              {/* Items in order */}
              <div>
                <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-3">
                  Item Perhiasan
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                          <img
                            src={getAdminProductImage('', it.name)}
                            alt={it.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="font-medium text-[#12263A] text-sm">{it.name}</h5>
                          <span className="text-xs text-[#4A5666]">{it.pearlSize} • {it.metal}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#4A5666]">{it.quantity}x</span>
                        <div className="font-serif font-semibold text-[#12263A]">
                          Rp {(it.price * it.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alamat & Pembayaran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E6DDD0]">
                <div>
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-2">
                    Alamat Pengiriman
                  </h4>
                  <p className="font-medium text-sm text-[#12263A]">{selectedOrder.customerName}</p>
                  <p className="text-xs text-[#4A5666] mt-1">{selectedOrder.shippingAddress}, {selectedOrder.city}</p>
                  <p className="text-xs text-[#4A5666] mt-0.5">{selectedOrder.customerPhone}</p>
                </div>

                <div>
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-2">
                    Ringkasan Pembayaran
                  </h4>
                  <div className="text-xs space-y-1.5 text-[#4A5666]">
                    <div className="flex justify-between"><span>Metode:</span><span className="font-medium text-[#12263A]">{selectedOrder.paymentMethod}</span></div>
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rp {selectedOrder.subtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span>Asuransi:</span><span>Rp {selectedOrder.insuranceCost.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between pt-2 border-t border-[#E6DDD0] text-sm font-semibold text-[#12263A]">
                      <span>Total:</span>
                      <span className="font-serif text-lg">Rp {selectedOrder.total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Resi, Kurir, Ubah Status */}
              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] space-y-4">
                <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                  Logistik &amp; Perubahan Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Kurir Pengiriman</label>
                    <input
                      type="text"
                      value={inputCourier}
                      onChange={(e) => setInputCourier(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E6DDD0] text-xs text-[#12263A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">Nomor Resi Pengiriman</label>
                    <input
                      type="text"
                      placeholder="Contoh: JNE-YES-998823101"
                      value={inputResi}
                      onChange={(e) => setInputResi(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E6DDD0] text-xs font-mono text-[#12263A]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-[#12263A] mr-2">Ubah Status Jadi:</span>
                  {(['Menunggu Pembayaran', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        if (st === 'Dibatalkan') {
                          // Sensitive action: Pembatalan pesanan wajib diajukan ke SPI
                          setCancelOrderCandidate(selectedOrder);
                          setCancelOrderNotes('');
                          setIsCancelOrderApprovalModalOpen(true);
                        } else {
                          handleUpdateOrderStatus(st);
                        }
                      }}
                      className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-[#12263A] text-white'
                          : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {selectedOrder.status === 'Menunggu Pembayaran' && (
                  <div className="mt-4 p-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-[#8A6A2F] shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#12263A]">Status: Menunggu Pembayaran</p>
                        <p className="text-[11px] text-[#4A5666]">
                          Sudah menerima transfer manual atau pelunasan kasir? Ajukan konfirmasi pelunasan ke SPI untuk verifikasi.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentApprovalOrder(selectedOrder);
                        setPaymentApprovalNotes('');
                        setIsPaymentApprovalModalOpen(true);
                      }}
                      className="min-h-[40px] px-5 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] cursor-pointer inline-flex items-center gap-1.5 shadow-sm border border-[#D9B877]/40"
                    >
                      <Check className="w-4 h-4 text-[#D9B877]" />
                      <span>Ajukan Konfirmasi Pembayaran</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tabel Pesanan */
            <DataTable>
              <thead>
                <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                  <th className="py-3.5 px-4">No. Pesanan</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Produk</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0]/60">
                {orders
                  .filter(o => orderStatusTab === 'Semua' ? true : o.status === orderStatusTab)
                  .filter(o => orderSearch ? o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || o.id.includes(orderSearch) : true)
                  .map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-[#F4F1EB]/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#12263A]">{order.id}</td>
                      <td className="py-3.5 px-4 text-xs text-[#4A5666]">{order.date}</td>
                      <td className="py-3.5 px-4 font-medium text-[#12263A]">{order.customerName}</td>
                      <td className="py-3.5 px-4 text-xs text-[#4A5666] truncate max-w-[200px]">{order.productSummary}</td>
                      <td className="py-3.5 px-4 font-serif font-semibold text-[#12263A]">
                        Rp {order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#4A5666]">{order.paymentMethod}</td>
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
          )}
        </div>
      )}

      {/* ========================================================
          3.5 PELANGGAN
         ======================================================== */}
      {activeMenu === 'customers' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Daftar Pelanggan"
            description="Informasi kontak VIP, riwayat pesanan perorangan, dan tautan langsung ke WhatsApp Concierge."
          />

          {selectedCustomer ? (
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8 space-y-6">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs font-semibold text-[#8A6A2F] hover:underline mb-2 cursor-pointer"
              >
                ← Kembali ke daftar pelanggan
              </button>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E6DDD0]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D9B877] shrink-0 shadow-sm">
                    <img
                      src={getCustomerAvatar(selectedCustomer.id)}
                      alt={selectedCustomer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-[#12263A]">{selectedCustomer.name}</h3>
                    <p className="text-xs text-[#4A5666]">{selectedCustomer.email} • Bergabung sejak {selectedCustomer.joinDate}</p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(selectedCustomer.name)},%20kami%20dari%20CD'E%20Pearls...`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-[#D9B877]" />
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>

              {/* 2 Cols: Alamat & Ringkasan Belanja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0]">
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-2">
                    Daftar Alamat Tersimpan
                  </h4>
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-white rounded-xl border border-[#E6DDD0] mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#12263A]">{addr.label}</span>
                        {addr.isPrimary && <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E2F1E0] text-[#2B6330] font-bold">Utama</span>}
                      </div>
                      <p className="text-xs text-[#4A5666] mt-1">{addr.address}, {addr.city}, {addr.postalCode}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0]">
                  <h4 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] mb-2">
                    Aktivitas Akun
                  </h4>
                  <div className="space-y-2 text-xs text-[#4A5666]">
                    <div className="flex justify-between"><span>Jumlah Pesanan:</span><span className="font-bold text-[#12263A]">{selectedCustomer.totalOrders} Pesanan</span></div>
                    <div className="flex justify-between"><span>Total Belanja:</span><span className="font-serif text-base font-bold text-[#12263A]">Rp {selectedCustomer.totalSpend.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between"><span>Kota Utama:</span><span className="text-[#12263A]">{selectedCustomer.city}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DataTable>
              <thead>
                <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                  <th className="py-3.5 px-4">Avatar X</th>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4">Kota</th>
                  <th className="py-3.5 px-4">Pesanan</th>
                  <th className="py-3.5 px-4">Total Belanja</th>
                  <th className="py-3.5 px-4">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0]/60">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-[#F4F1EB]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D9B877] shrink-0 shadow-xs">
                        <img
                          src={getCustomerAvatar(c.id)}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#12263A]">{c.name}</td>
                    <td className="py-3 px-4 text-xs text-[#4A5666]">{c.email}</td>
                    <td className="py-3 px-4 text-xs font-mono text-[#12263A]">{c.phone}</td>
                    <td className="py-3 px-4 text-xs text-[#4A5666]">{c.city}</td>
                    <td className="py-3 px-4 font-semibold text-[#12263A]">{c.totalOrders}x</td>
                    <td className="py-3 px-4 font-serif font-semibold text-[#12263A]">
                      Rp {c.totalSpend.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4A5666]">{c.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      )}

      {/* ========================================================
          3.6 STOK
         ======================================================== */}
      {activeMenu === 'stock' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Inventaris &amp; Stok Mutiara"
            description="Manajemen kuota mutiara hasil panen budidaya Lombok, batas ambang minimum, dan riwayat mutasi masuk/keluar."
          />

          {/* 3 Kartu Ringkasan Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              label="Total Item Terdata"
              value={`${stockItems.reduce((acc, curr) => acc + curr.stock, 0)} Unit`}
              note="Total seluruh koleksi perhiasan"
            />
            <StatCard
              label="Stok Menipis"
              value={`${stockItems.filter(s => s.status === 'Menipis').length} SKU`}
              note="Mendekati batas minimum panen"
            />
            <StatCard
              label="Stok Habis"
              value={`${stockItems.filter(s => s.status === 'Habis').length} SKU`}
              note="Menunggu batch panen berikutnya"
            />
          </div>

          {/* Tabel Stok Produk */}
          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Stok Saat Ini</th>
                <th className="py-3.5 px-4">Batas Minimum</th>
                <th className="py-3.5 px-4">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#F4F1EB]/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#12263A]">{item.productName}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[#4A5666]">{item.sku}</td>
                  <td className="py-3 px-4 font-serif text-base font-semibold text-[#12263A]">{item.stock} unit</td>
                  <td className="py-3 px-4 text-xs text-[#4A5666]">{item.minLimit} unit</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStockItem(item);
                        setStockAdjustQty(item.stock);
                        setIsAdjustStockOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-full border border-[#12263A] text-xs font-semibold text-[#12263A] hover:bg-[#12263A] hover:text-white transition-all cursor-pointer"
                    >
                      Sesuaikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {/* Riwayat Pergerakan Stok */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6">
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              Audit Logistik
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
              Riwayat Pergerakan Stok
            </h3>

            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-medium">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Jumlah</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/60 text-[#12263A]">
                  {stockMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F4F1EB]/50">
                      <td className="py-2.5 px-3 text-[#4A5666]">{m.date}</td>
                      <td className="py-2.5 px-3 font-medium">{m.productName}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${m.type === 'Masuk' ? 'bg-[#E2F1E0] text-[#2B6330]' : 'bg-[#E1ECF7] text-[#1D4E7A]'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">{m.quantity} Unit</td>
                      <td className="py-2.5 px-3 text-[#4A5666]">{m.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Sesuaikan Stok (Aksi Sensitif Diajukan ke SPI) */}
          {isAdjustStockOpen && selectedStockItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-1">
                  Pengajuan Penyesuaian Stok ke SPI
                </h3>
                <p className="text-xs text-[#4A5666] mb-4">
                  Produk: <strong className="text-[#12263A]">{selectedStockItem.productName}</strong> ({selectedStockItem.sku})
                </p>

                <form onSubmit={submitStockAdjustmentApproval} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0]">
                      <span className="text-[#4A5666] block">Stok Saat Ini:</span>
                      <span className="font-mono font-bold text-sm text-[#12263A]">{selectedStockItem.stock} unit</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0]">
                      <span className="text-[#8A6A2F] block font-semibold">Selisih:</span>
                      <span className="font-mono font-bold text-sm text-[#12263A]">
                        {stockAdjustQty - selectedStockItem.stock > 0 ? `+${stockAdjustQty - selectedStockItem.stock}` : stockAdjustQty - selectedStockItem.stock} unit
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">
                      Jumlah Unit Baru <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={stockAdjustQty}
                      onChange={(e) => setStockAdjustQty(Number(e.target.value))}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] mb-1">
                      Catatan Alasan Penyesuaian (Wajib untuk SPI) <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={stockAdjustNotes}
                      onChange={(e) => setStockAdjustNotes(e.target.value)}
                      placeholder="Contoh: Penerimaan panen mutiara baru dari farm Sekotong sebanyak 3 butir lolos uji gemologi."
                      className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdjustStockOpen(false)}
                      className="min-h-[40px] px-4 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!stockAdjustNotes.trim()}
                      className="min-h-[40px] px-5 rounded-full bg-[#12263A] text-[#D9B877] text-xs font-bold hover:bg-[#1A3652] disabled:opacity-50 border border-[#D9B877]/40 shadow-sm"
                    >
                      Ajukan Penyesuaian ke SPI
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3.7 SERTIFIKAT GEMOLOGI
         ======================================================== */}
      {activeMenu === 'certificates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Sertifikat Gemologi"
            description="Dokumentasi resmi keaslian mutiara dari laboratorium gemologi independen (Sertifikat lab gemologi)."
            actions={
              <button
                type="button"
                onClick={() => setIsCertModalOpen(true)}
                className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>+ Unggah Sertifikat PDF</span>
              </button>
            }
          />

          <DataTable>
            <thead>
              <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold text-xs uppercase tracking-wider bg-[#F4F1EB]/50">
                <th className="py-3.5 px-4">No. Sertifikat</th>
                <th className="py-3.5 px-4">Produk Perhiasan</th>
                <th className="py-3.5 px-4">Lab Penerbit</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-4">Ukuran Mutiara</th>
                <th className="py-3.5 px-4">Tanggal Terbit</th>
                <th className="py-3.5 px-4">Berkas</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDD0]/60">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-[#F4F1EB]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#12263A]">{cert.certNumber}</td>
                  <td className="py-3 px-4 font-medium text-[#12263A]">{cert.productName}</td>
                  <td className="py-3 px-4 text-xs text-[#4A5666]">{cert.issuingLab}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F1EB] text-[#8A6A2F] border border-[#E6DDD0]">
                      {cert.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#4A5666]">{cert.pearlSize}</td>
                  <td className="py-3 px-4 text-xs text-[#4A5666]">{cert.issueDate}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E1ECF7] text-[#1D4E7A]">
                      <FileText className="w-3 h-3" />
                      <span>{cert.pdfFileUrl}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCertPreview(cert)}
                        className="p-1.5 rounded-lg text-[#12263A] hover:bg-[#F4F1EB] transition-colors"
                        title="Lihat & Cetak Sertifikat Gemologi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertToDelete(cert)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Cabut / Hapus Sertifikat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {/* Modal Terbitkan Sertifikat Gemologi */}
          {isCertModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                      Gemological Authority
                    </span>
                    <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
                      Terbitkan Sertifikat Keaslian
                    </h3>
                  </div>
                  <button type="button" onClick={() => setIsCertModalOpen(false)} className="p-1 rounded-full hover:bg-[#F4F1EB]">
                    <X className="w-5 h-5 text-[#4A5666]" />
                  </button>
                </div>

                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Nomor Registrasi Sertifikat
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: LAB-LMB-9921 atau CERT-9901"
                      value={newCertNumber}
                      onChange={(e) => setNewCertNumber(e.target.value)}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm font-mono text-[#12263A] focus:outline-none focus:border-[#12263A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Pilih Produk Mutiara
                    </label>
                    <select
                      value={newCertProduct}
                      onChange={(e) => setNewCertProduct(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                        Lab Penerbit
                      </label>
                      <input
                        type="text"
                        value={newCertLab}
                        onChange={(e) => setNewCertLab(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                        Grade Gemologi
                      </label>
                      <input
                        type="text"
                        value={newCertGrade}
                        onChange={(e) => setNewCertGrade(e.target.value)}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-1">
                      Ukuran Diameter Mutiara
                    </label>
                    <input
                      type="text"
                      placeholder="11-12 mm"
                      value={newCertPearlSize}
                      onChange={(e) => setNewCertPearlSize(e.target.value)}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E6DDD0]">
                    <button
                      type="button"
                      onClick={() => setIsCertModalOpen(false)}
                      className="min-h-[44px] px-5 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652]"
                    >
                      Terbitkan Sertifikat
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3.8 LAPORAN
         ======================================================== */}
      {activeMenu === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Laporan Bisnis &amp; Penjualan"
            description="Analisis performa pendapatan perhiasan mutiara, distribusi kategori, dan produk terlaris."
            actions={
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white p-1 rounded-full border border-[#E6DDD0]">
                  {['Hari ini', '7 hari', '30 hari', 'Kustom'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setReportPeriod(p)}
                      className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all ${
                        reportPeriod === p
                          ? 'bg-[#12263A] text-white'
                          : 'text-[#4A5666] hover:text-[#12263A]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(reportApi.getSalesCsvDownloadUrl(), '_blank')}
                    className="min-h-[44px] px-4 rounded-full bg-[#12263A] text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#1A3652] cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#D9B877]" />
                    <span>Ekspor Penjualan (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(reportApi.getInventoryCsvDownloadUrl(), '_blank')}
                    className="min-h-[44px] px-4 rounded-full border border-[#12263A] text-[#12263A] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#F4F1EB] cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#8A6A2F]" />
                    <span>Ekspor Stok (CSV)</span>
                  </button>
                </div>
              </div>
            }
          />

          {/* 3 Kartu Total Laporan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              label="Total Penjualan"
              value={`Rp ${(dashboardStats?.total_revenue || 0).toLocaleString('id-ID')}`}
              note="Akumulasi seluruh transaksi resmi"
            />
            <StatCard
              label="Jumlah Pesanan"
              value={`${orders.length} Transaksi`}
              note={orders.length > 0 ? 'Total tercatat di basis data' : 'Belum ada transaksi'}
            />
            <StatCard
              label="Rata-rata Nilai Pesanan"
              value={`Rp ${(orders.length > 0 ? Math.round((dashboardStats?.total_revenue || 0) / orders.length) : 0).toLocaleString('id-ID')}`}
              note="Rata-rata per transaksi"
            />
          </div>

          {/* Dua Grafik: Penjualan Garis & Kategori Batang */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                Tren Pendapatan
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                Penjualan per Periode
              </h3>
              <div className="h-[180px] lg:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveSalesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" vertical={false} />
                    <XAxis dataKey="date" stroke="#4A5666" fontSize={11} tickLine={false} />
                    <YAxis stroke="#4A5666" fontSize={10} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
                    <Line type="monotone" dataKey="sales" stroke="#12263A" strokeWidth={2.5} dot={{ fill: '#D9B877', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                Distribusi Kategori
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
                Penjualan per Kategori
              </h3>
              <div className="h-[180px] lg:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveCategorySalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" vertical={false} />
                    <XAxis dataKey="category" stroke="#4A5666" fontSize={11} tickLine={false} />
                    <YAxis stroke="#4A5666" fontSize={10} tickLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
                    <Bar dataKey="sales" fill="#8A6A2F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabel Produk Terlaris */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6">
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              Top Performer
            </span>
            <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-4">
              Produk Terlaris (Bestsellers)
            </h3>

            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6DDD0] text-[#4A5666] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Peringkat</th>
                    <th className="py-3 px-3">Produk</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Terjual</th>
                    <th className="py-3 px-3">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]/60">
                  {bestsellers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#4A5666]">
                        Belum ada data penjualan tercatat.
                      </td>
                    </tr>
                  ) : (
                    bestsellers.map((b) => (
                      <tr key={b.rank} className="hover:bg-[#F4F1EB]/50">
                        <td className="py-3 px-3 font-serif font-bold text-sm text-[#8A6A2F]">#{b.rank}</td>
                        <td className="py-3 px-3 font-medium text-[#12263A]">{b.name}</td>
                        <td className="py-3 px-3 text-[#4A5666]">{b.category}</td>
                        <td className="py-3 px-3 font-bold text-[#12263A]">{b.sold} Unit</td>
                        <td className="py-3 px-3 font-serif font-semibold text-[#12263A]">
                          Rp {b.revenue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3.9 PENGATURAN
         ======================================================== */}
      {activeMenu === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageHeader
            title="Pengaturan Toko &amp; Atelier"
            description="Konfigurasi identitas butik, kanal WhatsApp Concierge, opsi kurir berasuransi, dan rekening bank resmi."
          />

          {/* Tab di bagian atas konten */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E6DDD0] pb-3">
            {[
              { id: 'profile', label: 'Profil Toko' },
              { id: 'contact', label: 'Kontak & WhatsApp' },
              { id: 'shipping', label: 'Pengiriman & Asuransi' },
              { id: 'payment', label: 'Pembayaran' },
              { id: 'security', label: 'Akun & Keamanan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`min-h-[40px] px-5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeSettingsTab === tab.id
                    ? 'bg-[#12263A] text-white shadow-xs'
                    : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 lg:p-8 max-w-2xl">
            {activeSettingsTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Profil Toko</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Nama Butik / Toko</label>
                  <input type="text" defaultValue="CD'E Pearls Lombok Atelier" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Logo Resmi Atelier CD'E Pearls</label>
                  <div className="p-3 bg-[#FBF8F3] border border-[#E6DDD0] rounded-xl inline-block shadow-xs">
                    <img
                      src="/images/cde_logo.png"
                      alt="CD'E Pearls Official Logo"
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Deskripsi Singkat</label>
                  <textarea rows={3} defaultValue="Atelier mutiara air laut selatan pilihan dari Lombok dengan kilau cermin alami dan sertifikasi gemologi resmi." className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <button type="button" onClick={() => alert('Perubahan profil tersimpan')} className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold cursor-pointer">Simpan Perubahan</button>
              </div>
            )}

            {activeSettingsTab === 'contact' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Kontak &amp; WhatsApp Concierge</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Nomor WhatsApp Concierge</label>
                  <input type="text" defaultValue="+62 812-3900-1122" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Akun Instagram</label>
                  <input type="text" defaultValue="@cdepearlslombok" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Alamat Atelier</label>
                  <textarea rows={2} defaultValue="Kawasan Pesisir Sire, Tanjung, Kabupaten Lombok Utara, Nusa Tenggara Barat 83352" className="w-full p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <button type="button" onClick={() => alert('Perubahan kontak tersimpan')} className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold cursor-pointer">Simpan Perubahan</button>
              </div>
            )}

            {activeSettingsTab === 'shipping' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Pengiriman &amp; Asuransi</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-[#12263A]">
                    <input type="checkbox" defaultChecked className="accent-[#12263A] w-4 h-4" />
                    <span>JNE Express (YES &amp; Reguler Berasuransi)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#12263A]">
                    <input type="checkbox" defaultChecked className="accent-[#12263A] w-4 h-4" />
                    <span>TIKI ONS (Over Night Services Berasuransi)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#12263A]">
                    <input type="checkbox" defaultChecked className="accent-[#12263A] w-4 h-4" />
                    <span>Wajibkan Asuransi Penuh untuk Nilai Tinggi</span>
                  </label>
                </div>
                <button type="button" onClick={() => alert('Pengaturan kurir tersimpan')} className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold cursor-pointer">Simpan Perubahan</button>
              </div>
            )}

            {activeSettingsTab === 'payment' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Metode Pembayaran</h3>
                <div className="p-3 bg-[#F4F1EB] rounded-xl text-xs space-y-1">
                  <p className="font-semibold text-[#12263A]">Rekening Utama BCA Atelier:</p>
                  <p className="font-mono text-[#12263A]">056-118-9900 a.n. PT CD'E Pearls Lombok</p>
                </div>
                <div className="p-3 bg-[#F4F1EB] rounded-xl text-xs space-y-1">
                  <p className="font-semibold text-[#12263A]">Rekening Mandiri Bisnis:</p>
                  <p className="font-mono text-[#12263A]">142-00-9922881-0 a.n. CD'E Pearls Official</p>
                </div>
                <button type="button" onClick={() => alert('Rekening bank tersimpan')} className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold cursor-pointer">Perbarui Rekening</button>
              </div>
            )}

            {activeSettingsTab === 'security' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Akun &amp; Keamanan</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Nama Petugas</label>
                  <input type="text" placeholder="Nama Petugas" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Email Login</label>
                  <input type="email" placeholder="admin@cdepearls.com" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] mb-1">Kata Sandi Baru</label>
                  <input type="password" placeholder="••••••••••••" className="w-full min-h-[44px] px-4 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-sm text-[#12263A]" />
                </div>
                <button type="button" onClick={() => alert('Kata sandi diperbarui')} className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold cursor-pointer">Simpan Keamanan</button>
              </div>
            )}
          </div>
        </div>
      )}

            {/* ========================================================
          MODAL: AJUKAN KONFIRMASI PEMBAYARAN KE SPI
         ======================================================== */}
      {isPaymentApprovalModalOpen && paymentApprovalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E6DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#12263A] text-[#D9B877] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5 text-[#D9B877]" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                  Ajukan Konfirmasi Pembayaran
                </h3>
                <p className="text-xs text-[#4A5666]">
                  Pesanan: <span className="font-mono font-bold text-[#12263A]">{paymentApprovalOrder.id}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Pelanggan:</span>
                <span className="font-semibold text-[#12263A]">{paymentApprovalOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Metode Pembayaran:</span>
                <span className="font-semibold text-[#12263A]">{paymentApprovalOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-[#E6DDD0] pt-1.5">
                <span className="text-[#4A5666]">Total Tagihan:</span>
                <span className="font-mono font-bold text-[#8A6A2F]">
                  Rp {paymentApprovalOrder.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={submitPaymentApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12263A] mb-1">
                  Catatan Admin (Wajib Diisi untuk Verifikasi SPI) <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={paymentApprovalNotes}
                  onChange={(e) => setPaymentApprovalNotes(e.target.value)}
                  placeholder="Contoh: Bukti mutasi transfer telah terverifikasi masuk rekening butik atas nama pemesan."
                  className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentApprovalModalOpen(false);
                    setPaymentApprovalOrder(null);
                  }}
                  className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!paymentApprovalNotes.trim()}
                  className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-2 border border-[#D9B877]/40"
                >
                  <Check className="w-4 h-4 text-[#D9B877]" />
                  <span>Kirim ke Persetujuan SPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AJUKAN PERUBAHAN HARGA >10% KE SPI
         ======================================================== */}
      {isPriceApprovalModalOpen && priceApprovalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E6DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FBEFD5] text-[#7A5410] flex items-center justify-center font-bold">
                %
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                  Otorisasi SPI: Ubah Harga &gt;{APPROVAL_RULES.PRICE_CHANGE_PERCENT_THRESHOLD}%
                </h3>
                <p className="text-xs text-[#4A5666]">
                  {priceApprovalProduct.product.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-red-700 block mb-0.5">Harga Lama:</span>
                <span className="font-bold text-red-950">
                  Rp {priceApprovalProduct.oldPrice.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block mb-0.5">Harga Baru Diajukan:</span>
                <span className="font-bold text-emerald-950">
                  Rp {priceApprovalProduct.newPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={submitPriceChangeApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12263A] mb-1">
                  Catatan Justifikasi Perubahan Harga (Wajib) <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={priceApprovalNotes}
                  onChange={(e) => setPriceApprovalNotes(e.target.value)}
                  placeholder="Contoh: Kenaikan harga emas 18K dunia dan sertifikasi grade AAA mirror luster."
                  className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPriceApprovalModalOpen(false);
                    setPriceApprovalProduct(null);
                  }}
                  className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!priceApprovalNotes.trim()}
                  className="min-h-[42px] px-6 rounded-full bg-[#12263A] text-[#D9B877] font-bold text-xs hover:bg-[#1A3652] disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-2 border border-[#D9B877]/40"
                >
                  <span>Ajukan ke SPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: AJUKAN PEMBATALAN PESANAN KE SPI
         ======================================================== */}
      {isCancelOrderApprovalModalOpen && cancelOrderCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E6DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">
                  Ajukan Pembatalan Pesanan
                </h3>
                <p className="text-xs text-[#4A5666]">
                  Pesanan: <span className="font-mono font-bold text-[#12263A]">{cancelOrderCandidate.id}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Pelanggan:</span>
                <span className="font-semibold text-[#12263A]">{cancelOrderCandidate.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Total Pesanan:</span>
                <span className="font-mono font-bold text-[#12263A]">Rp {cancelOrderCandidate.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <form onSubmit={submitCancelOrderApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12263A] mb-1">
                  Catatan Alasan Pembatalan (Wajib untuk SPI) <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelOrderNotes}
                  onChange={(e) => setCancelOrderNotes(e.target.value)}
                  placeholder="Contoh: Permintaan pembeli karena ingin mengganti pesanan dengan ukuran mutiara yang lebih besar."
                  className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelOrderApprovalModalOpen(false);
                    setCancelOrderCandidate(null);
                  }}
                  className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!cancelOrderNotes.trim()}
                  className="min-h-[42px] px-6 rounded-full bg-red-700 text-white font-bold text-xs hover:bg-red-800 disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <span>Ajukan Pembatalan ke SPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-full bg-[#12263A] text-white text-xs font-semibold shadow-xl border border-[#D9B877]/40 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

{/* ========================================================
          MODAL PREVIEW SERTIFIKAT LAB GEMOLOGI (Dengan Cetak)
         ======================================================== */}
      {selectedCertPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#D9B877] rounded-3xl max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95">
            {/* Header Sertifikat */}
            <div className="text-center border-b border-[#E6DDD0] pb-6 mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#12263A] text-[#D9B877] flex items-center justify-center mb-3 shadow-md border-2 border-[#D9B877]">
                <Award className="w-7 h-7" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#8A6A2F] block">
                Certificate of Authenticity &amp; Gemology
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#12263A] mt-1">
                CD'E Pearls Lombok
              </h3>
              <p className="text-xs text-[#4A5666] font-mono mt-1">
                Registrasi Resmi: {selectedCertPreview.certNumber}
              </p>
            </div>

            {/* Spesifikasi Mutiara */}
            <div className="space-y-3 text-xs bg-[#FBF8F3] p-5 rounded-2xl border border-[#E6DDD0]">
              <div className="flex justify-between border-b border-[#E6DDD0]/60 pb-2">
                <span className="text-[#4A5666]">Produk Perhiasan:</span>
                <span className="font-semibold text-[#12263A] text-right">{selectedCertPreview.productName}</span>
              </div>
              <div className="flex justify-between border-b border-[#E6DDD0]/60 pb-2">
                <span className="text-[#4A5666]">Laboratorium Gemologi:</span>
                <span className="font-semibold text-[#12263A]">{selectedCertPreview.issuingLab}</span>
              </div>
              <div className="flex justify-between border-b border-[#E6DDD0]/60 pb-2">
                <span className="text-[#4A5666]">Grade &amp; Kilau (Luster):</span>
                <span className="font-bold text-[#8A6A2F]">{selectedCertPreview.grade}</span>
              </div>
              <div className="flex justify-between border-b border-[#E6DDD0]/60 pb-2">
                <span className="text-[#4A5666]">Ukuran Diameter:</span>
                <span className="font-semibold text-[#12263A]">{selectedCertPreview.pearlSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A5666]">Tanggal Penerbitan:</span>
                <span className="font-mono text-[#12263A]">{selectedCertPreview.issueDate}</span>
              </div>
            </div>

            {/* Seal & QR Verification */}
            <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-[#E6DDD0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#12263A] rounded-xl flex items-center justify-center text-[#D9B877] font-bold font-mono text-[10px] text-center leading-none p-1">
                  QR VERIFIED
                </div>
                <div className="text-[11px] text-[#4A5666]">
                  <span className="font-semibold text-[#12263A] block">100% Genuine South Sea Pearl</span>
                  <span>Budidaya Perairan Pesisir Sire Lombok</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-[#D9B877] hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs border border-[#D9B877]/60"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sertifikat</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCertPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F1EB] text-[#4A5666]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          DIALOG KONFIRMASI HAPUS (Produk, Kategori, Sertifikat, Temuan)
         ======================================================== */}
      {/* 1. Hapus Produk (Aksi Sensitif Diajukan ke SPI) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E6DDD0] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 text-[#12263A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#12263A]">Ajukan Hapus Produk ke SPI</h3>
                <p className="text-xs text-[#4A5666]">Penghapusan SKU mutiara membutuhkan persetujuan resmi SPI.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs space-y-1">
              <div><span className="text-[#4A5666]">Nama Produk:</span> <strong className="text-[#12263A]">{productToDelete.name}</strong></div>
              <div><span className="text-[#4A5666]">Kategori:</span> {productToDelete.category} • <span className="text-[#4A5666]">Stok:</span> {productToDelete.stock} unit</div>
              <div><span className="text-[#4A5666]">Harga:</span> {productToDelete.formattedPrice}</div>
            </div>

            <form onSubmit={submitDeleteProductApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#12263A] mb-1">
                  Catatan Alasan Penghapusan (Wajib Diisi) <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={deleteProductNotes}
                  onChange={(e) => setDeleteProductNotes(e.target.value)}
                  placeholder="Contoh: Perhiasan mutiara ini sudah discontinued oleh perajin dan tidak lagi diproduksi."
                  className="w-full p-3 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProductToDelete(null);
                    setDeleteProductNotes('');
                  }}
                  className="min-h-[42px] px-5 rounded-full border border-[#E6DDD0] text-[#4A5666] hover:bg-[#F4F1EB] text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!deleteProductNotes.trim()}
                  onClick={() => setDeleteProductCandidate(productToDelete)}
                  className="min-h-[42px] px-6 rounded-full bg-red-700 text-white text-xs font-bold hover:bg-red-800 disabled:opacity-50 cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <span>Ajukan Hapus ke SPI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Hapus Kategori */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#12263A]">Hapus Kategori?</h3>
            <p className="text-xs text-[#4A5666]">
              Kategori <strong className="text-[#12263A]">{categoryToDelete.name}</strong> akan dihapus dari daftar etalase.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="min-h-[40px] px-5 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="min-h-[40px] px-5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hapus Sertifikat */}
      {certToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#12263A]">Cabut Sertifikat Gemologi?</h3>
            <p className="text-xs text-[#4A5666]">
              Sertifikat <strong className="text-[#12263A] font-mono">{certToDelete.certNumber}</strong> untuk produk {certToDelete.productName} akan dicabut.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCertToDelete(null)}
                className="min-h-[40px] px-5 rounded-full border border-[#12263A] text-xs font-semibold hover:bg-[#F4F1EB]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCert}
                className="min-h-[40px] px-5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Ya, Cabut
              </button>
            </div>
          </div>
        </div>
      )}

      </DashboardLayout>
  );
};
