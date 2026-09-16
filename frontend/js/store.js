/**
 * CDE PEARLS - CENTRAL STORE & STATE MANAGEMENT (v3.0)
 * Platform E-Commerce & Atelier Perhiasan Mutiara
 * Skema Relasional: Users, Categories, Products, Carts, Orders, Payments, Leads, Audit Logs, Reviews.
 * Role-Based Access Control: CUSTOMER | ADMIN | SUPER_ADMIN
 */

const STORAGE_KEYS = {
  PRODUCTS: 'cde_pearls_products_v3',
  CATEGORIES: 'cde_pearls_categories_v2',
  CART: 'cde_pearls_cart_v2',
  ORDERS: 'cde_pearls_orders_v2',
  SETTINGS: 'cde_pearls_settings_v2',
  COUPON: 'cde_pearls_coupon_v2',
  WISHLIST: 'cde_pearls_wishlist_v2',
  USERS: 'cde_pearls_users_v2',
  CURRENT_USER: 'cde_pearls_current_user_v2',
  REVIEWS: 'cde_pearls_reviews_v2',
  LEADS: 'cde_pearls_leads_v2',
  AUDIT_LOGS: 'cde_pearls_audit_logs_v2'
};

// 5 Kategori Utama Sesuai Spesifikasi
const DEFAULT_CATEGORIES = [
  { id: 'kalung', name: 'Kalung Mutiara', slug: 'kalung-mutiara', description: 'Untaian kemewahan kalung mutiara laut selatan berpadu emas 18K solid.', icon: 'sparkles' },
  { id: 'gelang', name: 'Gelang Mutiara', slug: 'gelang-mutiara', description: 'Gelang rantai halus dan bangle kaku bertabur mutiara Lombok kilau cermin.', icon: 'award' },
  { id: 'anting', name: 'Anting Mutiara', slug: 'anting-mutiara', description: 'Anting stud minimalis dan tetesan embun mutiara air laut Grade AAA.', icon: 'sparkles' },
  { id: 'cincin', name: 'Cincin Mutiara', slug: 'cincin-mutiara', description: 'Mahkota cincin solitaire dan daun berlian mikro berhias mutiara.', icon: 'shieldCheck' },
  { id: 'mutiara-lepas', name: 'Mutiara Lepas', slug: 'mutiara-lepas', description: 'Butiran mutiara laut selatan lepas bersertifikat laboratorium untuk investasi dan kreasi kustom.', icon: 'boxes' }
];

// Data Produk Lengkap 5 Kategori
const DEFAULT_PRODUCTS = [
  // 1. Kalung Mutiara (Necklaces)
  {
    id: 'cde-neck-1',
    categoryId: 'kalung',
    category: 'kalung',
    name: 'Lombok Blossom South Sea Pearl Strand Necklace 8–10 mm',
    price: 36000000,
    originalPrice: 43500000,
    discountPercent: 17,
    stock: 4,
    rating: 5.0,
    reviewsCount: 18,
    pearlType: 'White & Honey Accent South Sea',
    pearlSize: '8 - 10 mm',
    pearlColor: 'Silvery White & Honey Gold',
    pearlGrade: 'Grade AAA',
    origin: 'Pesisir Lombok Barat, NTB',
    weight: '48.5 gram',
    metal: 'Emas Kuning 18K Clasp',
    isFeatured: true,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    description: 'Untaian mutiara laut Lombok barok pilihan dengan aksen bunga madu kuning ceria yang dirangkai dengan benang sutra tahan lama.',
    certificate: 'CDE-CERT-8894'
  },
  {
    id: 'cde-neck-2',
    categoryId: 'kalung',
    category: 'kalung',
    name: 'Rinjani Luxe Pearl Collar South Sea Pearl Necklace 10 mm',
    price: 25500000,
    originalPrice: 30000000,
    discountPercent: 15,
    stock: 5,
    rating: 4.9,
    reviewsCount: 12,
    pearlType: 'Classic White South Sea Pearl',
    pearlSize: '10 mm',
    pearlColor: 'Lustrous Pure White',
    pearlGrade: 'Grade AAA',
    origin: 'Teluk Medana, Lombok',
    weight: '36.2 gram',
    metal: 'Emas Putih 18K + Anyaman Kristal',
    isFeatured: true,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    description: 'Kalung kerah mewah berdesain lattice tenunan emas putih bertabur mutiara laut putih menggantung anggun di lekuk leher.',
    certificate: 'CDE-CERT-8895'
  },
  {
    id: 'cde-neck-3',
    categoryId: 'kalung',
    category: 'kalung',
    name: 'Mandalika Grace Multi-Strand South Sea Pearl Necklace',
    price: 48500000,
    originalPrice: 58000000,
    discountPercent: 16,
    stock: 3,
    rating: 5.0,
    reviewsCount: 14,
    pearlType: 'Champagne Gold South Sea Pearl',
    pearlSize: '8 - 10 mm (3 Strands)',
    pearlColor: 'Imperial Champagne Gold',
    pearlGrade: 'Grade AAA',
    origin: 'Perairan Sekotong, Lombok',
    weight: '72.0 gram',
    metal: 'Emas Kuning 18K Pengait Eksklusif',
    isFeatured: false,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1611591475836-848e3a24eb87?auto=format&fit=crop&w=800&q=80',
    description: 'Mahakarya untaian mutiara laut bergradasi warna sampanye emas. Dirangkai sempurna untuk resepsi agung dan acara pesta bergengsi.',
    certificate: 'CDE-CERT-8896'
  },

  // 2. Gelang Mutiara (Bracelets)
  {
    id: 'cde-brace-1',
    categoryId: 'gelang',
    category: 'gelang',
    name: 'Senggigi Golden Sunset Pearl Bracelet 10-11 mm',
    price: 28000000,
    originalPrice: 35000000,
    discountPercent: 20,
    stock: 5,
    rating: 4.9,
    reviewsCount: 9,
    pearlType: 'Golden South Sea Pearl',
    pearlSize: '10 - 11 mm',
    pearlColor: 'Deep Golden Luster',
    pearlGrade: 'Grade AAA',
    origin: 'Pesisir Senggigi, Lombok Barat',
    weight: '24.8 gram',
    metal: 'Emas Kuning 18K Solid',
    isFeatured: true,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1611591475836-848e3a24eb87?auto=format&fit=crop&w=800&q=80',
    description: 'Gelang rantai halus berbalut emas kuning 18K dengan butir mutiara emas laut Lombok berkilau intens.',
    certificate: 'CDE-CERT-8901'
  },
  {
    id: 'cde-brace-2',
    categoryId: 'gelang',
    category: 'gelang',
    name: 'Sire Bay Dewdrop Pearl Bangle 11 mm - Classic White',
    price: 32000000,
    originalPrice: 38000000,
    discountPercent: 16,
    stock: 4,
    rating: 4.8,
    reviewsCount: 8,
    pearlType: 'Classic White South Sea Pearl',
    pearlSize: '11 mm',
    pearlColor: 'Mirror Silver White',
    pearlGrade: 'Grade AAA',
    origin: 'Teluk Sire, Lombok Utara',
    weight: '31.5 gram',
    metal: 'Emas Putih 18K Rigid Bangle',
    isFeatured: false,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    description: 'Bangle kaku berlapis emas putih 18K berhiaskan butir mutiara putih air laut dengan kilau cermin tinggi.',
    certificate: 'CDE-CERT-8902'
  },

  // 3. Anting Mutiara (Earrings)
  {
    id: 'cde-ear-1',
    categoryId: 'anting',
    category: 'anting',
    name: 'Sereat Moonlight Iconic Stud Earrings 9-10 mm',
    price: 24000000,
    originalPrice: 30000000,
    discountPercent: 20,
    stock: 7,
    rating: 5.0,
    reviewsCount: 22,
    pearlType: 'Silver Mist South Sea Pearl',
    pearlSize: '9 - 10 mm Pair',
    pearlColor: 'Silver Mist Lavender',
    pearlGrade: 'Grade AAA',
    origin: 'Gili Genting, Lombok',
    weight: '12.4 gram',
    metal: 'Emas Putih 18K Solid',
    isFeatured: true,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    description: 'Sepasang anting ikonik bertabur kristal dengan tetesan mutiara air laut bernuansa silver mist yang memancarkan aura modern.',
    certificate: 'CDE-CERT-8897'
  },
  {
    id: 'cde-ear-2',
    categoryId: 'anting',
    category: 'anting',
    name: 'Tidore Dew Drop Classic Dangle Earrings 11 mm',
    price: 25500000,
    originalPrice: 31000000,
    discountPercent: 18,
    stock: 9,
    rating: 4.9,
    reviewsCount: 15,
    pearlType: 'Lustrous Classic White Pearl',
    pearlSize: '11 mm Pair',
    pearlColor: 'Pure Oceanic White',
    pearlGrade: 'Grade AAA',
    origin: 'Teluk Sekotong, Lombok',
    weight: '14.2 gram',
    metal: 'Emas Kuning 18K Dangle',
    isFeatured: false,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80',
    description: 'Anting gantung untaian rantai emas 18K berujungkan butir mutiara putih air laut 11 mm dengan simetri tetesan embun sempurna.',
    certificate: 'CDE-CERT-8898'
  },

  // 4. Cincin Mutiara (Rings)
  {
    id: 'cde-ring-1',
    categoryId: 'cincin',
    category: 'cincin',
    name: 'Lombok Heritage Pearl Ring Leaf Motif 9-10 mm',
    price: 36000000,
    originalPrice: 45000000,
    discountPercent: 20,
    stock: 6,
    rating: 5.0,
    reviewsCount: 26,
    pearlType: 'Tahitian Grey Accent South Sea',
    pearlSize: '9 - 10 mm',
    pearlColor: 'Dark Peacock Tahitian Grey',
    pearlGrade: 'Grade AAA',
    origin: 'Sekotong, Lombok Barat',
    weight: '9.8 gram',
    metal: 'White Gold 18K / Perak 925 Berlian Micro',
    isFeatured: true,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    description: 'Cincin elegan berbalut motif dedaunan berlian micro-setting dengan satu butir mutiara laut Lombok bernuansa abu-abu mutiara Tahiti.',
    certificate: 'CDE-CERT-8891'
  },
  {
    id: 'cde-ring-2',
    categoryId: 'cincin',
    category: 'cincin',
    name: 'Rinjani Classic Pearl Solitaire Ring 10 mm',
    price: 25500000,
    originalPrice: 31000000,
    discountPercent: 18,
    stock: 8,
    rating: 4.8,
    reviewsCount: 16,
    pearlType: 'Classic White South Sea Pearl',
    pearlSize: '10 mm',
    pearlColor: 'Lustrous Silver White',
    pearlGrade: 'Grade AAA',
    origin: 'Teluk Sire, Lombok',
    weight: '8.4 gram',
    metal: 'Solid White Gold 18K',
    isFeatured: true,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
    description: 'Desain solitaire klasik minimalis bermahkotakan mutiara laut putih bulat sempurna 10 mm dengan pantulan kemilau cermin.',
    certificate: 'CDE-CERT-8892'
  },
  {
    id: 'cde-ring-3',
    categoryId: 'cincin',
    category: 'cincin',
    name: 'Mandalika Pearl Ribbon Ring 10-11 mm Champagne Gold',
    price: 35500000,
    originalPrice: 45500000,
    discountPercent: 22,
    stock: 5,
    rating: 4.9,
    reviewsCount: 19,
    pearlType: 'Champagne Gold South Sea Pearl',
    pearlSize: '10 - 11 mm',
    pearlColor: 'Champagne Gold Luster',
    pearlGrade: 'Grade AAA',
    origin: 'Teluk Sekotong, Lombok',
    weight: '11.2 gram',
    metal: 'Yellow Gold 18K Solid Pavé',
    isFeatured: false,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=80',
    description: 'Cincin mewah berdesain ribbon band emas 18K dihiasi barisan berlian pavé dan butir mutiara emas sampanye hangat.',
    certificate: 'CDE-CERT-8893'
  },

  // 5. Mutiara Lepas (Loose Pearls)
  {
    id: 'cde-loose-1',
    categoryId: 'mutiara-lepas',
    category: 'mutiara-lepas',
    name: 'South Sea Loose Pearl Solitaire 12-13 mm - Imperial Gold',
    price: 22000000,
    originalPrice: 28000000,
    discountPercent: 21,
    stock: 10,
    rating: 5.0,
    reviewsCount: 7,
    pearlType: 'Golden South Sea Loose Pearl',
    pearlSize: '12 - 13 mm',
    pearlColor: 'Deep Imperial Gold (24K Tone)',
    pearlGrade: 'Grade AAA Gem Quality (Round 100%)',
    origin: 'Kawasan Konservasi Sekotong, Lombok Barat',
    weight: '3.8 gram / 19 Karat',
    metal: 'Tanpa Ikatan (Loose Gemstone)',
    isFeatured: true,
    isBestseller: true,
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
    description: 'Butir mutiara laut selatan bulat sempurna (round 100%) dengan tebal nacre premium dan refleksi pantul cermin tanpa cela.',
    certificate: 'CDE-CERT-9011'
  },
  {
    id: 'cde-loose-2',
    categoryId: 'mutiara-lepas',
    category: 'mutiara-lepas',
    name: 'South Sea Loose Pearl 13-14 mm - Mirror White',
    price: 26000000,
    originalPrice: 32000000,
    discountPercent: 18,
    stock: 6,
    rating: 4.9,
    reviewsCount: 5,
    pearlType: 'White South Sea Loose Pearl',
    pearlSize: '13 - 14 mm',
    pearlColor: 'Silvery Mirror White',
    pearlGrade: 'Grade AAA Gem Quality',
    origin: 'Teluk Sire, Lombok Utara',
    weight: '4.5 gram / 22.5 Karat',
    metal: 'Tanpa Ikatan (Loose Gemstone)',
    isFeatured: false,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    description: 'Mutiara air laut bulat sempurna ukuran istimewa 13-14 mm. Sangat ideal untuk pesanan perhiasan kustom atelier cincin atau liontin.',
    certificate: 'CDE-CERT-9012'
  }
];

// Data Default Pengguna & Role
const DEFAULT_USERS = [
  {
    id: 'usr-superadmin',
    name: 'Super Administrator CD\'E',
    email: 'superadmin@cdepearls.com',
    phone: '081239887766',
    role: 'SUPER_ADMIN',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-admin-atelier',
    name: 'Admin Atelier Lombok',
    email: 'admin@cdepearls.com',
    phone: '081239887700',
    role: 'ADMIN',
    createdAt: '2026-02-15'
  },
  {
    id: 'usr-customer-1',
    name: 'Ibu Ratna Paramitha',
    email: 'ratna.paramitha@gmail.com',
    phone: '081298765432',
    role: 'CUSTOMER',
    address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
    createdAt: '2026-08-10'
  }
];

// Data Default Pesanan
const DEFAULT_ORDERS = [
  {
    id: 'CDE-2026-0041',
    userId: 'usr-customer-1',
    customerName: 'Ibu Ratna Paramitha',
    phone: '081298765432',
    address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
    courier: 'JNE YES Berasuransi Penuh',
    items: [
      {
        id: 'cde-neck-1',
        name: 'Lombok Blossom South Sea Pearl Strand Necklace 8–10 mm',
        qty: 1,
        price: 36000000,
        spec: 'Panjang 45cm, Emas Kuning 18K'
      }
    ],
    subtotal: 36000000,
    discount: 0,
    insurance: 50000,
    total: 36050000,
    paymentStatus: 'PAID', // WAITING_PAYMENT | PAYMENT_REVIEW | PAID | FAILED | REFUNDED
    orderStatus: 'PROCESSING', // PENDING | PROCESSING | READY_TO_SHIP | SHIPPED | DELIVERED | COMPLETED | CANCELLED
    date: '12 Sep 2026, 14:15',
    resi: 'JNE-LOM-99218273',
    notes: 'Mohon dibungkus kotak velvet beludru merah maroon.'
  },
  {
    id: 'CDE-2026-0042',
    userId: 'usr-customer-1',
    customerName: 'Bapak Hendra Wijaya',
    phone: '081734567890',
    address: 'Kertajaya Indah Regency Blok F-12, Surabaya',
    courier: 'TiKi ONS (Asuransi Penuh)',
    items: [
      {
        id: 'cde-ring-3',
        name: 'Mandalika Pearl Ribbon Ring 10-11 mm Champagne Gold',
        qty: 1,
        price: 35500000,
        spec: 'Size 14, Emas Kuning 18K'
      }
    ],
    subtotal: 35500000,
    discount: 0,
    insurance: 50000,
    total: 35550000,
    paymentStatus: 'WAITING_PAYMENT',
    orderStatus: 'PENDING',
    date: '13 Sep 2026, 09:30',
    resi: null,
    notes: 'Harap konfirmasi rekening resmi via WhatsApp.'
  }
];

// Data Default Pengaturan
const DEFAULT_SETTINGS = {
  shopName: "CD'E Pearls Lombok",
  whatsappNumber: '6281239887766',
  boutiqueAddress: 'Jl. Raya Senggigi No. 88, Lombok Barat, NTB',
  contactEmail: 'concierge@cdepearls.com',
  insuranceFee: 50000,
  freeBoxAndCert: true,
  templateGreeting: "Halo Concierge CD'E Pearls, saya ingin berkonsultasi mengenai produk perhiasan mutiara berikut:"
};

// Data Default Ulasan Pelanggan
const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    productId: 'cde-ring-1',
    userName: 'Dewi Lestari, Jakarta',
    rating: 5,
    date: '10 Sep 2026',
    comment: 'Kilau mutiaranya benar-benar berkualitas tinggi, pantulan cerminnya sempurna dan sertifikat lab-nya resmi. Pelayanan via WhatsApp sangat ramah dan profesional!'
  },
  {
    id: 'rev-2',
    productId: 'cde-neck-1',
    userName: 'Rina S., Surabaya',
    rating: 5,
    date: '08 Sep 2026',
    comment: 'Kalung mutiaranya sangat mewah. Kemasannya rapi dengan kotak velvet premium. Pengiriman sampai dengan selamat dan berasuransi penuh.'
  },
  {
    id: 'rev-3',
    productId: 'cde-brace-1',
    userName: 'Agnes Pramono, Bandung',
    rating: 5,
    date: '02 Sep 2026',
    comment: 'Warna emas mutiaranya pekat dan hangat. Sangat berkelas dipakai untuk acara formal maupun santai.'
  }
];

const CDEStore = {
  init() {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
  },

  /* ================== PRODUK & KATEGORI ================== */
  getCategories() {
    this.init();
    if (typeof localStorage === 'undefined') return DEFAULT_CATEGORIES;
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  getProducts() {
    this.init();
    if (typeof localStorage === 'undefined') return DEFAULT_PRODUCTS;
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || DEFAULT_PRODUCTS;
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  getProductsByCategory(categoryId) {
    const products = this.getProducts();
    if (!categoryId || categoryId === 'semua' || categoryId === 'all') {
      return products;
    }
    return products.filter(p => p.categoryId === categoryId || p.category === categoryId);
  },

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notifyUpdate('products');
  },

  addProduct(productData) {
    const products = this.getProducts();
    const newProduct = {
      ...productData,
      id: 'cde-p' + Date.now(),
      rating: 5.0,
      reviewsCount: 0,
      discountPercent: productData.discountPercent || (productData.originalPrice ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) : 0),
      certificate: 'CDE-CERT-' + Math.floor(1000 + Math.random() * 9000)
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    this.logAudit('CREATE_PRODUCT', `Menambahkan produk baru: ${newProduct.name}`);
    return newProduct;
  },

  updateProduct(id, updatedData) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedData };
      this.saveProducts(products);
      this.logAudit('UPDATE_PRODUCT', `Memperbarui data produk: ${products[index].name}`);
      return products[index];
    }
    return null;
  },

  deleteProduct(id) {
    let products = this.getProducts();
    const item = products.find(p => p.id === id);
    products = products.filter(p => p.id !== id);
    this.saveProducts(products);
    if (item) {
      this.logAudit('DELETE_PRODUCT', `Menghapus produk: ${item.name}`);
    }
    return true;
  },

  /* ================== WISHLIST ================== */
  getWishlist() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST)) || [];
    } catch (e) {
      return [];
    }
  },

  isInWishlist(productId) {
    const list = this.getWishlist();
    return list.includes(productId);
  },

  toggleWishlist(productId) {
    let list = this.getWishlist();
    const index = list.indexOf(productId);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      added = true;
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    this.notifyUpdate('wishlist');
    return { added, count: list.length };
  },

  /* ================== KERANJANG (CART) ================== */
  getCart() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.notifyUpdate('cart');
  },

  addToCart(item) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(c => 
      c.id === item.id && 
      c.customSpec === item.customSpec
    );

    if (existingIndex > -1) {
      cart[existingIndex].qty += (item.qty || 1);
    } else {
      cart.push({
        ...item,
        qty: item.qty || 1,
        cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
      });
    }
    this.saveCart(cart);
    return cart;
  },

  removeFromCart(cartItemId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    this.saveCart(cart);
    return cart;
  },

  updateCartQty(cartItemId, newQty) {
    let cart = this.getCart();
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (item) {
      if (newQty <= 0) {
        return this.removeFromCart(cartItemId);
      }
      item.qty = newQty;
      this.saveCart(cart);
    }
    return cart;
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartTotal() {
    const cart = this.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const settings = this.getSettings();
    const insurance = cart.length > 0 ? (settings.insuranceFee || 50000) : 0;
    
    let discount = 0;
    const activeCoupon = this.getActiveCoupon();
    if (activeCoupon && subtotal > 0) {
      discount = Math.round(subtotal * (activeCoupon.discountPercent / 100));
    }

    const grandTotal = Math.max(0, subtotal - discount + insurance);

    return {
      subtotal,
      discount,
      insurance,
      grandTotal,
      itemCount: cart.reduce((count, item) => count + item.qty, 0)
    };
  },

  /* ================== KUPON ================== */
  getActiveCoupon() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPON)) || null;
    } catch (e) {
      return null;
    }
  },

  applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode === 'LOMBOK10') {
      const coupon = { code: 'LOMBOK10', discountPercent: 10, label: 'Diskon Spesial Lombok 10%' };
      localStorage.setItem(STORAGE_KEYS.COUPON, JSON.stringify(coupon));
      this.notifyUpdate('cart');
      return { success: true, coupon };
    } else if (cleanCode === 'CDEVIP') {
      const coupon = { code: 'CDEVIP', discountPercent: 15, label: 'Apresiasi VIP Concierge 15%' };
      localStorage.setItem(STORAGE_KEYS.COUPON, JSON.stringify(coupon));
      this.notifyUpdate('cart');
      return { success: true, coupon };
    }
    return { success: false, message: 'Kode kupon tidak valid atau telah kedaluwarsa.' };
  },

  removeCoupon() {
    localStorage.removeItem(STORAGE_KEYS.COUPON);
    this.notifyUpdate('cart');
  },

  /* ================== PESANAN (ORDERS) ================== */
  getOrders() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || DEFAULT_ORDERS;
    } catch (e) {
      return DEFAULT_ORDERS;
    }
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.notifyUpdate('orders');
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const currentUser = this.getCurrentUser();
    const newOrder = {
      id: 'CDE-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser ? currentUser.id : (orderData.userId || 'guest'),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      paymentStatus: 'WAITING_PAYMENT',
      orderStatus: 'PENDING',
      ...orderData
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);
    this.logAudit('CREATE_ORDER', `Pesanan baru dibuat: ${newOrder.id} oleh ${newOrder.customerName}`);
    return newOrder;
  },

  getUserOrders(userId) {
    const orders = this.getOrders();
    if (!userId) return [];
    return orders.filter(o => o.userId === userId);
  },

  updateOrderStatus(orderId, newStatus, resi = null) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.orderStatus = newStatus;
      if (resi !== null) {
        order.resi = resi;
      }
      this.saveOrders(orders);
      this.logAudit('UPDATE_ORDER_STATUS', `Status pesanan ${orderId} diubah menjadi ${newStatus}`);
      return order;
    }
    return null;
  },

  updatePaymentStatus(orderId, newPaymentStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.paymentStatus = newPaymentStatus;
      if (newPaymentStatus === 'PAID' && order.orderStatus === 'PENDING') {
        order.orderStatus = 'PROCESSING';
      }
      this.saveOrders(orders);
      this.logAudit('UPDATE_PAYMENT_STATUS', `Status pembayaran pesanan ${orderId} diubah menjadi ${newPaymentStatus}`);
      return order;
    }
    return null;
  },

  /* ================== USER & AUTHENTICATION (RBAC) ================== */
  getUsers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    } catch (e) {
      return null;
    }
  },

  login(email, role = 'CUSTOMER') {
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      // Auto-create customer jika belum ada
      user = {
        id: 'usr-' + Date.now(),
        name: email.split('@')[0],
        email: email,
        phone: '',
        role: role,
        createdAt: new Date().toISOString().split('T')[0]
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.notifyUpdate('auth');
    this.logAudit('LOGIN', `Pengguna ${user.email} (${user.role}) masuk`);
    return user;
  },

  register(userData) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === (userData.email || '').toLowerCase());
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar. Silakan login langsung.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      phone: userData.phone || '',
      role: 'CUSTOMER',
      address: userData.address || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    this.notifyUpdate('auth');
    this.logAudit('REGISTER', `Registrasi pelanggan baru: ${newUser.email}`);
    return { success: true, user: newUser };
  },

  updateProfile(userId, profileData) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], ...profileData };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[userIndex]));
      }
      
      this.notifyUpdate('auth');
      this.logAudit('UPDATE_PROFILE', `Profil diperbarui: ${users[userIndex].email}`);
      return users[userIndex];
    }
    return null;
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.logAudit('LOGOUT', `Pengguna ${user.email} keluar`);
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notifyUpdate('auth');
  },

  addUser(userData) {
    const users = this.getUsers();
    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      phone: userData.phone || '',
      role: userData.role || 'ADMIN',
      address: userData.address || '',
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyUpdate('users');
    this.logAudit('CREATE_USER', `Membuat akun ${newUser.role}: ${newUser.email}`);
    return newUser;
  },

  updateUserRole(userId, newRole) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.role = newRole;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notifyUpdate('users');
      this.logAudit('UPDATE_USER_ROLE', `Mengubah peran ${user.email} menjadi ${newRole}`);
      return user;
    }
    return null;
  },

  deleteUser(userId) {
    let users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      users = users.filter(u => u.id !== userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notifyUpdate('users');
      this.logAudit('DELETE_USER', `Menghapus akun: ${user.email}`);
      return true;
    }
    return false;
  },

  /* ================== LEADS & AUDIT LOGS ================== */
  logWhatsAppLead(leadData) {
    this.init();
    try {
      const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS)) || [];
      leads.unshift({
        id: 'lead-' + Date.now(),
        ...leadData,
        createdAt: new Date().toLocaleString('id-ID')
      });
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
      this.notifyUpdate('leads');
    } catch (e) {}
  },

  getWhatsAppLeads() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS)) || [];
    } catch (e) {
      return [];
    }
  },

  logAudit(action, details) {
    this.init();
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) || [];
      const user = this.getCurrentUser() || { email: 'guest/system', role: 'SYSTEM' };
      logs.unshift({
        id: 'log-' + Date.now(),
        user: user.email,
        role: user.role,
        action,
        details,
        timestamp: new Date().toLocaleString('id-ID')
      });
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100))); // keep 100 max
      this.notifyUpdate('audit');
    } catch (e) {}
  },

  getAuditLogs() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) || [];
    } catch (e) {
      return [];
    }
  },

  /* ================== ULASAN (REVIEWS) ================== */
  getReviews() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS)) || DEFAULT_REVIEWS;
    } catch (e) {
      return DEFAULT_REVIEWS;
    }
  },

  getReviewsByProduct(productId) {
    const reviews = this.getReviews();
    return reviews.filter(r => r.productId === productId);
  },

  addReview(reviewData) {
    const reviews = this.getReviews();
    const newRev = {
      id: 'rev-' + Date.now(),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      ...reviewData
    };
    reviews.unshift(newRev);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    this.notifyUpdate('reviews');
    return newRev;
  },

  deleteReview(reviewId) {
    let reviews = this.getReviews();
    const target = reviews.find(r => r.id === reviewId);
    reviews = reviews.filter(r => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    this.notifyUpdate('reviews');
    if (target) {
      this.logAudit('DELETE_REVIEW', `Menghapus ulasan ID ${reviewId} dari ${target.userName}`);
    }
    return true;
  },

  /* ================== WHATSAPP LEADS TRACKER ================== */
  getLeads() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS)) || [];
    } catch (e) {
      return [];
    }
  },

  addLead(leadData) {
    const leads = this.getLeads();
    const newLead = {
      id: 'lead-' + Date.now(),
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'NEW', // NEW | CONTACTED | DEAL | CANCELLED
      ...leadData
    };
    leads.unshift(newLead);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    this.notifyUpdate('leads');
    this.logAudit('ADD_LEAD', `Lead WhatsApp baru tercatat: ${newLead.customerName || newLead.phone}`);
    return newLead;
  },

  updateLeadStatus(leadId, status) {
    const leads = this.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = status;
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
      this.notifyUpdate('leads');
      this.logAudit('UPDATE_LEAD_STATUS', `Status lead ${leadId} diubah ke ${status}`);
      return lead;
    }
    return null;
  },

  /* ================== PENGATURAN TOKO ================== */
  getSettings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(newSettings) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    this.notifyUpdate('settings');
    this.logAudit('UPDATE_SETTINGS', 'Memperbarui konfigurasi toko/gateway WhatsApp');
    return merged;
  },

  /* ================== FORMAT RUPIAH & EVENT ================== */
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  notifyUpdate(type) {
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cde_store_updated', { detail: { type } }));
    }
  }
};

if (typeof window !== 'undefined') {
  if (typeof localStorage !== 'undefined') {
    CDEStore.init();
  }
  window.CDEStore = CDEStore;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CDEStore;
}
