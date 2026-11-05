export interface MockCategory {
  id: number;
  name: string;
  subtitle: string;
  slug: string;
  productsCount: number;
  order: number;
  status: 'Aktif' | 'Nonaktif';
  image?: string;
}
export const MockCategory = {};

export interface MockProduct {
  id: number;
  name: string;
  category: string;
  categorySlug: string;
  variety: string;
  grade: string;
  pearlSize: string; // e.g. "11-12 mm"
  metal: 'Emas 18K' | 'Perak 925';
  goldKarat?: string;
  weight: string; // e.g. "4.2 gr"
  price: number;
  formattedPrice: string;
  stock: number;
  status: 'Aktif' | 'Nonaktif';
  description: string;
  certificateNo?: string;
  bentuk?: string;
  colorGroup?: string;
  colorVariant?: string;
  images?: Array<{ url: string; order: number; is_primary: boolean; alt?: string }>;
  isBestseller?: boolean;
  image?: string;
}
export const MockProduct = {};

export interface MockOrderItem {
  productId: number;
  name: string;
  pearlSize: string;
  metal: string;
  price: number;
  quantity: number;
}
export const MockOrderItem = {};

export interface MockOrder {
  id: string; // #[ORD-2026-081]
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  productSummary: string;
  items: MockOrderItem[];
  subtotal: number;
  shippingCost: number;
  insuranceCost: number;
  total: number;
  paymentMethod: string;
  status: 'Menunggu Pembayaran' | 'Dikemas' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  trackingNumber?: string;
  courier?: string;
  timeline: {
    status: string;
    date: string;
    description: string;
    completed: boolean;
    current?: boolean;
  }[];
}
export const MockOrder = {};

export interface MockCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpend: number;
  joinDate: string;
  addresses: {
    id: number;
    label: string;
    recipient: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isPrimary: boolean;
  }[];
}
export const MockCustomer = {};

export interface MockStockItem {
  id: number;
  productName: string;
  sku: string;
  stock: number;
  minLimit: number;
  status: 'Aman' | 'Menipis' | 'Habis';
}
export const MockStockItem = {};

export interface MockStockMovement {
  id: number;
  date: string;
  productName: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  notes: string;
}
export const MockStockMovement = {};

export interface MockCertificate {
  id: number;
  certNumber: string;
  productName: string;
  issuingLab: string;
  grade: string;
  pearlSize: string;
  issueDate: string;
  pdfFileUrl: string;
}
export const MockCertificate = {};

export interface MockSpiAuditLog {
  id: number;
  timestamp: string;
  user: string;
  role: 'admin' | 'spi' | 'user';
  action: string;
  target: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  status: 'Disetujui' | 'Perlu Review' | 'Ditolak';
}
export const MockSpiAuditLog = {};

export type ApprovalType =
  | 'KONFIRMASI_PEMBAYARAN'
  | 'PERUBAHAN_HARGA'
  | 'HAPUS_PRODUK'
  | 'PENYESUAIAN_STOK'
  | 'PEMBATALAN_PESANAN'
  | 'DISKON_VIP';

export interface MockApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  target: string;
  targetId?: string | number;
  requestedBy: string;
  requestDate: string;
  notes: string;
  oldValue: string;
  newValue: string;
  payload?: any;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
}
export const MockApprovalItem = {};

export interface MockSpiFinding {
  id: number;
  code: string;
  title: string;
  category: 'Inventaris' | 'Finansial' | 'Kepatuhan Gemologi' | 'Operasional';
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
  staffName: string;
  recommendation: string;
  status: 'Dalam Investigasi' | 'Selesai';
  date: string;
}
export const MockSpiFinding = {};

export interface MockVipDiscountRequest {
  id: number;
  customerName: string;
  productName: string;
  originalPrice: number;
  requestedDiscountPercent: number;
  discountedPrice: number;
  requestedBy: string;
  reason: string;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  date: string;
}
export const MockVipDiscountRequest = {};

export interface MockStaffAccount {
  id: number;
  name: string;
  email: string;
  role: 'Admin Operasional' | 'Kasir Butik' | 'Staf Gudang' | 'Gemologis';
  status: 'Aktif' | 'Dibekukan';
  lastActive: string;
  permissions: string[];
}
export const MockStaffAccount = {};

// ================= DATA KATALOG (KOSONG - SUMBER DATA PRODUKSI HANYA API RESMI) =================

export const mockCategories: MockCategory[] = [];
export const mockProducts: MockProduct[] = [];
export const mockOrders: MockOrder[] = [];
export const mockCustomers: MockCustomer[] = [];
export const mockStockItems: MockStockItem[] = [];
export const mockStockMovements: MockStockMovement[] = [];
export const mockCertificates: MockCertificate[] = [];
export const mockSalesChartData: Array<{ date: string; sales: number; orders: number }> = [];
export const mockCategorySalesData: Array<{ category: string; sales: number }> = [];
export const mockBestsellers: Array<{ rank: number; name: string; category: string; sold: number; revenue: number }> = [];
export const mockSpiAuditLogs: MockSpiAuditLog[] = [];
export const mockApprovals: MockApprovalItem[] = [];
export const mockSpiFindings: MockSpiFinding[] = [];
export const mockVipDiscountRequests: MockVipDiscountRequest[] = [];
export const mockStaffAccounts: MockStaffAccount[] = [];
