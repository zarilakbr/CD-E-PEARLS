# CDE Pearls Lombok — Dokumentasi Rancangan Sistem Lengkap
**Versi:** 1.0.0 | **Tanggal:** 12 September 2026 | **Author:** Tim CDE Pearls Dev

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Flowchart — Alur Pengguna (Customer Journey)](#2-flowchart--alur-pengguna-customer-journey)
3. [Flowchart — Alur Pembelian via WhatsApp](#3-flowchart--alur-pembelian-via-whatsapp)
4. [Flowchart — Alur Kustomisasi 3D (Atelier)](#4-flowchart--alur-kustomisasi-3d-atelier)
5. [Flowchart — Alur Admin (Super Admin Panel)](#5-flowchart--alur-admin-super-admin-panel)
6. [Use Case Diagram](#6-use-case-diagram)
7. [Class Diagram (Struktur Data)](#7-class-diagram-struktur-data)
8. [Sequence Diagram — Proses Checkout WhatsApp](#8-sequence-diagram--proses-checkout-whatsapp)
9. [Sequence Diagram — Admin Tambah Produk](#9-sequence-diagram--admin-tambah-produk)
10. [Sequence Diagram — 3D Customizer](#10-sequence-diagram--3d-customizer)
11. [Entity Relationship Diagram (ERD)](#11-entity-relationship-diagram-erd)
12. [State Diagram — Status Pesanan](#12-state-diagram--status-pesanan)
13. [Component Diagram — Arsitektur Frontend](#13-component-diagram--arsitektur-frontend)
14. [Activity Diagram — Filter Kategori Produk](#14-activity-diagram--filter-kategori-produk)
15. [Data Flow Diagram (DFD)](#15-data-flow-diagram-dfd)
16. [Deployment Diagram](#16-deployment-diagram)

---

## 1. Arsitektur Sistem

```
CUSTOMER LAYER (frontend/)               ADMIN LAYER TERPISAH (admin/)
├── index.html (5 Kategori & Filter)    ├── index.html (Pusat Kontrol Super Admin)
├── customizer.html (Atelier 3D PBR)    ├── css/admin.css
├── cart.html (Invoice WA & Pelacak)    └── js/admin.js (RBAC & Controller)
├── customer.html (Dashboard Pembeli)        ├── Dashboard & KPI Omset
├── about.html (Edukasi Budidaya)            ├── Katalog Produk & 5 Kategori
├── contact.html (Concierge Senggigi)        ├── Stok Butir Mutiara (+/-)
├── faq.html (Tanya Jawab Interaktif)        ├── Pesanan & Verifikasi Lunas (PAID)
└── blog.html (Jurnal Gemologi Mutiara)      ├── WhatsApp Leads CRM
                                             ├── Daftar Pelanggan & Ulasan
                                             ├── Admin Users (Super Admin Only)
                                             ├── Laporan & Audit Logs (Super Admin Only)
                                             └── Pengaturan Gateway WhatsApp

                    SHARED STATE LAYER (store.js & whatsappService.js)
        CDEStore -- Central State, RBAC, Leads CRM, Audit Logs & LocalStorage
        Products (5 Kategori) | Orders (Dual-Status) | Users | Leads | Settings

                    BROWSER PERSISTENCE (localStorage)
   cde_pearls_products_v3 | cde_pearls_categories_v1 | cde_pearls_cart_v2
   cde_pearls_orders_v2   | cde_pearls_users_v1      | cde_pearls_leads_v1
   cde_pearls_settings_v2 | cde_pearls_audit_logs_v1 | cde_pearls_reviews_v1
```

**Teknologi Stack:**
- **Frontend & Styling:** HTML5 Semantik, Vanilla CSS3 (Deep Navy `#0B1F33`, Pearl White `#F8F7F2`, Champagne Gold `#C9A96E`)
- **Typography:** Inter (UI & Data) + Playfair Display (Luxury Headings)
- **Icons:** Lucide Icons (stroke: 1.8–2px, rounded, tanpa emoji)
- **Logic & Store:** Vanilla JavaScript ES6+ (Event-driven Store Architecture)
- **3D Engine:** Three.js + OrbitControls PBR Material Simulation
- **Purchase Gateway:** WhatsApp API (wa.me deeplink dengan generator pesan terstruktur)
- **RBAC Security:** Role-Based Access Control (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`) dengan Admin Cloaking terisolasi penuh
- **Hosting:** Static Web Architecture (Zero Server Maintenance, Instant Performance)

---

## 2. Flowchart — Alur Pengguna (Customer Journey)

```mermaid
flowchart TD
    A([Masuk ke Website CDEPearls]) --> B[Tampilkan Halaman Etalase\nindex.html]
    B --> C{Pilih Kategori?}
    C -->|Semua| D[Tampilkan Semua Produk]
    C -->|Cincin| E[Filter: category = cincin]
    C -->|Kalung| F[Filter: category = kalung]
    C -->|Anting| G[Filter: category = anting]
    C -->|Gelang| H[Filter: category = gelang]
    D & E & F & G & H --> I[Tampilkan Grid Produk\nsesuai filter]
    I --> J{Aksi User?}
    J -->|Klik Produk| K[Buka Modal Detail Produk]
    J -->|Klik Customizer| L[Buka 3D Atelier\ncustomizer.html]
    K --> M{Di Modal?}
    M -->|Add to Cart| N[Tambah ke Keranjang\nCDEStore.addToCart]
    M -->|Beli Langsung| O[Arahkan ke cart.html]
    M -->|Tutup| I
    N --> P[Update Cart Badge di Header]
    P --> J
    L --> Q[3D Customizer Flow - lihat Diagram 4]
    O --> R[Halaman Keranjang\ncart.html]
    R --> S[Checkout Flow - lihat Diagram 3]
    S --> T([Selesai / Konfirmasi WhatsApp])
```

---

## 3. Flowchart — Alur Pembelian via WhatsApp

```mermaid
flowchart TD
    A([Halaman Keranjang\ncart.html]) --> B[Tampilkan Item Keranjang\ndari CDEStore.getCart]
    B --> C{Keranjang Kosong?}
    C -->|Ya| D[Tampilkan Pesan Keranjang Kosong]
    D --> E[Tombol: Kembali Belanja]
    E --> Z([index.html])
    C -->|Tidak| F[Hitung Total\nsubtotal + asuransi - kupon]
    F --> G{Input Kupon?}
    G -->|Ya| H[CDEStore.applyCoupon\nkode LOMBOK10 / CDEVIP]
    H -->|Valid| I[Terapkan Diskon]
    H -->|Tidak Valid| J[Tampilkan Error Kupon]
    I & J --> K[Tampilkan Summary Total Akhir]
    G -->|Tidak| K
    K --> L[Isi Form Pemesanan\nNama / HP / Alamat / Ekspedisi]
    L --> M{Validasi Form}
    M -->|Tidak Lengkap| N[Tampilkan Validasi Error]
    N --> L
    M -->|Lengkap| O[CDEStore.createOrder\nbuat data pesanan]
    O --> P[CDEStore.generateWhatsAppLink\nformat pesan otomatis]
    P --> Q[Buka WhatsApp\nwa.me dengan pesan terformat]
    Q --> R[Customer Kirim Pesan ke Admin CDE Pearls]
    R --> S[Admin Terima & Konfirmasi di WhatsApp]
    S --> T[Admin Update Status\ndi Super Admin Panel]
    T --> U([Status Pesanan: pending → confirmed → shipping → done])
```

---

## 4. Flowchart — Alur Kustomisasi 3D (Atelier)

```mermaid
flowchart TD
    A([Masuk Halaman\ncustomizer.html]) --> B[Inisialisasi Three.js\nWebGL Canvas + Lighting]
    B --> C[Load Model 3D\nBentuk Default: cincin]
    C --> D{WebGL Supported?}
    D -->|Tidak| E[Tampilkan Fallback Image Mode]
    D -->|Ya| F[Tampilkan 3D Viewer\nOrbitControls Aktif]
    F --> G[Panel Konfigurasi Aktif]
    G --> H{Pilihan User}
    H -->|Pilih Tipe Perhiasan| I[Ganti Model 3D\ncincin/kalung/gelang]
    H -->|Pilih Warna Mutiara| J[Update Material\nwarna pearl 3D]
    H -->|Pilih Jenis Logam| K[Update Material\nwarna gold/silver]
    H -->|Pilih Ukuran| L[Update Scale\ndimensi perhiasan]
    H -->|Rotate/Zoom| M[OrbitControls\nmanipulasi viewport]
    I & J & K & L --> N[Update Ringkasan Spesifikasi Real-time]
    N --> O[Hitung Estimasi Harga\nberdasarkan pilihan]
    O --> P{Aksi User}
    P -->|Tambah ke Keranjang| Q[CDEStore.addToCart\ndengan customSpec]
    P -->|Konsultasi WhatsApp| R[Buka wa.me dengan\nspesifikasi kustom]
    P -->|Lanjut Konfigurasi| H
    Q --> S[Redirect ke cart.html]
    R --> T([WhatsApp Consultation])
```

---

## 5. Flowchart — Alur Admin (Super Admin Panel)

```mermaid
flowchart TD
    A([Akses admin/index.html]) --> B{Autentikasi?\nSession Check}
    B -->|Tidak Terautentikasi| C[Login Form\nUsername + Password]
    C --> D{Validasi Kredensial}
    D -->|Salah| E[Tampilkan Error Login Gagal]
    E --> C
    D -->|Benar| F[Dashboard Admin Loaded]
    B -->|Terautentikasi| F
    F --> G{Pilih Menu}
    G -->|Produk| H[Manajemen Produk]
    G -->|Pesanan| I[Manajemen Pesanan]
    G -->|Pengaturan| J[Pengaturan Sistem]
    H --> K{Aksi Produk}
    K -->|Tambah| L[Form Tambah Produk\nnama/kategori/harga/stok/gambar]
    L --> M[CDEStore.addProduct\nsimpan ke localStorage]
    M --> N[Produk Muncul di Etalase Pelanggan]
    K -->|Edit| O[Form Edit Produk\npre-filled data]
    O --> P[CDEStore.updateProduct\nupdate localStorage]
    K -->|Hapus| Q[Konfirmasi Hapus]
    Q -->|Ya| R[CDEStore.deleteProduct]
    Q -->|Tidak| H
    I --> S{Aksi Pesanan}
    S -->|Lihat Detail| T[Modal Detail Pesanan\nitem/alamat/total]
    S -->|Update Status| U[Dropdown Status\npending/confirmed/atelier/qc/shipping/done]
    U --> V[CDEStore.updateOrderStatus]
    V --> W[Status Terupdate di Dashboard]
    J --> X[Edit Nomor WhatsApp\nNama Toko / Alamat]
    X --> Y[CDEStore.saveSettings]
    Y --> F
```

---

## 6. Use Case Diagram

```mermaid
graph TB
    subgraph ACTORS["Aktor Sistem"]
        UC(["Customer / Pelanggan"])
        UA(["Super Admin"])
        WA(["WhatsApp - External"])
    end

    subgraph FRONTEND["Frontend - Etalase Pelanggan"]
        UC1["Melihat Katalog Produk"]
        UC2["Filter berdasarkan Kategori"]
        UC3["Melihat Detail Produk"]
        UC4["Menambahkan ke Keranjang"]
        UC5["Melakukan Checkout"]
        UC6["Menggunakan Kode Kupon"]
        UC7["Mengisi Form Pemesanan"]
        UC8["Mengirim Pesanan via WhatsApp"]
        UC9["Membuat Kustomisasi 3D Atelier"]
        UC10["Konsultasi via WhatsApp"]
    end

    subgraph ADMIN_UC["Admin Panel - Super Admin"]
        UA1["Login ke Dashboard Admin"]
        UA2["Manajemen Produk CRUD"]
        UA3["Tambah Produk Baru"]
        UA4["Edit Produk"]
        UA5["Hapus Produk"]
        UA6["Manajemen Pesanan"]
        UA7["Update Status Pesanan"]
        UA8["Lihat Detail Pesanan"]
        UA9["Konfigurasi Nomor WhatsApp"]
        UA10["Pengaturan Toko"]
    end

    UC --> UC1 & UC2 & UC3 & UC4
    UC --> UC5 & UC6 & UC7 & UC8
    UC --> UC9 & UC10
    UC8 --> WA
    UC10 --> WA
    UA --> UA1
    UA1 --> UA2 & UA6 & UA9
    UA2 --> UA3 & UA4 & UA5
    UA6 --> UA7 & UA8
    UA9 --> UA10
    WA -->|Notifikasi pesanan masuk| UA
```

---

## 7. Class Diagram (Struktur Data)

```mermaid
classDiagram
    class CDEStore {
        +STORAGE_KEYS: Object
        +init() void
        +getProducts() Product[]
        +getProductById(id) Product
        +saveProducts(products) void
        +addProduct(data) Product
        +updateProduct(id, data) Product
        +deleteProduct(id) boolean
        +getCart() CartItem[]
        +addToCart(item) CartItem[]
        +removeFromCart(cartItemId) CartItem[]
        +updateCartQty(cartItemId, qty) CartItem[]
        +clearCart() void
        +getCartTotal() CartTotal
        +applyCoupon(code) CouponResult
        +removeCoupon() void
        +getOrders() Order[]
        +createOrder(data) Order
        +updateOrderStatus(id, status, resi) Order
        +getSettings() Settings
        +saveSettings(data) Settings
        +formatRupiah(amount) string
        +generateWhatsAppLink(order) string
        +notifyUpdate(type) void
    }

    class Product {
        +id: string
        +name: string
        +category: string
        +type: string
        +pearlType: string
        +pearlGrade: string
        +pearlSize: string
        +metal: string
        +price: number
        +originalPrice: number
        +discountPercent: number
        +stock: number
        +popularity: number
        +origin: string
        +image: string
        +description: string
        +certificate: string
    }

    class CartItem {
        +cartItemId: string
        +id: string
        +name: string
        +price: number
        +qty: number
        +image: string
        +customSpec: string
    }

    class CartTotal {
        +subtotal: number
        +discount: number
        +insurance: number
        +grandTotal: number
        +itemCount: number
    }

    class Order {
        +id: string
        +customerName: string
        +phone: string
        +address: string
        +items: OrderItem[]
        +total: number
        +status: string
        +date: string
        +courier: string
        +resi: string
        +notes: string
    }

    class OrderItem {
        +name: string
        +qty: number
        +price: number
        +spec: string
    }

    class Coupon {
        +code: string
        +discountPercent: number
        +label: string
    }

    class Settings {
        +shopName: string
        +whatsappNumber: string
        +boutiqueAddress: string
        +contactEmail: string
        +insuranceFee: number
        +freeBoxAndCert: boolean
    }

    class CustomizerConfig {
        +jewelryType: string
        +pearlColor: string
        +metalType: string
        +size: string
        +estimatedPrice: number
        +notes: string
    }

    CDEStore "1" --> "*" Product : manages
    CDEStore "1" --> "*" CartItem : manages
    CDEStore "1" --> "1" CartTotal : calculates
    CDEStore "1" --> "*" Order : manages
    CDEStore "1" --> "0..1" Coupon : applies
    CDEStore "1" --> "1" Settings : manages
    Order "1" *-- "*" OrderItem : contains
    CartItem --> Product : references
    CustomizerConfig --> CartItem : converts to
```

---

## 8. Sequence Diagram — Proses Checkout WhatsApp

```mermaid
sequenceDiagram
    actor C as Customer
    participant Cart as cart.html
    participant Store as CDEStore
    participant LS as localStorage
    participant WA as WhatsApp API

    C->>Cart: Buka cart.html
    Cart->>Store: getCart()
    Store->>LS: getItem cde_pearls_cart_v1
    LS-->>Store: JSON Cart Data
    Store-->>Cart: CartItem[]
    Cart->>Store: getCartTotal()
    Store-->>Cart: subtotal, insurance, grandTotal
    Cart-->>C: Tampilkan ringkasan keranjang

    opt Pakai Kupon
        C->>Cart: Input kode kupon
        Cart->>Store: applyCoupon(code)
        Store-->>Cart: success + coupon
        Cart-->>C: Tampilkan diskon
    end

    C->>Cart: Isi form nama, HP, alamat, ekspedisi
    C->>Cart: Klik Pesan via WhatsApp
    Cart->>Store: createOrder(formData + cartItems)
    Store->>LS: saveOrders(newOrder)
    Store-->>Cart: newOrder object
    Cart->>Store: generateWhatsAppLink(order)
    Store-->>Cart: wa.me URL dengan pesan terformat
    Cart->>Store: clearCart()
    Store->>LS: saveCart array kosong
    Cart->>WA: window.open(waLink)
    WA-->>C: Buka WhatsApp dengan pesan siap kirim
    C->>WA: Kirim pesan ke Admin CDE Pearls
```

---

## 9. Sequence Diagram — Admin Tambah Produk

```mermaid
sequenceDiagram
    actor A as Super Admin
    participant ADM as admin/index.html
    participant JS as admin.js
    participant Store as CDEStore
    participant LS as localStorage
    participant FE as frontend/index.html

    A->>ADM: Buka Admin Panel
    ADM->>JS: DOMContentLoaded
    JS->>Store: getProducts()
    Store->>LS: getItem cde_pearls_products_v2
    LS-->>Store: Products JSON
    Store-->>JS: Product[]
    JS-->>ADM: Render tabel produk

    A->>ADM: Klik Tambah Produk
    ADM-->>A: Tampilkan Modal Form
    A->>ADM: Isi nama, kategori, harga, stok, gambar
    A->>ADM: Klik Simpan
    ADM->>JS: handleAddProduct(formData)
    JS->>Store: addProduct(productData)
    Store->>Store: generate ID + Certificate
    Store->>LS: setItem cde_pearls_products_v2
    Store->>Store: notifyUpdate products
    Store-->>JS: newProduct
    JS-->>ADM: Update tabel produk
    ADM-->>A: Notifikasi Produk berhasil ditambahkan

    Note over FE: Pelanggan buka etalase
    FE->>Store: getProducts()
    Store->>LS: getItem cde_pearls_products_v2
    LS-->>Store: Products JSON dengan produk baru
    Store-->>FE: Product[] termasuk produk baru
    FE-->>FE: Render produk baru di kategori sesuai
```

---

## 10. Sequence Diagram — 3D Customizer

```mermaid
sequenceDiagram
    actor C as Customer
    participant CU as customizer.html
    participant JS as customizer.js
    participant THREE as Three.js Engine
    participant Store as CDEStore
    participant Cart as cart.html

    C->>CU: Buka customizer.html
    CU->>JS: DOMContentLoaded
    JS->>THREE: new WebGLRenderer
    THREE-->>JS: renderer instance
    JS->>THREE: Setup Scene + Camera + Lights
    JS->>THREE: Create Pearl Geometry SphereGeometry
    THREE-->>JS: mesh object
    JS->>THREE: animate loop requestAnimationFrame
    THREE-->>CU: Canvas WebGL 3D view

    C->>CU: Pilih tipe perhiasan cincin
    CU->>JS: switchJewelryType
    JS->>THREE: update geometry / scene
    THREE-->>CU: Update 3D view

    C->>CU: Pilih warna mutiara gold
    CU->>JS: updatePearlColor
    JS->>THREE: material.color.set
    THREE-->>CU: Update warna real-time

    C->>CU: Klik Tambah ke Keranjang
    CU->>JS: addCustomToCart
    JS->>JS: buildCustomSpec string spesifikasi
    JS->>JS: calculateEstimatedPrice
    JS->>Store: addToCart dengan customSpec
    Store-->>JS: CartItem[]
    JS->>Cart: redirect ke cart.html
    Cart-->>C: Tampilkan item kustom di keranjang
```

---

## 11. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PRODUCT {
        string id PK
        string name
        string category
        string type
        string pearlType
        string pearlGrade
        string pearlSize
        string metal
        number price
        number originalPrice
        number discountPercent
        number stock
        number popularity
        string origin
        string image
        string description
        string certificate
    }

    CART_ITEM {
        string cartItemId PK
        string productId FK
        number qty
        number price
        string customSpec
        string name
        string image
    }

    ORDER {
        string id PK
        string customerName
        string phone
        string address
        number total
        number subtotal
        number insurance
        string status
        string date
        string courier
        string resi
        string notes
    }

    ORDER_ITEM {
        string orderId FK
        string name
        number qty
        number price
        string spec
    }

    COUPON {
        string code PK
        number discountPercent
        string label
    }

    SETTINGS {
        string shopName
        string whatsappNumber
        string boutiqueAddress
        string contactEmail
        number insuranceFee
        boolean freeBoxAndCert
    }

    PRODUCT ||--o{ CART_ITEM : "dimasukkan ke"
    ORDER ||--|{ ORDER_ITEM : "berisi"
    PRODUCT }|--o{ ORDER_ITEM : "dirujuk oleh"
    COUPON }o--o| ORDER : "diterapkan pada"
    SETTINGS ||--o{ ORDER : "mengonfigurasi"
```

---

## 12. State Diagram — Alur Status Ganda (Payment & Order Lifecycle)

```mermaid
stateDiagram-v2
    state "Siklus Status Pembayaran (paymentStatus)" as PaymentFlow {
        [*] --> WAITING_PAYMENT : Checkout / Pemesanan via WA
        WAITING_PAYMENT --> PAYMENT_REVIEW : Unggah Bukti Transfer ke Admin
        WAITING_PAYMENT --> FAILED : Tidak Bayar / Kadaluwarsa
        PAYMENT_REVIEW --> PAID : Admin Verifikasi Pembayaran Lunas
        PAYMENT_REVIEW --> WAITING_PAYMENT : Bukti Tidak Valid / Minta Ulang
        PAID --> REFUNDED : Permintaan Pengembalian Dana
        FAILED --> [*]
        REFUNDED --> [*]
    }

    state "Siklus Status Pengerjaan (orderStatus)" as OrderFlow {
        [*] --> PENDING : Pesanan Masuk ke Sistem
        PENDING --> PROCESSING : Pembayaran Terkonfirmasi (PAID)
        PROCESSING --> READY_TO_SHIP : Selesai Dirakit & Lolos Uji Lab
        READY_TO_SHIP --> SHIPPED : Diserahkan ke Kurir & Resi Terbit
        SHIPPED --> DELIVERED : Paket Diterima Pembeli
        DELIVERED --> COMPLETED : Transaksi Selesai & Ulasan
        PENDING --> CANCELLED : Dibatalkan
        COMPLETED --> [*]
        CANCELLED --> [*]
    }
```

---

## 13. Component Diagram — Arsitektur Frontend

```mermaid
graph TB
    subgraph BROWSER["Browser - Client Side"]

        subgraph FRONTEND["frontend/ - Customer Layer"]
            IH["index.html\nEtalase + Filter + Modal"]
            CH["customizer.html\n3D Atelier"]
            CRT["cart.html\nCheckout"]

            subgraph CSS_FE["css/"]
                SCSS["style.css\nGlobal + Luxury Buttons"]
                CCSS["customizer.css\n3D Panel"]
                CARTCSS["cart.css\nCheckout Form"]
            end

            subgraph JS_FE["js/"]
                STORE["store.js\nCentral State Manager"]
                MAIN["main.js\nProduct Render + Filter"]
                CUSTJS["customizer.js\nThree.js Controller"]
                CARTJS["cart.js\nCart Logic"]
                THREE["vendor/three.min.js\n3D Engine"]
                ORBIT["vendor/OrbitControls.js\n3D Controls"]
            end
        end

        subgraph ADMIN["admin/ - Super Admin Layer"]
            AIH["index.html\nAdmin Dashboard"]
            subgraph CSS_ADM["css/"]
                ADMCSS["admin.css"]
            end
            subgraph JS_ADM["js/"]
                ADMJS["admin.js\nCRUD Produk dan Pesanan"]
            end
        end

        subgraph STORAGE["localStorage - Persistence Layer"]
            P["cde_pearls_products_v2"]
            C["cde_pearls_cart_v1"]
            O["cde_pearls_orders_v1"]
            S["cde_pearls_settings_v1"]
            CPN["cde_pearls_coupon_v1"]
        end
    end

    subgraph EXTERNAL["External Services"]
        WA_API["WhatsApp API\nwa.me deeplink"]
        UNSPLASH["Unsplash CDN\nProduct Images"]
        GFONTS["Google Fonts CDN"]
    end

    IH --> STORE & MAIN & SCSS
    CH --> STORE & CUSTJS & CCSS & THREE & ORBIT
    CRT --> STORE & CARTJS & CARTCSS
    AIH --> STORE & ADMJS & ADMCSS

    STORE <-->|read/write| P & C & O & S & CPN
    ADMJS --> STORE

    CARTJS -->|wa.me deeplink| WA_API
    CUSTJS -->|consultation link| WA_API
    IH -->|image src| UNSPLASH
    IH & CH & CRT & AIH -->|fonts| GFONTS
```

---

## 14. Activity Diagram — Filter Kategori Produk

```mermaid
flowchart TD
    START([User membuka index.html]) --> INIT[main.js: DOMContentLoaded]
    INIT --> LOAD[CDEStore.getProducts\nambil dari localStorage]
    LOAD --> RENDER_ALL[Render semua produk ke grid HTML]
    RENDER_ALL --> LISTEN[Pasang event listener\ndi tombol filter kategori]
    LISTEN --> WAIT{Menunggu klik filter?}
    WAIT -->|Klik filter| FILTER[Tangkap nilai kategori\ndari data-category attribute]
    FILTER --> CHECK{kategori = semua?}
    CHECK -->|Ya| SHOW_ALL[filtered = allProducts]
    CHECK -->|Tidak| SHOW_CAT[filtered = allProducts.filter\nberdasarkan kategori]
    SHOW_ALL & SHOW_CAT --> UPDATE_ACTIVE[Update kelas CSS active\npada tombol filter]
    UPDATE_ACTIVE --> CLEAR[Kosongkan container grid]
    CLEAR --> LOOP{Loop item di filtered}
    LOOP -->|Ada item| CREATE[Buat elemen card HTML\ndengan data produk]
    CREATE --> ATTACH[Pasang event listener\nklik card buka modal]
    ATTACH --> LOOP
    LOOP -->|Selesai| SHOW_GRID[Tampilkan grid produk\nyang telah difilter]
    SHOW_GRID --> WAIT
    WAIT -->|Klik card| MODAL[Buka Modal Detail Produk\nisi data nama/harga/spec]
    MODAL --> WAIT
```

---

## 15. Data Flow Diagram (DFD)

### Level 0 — Context Diagram

```mermaid
graph LR
    C(["Customer"])
    SA(["Super Admin"])
    WA(["WhatsApp"])

    SYS["Sistem\nCDE Pearls\nE-Commerce"]

    C -->|"Browse katalog, klik produk\ncheckout order, custom perhiasan"| SYS
    SYS -->|"Tampilkan produk\nkonfirmasi keranjang, redirect WA"| C
    SA -->|"CRUD produk\nupdate status pesanan\nkonfigurasi toko"| SYS
    SYS -->|"Data produk terkini\nringkasan pesanan\nlaporan stok"| SA
    SYS -->|"Pesan order terformat\nkonsultasi kustom"| WA
    WA -->|"Konfirmasi penerimaan"| C
```

### Level 1 — Sub-sistem Detail

```mermaid
flowchart TD
    subgraph INPUT["Input Aktor"]
        C(["Customer"])
        SA(["Super Admin"])
    end

    subgraph PROCESSES["Proses Utama"]
        P1["1.0\nManajemen Katalog"]
        P2["2.0\nFilter dan Tampilkan Produk"]
        P3["3.0\nManajemen Keranjang"]
        P4["4.0\nCheckout dan Pemesanan"]
        P5["5.0\n3D Kustomisasi Atelier"]
        P6["6.0\nAdmin Panel CRUD"]
    end

    subgraph DATA_STORES["Data Stores - localStorage"]
        DS1[("D1: Products")]
        DS2[("D2: Cart")]
        DS3[("D3: Orders")]
        DS4[("D4: Settings")]
    end

    subgraph EXTERNAL["External"]
        WA(["WhatsApp"])
    end

    SA --> P6
    P6 -->|"Simpan produk"| DS1
    P6 -->|"Update pesanan"| DS3
    P6 -->|"Simpan pengaturan"| DS4

    C --> P2
    DS1 -->|"Baca produk"| P1
    P1 --> P2
    P2 -->|"Produk terfilter"| C

    C --> P3
    DS1 -->|"Detail produk"| P3
    P3 -->|"Simpan cart"| DS2
    DS2 -->|"Baca cart"| P3

    C --> P4
    DS2 -->|"Ambil cart"| P4
    DS4 -->|"Ambil settings WA"| P4
    P4 -->|"Simpan pesanan"| DS3
    P4 -->|"Redirect + pesan"| WA

    C --> P5
    P5 -->|"Tambah ke cart"| DS2
    P5 -->|"Konsultasi"| WA
```

---

## 16. Deployment Diagram

```mermaid
graph TB
    subgraph CLIENT["Browser - Client"]
        B["Web Browser\nChrome / Firefox / Safari / Edge"]
        LS["localStorage\nPersistent Client Storage"]
        WEBGL["WebGL Context\nThree.js 3D Renderer"]
        B --- LS & WEBGL
    end

    subgraph HOSTING["Static Hosting - Vercel / Netlify / GitHub Pages"]
        subgraph FE_HOST["frontend/"]
            FE_HTML["HTML Files\nindex.html, customizer.html, cart.html"]
            FE_CSS["CSS Files\nstyle.css, customizer.css, cart.css"]
            FE_JS["JS Files\nstore.js, main.js, customizer.js, cart.js"]
            VENDOR["Vendor JS\nthree.min.js, OrbitControls.js"]
        end

        subgraph ADM_HOST["admin/"]
            ADM_HTML["index.html\nSuper Admin Dashboard"]
            ADM_CSS["admin.css"]
            ADM_JS["admin.js"]
        end
    end

    subgraph EXTERNAL["External Services"]
        WA_SVC["WhatsApp Business\nwa.me API deeplink"]
        UNSPLASH_CDN["Unsplash CDN\nImage proxy"]
        GFONTS["Google Fonts CDN\nCormorant Garamond, Montserrat"]
    end

    B -->|HTTP GET| FE_HOST
    B -->|HTTP GET| ADM_HOST
    B <-->|Read/Write| LS
    B -->|WebGL Render| WEBGL
    B -->|window.open wa.me| WA_SVC
    FE_HTML -->|img src| UNSPLASH_CDN
    FE_HTML & ADM_HTML -->|font import| GFONTS
```

> **Catatan:** Tidak ada server-side backend. Semua data disimpan di localStorage browser. Cocok untuk MVP dan demo profesional. Siap deploy ke Vercel / Netlify / GitHub Pages.

---

## Ringkasan Arsitektur

| Aspek | Detail |
|---|---|
| **Arsitektur** | Client-side SPA Static Site |
| **State Management** | CDEStore singleton + localStorage |
| **Halaman Customer** | index.html, customizer.html, cart.html |
| **Halaman Admin** | admin/index.html (terpisah penuh) |
| **3D Engine** | Three.js r128 + OrbitControls |
| **Purchase Flow** | WhatsApp Deeplink wa.me |
| **Kategori Produk** | Cincin, Kalung, Anting, Gelang |
| **Status Pesanan** | pending → confirmed → atelier → qc → shipping → done |
| **Kupon Diskon** | LOMBOK10 (10%), CDEVIP (15%) |
| **Persistence** | 5 key localStorage |
| **Notifikasi** | Custom DOM Event: cde_store_updated |
| **Backend** | Tidak ada (100% client-side) |
| **Database** | Tidak ada (localStorage sebagai pengganti) |

---

*Dokumen ini dibuat berdasarkan analisis kode sumber CDE Pearls E-Commerce System.*  
*© 2026 CDE Pearls Lombok — Confidential System Design Document*
