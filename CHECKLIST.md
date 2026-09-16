# Checklist Pengembangan CD'E Pearls Lombok (v3.0)
Dokumen Pelacakan Fitur: **Sudah Selesai (Completed)** vs **Belum / Rencana Lanjutan (Future Backlog)**
*Terakhir diperbarui: 13 September 2026*

---

## Ringkasan Progres

```
[========================================] 100% Fitur Utama Selesai
• Total Modul Utama   : 20 Modul Selesai
• Halaman Aktif       : 9 File HTML Berfungsi Penuh (HTTP 200)
• Status Arsitektur   : Sesuai PRD v3.0 & SYSTEM DESIGN
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
- [x] **Header Navigasi Putih Bersih & Rata Kanan (White Curved Navbar)**: Sticky header putih bersih (`#FFFFFF`) melengkung (`border-radius: 0 0 32px 32px`), teks dark espresso (`#382218`), teks navigasi horizontal 1 baris tanpa menumpuk (`white-space: nowrap`), search pill linen (`#F5ECE5`), serta icon counter emas (`#BD8F4B`).
- [x] **Footer Terracotta Melengkung Bebas Halo Putih**: Background terracotta (`#BF9384`, `border-radius: 36px 36px 0 0`), logo CD'E Pearls bersih dan selaras (`cde_logo_clean.png` dengan transparansi alpha murni, kilau mutiara South Sea 3D, tanpa kotak gelap atau halo putih), blok newsletter *"You can be one step ahead"*, serta baris navigasi horizontal: *Our Product, Tutorial Order, Status Order, Whatsapp, Instagram, About Us*.

### 1.2. Halaman Beranda & Katalog (`index.html`)
- [x] **Announcement Bar**: Informasi pengiriman berasuransi ke seluruh Indonesia & sertifikat keaslian gemologi gratis.
- [x] **Hero Luxury Samudera Lombok (Background Gambar Mutiara Mewah)**: Menggantikan latar biru dengan gambar mutiara laut selatan (*South Sea Pearls*) berkilau di atas kain sutra sampanye dan cangkang tiram nacre alami (`hero_pearl_bg.jpg`), berpadu dengan judul editorial *"Kilau Murni Samudera Indonesia"*, badge mutiara laut, dan 2 tombol CTA (*Lihat Koleksi Perhiasan* & *Konsultasi via WhatsApp*).
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

## 3. Portal Super Admin Terisolasi (`admin/`)

### 3.1. Keamanan & Admin Cloaking
- [x] **Isolasi Mutlak**: Portal admin berada terpisah di `/admin/index.html`, tanpa adanya tautan masuk dari antarmuka pembeli.
- [x] **Login Overlay RBAC**: Form login kredensial dengan validasi peran. Pembeli/Customer ditolak masuk.
- [x] **Tombol Demo Cepat**:
  - 👑 Super Admin (`superadmin@cdepearls.com`)
  - 🛠 Admin Atelier (`admin@cdepearls.com`)
- [x] **Pembatasan Hak Akses (Role Gate)**:
  - `ADMIN`: Akses ke Dashboard, Produk, Kategori, Stok, Pesanan, WhatsApp Leads, Pelanggan, Ulasan, dan Pengaturan.
  - `SUPER_ADMIN`: Seluruh hak akses di atas ditambah modul **Admin Users** dan **Laporan Finansial & Audit Logs**.
- [x] **Profil Pengguna Sidebar**: Menampilkan nama admin, email, lencana peran emas/biru, dan tombol keluar (*logout*).

### 3.2. Modul Manajemen Admin (11 Modul)
- [x] **1. Dashboard Ringkasan**:
  - 4 Kartu KPI: Total Omset, Pesanan Masuk, Koleksi Desain Aktif, Stok Butir Mutiara.
  - Ringkasan Pesanan Terbaru (dengan badge pembayaran & tanggal).
  - Ringkasan WhatsApp Leads Terbaru (dengan tombol chat WA cepat).
- [x] **2. Katalog Produk (CRUD)**:
  - Form tambah/edit perhiasan dengan 11 spesifikasi lengkap: Nama, Kategori, Varietas, Grade, Diameter mm, Rangka Logam, Harga, Stok, Asal Panen, Link Foto, Deskripsi.
  - Toolbar pencarian real-time dan filter kategori.
  - Tabel katalog aktif dengan tombol Edit dan Hapus.
- [x] **3. 5 Kategori Mutiara**:
  - Kartu monitoring 5 kategori perhiasan dengan jumlah produk aktif di masing-masing kategori.
  - Tombol navigasi instan untuk memfilter produk sesuai kategori yang dipilih.
- [x] **4. Stok Butir Mutiara**:
  - Banner peringatan otomatis jika ada stok mutiara yang menipis (<= 3 butir) atau habis.
  - Kontrol penyesuaian cepat tombol `+` dan `-` per butir mutiara yang langsung tersimpan ke sistem.
- [x] **5. Pesanan & Verifikasi Pembayaran**:
  - Filter pesanan: Semua, Menunggu Pembayaran, Lunas (`PAID`), Diproses Atelier, dan Dikirim.
  - Kotak pencarian pesanan berdasarkan ID, nama pembeli, atau nomor telepon.
  - Kartu pesanan lengkap dengan rincian barang, total biaya, kurir, dan alamat.
  - Tombol *"Konfirmasi Lunas (PAID)"* untuk memvalidasi pembayaran transfer pelanggan.
  - Pengubah status pengerjaan atelier Lombok (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `COMPLETED`).
  - Input nomor resi pengiriman berasuransi (otomatis terintegrasi ke pelacak pelanggan).
  - Tombol WhatsApp pesan langsung ke pembeli mengenai update status pesanan.
- [x] **6. WhatsApp Leads CRM**:
  - Tabel catatan seluruh calon pembeli yang menekan tombol konsultasi atau pemesanan WhatsApp.
  - Dropdown pengubah status follow-up: `NEW`, `CONTACTED`, `DEAL`, `CANCELLED`.
  - Tombol *"Buka Chat WA"* yang langsung menghubungkan staf butik ke percakapan WhatsApp calon pembeli.
  - Tombol *"+ Catat Lead Baru"* untuk memasukkan data calon pembeli offline secara manual.
- [x] **7. Daftar Pelanggan**:
  - Direktori seluruh pelanggan terdaftar beserta email, nomor WhatsApp, alamat pengiriman, dan akumulasi total belanja.
- [x] **8. Ulasan Pelanggan**:
  - Moderasi ulasan testimoni pembeli dengan rating bintang.
  - Tombol hapus ulasan jika tidak sesuai ketentuan butik.
- [x] **9. Admin Users (Khusus Super Admin)**:
  - Tabel seluruh staf administrator butik.
  - Formulir penambahan staf admin baru (Nama, Email, Peran: `ADMIN` atau `SUPER_ADMIN`).
  - Fitur ganti peran dan hapus staf admin (dengan proteksi tidak dapat menghapus akun sendiri).
- [x] **10. Laporan Finansial & Audit Logs (Khusus Super Admin)**:
  - Total Pendapatan Terverifikasi (`PAID`).
  - Nilai Rata-rata Pesanan (*Average Order Value* - AOV).
  - Total Butir Mutiara Terjual.
  - Tabel distribusi omset penjualan per 5 kategori mutiara.
  - Tabel Log Audit Sistem (mencatat waktu, email pengguna, peran, aksi operasi, dan detail perubahan).
- [x] **11. Pengaturan Gateway WhatsApp**:
  - Formulir konfigurasi nomor WhatsApp concierge butik (format internasional 62).
  - Alamat galeri & butik resmi Lombok.
  - Penutup pesan konfirmasi WhatsApp.
  - Pratinjau langsung (*Live Preview*) format invoice pesan WhatsApp.

---

## 4. Dokumentasi & Spesifikasi Sistem

- [x] **`PRD.md` (Product Requirements Document)**: Diperbarui penuh ke Versi 3.0.0 mencakup spesifikasi 20 halaman/modul, arsitektur sitemap, dan alur status ganda.
- [x] **`SYSTEM_DESIGN.md` (Spesifikasi Sistem Lengkap)**: Diperbarui dengan diagram arsitektur v3.0, class diagram, dan state diagram status pembayaran & pesanan.
- [x] **`walkthrough.md`**: Ringkasan implementasi dan panduan pengujian di browser.

---

## 5. Yang Belum / Rencana Lanjutan (Future Backlog / Fase Produksi)

Bagian ini mencakup fitur opsional untuk fase deployment live server / produksi komersial tingkat lanjut:

| Modul / Fitur | Status | Keterangan & Rencana Implementasi |
|---|:---:|---|
| **Backend API & Database Cloud** (PostgreSQL / Supabase / Node.js) | *Pending / Backlog* | Saat ini sistem menggunakan LocalStorage yang telah terintegrasi penuh. Jika butik ingin sinkronisasi multi-device antar komputer staf yang berbeda lokasi secara live tanpa LocalStorage bersama, dapat disambungkan ke REST API / Supabase. |
| **Integrasi WhatsApp Business Cloud API (Meta Webhook)** | *Pending / Backlog* | Saat ini integrasi menggunakan deep-link resmi `https://wa.me/` (100% bebas biaya langganan). Untuk pesan otomatis server-to-server bot tanpa perlu membuka aplikasi WhatsApp, diperlukan pendaftaran nomor resmi Meta Cloud API. |
| **Manajemen Banner Promo Dinamis di Admin** | *Pending / Backlog* | Saat ini banner promosi dan hero section dikelola melalui template HTML dengan desain luxury. Dapat ditambahkan form upload banner kustom di menu admin Settings jika diinginkan. |
| **Editor CMS Blog di Admin** | *Pending / Backlog* | Saat ini 4 artikel edukasi gemologi telah tertanam rapi di `blog.html` beserta modal baca interaktif. Form penambahan artikel blog baru langsung dari admin panel dapat ditambahkan di fase berikutnya. |
| **Deployment Custom Domain & SSL** | *Pending / Backlog* | Menghubungkan platform ke domain utama (contoh: `cdepearls.com`) dan subdomain admin privat (contoh: `admin.cdepearls.com`) di hosting cPanel/Vercel/Netlify. |

---

*Dokumen ini merupakan catatan status resmi pengerjaan platform CD'E Pearls Lombok v3.0.*
