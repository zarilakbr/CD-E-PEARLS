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

// ================= MOCK DATA =================

export const mockCategories: MockCategory[] = [
  {
    id: 1,
    name: 'Kalung Mutiara',
    subtitle: 'Untaian Strand & Collar',
    slug: 'kalung-mutiara',
    productsCount: 12,
    order: 1,
    status: 'Aktif',
    image: '/images/hero_pearl_shell.jpg',
  },
  {
    id: 2,
    name: 'Gelang Mutiara',
    subtitle: 'Bangle & Rantai Emas 18K',
    slug: 'gelang-mutiara',
    productsCount: 8,
    order: 2,
    status: 'Aktif',
    image: '/images/placeholder_jewelry.svg',
  },
  {
    id: 3,
    name: 'Anting Mutiara',
    subtitle: 'Stud, Drop & Dangle Klasik',
    slug: 'anting-mutiara',
    productsCount: 14,
    order: 3,
    status: 'Aktif',
    image: '/images/terroir_pearl_plate_left.jpg',
  },
  {
    id: 4,
    name: 'Cincin Mutiara',
    subtitle: 'Solitaire & Mahkota Berlian',
    slug: 'cincin-mutiara',
    productsCount: 9,
    order: 4,
    status: 'Aktif',
    image: '/images/cat_ring_silk.jpg',
  },
  {
    id: 5,
    name: 'Mutiara Lepas',
    subtitle: 'Loose Pearl Grade AAA & Kolektor',
    slug: 'mutiara-lepas',
    productsCount: 6,
    order: 5,
    status: 'Aktif',
    image: '/images/hero_pearl_dark_luxury.jpg',
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: 1,
    name: 'Kalung Mutiara South Sea Princess AAA',
    category: 'Kalung Mutiara',
    categorySlug: 'kalung-mutiara',
    variety: 'South Sea Pearl',
    grade: 'AAA',
    pearlSize: '11-12 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Kuning 18K (750)',
    weight: '5.4 gr',
    price: 18500000,
    formattedPrice: 'Rp 18.500.000',
    stock: 5,
    status: 'Aktif',
    description: 'Kalung untaian mutiara air laut selatan pilihan dari kedalaman perairan Lombok dengan kilau cermin tinggi (Mirror Luster). Pengait emas 18K bersertifikat resmi.',
    certificateNo: 'GIA-LMB-8921',
    isBestseller: true,
    image: '/images/hero_pearl_shell.jpg',
  },
  {
    id: 2,
    name: 'Gelang Rantai Mutiara Emas Imperial',
    category: 'Gelang Mutiara',
    categorySlug: 'gelang-mutiara',
    variety: 'Golden South Sea',
    grade: 'AAA',
    pearlSize: '10-11 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Kuning 18K (750)',
    weight: '4.8 gr',
    price: 14200000,
    formattedPrice: 'Rp 14.200.000',
    stock: 3,
    status: 'Aktif',
    description: 'Mutiara laut warna emas keemasan alami tanpa pewarna kimia, dipadukan rantai emas kuning 18K bermotif elegan.',
    certificateNo: 'GIA-LMB-8922',
    isBestseller: true,
    image: '/images/placeholder_jewelry.svg',
  },
  {
    id: 3,
    name: 'Anting Stud Mutiara Putih Lombok AAA',
    category: 'Anting Mutiara',
    categorySlug: 'anting-mutiara',
    variety: 'South Sea Pearl',
    grade: 'AAA',
    pearlSize: '9-10 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Putih 18K (750)',
    weight: '2.6 gr',
    price: 7800000,
    formattedPrice: 'Rp 7.800.000',
    stock: 8,
    status: 'Aktif',
    description: 'Anting stud klasik dengan mutiara bulat sempurna (round) berdiameter 9.5mm dan dudukan emas putih 18K tahan lama.',
    certificateNo: 'GIA-LMB-8923',
    isBestseller: true,
    image: '/images/terroir_pearl_plate_left.jpg',
  },
  {
    id: 4,
    name: 'Cincin Solitaire Tahitian Black Pearl 12mm',
    category: 'Cincin Mutiara',
    categorySlug: 'cincin-mutiara',
    variety: 'Tahitian Black Pearl',
    grade: 'AAA',
    pearlSize: '12-13 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Putih 18K (750)',
    weight: '3.9 gr',
    price: 12600000,
    formattedPrice: 'Rp 12.600.000',
    stock: 2,
    status: 'Aktif',
    description: 'Mutiara hitam eksotis Tahiti dengan kilau peacock hijau keperakan di atas rangka mahkota emas putih 18K beraksen pavé.',
    certificateNo: 'GIA-LMB-8924',
    isBestseller: true,
    image: '/images/cat_ring_silk.jpg',
  },
  {
    id: 5,
    name: 'Mutiara Lepas Golden South Sea 14mm AAA',
    category: 'Mutiara Lepas',
    categorySlug: 'mutiara-lepas',
    variety: 'Golden South Sea',
    grade: 'AAA',
    pearlSize: '14 mm',
    metal: 'Perak 925',
    goldKarat: 'Tanpa Logam (Loose)',
    weight: '3.8 gr',
    price: 9500000,
    formattedPrice: 'Rp 9.500.000',
    stock: 1,
    status: 'Aktif',
    description: 'Mutiara lepas mentah kelas kolektor dengan permukaan mulus di atas 98%, nacre tebal, dan warna deep golden memukau.',
    certificateNo: 'GIA-LMB-8925',
    image: '/images/hero_pearl_dark_luxury.jpg',
  },
  {
    id: 6,
    name: 'Kalung Choker Mutiara Gradasi Laut Selatan',
    category: 'Kalung Mutiara',
    categorySlug: 'kalung-mutiara',
    variety: 'South Sea Pearl',
    grade: 'AA+',
    pearlSize: '10-13 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Kuning 18K (750)',
    weight: '38.5 gr',
    price: 32000000,
    formattedPrice: 'Rp 32.000.000',
    stock: 2,
    status: 'Aktif',
    description: 'Untaian choker 42cm dengan susunan gradasi simetris yang dirangkai manual dengan sutra khusus perhiasan berkekuatan tinggi.',
    certificateNo: 'GIA-LMB-8926',
    image: '/images/hero_pearl_bg.jpg',
  },
  {
    id: 7,
    name: 'Anting Gantung Drop Pearl Emas 18K',
    category: 'Anting Mutiara',
    categorySlug: 'anting-mutiara',
    variety: 'South Sea Pearl',
    grade: 'AA+',
    pearlSize: '10-11 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Kuning 18K (750)',
    weight: '3.2 gr',
    price: 8900000,
    formattedPrice: 'Rp 8.900.000',
    stock: 4,
    status: 'Aktif',
    description: 'Anting drop anggun berbentuk teardrop alami yang memantulkan cahaya saat bergerak.',
    certificateNo: 'GIA-LMB-8927',
    image: '/images/terroir_pearl_plate_left.jpg',
  },
  {
    id: 8,
    name: 'Cincin Mutiara Barok Emas 18K Signature',
    category: 'Cincin Mutiara',
    categorySlug: 'cincin-mutiara',
    variety: 'South Sea Pearl',
    grade: 'AA+',
    pearlSize: '13 mm',
    metal: 'Emas 18K',
    goldKarat: 'Emas Kuning 18K (750)',
    weight: '5.1 gr',
    price: 11500000,
    formattedPrice: 'Rp 11.500.000',
    stock: 0,
    status: 'Nonaktif',
    description: 'Desain organik unik menggunakan mutiara barok tunggal bernilai seni tinggi.',
    certificateNo: 'GIA-LMB-8928',
    image: '/images/cat_ring_silk.jpg',
  },
];

export const mockOrders: MockOrder[] = [
  {
    id: '#[ORD-2026-081]',
    date: '28 Okt 2026, 14:32',
    customerName: 'Siti Rahmawati',
    customerEmail: 'siti.rahma@gmail.com',
    customerPhone: '+62 812-3456-7890',
    shippingAddress: 'Jl. Menteng Raya No. 45, RT 02 / RW 05, Menteng',
    city: 'Jakarta Pusat',
    productSummary: 'Kalung Mutiara South Sea Princess AAA',
    items: [
      {
        productId: 1,
        name: 'Kalung Mutiara South Sea Princess AAA',
        pearlSize: '11-12 mm',
        metal: 'Emas 18K',
        price: 18500000,
        quantity: 1,
      },
    ],
    subtotal: 18500000,
    shippingCost: 0,
    insuranceCost: 50000,
    total: 18550000,
    paymentMethod: 'Bank Transfer (BCA)',
    status: 'Dikirim',
    trackingNumber: 'JNE-YES-998823101',
    courier: 'JNE Express (Berasuransi)',
    timeline: [
      { status: 'Dibayar', date: '28 Okt 2026, 15:00', description: 'Pembayaran telah diverifikasi otomatis', completed: true },
      { status: 'Dikemas', date: '28 Okt 2026, 16:30', description: 'Perhiasan dikemas dalam kotak velvet berbalut segel keamanan', completed: true },
      { status: 'Dikirim', date: '29 Okt 2026, 09:15', description: 'Paket telah diserahkan ke JNE Express Mataram', completed: true, current: true },
      { status: 'Diterima', date: 'Estimasi 30 Okt 2026', description: 'Paket dalam perjalanan ke alamat tujuan', completed: false },
    ],
  },
  {
    id: '#[ORD-2026-080]',
    date: '28 Okt 2026, 11:15',
    customerName: 'Raden Ayu Kartika',
    customerEmail: 'kartika.ayu@perusahaan.co.id',
    customerPhone: '+62 813-8899-0011',
    shippingAddress: 'Jl. Diponegoro No. 12',
    city: 'Surabaya',
    productSummary: 'Gelang Rantai Mutiara Emas Imperial',
    items: [
      {
        productId: 2,
        name: 'Gelang Rantai Mutiara Emas Imperial',
        pearlSize: '10-11 mm',
        metal: 'Emas 18K',
        price: 14200000,
        quantity: 1,
      },
    ],
    subtotal: 14200000,
    shippingCost: 0,
    insuranceCost: 40000,
    total: 14240000,
    paymentMethod: 'Kartu Kredit Mandiri',
    status: 'Dikemas',
    trackingNumber: 'Menunggu penyerahan kurir',
    courier: 'TIKI ONS',
    timeline: [
      { status: 'Dibayar', date: '28 Okt 2026, 11:20', description: 'Pembayaran kartu kredit terverifikasi', completed: true },
      { status: 'Dikemas', date: '28 Okt 2026, 13:00', description: 'Quality control gemologi dan pembuatan sertifikat', completed: true, current: true },
      { status: 'Dikirim', date: 'Menunggu Kurir', description: 'Siap dijemput oleh armada logistik khusus', completed: false },
      { status: 'Diterima', date: 'Estimasi 31 Okt 2026', description: 'Pengiriman berasuransi penuh', completed: false },
    ],
  },
  {
    id: '#[ORD-2026-079]',
    date: '27 Okt 2026, 19:40',
    customerName: 'Bambang Soediro',
    customerEmail: 'bambang.soediro@gmail.com',
    customerPhone: '+62 811-9876-5432',
    shippingAddress: 'Komp. Dago Asri Blok C-8',
    city: 'Bandung',
    productSummary: 'Anting Stud Mutiara Putih Lombok AAA',
    items: [
      {
        productId: 3,
        name: 'Anting Stud Mutiara Putih Lombok AAA',
        pearlSize: '9-10 mm',
        metal: 'Emas 18K',
        price: 7800000,
        quantity: 1,
      },
    ],
    subtotal: 7800000,
    shippingCost: 0,
    insuranceCost: 25000,
    total: 7825000,
    paymentMethod: 'Virtual Account BCA',
    status: 'Selesai',
    trackingNumber: 'JNE-YES-887711204',
    courier: 'JNE Express',
    timeline: [
      { status: 'Dibayar', date: '27 Okt 2026, 19:45', description: 'Selesai', completed: true },
      { status: 'Dikemas', date: '28 Okt 2026, 08:30', description: 'Selesai', completed: true },
      { status: 'Dikirim', date: '28 Okt 2026, 10:00', description: 'Selesai', completed: true },
      { status: 'Diterima', date: '29 Okt 2026, 12:15', description: 'Diterima oleh Bpk. Bambang Soediro', completed: true, current: true },
    ],
  },
  {
    id: '#[ORD-2026-078]',
    date: '27 Okt 2026, 09:10',
    customerName: 'Maya Indah Lestari',
    customerEmail: 'maya.lestari@outlook.com',
    customerPhone: '+62 819-2233-4455',
    shippingAddress: 'Jl. Boulevard Barat Raya Blok LA-1',
    city: 'Jakarta Utara',
    productSummary: 'Cincin Solitaire Tahitian Black Pearl 12mm',
    items: [
      {
        productId: 4,
        name: 'Cincin Solitaire Tahitian Black Pearl 12mm',
        pearlSize: '12-13 mm',
        metal: 'Emas 18K',
        price: 12600000,
        quantity: 1,
      },
    ],
    subtotal: 12600000,
    shippingCost: 0,
    insuranceCost: 35000,
    total: 12635000,
    paymentMethod: 'Bank Transfer (Mandiri)',
    status: 'Menunggu Pembayaran',
    timeline: [
      { status: 'Dibayar', date: 'Menunggu transfer', description: 'Batas pembayaran 24 jam', completed: false, current: true },
      { status: 'Dikemas', date: '-', description: '-', completed: false },
      { status: 'Dikirim', date: '-', description: '-', completed: false },
      { status: 'Diterima', date: '-', description: '-', completed: false },
    ],
  },
  {
    id: '#[ORD-2026-077]',
    date: '26 Okt 2026, 16:22',
    customerName: 'dr. Fajar Kusuma',
    customerEmail: 'fajar.kusuma@medika.org',
    customerPhone: '+62 856-7788-9900',
    shippingAddress: 'Jl. Kaliurang KM 6.5',
    city: 'Sleman, D.I. Yogyakarta',
    productSummary: 'Mutiara Lepas Golden South Sea 14mm AAA',
    items: [
      {
        productId: 5,
        name: 'Mutiara Lepas Golden South Sea 14mm AAA',
        pearlSize: '14 mm',
        metal: 'Perak 925',
        price: 9500000,
        quantity: 1,
      },
    ],
    subtotal: 9500000,
    shippingCost: 0,
    insuranceCost: 30000,
    total: 9530000,
    paymentMethod: 'Virtual Account BNI',
    status: 'Dibatalkan',
    timeline: [
      { status: 'Dibayar', date: 'Kedaluwarsa', description: 'Waktu pembayaran telah habis', completed: false },
      { status: 'Dikemas', date: '-', description: '-', completed: false },
      { status: 'Dikirim', date: '-', description: '-', completed: false },
      { status: 'Diterima', date: '-', description: '-', completed: false },
    ],
  },
];

export const mockCustomers: MockCustomer[] = [
  {
    id: 1,
    name: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    phone: '+62 812-3456-7890',
    city: 'Jakarta Pusat',
    totalOrders: 4,
    totalSpend: 48900000,
    joinDate: '12 Jan 2025',
    addresses: [
      {
        id: 101,
        label: 'Rumah',
        recipient: 'Siti Rahmawati',
        phone: '+62 812-3456-7890',
        address: 'Jl. Menteng Raya No. 45, RT 02 / RW 05, Menteng',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postalCode: '10310',
        isPrimary: true,
      },
      {
        id: 102,
        label: 'Kantor',
        recipient: 'Siti Rahmawati (Divisi Legal)',
        phone: '+62 812-3456-7890',
        address: 'Gedung Menara Sudirman Lt. 18, Jl. Jend. Sudirman Kav. 60',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12190',
        isPrimary: false,
      },
    ],
  },
  {
    id: 2,
    name: 'Raden Ayu Kartika',
    email: 'kartika.ayu@perusahaan.co.id',
    phone: '+62 813-8899-0011',
    city: 'Surabaya',
    totalOrders: 3,
    totalSpend: 36500000,
    joinDate: '04 Mar 2025',
    addresses: [
      {
        id: 201,
        label: 'Rumah',
        recipient: 'Raden Ayu Kartika',
        phone: '+62 813-8899-0011',
        address: 'Jl. Diponegoro No. 12',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postalCode: '60241',
        isPrimary: true,
      },
    ],
  },
  {
    id: 3,
    name: 'Bambang Soediro',
    email: 'bambang.soediro@gmail.com',
    phone: '+62 811-9876-5432',
    city: 'Bandung',
    totalOrders: 2,
    totalSpend: 15600000,
    joinDate: '18 Mei 2025',
    addresses: [
      {
        id: 301,
        label: 'Rumah',
        recipient: 'Bambang Soediro',
        phone: '+62 811-9876-5432',
        address: 'Komp. Dago Asri Blok C-8',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40135',
        isPrimary: true,
      },
    ],
  },
  {
    id: 4,
    name: 'dr. Fajar Kusuma',
    email: 'fajar.kusuma@medika.org',
    phone: '+62 856-7788-9900',
    city: 'Sleman',
    totalOrders: 1,
    totalSpend: 9500000,
    joinDate: '22 Jul 2025',
    addresses: [
      {
        id: 401,
        label: 'Klinik',
        recipient: 'dr. Fajar Kusuma',
        phone: '+62 856-7788-9900',
        address: 'Jl. Kaliurang KM 6.5',
        city: 'Sleman',
        province: 'D.I. Yogyakarta',
        postalCode: '55281',
        isPrimary: true,
      },
    ],
  },
];

export const mockStockItems: MockStockItem[] = [
  { id: 1, productName: 'Kalung Mutiara South Sea Princess AAA', sku: 'SKU-KLG-001', stock: 5, minLimit: 3, status: 'Aman' },
  { id: 2, productName: 'Gelang Rantai Mutiara Emas Imperial', sku: 'SKU-GLG-002', stock: 3, minLimit: 3, status: 'Menipis' },
  { id: 3, productName: 'Anting Stud Mutiara Putih Lombok AAA', sku: 'SKU-ANT-003', stock: 8, minLimit: 4, status: 'Aman' },
  { id: 4, productName: 'Cincin Solitaire Tahitian Black Pearl 12mm', sku: 'SKU-CNC-004', stock: 2, minLimit: 3, status: 'Menipis' },
  { id: 5, productName: 'Mutiara Lepas Golden South Sea 14mm AAA', sku: 'SKU-LSE-005', stock: 1, minLimit: 2, status: 'Menipis' },
  { id: 6, productName: 'Kalung Choker Mutiara Gradasi Laut Selatan', sku: 'SKU-KLG-006', stock: 2, minLimit: 2, status: 'Menipis' },
  { id: 7, productName: 'Anting Gantung Drop Pearl Emas 18K', sku: 'SKU-ANT-007', stock: 4, minLimit: 2, status: 'Aman' },
  { id: 8, productName: 'Cincin Mutiara Barok Emas 18K Signature', sku: 'SKU-CNC-008', stock: 0, minLimit: 2, status: 'Habis' },
];

export const mockStockMovements: MockStockMovement[] = [
  { id: 1, date: '28 Okt 2026, 16:30', productName: 'Kalung Mutiara South Sea Princess AAA', type: 'Keluar', quantity: 1, notes: 'Pengiriman Pesanan #[ORD-2026-081]' },
  { id: 2, date: '28 Okt 2026, 13:00', productName: 'Gelang Rantai Mutiara Emas Imperial', type: 'Keluar', quantity: 1, notes: 'Pengiriman Pesanan #[ORD-2026-080]' },
  { id: 3, date: '26 Okt 2026, 10:15', productName: 'Anting Stud Mutiara Putih Lombok AAA', type: 'Masuk', quantity: 5, notes: 'Penerimaan Hasil Panen Atelier Lombok Batch #89' },
  { id: 4, date: '25 Okt 2026, 14:00', productName: 'Cincin Solitaire Tahitian Black Pearl 12mm', type: 'Masuk', quantity: 2, notes: 'Selesai Setting Mahkota Emas 18K' },
  { id: 5, date: '24 Okt 2026, 11:20', productName: 'Cincin Mutiara Barok Emas 18K Signature', type: 'Keluar', quantity: 1, notes: 'Terjual Pembelian Langsung Private Concierge' },
];

export const mockCertificates: MockCertificate[] = [
  {
    id: 1,
    certNumber: 'GIA-LMB-8921',
    productName: 'Kalung Mutiara South Sea Princess AAA',
    issuingLab: 'Laboratorium Gemologi Independen',
    grade: 'AAA - Mirror Luster',
    pearlSize: '11.4 mm',
    issueDate: '15 Okt 2026',
    pdfFileUrl: '#[PDF-SERTIFIKAT-8921]',
  },
  {
    id: 2,
    certNumber: 'GIA-LMB-8922',
    productName: 'Gelang Rantai Mutiara Emas Imperial',
    issuingLab: 'Gemological Institute of America (GIA)',
    grade: 'AAA - Deep Natural Gold',
    pearlSize: '10.8 mm',
    issueDate: '18 Okt 2026',
    pdfFileUrl: '#[PDF-SERTIFIKAT-8922]',
  },
  {
    id: 3,
    certNumber: 'GIA-LMB-8923',
    productName: 'Anting Stud Mutiara Putih Lombok AAA',
    issuingLab: 'Laboratorium Gemologi Independen',
    grade: 'AAA - Spherical Perfect',
    pearlSize: '9.6 mm',
    issueDate: '20 Okt 2026',
    pdfFileUrl: '#[PDF-SERTIFIKAT-8923]',
  },
  {
    id: 4,
    certNumber: 'GIA-LMB-8924',
    productName: 'Cincin Solitaire Tahitian Black Pearl 12mm',
    issuingLab: 'IGI Gemological Laboratory',
    grade: 'AAA - Peacock Greenish Black',
    pearlSize: '12.5 mm',
    issueDate: '22 Okt 2026',
    pdfFileUrl: '#[PDF-SERTIFIKAT-8924]',
  },
];

export const mockSalesChartData = [
  { date: '22 Okt', sales: 18500000, orders: 1 },
  { date: '23 Okt', sales: 24300000, orders: 2 },
  { date: '24 Okt', sales: 12600000, orders: 1 },
  { date: '25 Okt', sales: 32000000, orders: 2 },
  { date: '26 Okt', sales: 17300000, orders: 2 },
  { date: '27 Okt', sales: 20400000, orders: 2 },
  { date: '28 Okt', sales: 32700000, orders: 3 },
];

export const mockCategorySalesData = [
  { category: 'Kalung', sales: 50500000 },
  { category: 'Gelang', sales: 28400000 },
  { category: 'Anting', sales: 24500000 },
  { category: 'Cincin', sales: 24100000 },
  { category: 'Mutiara Lepas', sales: 19000000 },
];

export const mockBestsellers = [
  { rank: 1, name: 'Kalung Mutiara South Sea Princess AAA', category: 'Kalung Mutiara', sold: 8, revenue: 148000000 },
  { rank: 2, name: 'Gelang Rantai Mutiara Emas Imperial', category: 'Gelang Mutiara', sold: 6, revenue: 85200000 },
  { rank: 3, name: 'Anting Stud Mutiara Putih Lombok AAA', category: 'Anting Mutiara', sold: 10, revenue: 78000000 },
  { rank: 4, name: 'Cincin Solitaire Tahitian Black Pearl 12mm', category: 'Cincin Mutiara', sold: 4, revenue: 50400000 },
];

export const mockSpiAuditLogs: MockSpiAuditLog[] = [
  {
    id: 1,
    timestamp: '29 Okt 2026, 08:30:12',
    user: 'Budi Santoso (Admin)',
    role: 'admin',
    action: 'Pembaruan Nomor Resi Pesanan #[ORD-2026-081]',
    target: 'Pesanan #[ORD-2026-081]',
    oldValue: 'Resi: - (Belum Diinput)',
    newValue: 'Resi: JNE-YES-887712390',
    ipAddress: '180.252.12.88',
    status: 'Disetujui',
  },
  {
    id: 2,
    timestamp: '28 Okt 2026, 17:15:40',
    user: 'Drs. Hendra Wijaya (SPI)',
    role: 'spi',
    action: 'Otorisasi Penerbitan Sertifikat Gemologi Baru',
    target: 'Sertifikat #GIA-LMB-8924',
    oldValue: 'Status: Draft Pengajuan',
    newValue: 'Status: Diterbitkan & Terverifikasi Lab',
    ipAddress: '103.21.244.10',
    status: 'Disetujui',
  },
  {
    id: 3,
    timestamp: '28 Okt 2026, 14:02:19',
    user: 'Budi Santoso (Admin)',
    role: 'admin',
    action: 'Penyesuaian Manual Stok Produk (SKU-CNC-008)',
    target: 'Stok: Cincin Mutiara Barok',
    oldValue: 'Stok Fisik: 5 butir',
    newValue: 'Stok Fisik: 3 butir (-2 penyesuaian)',
    ipAddress: '180.252.12.88',
    status: 'Perlu Review',
  },
  {
    id: 4,
    timestamp: '27 Okt 2026, 19:42:05',
    user: 'Siti Rahmawati (User)',
    role: 'user',
    action: 'Checkout Pesanan Baru Senilai Rp 18.550.000',
    target: 'Pesanan #[ORD-2026-081]',
    oldValue: 'Status: Keranjang Belanja',
    newValue: 'Status: Menunggu Pembayaran',
    ipAddress: '36.85.14.92',
    status: 'Disetujui',
  },
];

export const mockApprovals: MockApprovalItem[] = [
  {
    id: 'REQ-2026-001',
    type: 'KONFIRMASI_PEMBAYARAN',
    title: 'Konfirmasi Pelunasan Transfer Bank Manual',
    target: 'Pesanan #[ORD-2026-080]',
    targetId: '#[ORD-2026-080]',
    requestedBy: 'Budi Santoso (Admin)',
    requestDate: '29 Okt 2026, 11:20',
    notes: 'Pelanggan telah mengirimkan bukti mutasi transfer Bank Mandiri senilai Rp 12.635.000 ke rekening butik. Validasi kasir telah cocok.',
    oldValue: 'Status: Menunggu Pembayaran (Bank Transfer Mandiri)',
    newValue: 'Status: Dikemas (Telah Dikonfirmasi Lunas)',
    payload: {
      orderId: '#[ORD-2026-080]',
      newStatus: 'Dikemas',
      paymentMethodDetail: 'Bank Transfer (Mandiri) - Disetujui SPI',
    },
    status: 'Menunggu Persetujuan',
  },
  {
    id: 'REQ-2026-002',
    type: 'PERUBAHAN_HARGA',
    title: 'Penyesuaian Harga Produk >10%',
    target: 'Kalung Mutiara South Sea Princess AAA',
    targetId: 1,
    requestedBy: 'Budi Santoso (Admin)',
    requestDate: '29 Okt 2026, 14:05',
    notes: 'Kenaikan harga pasar emas 18K global sebesar 8% dan kelangkaan panen mutiara putih 12mm AAA mirror luster.',
    oldValue: 'Harga: Rp 18.500.000',
    newValue: 'Harga: Rp 21.500.000 (+16.2%)',
    payload: {
      productId: 1,
      newPrice: 21500000,
      newFormattedPrice: 'Rp 21.500.000',
    },
    status: 'Menunggu Persetujuan',
  },
  {
    id: 'REQ-2026-003',
    type: 'PENYESUAIAN_STOK',
    title: 'Penyesuaian Stok Manual Gudang',
    target: 'Mutiara Lepas Golden South Sea 14mm AAA',
    targetId: 5,
    requestedBy: 'Hendra Saputra (Staff Gudang via Admin)',
    requestDate: '29 Okt 2026, 15:30',
    notes: 'Penerimaan batch mutiara hasil seleksi gemologis farm Sekotong Lombok Barat sebanyak 3 butir.',
    oldValue: 'Stok: 4 butir',
    newValue: 'Stok: 7 butir (+3 butir)',
    payload: {
      stockId: 5,
      newStock: 7,
      qtyChange: 3,
      reason: 'Penerimaan batch mutiara baru',
    },
    status: 'Menunggu Persetujuan',
  },
  {
    id: 'REQ-2026-004',
    type: 'HAPUS_PRODUK',
    title: 'Penghapusan SKU Produk Tidak Aktif',
    target: 'Bros Mutiara Samudera Klasik (SKU-BRS-019)',
    targetId: 99,
    requestedBy: 'Budi Santoso (Admin)',
    requestDate: '28 Okt 2026, 16:45',
    notes: 'Model perhiasan sudah di-discontinue oleh perajin dan tidak lagi diproduksi.',
    oldValue: 'Status: Tersedia di Katalog',
    newValue: 'Status: Hapus Permanen dari Database',
    payload: {
      productId: 99,
    },
    status: 'Menunggu Persetujuan',
  },
  {
    id: 'REQ-2026-005',
    type: 'DISKON_VIP',
    title: 'Diskon VIP Khusus > 15%',
    target: 'Ibu Ratna Dewi (Pelanggan VIP Platinum)',
    targetId: 1,
    requestedBy: 'Budi Santoso (Admin)',
    requestDate: '28 Okt 2026, 10:15',
    notes: 'Pembelian paket set mahar pernikahan adat (Kalung Princess + Anting Stud AAA). Diskon diajukan 20%.',
    oldValue: 'Diskon Standar: Maks 10%',
    newValue: 'Diskon Diajukan: 20% (Potongan Rp 3.700.000)',
    payload: {
      customerId: 1,
      discountPercent: 20,
    },
    status: 'Disetujui',
    reviewedBy: 'Hj. Baiq Ratna Sari (SPI)',
    reviewedDate: '28 Okt 2026, 11:00',
    reviewNotes: 'Disetujui untuk pembeli setia platinum butik CD\'E Pearls.',
  },
  {
    id: 'REQ-2026-006',
    type: 'PEMBATALAN_PESANAN',
    title: 'Pembatalan Pesanan Pelanggan',
    target: 'Pesanan #[ORD-2026-077]',
    targetId: '#[ORD-2026-077]',
    requestedBy: 'Budi Santoso (Admin)',
    requestDate: '26 Okt 2026, 16:30',
    notes: 'Pelanggan dr. Fajar Kusuma membatalkan karena salah spesifikasi ukuran mutiara dan berniat memesan ulang ukuran 16mm.',
    oldValue: 'Status: Menunggu Pembayaran (Rp 9.530.000)',
    newValue: 'Status: Dibatalkan (Dana Tidak Diterima)',
    payload: {
      orderId: '#[ORD-2026-077]',
      newStatus: 'Dibatalkan',
    },
    status: 'Disetujui',
    reviewedBy: 'Hj. Baiq Ratna Sari (SPI)',
    reviewedDate: '26 Okt 2026, 17:00',
    reviewNotes: 'Disetujui. Stok otomatis dikembalikan ke etalase.',
  },
];

export const mockSpiFindings: MockSpiFinding[] = [
  {
    id: 1,
    code: 'SPI-FND-001',
    title: 'Selisih Catatan Fisik vs Sistem Butik Sire',
    category: 'Inventaris',
    severity: 'Tinggi',
    staffName: 'Hendra Saputra (Staff Gudang)',
    recommendation: 'Lakukan stock opname menyeluruh batch mutiara barok dan rekonsiliasi database.',
    status: 'Dalam Investigasi',
    date: '28 Okt 2026',
  },
  {
    id: 2,
    code: 'SPI-FND-002',
    title: 'Pemberian Diskon Promosi Manual Melebihi SOP (12%)',
    category: 'Finansial',
    severity: 'Sedang',
    staffName: 'Budi Santoso (Admin Toko)',
    recommendation: 'Wajibkan otorisasi SPI terlebih dahulu untuk setiap diskon di atas 10%.',
    status: 'Dalam Investigasi',
    date: '26 Okt 2026',
  },
  {
    id: 3,
    code: 'SPI-FND-003',
    title: 'Pengecekan Kode QR Sertifikat Gemologi Telah Selesai',
    category: 'Kepatuhan Gemologi',
    severity: 'Rendah',
    staffName: 'Dr. Sarah (Gemologis)',
    recommendation: 'Semua 24 sertifikat terbitan bulan ini sudah tersinkronisasi dengan portal sertifikat lab gemologi.',
    status: 'Selesai',
    date: '22 Okt 2026',
  },
];

export const mockVipDiscountRequests: MockVipDiscountRequest[] = [
  {
    id: 1,
    customerName: 'Ibu Ratna Dewi (Pelanggan VIP Platinum)',
    productName: 'Kalung Mutiara South Sea Princess AAA',
    originalPrice: 18500000,
    requestedDiscountPercent: 15,
    discountedPrice: 15725000,
    requestedBy: 'Budi Santoso (Admin Toko)',
    reason: 'Pembelian paket set pernikahan adat Lombok (Kalung + Anting Stud).',
    status: 'Menunggu Persetujuan',
    date: '29 Okt 2026',
  },
  {
    id: 2,
    customerName: 'Kolektor Seni Mutiara Bali (Bpk. Wayan)',
    productName: 'Cincin Solitaire Tahitian Black Pearl 12mm',
    originalPrice: 12600000,
    requestedDiscountPercent: 20,
    discountedPrice: 10080000,
    requestedBy: 'Budi Santoso (Admin Toko)',
    reason: 'Langganan tahunan butik, repeat order ke-5 dalam 6 bulan.',
    status: 'Disetujui',
    date: '27 Okt 2026',
  },
];

export const mockStaffAccounts: MockStaffAccount[] = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'admin@cdepearls.com',
    role: 'Admin Operasional',
    status: 'Aktif',
    lastActive: 'Aktif saat ini',
    permissions: ['Katalog Produk (CRUD)', 'Pesanan & Resi', 'Stok & Mutasi', 'Cetak Sertifikat'],
  },
  {
    id: 2,
    name: 'Maya Puspita Sari',
    email: 'maya.kasir@cdepearls.com',
    role: 'Kasir Butik',
    status: 'Aktif',
    lastActive: '30 menit lalu',
    permissions: ['Kasir & Checkout Butik', 'Lihat Katalog', 'Penerimaan Pembayaran'],
  },
  {
    id: 3,
    name: 'Hendra Saputra',
    email: 'hendra.gudang@cdepearls.com',
    role: 'Staf Gudang',
    status: 'Aktif',
    lastActive: '2 jam lalu',
    permissions: ['Kelola Stok Fisik', 'Pengemasan & QC Mutiara'],
  },
  {
    id: 4,
    name: 'Dr. Sarah Nurhaliza, FGA',
    email: 'sarah.gemologis@cdepearls.com',
    role: 'Gemologis',
    status: 'Aktif',
    lastActive: 'Kemarin, 16:40',
    permissions: ['Penerbitan Sertifikat Gemologi', 'Validasi Grade Mutiara Lab Gemologi'],
  },
];
