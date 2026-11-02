# Checklist Pengembangan CD'E Pearls Lombok (v4.0)
Dokumen Pelacakan Fitur: **Sudah Selesai (Completed)** vs **Belum / Rencana Lanjutan (Future Backlog)**
*Terakhir diperbarui: 28 Oktober 2026*

---

## Ringkasan Progres

```
[========================================] 100% Arsitektur Modern Selesai
• Frontend Modern     : React 19 + TypeScript + Vite + Tailwind CSS v4 + Shadcn/UI
• 3D Studio WebGL     : Three.js Interactive OrbitControls 360° Studio
• Backend Modern      : Laravel 11 RESTful API (PHP 8.5) + Laravel Sanctum
• Database Relasional : SQLite / MySQL Ready dengan Migrations, Seeders & Dual-Status Lifecycle
• Real-Time Sync      : Polling & Event Synchronizer (/api/realtime/events)
• Status Eksekusi     : 100% Build Sukses (HTTP 200 Backend & Frontend Aktif)
```

---

## 1. Domain Utama / Customer-Facing (`frontend/`)

### 1.1. Tampilan & Desain Global (Sesuai Desain Pemilik)
- [x] **Palet Warna Resmi Pemilik (Owner Approved Luxury Palette)**:
  - Canvas / Page Background: Soft Warm Dusty Rose Terracotta (`#E3CAC3`).
  - Header & Footer: Cokelat Terracotta (`#BF9384`) dengan lengkungan sudut mewah (`border-radius: 36px`).
  - Tipografi & Icon Utama: Rich Dark Espresso (`#382218`).
  - Tombol Aksi Utama: Honey Caramel Gold (`#BD8F4B`, hover `#A87834`, text `#FFFFFF`).
  - Harga Promo: Crimson Coral Red (`#BA4E4E`) & Coretan Harga Muted Taupe (`#96857D`).
  - Kartu Produk: Putih Bersih (`#FFFFFF`) dengan border halus (`#E8D8D3`) dan shadow lembut.
  - WhatsApp Resmi: Emerald Green (`#25D366`).
- [x] **Ikonografi Bebas Emoji**: 100% menggunakan SVG & Lucide Icons dengan stroke elegan, rounded corner minimalis modern.
- [x] **Tipografi Mewah**: Font Google **Inter** (UI, tabel, form, body) dan **Playfair Display** (heading editorial mewah).
- [x] **Logo Resmi CD'E Pearls**: Integrasi logo brand resolusi tinggi pada navbar header dan footer terracotta.
- [x] **Header Navigasi Transparan & Frosted Glass Mewah (Transparent Luxury Glass Navbar)**: Sticky header dengan efek transparansi modern (`backdrop-blur-xl`), dinamis bertransisi mulus ke frosted glass saat di-scroll (`window.scrollY > 20`), logo brand transparan murni, teks navigasi horizontal 1 baris beraksen garis emas saat aktif, search box kaca frosted glass, icon counter emas (`#BD8F4B`), tombol akses cepat SPI (Owner), serta drawer navigasi mobile responsif.
- [x] **Footer Obsidian & Terracotta Melengkung**: Background mewah espresso obsidian (`#24150E`, `border-radius: 40px 40px 0 0`) beraksen emas (`#BD8F4B`), logo CD'E Pearls bersih, newsletter collector mutiara, baris direktori halaman horizontal, dan informasi kontak butik Senggigi.

### 1.2. Halaman Beranda & Katalog (`index.html`)
- [x] **Announcement Bar**: Informasi pengiriman berasuransi ke seluruh Indonesia & sertifikat keaslian gemologi gratis.
- [x] **Hero Panoramic Full-Bleed Samudera Lombok (Background Gambar Mutiara Penuh Edge-to-Edge Tanpa Kotak Card)**: Mengadopsi tata letak situs wisata & destinasi mewah internasional dengan visual mutiara laut selatan (*South Sea Pearls*) membentang 100% penuh layar (*edge-to-edge full width*, min-height 92vh/100vh), navbar kaca transparan mengambang di atas gambar, judul editorial *"Mahakarya Kilau Murni Samudera Indonesia"*, 4 trust pills kaca, tombol CTA emas & 3D atelier, floating masterpiece cincin Golden South Sea, dan indikator koordinat Teluk Sire Lombok.
- [x] **Showcase 5 Kategori Mutiara**: Kartu navigasi visual 5 kategori:
  1. Kalung Mutiara (*Necklaces*)
  2. Gelang Mutiara (*Bracelets*)
  3. Anting Mutiara (*Earrings*)
  4. Cincin Mutiara (*Rings*)
  5. Mutiara Lepas (*Loose Pearls*)
- [x] **Filter Bar Mewah**:
  - Filter Varietas Mutiara (Semua, Gold South Sea, White South Sea, Silver Mist, Tahitian Grey).
  - Filter Grade Mutu (Semua, Grade AAA, Grade AA+, Grade Baroque).
  - Urutkan (Harga Tertinggi, Harga Terendah, Terpopuler, Rating Tertinggi).
- [x] **Pemisahan Kategori Mutlak**: Setiap kategori memiliki blok/grup tersendiri di etalase dan tidak tercampur.
- [x] **Kartu Produk Persegi Persis Screenshot Pemilik**: Kotak putih bersih (`#FFFFFF`) ber-radius 20px dengan border halus (`#E8D8D3`), ikon hati rose terracotta di sudut kanan atas, foto produk 1:1, judul elegan espresso, harga promo crimson coral (`#BA4E4E`), coretan harga muted taupe (`#96857D`), tag diskon (`-20% OFF`), serta tombol full-width pill *"ADD TO CART"* berwarna honey caramel gold (`#BD8F4B`).
- [x] **Modal Detail Produk Interaktif**:
  - Foto resolusi tinggi & nomor sertifikat laboratorium gemologi.
  - Rincian spesifikasi mutiara (grade, diameter mm, logam mulia 18K, berat, asal perairan).
  - 3 Tombol Aksi:
    - `+ Keranjang` (Add to Cart dengan notifikasi toast).
    - `Beli via WhatsApp` (Direct order invoice otomatis).
    - `Konsultasi via WA` (Tanya gemologist butik via WhatsApp).
  - Dukungan URL Parameter (`index.html?product=ID`).

### 1.3. Studio Kustomisasi 3D WebGL (`customizer.html`)
- [x] **Engine Three.js WebGL Mandiri**: Berjalan lokal tanpa dependensi eksternal yang rentan.
- [x] **OrbitControls 360°**: Rotasi 360 derajat, zoom, panning, dan kontrol auto-spin.
- [x] **Simulasi Material PBR**:
  - 4 Varietas Nacre Mutiara (Golden South Sea, Silvery White, Tahitian Grey, Champagne).
  - 4 Jenis Logam Mulia (Emas Kuning 18K, Emas Putih 18K, Rose Gold 18K, Perak 925).
- [x] **Geometri Prosedural 5 Basis Perhiasan**: Cincin Solitaire, Kalung Liontin, Gelang Bangle, Anting Drop sepasang, dan Bros Kebaya.
- [x] **Slider Diameter Real-Time**: Skala ukuran mutiara interaktif dari 9 mm hingga 14 mm.
- [x] **Kalkulator Harga Investasi Real-Time**: Harga terhitung otomatis berdasarkan bahan, ukuran, dan mutiara yang dipilih.
- [x] **Pemesanan Kustom via WhatsApp**: Format spesifikasi pesanan terstruktur langsung terkirim ke WhatsApp concierge.

### 1.4. Keranjang Belanja & Checkout (`cart.html`)
- [x] **Daftar Item Keranjang**: Thumbnail foto, nama perhiasan, spesifikasi, kontrol kuantitas (+/-), dan tombol hapus item.
- [x] **Sistem Kupon Diskon**:
  - Kupon `LOMBOK10` (Diskon 10%).
  - Kupon `CDEVIP` (Diskon apresiasi VIP 15%).
- [x] **Biaya Asuransi Pengiriman**: Asuransi pengiriman berasuransi penuh senilai harga perhiasan.
- [x] **Form Data Penerima**: Nama, No. WhatsApp, Alamat Pengiriman lengkap, Catatan khusus.
- [x] **Pilihan Kurir Ekspedisi**: JNE YES, TiKi ONS, Pos Indonesia Express.
- [x] **Metode Pembayaran**:
  - `Checkout via WhatsApp (Resmi)`: Mengirimkan invoice lengkap dan memicu status `WAITING_PAYMENT`.
  - `Transfer Bank Manual`: Menampilkan instruksi nomor rekening resmi butik CDE Pearls.
- [x] **Pelacak Cepat Pesanan (Quick Order Lookup)**: Pelanggan dapat memasukkan nomor pesanan (contoh: `CDE-2026-0041`) untuk melihat status pengerjaan dan nomor resi pengiriman secara instan.

### 1.5. Customer Dashboard (`customer.html`)
- [x] **Autentikasi Akun Pembeli**:
  - Tab Login & Tab Registrasi Akun baru.
  - Tombol uji demo cepat *"Login sebagai Ibu Ratna Paramitha"*.
- [x] **Tab 1 - Profil Pengguna**: Nama lengkap, email, nomor WhatsApp, dan alamat pengiriman dengan tombol simpan profil.
- [x] **Tab 2 - Riwayat Pesanan**:
  - Pelacak pesanan dengan badge status ganda (`orderStatus` & `paymentStatus`).
  - Rincian item perhiasan dan nomor resi pengiriman.
  - Tombol WhatsApp Follow-up langsung untuk menanyakan pesanan ke admin butik.
- [x] **Tab 3 - Wishlist Favorit**: Koleksi perhiasan yang disimpan oleh pelanggan dengan tombol *"Pindah ke Keranjang"* atau pesan langsung.
- [x] **Tab 4 - Ulasan Pelanggan**: Daftar riwayat ulasan yang telah dibuat serta formulir penulisan ulasan baru dengan rating bintang 1–5.

### 1.6. Halaman Informasi & Edukasi
- [x] **Tentang Kami (`about.html`)**:
  - Sejarah budidaya tiram *Pinctada maxima* di perairan Sekotong & Gili Genting, Lombok.
  - Infografis siklus 24–36 bulan pembentukan lapisan nacre tebal alami.
  - Atelier perhiasan emas 18K dan sertifikasi laboratorium gemologi.
- [x] **Kontak & Concierge (`contact.html`)**:
  - Alamat butik fisik di Senggigi, Lombok Barat, NTB.
  - Jadwal konsultasi privat (*Private Appointment*).
  - Form kirim pesan interaktif dengan direct WhatsApp dispatch & pencatatan lead CRM otomatis.
- [x] **FAQ Interaktif (`faq.html`)**:
  - Accordion interaktif seputar perbedaan mutiara air laut vs air tawar, sertifikasi gemologi, garansi pengiriman aman, dan panduan perawatan nacre.
- [x] **Blog & Jurnal Mutiara (`blog.html`)**:
  - 4 artikel jurnal komprehensif: Grade AAA vs AA+, Air Laut vs Air Tawar, Mutiara Emas Imperial, dan Panduan Merawat Mutiara.
  - Modal baca artikel interaktif lengkap.

---

## 2. Layanan WhatsApp & State Terpusat (`frontend/js/`)

### 2.1. Dynamic WhatsApp Service (`whatsappService.js`)
- [x] **Nomor Dinamis Terpusat**: Mengambil nomor WhatsApp resmi dari `CDEStore.getSettings().whatsappNumber` (default fallback `6281239887766`).
- [x] **Generator Konsultasi Produk**: `generateProductConsultationMessage(product)`.
- [x] **Generator Checkout Pesanan**: `generateOrderMessage(orderData, cartItems, pricing)`.
- [x] **Pencatat Prospek Otomatis**: Setiap klik tombol WhatsApp otomatis dicatat sebagai data leads baru ke `CDEStore.addLead()`.

### 2.2. Central State Store v3.0 (`store.js`)
- [x] **Struktur Data 5 Kategori**: `kalung`, `gelang`, `anting`, `cincin`, `mutiara-lepas`.
- [x] **Sistem Status Ganda (Dual-Status Lifecycle)**:
  - `paymentStatus`: `WAITING_PAYMENT` -> `PAYMENT_REVIEW` -> `PAID` -> `FAILED` / `REFUNDED`.
  - `orderStatus`: `PENDING` -> `PROCESSING` -> `READY_TO_SHIP` -> `SHIPPED` -> `DELIVERED` -> `COMPLETED` -> `CANCELLED`.
- [x] **Manajemen Pengguna & RBAC**: Peran `CUSTOMER`, `ADMIN`, dan `SUPER_ADMIN`.
- [x] **Manajemen Leads CRM**: `getLeads()`, `addLead()`, `updateLeadStatus()`.
- [x] **Log Audit Sistem**: `logAudit(action, details)`, `getAuditLogs()`.
- [x] **Manajemen Ulasan**: `getReviews()`, `addReview()`, `deleteReview()`.
- [x] **Event Real-Time Synchronizer**: Event `cde_store_updated` yang menyinkronkan seluruh tab browser saat terjadi perubahan data.

---

## 3. SPI — Sistem Pengendali Internal Khusus Owner Butik (`SPI`)

### 3.1. Keamanan & Hak Pengendali Tunggal Owner (Single Master Portal)
- [x] **Portal Tunggal SPI Khusus Owner**: Sesuai instruksi pemilik, modul dan akun staf atelier ditiadakan/dihapus (*staff owner dihapus*). Sistem beroperasi dengan akun pemegang kendali penuh melalui portal SPI terotentikasi (kredensial dikonfigurasi melalui environment variable SEED_SPI_* secara aman tanpa pencatatan kredensial pada repositori).
- [x] **Pure Shadcn UI Component Standards**: 100% menggunakan primitif Shadcn UI (`Card`, `Button`, `Badge`, `Input`, `Textarea`, `Table`, `Tabs`, `Separator`, `Alert`, `Dialog`) dengan palet luxury resmi (`#382218`, `#BD8F4B`, `#BF9384`, `#E3CAC3`, `#BA4E4E`, `#FFFFFF`).
- [x] **Pure Lucide React Icons**: Menggunakan icon resmi ekosistem Shadcn UI (`lucide-react`) tanpa emoji di seluruh tombol, tabel, badge, dan modal.
- [x] **Login Screen Khusus Owner**: Form login kredensial terisolasi dengan kartu Shadcn UI dan tombol akses cepat 1-klik untuk Owner Butik.
- [x] **Hak Akses Penuh Owner**: Owner memiliki kendali mutlak atas seluruh 10 modul internal butik.

### 3.2. 10 Modul Pengendalian Internal SPI (Tata Letak Standard & Lengkap)
- [x] **1. Dashboard Eksekutif SPI (Standard 2-Column Responsive Layout)**:
  - 4 Kartu KPI Standard: Total Omset (PAID), Pesanan Masuk, Koleksi Desain Aktif, Stok Butir Mutiara (lengkap dengan badge tren).
  - Kolom Utama (65%): Tabel Pesanan Terbaru Butik (status pembayaran, status atelier, aksi verifikasi & chat WA) + Ringkasan Distribusi 5 Kategori.
  - Kolom Samping (35%): Widget Peringatan Stok Menipis (&le; 3 butir) dengan tombol cepat `+`/`-`, Widget WhatsApp Leads Baru dengan tombol chat WA instan, dan Pintasan Cepat Owner.
- [x] **2. Pengendalian Katalog Perhiasan (CRUD 11 Parameter Gemologi)**:
  - Toolbar pencarian & filter, badge total koleksi aktif.
  - Tabel Shadcn UI untuk pengelolaan 11 spesifikasi lengkap: Nama, Kategori, Varietas, Grade AAA/AA+, Diameter mm, Rangka Logam 18K, Harga, Stok, Asal Panen Teluk Sire, Link Foto, Deskripsi Gemologi.
  - Modal Shadcn UI (`Dialog`) untuk Tambah & Edit Perhiasan.
- [x] **3. Monitoring 5 Kategori Mutiara**:
  - Kartu monitoring 5 kategori perhiasan (Kalung, Gelang, Anting, Cincin, Mutiara Lepas) dengan hitungan item real-time.
- [x] **4. Pengendalian Stok Butir Mutiara**:
  - Peringatan inventaris otomatis (`Alert destructive`) jika stok butir mutiara &le; 3 butir di atelier.
  - Tombol aksi cepat `+` dan `-` per butir mutiara yang langsung tersimpan secara live ke database.
- [x] **5. Verifikasi Pembayaran & Pesanan Masuk (Dual-Status Lifecycle)**:
  - Filter pembayaran (Semua, Menunggu Pembayaran, Lunas PAID) & kotak pencarian.
  - Kartu & tabel pesanan dengan validasi status pembayaran (`PAID` vs `WAITING_PAYMENT`).
  - Tombol aksi *"Konfirmasi Lunas (PAID)"* untuk memvalidasi transfer bank.
  - Pengubah status pengerjaan atelier (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `COMPLETED`).
  - Input nomor resi pengiriman berasuransi yang langsung terhubung ke pelacak pesanan pelanggan.
  - Tombol WhatsApp pesan langsung ke pembeli.
- [x] **6. Audit Prospek WhatsApp Leads CRM**:
  - Filter status leads (Semua, Baru, Deal) & tombol *"Catat Prospek Baru"*.
  - Tabel catatan seluruh calon pembeli dari tombol konsultasi atau pemesanan WhatsApp.
  - Dropdown pengubah status follow-up: `NEW`, `CONTACTED`, `DEAL`, `CANCELLED`.
  - Tombol direct WhatsApp dan modal Shadcn UI untuk mencatat lead offline baru.
- [x] **7. Pengendalian Direktori Pelanggan**:
  - Tabel seluruh pelanggan terdaftar beserta kontak WhatsApp dan alamat pengiriman.
- [x] **8. Moderasi Ulasan & Testimoni Pelanggan**:
  - Kartu ulasan testimoni pembeli dengan rating bintang gemologi dan tombol hapus ulasan.
- [x] **9. Laporan Finansial & Jejak Audit (Audit Logs)**:
  - Rekapitulasi omset bersih perhiasan lunas (`total_paid_revenue`), AOV (*Average Order Value*), dan total transaksi lunas.
  - Tabel Jejak Rekam Audit Aktivitas (*Immutable Audit Logs*) mencatat waktu, pelaksana, aksi, dan detail operasi.
- [x] **10. Pengendalian Gateway WhatsApp Butik**:
  - Formulir konfigurasi nomor WhatsApp concierge butik (format 62) dan alamat galeri atelier resmi.

---

## 4. Dokumentasi & Spesifikasi Sistem

- [x] **`PRD.md` (Product Requirements Document)**: Diperbarui penuh ke Versi 3.0.0 mencakup spesifikasi 20 halaman/modul, arsitektur sitemap, dan alur status ganda.
- [x] **`SYSTEM_DESIGN.md` (Spesifikasi Sistem Lengkap)**: Diperbarui dengan diagram arsitektur v3.0, class diagram, dan state diagram status pembayaran & pesanan.
- [x] **`walkthrough.md`**: Ringkasan implementasi dan panduan pengujian di browser.

---

## 5. Status Migrasi Arsitektur & Rencana Lanjutan

| Modul / Fitur | Status | Keterangan & Catatan Implementasi |
|---|:---:|---|
| **Backend RESTful API (Laravel 11)** | **SELESAI (Completed)** | Berjalan di `backend/` menggunakan PHP 8.5 & Laravel 11. Sanctum authentication, 8 API Controller, 34 rute RESTful, dan seeder data lengkap. |
| **Frontend Modern (React + Shadcn/UI + Tailwind)** | **SELESAI (Completed)** | Berjalan di `frontend/` menggunakan React 19, TypeScript, Vite, Tailwind CSS v4, dan komponen Shadcn/UI dengan palet luxury resmi terracotta. |
| **Studio 3D WebGL (Three.js)** | **SELESAI (Completed)** | Komponen `ThreeCustomizer.tsx` dengan rotasi 360°, pemilihan varietas mutiara & jenis emas 18K, slider ukuran mm, dan kalkulasi harga instan. |
| **Real-time Synchronizer** | **SELESAI (Completed)** | Endpoint `/api/realtime/events` dan auto-polling pada Admin Portal untuk update pesanan & lead baru tanpa reload. |
| **Integrasi WhatsApp Business Cloud API (Meta Webhook)** | *Pending / Backlog Opsional* | Saat ini integrasi menggunakan deep-link resmi `https://wa.me/` (100% bebas biaya langganan). Untuk webhook otomatis server-to-server bot, siap dikonfigurasi pada route webhook Laravel jika diperlukan. |
| **Deployment Custom Domain & SSL** | *Pending / Backlog Produksi* | Siap dideploy ke VPS / server produksi dengan Nginx reverse proxy mengarah ke port 8000 (Laravel) dan port 5173 atau static build `dist/` (React). |

---

*Dokumen ini merupakan catatan status resmi pengerjaan platform CD'E Pearls Lombok v4.0.*
