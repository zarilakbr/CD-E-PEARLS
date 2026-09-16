# Product Requirements Document (PRD) v3.0
## Platform E-Commerce & Atelier Perhiasan Mutiara "CD'E Pearls Lombok"

- **Dokumen Versi**: 3.0.0 (Enterprise Release - Deep Navy & Pearl White Luxury Theme, Lucide Icons, Dual-Status Workflow, 5 Kategori Terpisah, WhatsApp Leads CRM & Isolated Super Admin RBAC)
- **Status**: Disetujui & Selesai Diimplementasikan (Fully Implemented)
- **Terakhir Diperbarui**: September 2026
- **Target Pengguna**: Konsumen Perhiasan Mewah, Kolektor Mutiara, Pemesan Kustom Atelier, & Administrator Butik

---

## 1. Ringkasan Eksekutif & Visi Produk

**CD'E Pearls Lombok** adalah platform digital perhiasan mutiara air laut (*South Sea Pearls* - *Pinctada maxima*) asal Lombok, Nusa Tenggara Barat. Platform ini memadukan estetika perhiasan mewah bertaraf internasional dengan kemudahan transaksi concierge melalui integrasi **WhatsApp Service**, studio kustomisasi 3D WebGL interaktif, Customer Dashboard terpadu, dan portal Super Admin terisolasi penuh dengan sistem Role-Based Access Control (RBAC).

### Pilar Utama Produk:
1. **Palet Warna Mewah Eksekutif**:
   - **Deep Navy (`#0B1F33`)**: Header navbar, tombol primer, heading utama, footer, dan sidebar eksekutif.
   - **Pearl White (`#F8F7F2`)**: Latar belakang kanvas utama etalase dan portal.
   - **Champagne Gold (`#C9A96E`)**: Aksen perhiasan mewah, border aktif, lencana sertifikat, harga investasi.
   - **Soft Blue (`#8FAFC4`)**: Aksen sekunder, tag varietas mutiara, highlight informasi.
   - **Dark Text (`#17202A`)**: Tipografi heading dan body text kontras tinggi.
   - **Light Gray (`#EEF1F3`)**: Garis batas pembagi, kartu latar, dan tabel data.
   - **WhatsApp Green (`#25D366`)**: Tombol interaktif chat konsultasi, order invoice, dan quick CRM link.
2. **Standar Ikon Minimalis**: Menggunakan **Lucide Icons** (stroke 1.8–2px, rounded corner, modern, elegan) secara konsisten di seluruh halaman tanpa emoji ataupun ikon pihak ketiga yang tidak serasi.
3. **Pemisahan Kategori Mutlak (5 Kategori Perhiasan)**:
   - Kalung Mutiara (*Necklaces*)
   - Gelang Mutiara (*Bracelets*)
   - Anting Mutiara (*Earrings*)
   - Cincin Mutiara (*Rings*)
   - Mutiara Lepas (*Loose Pearls*)
   Kelima kategori dipisahkan secara tegas di etalase, filter, maupun sistem inventaris admin tanpa percampuran.
4. **Layanan WhatsApp Service Terintegrasi**: WhatsApp berfungsi sebagai media konsultasi gemologi personal (`generateProductConsultationMessage`), invoice pemesanan terstruktur (`generateOrderMessage`), dan pencatatan prospek ke WhatsApp Leads CRM.
5. **Customer Dashboard**: Portal mandiri pelanggan (`frontend/customer.html`) dengan 4 modul: Profil Pengguna, Riwayat Pesanan dengan Pelacak Resi, Wishlist, dan Ulasan Testimoni.
6. **Isolasi Total Super Admin (Admin Cloaking & RBAC)**: Portal administrasi beroperasi privat di `/admin/index.html` dan sama sekali tidak memiliki tautan di antarmuka pelanggan. Memiliki autentikasi RBAC untuk `SUPER_ADMIN` (akses penuh, laporan finansial, audit log, admin users) dan `ADMIN` (operasional katalog, stok, pesanan, leads, ulasan).
7. **Studio Kustomisasi 3D WebGL (Three.js Atelier)**: Visualizer 3D putar 360°, pemilihan material PBR nacre mutiara laut dan rangka emas 18K/perak 925, slider diameter mutiara 9–14 mm, serta kalkulator harga dinamis.

---

## 2. Struktur Peta Situs (Sitemap Architecture)

### 2.1. Domain Utama (Customer-Facing Website)
```
DOMAIN UTAMA (frontend/)
│
├── Home (index.html)
│   ├── Announcement Bar Deep Navy
│   ├── Header Navigasi Navy & Logo CD'E Pearls
│   ├── Hero Luxury Samudera Lombok
│   ├── 5 Kategori Showcase (Kalung, Gelang, Anting, Cincin, Mutiara Lepas)
│   ├── Filter Bar Mewah (Varietas, Grade, Urutan)
│   ├── Katalog 5 Grup Kategori Terpisah
│   ├── Keunggulan & Sertifikasi Gemologi
│   ├── Ulasan & Testimoni Pelanggan
│   └── Footer Navy Concierge
│
├── Produk (Katalog Terklasifikasi 5 Kategori)
│   ├── Kalung Mutiara
│   ├── Gelang Mutiara
│   ├── Anting Mutiara
│   ├── Cincin Mutiara
│   └── Mutiara Lepas
│
├── Detail Produk (Modal Interaktif & Dukungan URL Parameter ?product=ID)
│   ├── Galeri Foto Resolusi Tinggi
│   ├── Spesifikasi Lengkap (Grade, Ukuran mm, Logam, Origin, Sertifikat)
│   ├── Tombol Tambah ke Keranjang
│   ├── Tombol Beli via WhatsApp
│   └── Tombol Konsultasi via WhatsApp
│
├── Studio Kustomisasi 3D (customizer.html)
│   ├── Viewport WebGL Three.js PBR OrbitControls
│   ├── Stepper 4 Tahap (Basis Perhiasan, Mutiara, Rangka, Ukuran & Aksesoris)
│   └── Direct WhatsApp Custom Order Generator
│
├── Keranjang Belanja (cart.html)
│   ├── Rincian Item Perhiasan & Jumlah
│   ├── Voucher Diskon (LOMBOK10, CDEVIP)
│   ├── Asuransi Pengiriman Berasuransi Penuh
│   ├── Form Data Penerima & Pilihan Kurir
│   ├── Tombol Checkout WhatsApp Invoice
│   ├── Tombol Transfer Bank Manual
│   └── Kotak Pelacak Cepat Pesanan (Order Tracking Lookup)
│
├── Tentang Kami (about.html)
│   ├── Kisah Budidaya Tiram Pinctada maxima di Lombok
│   ├── Proses 24-36 Bulan Pembentukan Mutiara Laut
│   ├── Atelier Emas 18K Pengrajin Lokal
│   └── Standar Sertifikasi Laboratorium Gemologi
│
├── Kontak & Concierge (contact.html)
│   ├── Lokasi Galeri & Butik Senggigi, Lombok Barat
│   ├── Jam Layanan Private Appointment
│   └── Form Pesan Interaktif dengan WhatsApp Dispatch & Lead Logging
│
├── FAQ (faq.html)
│   └── Accordion Interaktif (Air Laut vs Air Tawar, Sertifikasi, Logistik, Perawatan)
│
├── Blog & Edukasi Mutiara (blog.html)
│   ├── Jurnal Kilau Mutiara Air Laut
│   ├── Grade AAA vs AA+
│   ├── Mutiara Emas Imperial South Sea
│   └── Modal Baca Artikel Komprehensif
│
└── Customer Dashboard (customer.html)
    ├── Autentikasi Pengguna (Login & Registrasi Pelanggan)
    ├── Tab Profil (Nama, Email, WhatsApp, Alamat Pengiriman)
    ├── Tab Pesanan (Dual-Status, Riwayat Transaksi, Pelacak Resi, Chat WA)
    ├── Tab Wishlist (Koleksi Favorit dengan Pindah ke Keranjang)
    └── Tab Ulasan (Testimoni Pembeli dengan Rating Bintang)
```

### 2.2. Portal Super Admin Terpisah (Admin Cloaking)
```
ADMIN TERPISAH (admin/index.html)
│
├── Login RBAC Overlay (Autentikasi SUPER_ADMIN & ADMIN Atelier)
├── Dashboard Ringkasan (KPI Omset, Pesanan, Desain, Stok, Recent Orders & Leads)
├── Katalog Produk (CRUD 11 Parameter Perhiasan, Filter Kategori, Pencarian)
├── 5 Kategori Mutiara (Manajemen Kategori Terpisah & Tautan Cepat)
├── Stok Butir Mutiara (Kontrol Cepat +1/-1 & Peringatan Stok Menipis <= 3)
├── Pesanan & Bayar (Verifikasi Lunas PAID, Status Atelier, Input Resi, WhatsApp Chat)
├── WhatsApp Leads CRM (Pelacak Prospek Chat, Status: NEW, CONTACTED, DEAL, CANCELLED)
├── Daftar Pelanggan (Direktori Pelanggan Terdaftar & Total Transaksi)
├── Ulasan Pelanggan (Moderasi & Hapus Testimoni)
├── Admin Users [SUPER ADMIN ONLY] (Manajemen Hak Akses & Penambahan Akun Admin)
├── Laporan & Audit Logs [SUPER ADMIN ONLY] (Omset, AOV, Kategori Terlaris, Log Aktivitas)
└── Pengaturan Gateway WA (Nomor Concierge, Alamat Butik, Template Notifikasi WA)
```

---

## 3. Siklus Transaksi & Alur Status Ganda (Dual-Status Flow)

### 3.1. Status Pembayaran (`paymentStatus`)
1. `WAITING_PAYMENT`: Pelanggan telah mengirim pesanan via WhatsApp/Web, menunggu konfirmasi transfer rekening resmi butik.
2. `PAYMENT_REVIEW`: Bukti transfer dikirimkan via WhatsApp dan sedang diverifikasi oleh admin.
3. `PAID`: Pembayaran tervalidasi lunas oleh admin. Otomatis mengubah `orderStatus` menjadi `PROCESSING`.
4. `FAILED`: Transaksi kadaluwarsa atau dibatalkan sebelum pembayaran.
5. `REFUNDED`: Pengembalian dana atas permintaan pembeli/insiden stok.

### 3.2. Status Pesanan (`orderStatus`)
1. `PENDING`: Pesanan baru terdaftar di sistem.
2. `PROCESSING`: Pesanan sedang dipersiapkan di atelier Lombok (penyesuaian ukuran cincin, rantai emas, atau sertifikasi).
3. `READY_TO_SHIP`: Pengepakan selesai dalam kotak velvet beludru dan asuransi disiapkan.
4. `SHIPPED`: Pesanan diserahkan ke kurir (JNE YES/TiKi ONS) dan nomor resi diterbitkan.
5. `DELIVERED`: Paket diterima oleh pembeli.
6. `COMPLETED`: Transaksi selesai penuh.

---

## 4. Desain Sistem & Tokenisasi Antarmuka (Sesuai Arahan Pemilik)

| Nama Token | Nilai Hex | Peruntukan Desain Sesuai Arahan Pemilik |
|---|---|---|
| `--c-page-bg` | `#E3CAC3` | Canvas Latar Belakang: Warm Soft Dusty Rose Terracotta |
| `--c-header-bg` | `#BF9384` | Header Melengkung & Footer: Cokelat Terracotta (`border-radius: 36px`) |
| `--c-dark-text` | `#382218` | Dark Espresso: Tipografi teks, heading, ikon, dan navigasi |
| `--c-gold-btn` | `#BD8F4B` | Honey Caramel Gold: Tombol pill "ADD TO CART" & highlight mewah |
| `--c-price-red` | `#BA4E4E` | Crimson Coral Red: Label harga promo produk mutiara |
| `--c-price-strike` | `#96857D` | Muted Taupe: Coretan harga asli sebelum diskon |
| `--c-card-bg` | `#FFFFFF` | Putih Bersih: Kartu produk kotak (border-radius 20px, border `#E8D8D3`) |
| `--c-heart-outline` | `#C08A7C` | Delicate Rose Terracotta: Ikon outline hati simpan ke favorit |
| `--c-search-bg` | `#F5ECE5` | Soft Linen Cream: Search pill header & newsletter pill footer |
| `--c-whatsapp` | `#25D366` | WhatsApp Emerald: Tombol konsultasi concierge & direct checkout |

---

## 5. Kriteria Keberhasilan & Verifikasi Sistem

1. **Integritas Navigasi & File**:
   - Seluruh 9 file HTML (`index.html`, `cart.html`, `customer.html`, `about.html`, `contact.html`, `faq.html`, `blog.html`, `customizer.html`, `admin/index.html`) mengembalikan HTTP 200 tanpa tautan rusak (*broken link*).
2. **Kesesuaian Desain 100% dengan Screenshot Pemilik**:
   - Canvas menggunakan latar soft dusty rose terracotta (`#E3CAC3`).
   - Header dan Footer memiliki aksen melengkung khas butik perhiasan (`#BF9384`).
   - Kartu produk berbentuk kotak putih murni (`#FFFFFF`) dengan ikon hati terracotta rose di kanan atas dan tombol full-width pill *"ADD TO CART"* honey caramel gold (`#BD8F4B`).
   - Footer menampilkan logo monogram CD'E Pearls, form newsletter *"You can be one step ahead"*, serta tautan navigasi horizontal teratur.
3. **Isolasi Super Admin**:
   - Direktori `admin/` berdiri sendiri dengan kontrol RBAC penuh. Antarmuka pelanggan tidak memiliki akses ke portal admin.
4. **CRM & Konsultasi WhatsApp**:
   - Interaksi konsultasi WhatsApp dan order tercatat ke leads dan audit log secara real-time.

---
*Dokumen Disahkan oleh Pemilik & Tim Rekayasa Perhiasan CD'E Pearls Lombok (Versi 3.5 - Owner Design Approval).*
