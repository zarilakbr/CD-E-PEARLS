# 👑 CDE PEARLS LOMBOK — Platform Perhiasan Mutiara Air Laut Mewah

Aplikasi web eksklusif untuk **CDE Pearls Lombok** (South Sea Pearls Atelier), dirancang dengan presisi tinggi mengacu pada 4 artboard desain Figma. Proyek ini memisahkan secara profesional modul publik pelanggan (**Frontend**) dan modul manajemen butik (**Super Admin**), dengan integrasi sinkronisasi data *real-time* via `localStorage`.

---

## 📂 Struktur Folder Proyek yang Rapi & Terorganisir

```
d:\NGODING\CDEPearls/
├── index.html                  # Gerbang utama proyek (otomatis mengarahkan ke frontend/)
│
├── frontend/                   # Modul Customer Facing (Etalase Butik & Atelier Pelanggan)
│   ├── index.html              # Halaman Beranda, Edukasi Terroir Lombok & Katalog Mutiara
│   ├── customizer.html         # Studio Kustomisasi Perhiasan Mutiara Pribadi (4-Step Builder)
│   ├── cart.html               # Keranjang Belanja, Kupon Diskon & Checkout Direct WhatsApp
│   │
│   ├── css/
│   │   ├── style.css           # Desain sistem mewah (Palet ivory, emas, bronze, tipografi serif)
│   │   ├── customizer.css      # Styling khusus stepper, visualizer render, live price calculator
│   │   └── cart.css            # Styling keranjang, form pemesan & modal sertifikat keaslian
│   │
│   └── js/
│       ├── store.js            # Central Store & Sinkronisasi data antar-halaman & Super Admin
│       ├── main.js             # Logika etalase katalog, filter kategori, wishlist, modal detail
│       ├── customizer.js       # Logika 4 tahap kustomisasi, kalkulasi harga & visualizer dinamis
│       └── cart.js             # Logika keranjang, diskon kupon, validasi & WhatsApp invoice generator
│
├── admin/                      # Modul Super Admin Independen (Pusat Kontrol Butik & POS)
│   ├── index.html              # Portal Eksekutif Super Admin (Dashboard, Inventaris & Pesanan)
│   ├── css/
│   │   └── admin.css           # Styling dashboard eksekutif, tabel data, modal & status badges
│   └── js/
│       └── admin.js            # CRUD produk live, manajemen stok, pelacak status & gateway WhatsApp
│
└── README.md                   # Dokumentasi lengkap proyek dan panduan pengoperasian
```

---

## 💎 Fitur Utama Sesuai 4 Artboard Figma

### 1. Studio Kustomisasi Perhiasan Mutiara Pribadi (`frontend/customizer.html`)
- **4-Step Wizard Stepper**:
  - **Tahap 1**: Pilih Basis Perhiasan (Cincin Solitaire, Kalung Liontin, Gelang Rantai, Anting Drop, Bros Kebaya).
  - **Tahap 2**: Pilih Mutiara Lombok Asli (Lombok Golden South Sea AAA, Silvery White AAA, Tahitian Peacock Black AAA, Champagne South Sea AA+) beserta slider diameter butir (9 mm - 14 mm).
  - **Tahap 3**: Pilih Bahan Logam Mulia (Solid Yellow Gold 18K 750, Emas Putih 18K + Rhodium, Rose Gold 18K, Perak 925 Berlapis Emas Putih).
  - **Tahap 4**: Ukuran Jari / Panjang Rantai & Grafir Nama Khusus (Gratis).
- **Dynamic Simulated 3D Visualizer**: Merender perubahan bentuk perhiasan, rona logam mulia, dan gradasi kemilau mutiara secara visual dan instan saat opsi dipilih.
- **Kalkulator Biaya Real-time**: Mengalkulasi harga rangka logam, butir mutiara terskala diameter, ongkos atelier (gratis), dan sertifikat lab.
- **Pesan Custom Sekali Klik**: Desain langsung tersimpan ke keranjang belanja lengkap dengan rincian spesifikasinya.

### 2. Beranda Mewah & Katalog Mutiara Lombok (`frontend/index.html`)
- **Hero Banner Sinematik**: *"Born from Pristine Lombok Waters, Hand-Knotted for Generations"*.
- **Filter Kategori Cepat**: Semua Koleksi, Kalung, Cincin, Gelang, Anting, Bros.
- **Kartu Perhiasan Interaktif**: Menampilkan grade mutiara, asal perairan Lombok, kadar logam, foto resolusi tinggi, tombol Wishlist, dan Tambah ke Keranjang.
- **Edukasi "The Anatomy of a CDE Pearl & Lombok Terroir"**: 6 kartu pilar keunggulan (Ketebalan Nacre Alami, Deep Metallic Luster, Simetri Bulat, Panen Berkelanjutan Lombok, Sertifikat Laboratorium Resmi, Pengerjaan Atelier Terampil).
- **Banner Konsultasi WhatsApp Pribadi**: Terhubung langsung ke concierge butik untuk konsultasi desain kustom.

### 3. Pusat Kontrol Super Admin (`admin/index.html`)
- **Terpisah Secara Independen**: Folder dan sistem terisolasi dari antarmuka pelanggan.
- **4 Kartu Metrik KPI Bisnis**:
  - Total Omset Penjualan (terhitung dinamis dari total pesanan)
  - Jumlah Pesanan Masuk (update live)
  - Total Koleksi Aktif di Katalog
  - Total Stok Butir Mutiara Tersedia
- **Form Manajemen & Tambah Koleksi**: Input Nama, Kategori, Grade Mutiara, Jenis Logam, Harga Jual, Stok, Asal Perairan, URL Gambar, dan Deskripsi Gemologi. Mendukung mode Tambah dan Edit Produk.
- **Tabel Inventaris Katalog**: Pencarian instan (search bar), filter kategori, badge stok (*Tersedia*, *Menipis*, *Habis*), tombol Edit dan Hapus. Perubahan di sini langsung tampil di etalase pembeli!
- **Pelacak Pesanan WhatsApp & Custom Atelier**:
  - Daftar pesanan masuk dengan status: *Menunggu Konfirmasi*, *Proses Atelier Lombok*, *QC & Sertifikasi*, *Siap Kirim / Resi*, *Selesai*.
  - Tombol aksi sekali klik untuk menghubungi pemesan langsung via WhatsApp.
  - Input nomor resi ekspedisi berasuransi saat status diubah ke pengiriman.
- **Pengaturan Gateway WhatsApp**: Konfigurasi nomor WhatsApp concierge resmi dan template pesan otomatis dengan pratinjau live box.

### 4. Keranjang Belanja & Direct WhatsApp Checkout (`frontend/cart.html`)
- **Manajemen Keranjang**: Ubah kuantitas, hapus item, dan pratinjau spesifikasi kustom.
- **Sistem Kupon Diskon**: Coba gunakan kupon promo `LOMBOK10` (Diskon 10%) atau `CDEVIP` (Diskon 15%).
- **Form Pemesan Terintegrasi**: Nama Lengkap, Nomor WhatsApp, Alamat Tujuan di Indonesia, Pilihan Kurir Berasuransi (JNE YES, TiKi ONS, Paxel), dan Catatan Khusus.
- **Direct WhatsApp Checkout Invoice**: Menghasilkan format pesan invoice rapi siap kirim ke WhatsApp CDE Pearls dengan nomor pesanan resmi (cth: `CDE-2026-XXXX`).
- **Modal Sertifikat Keaslian Gemologis**: Tampilan sertifikat resmi dengan nomor seri terdaftar, stempel emas atelier, dan jaminan mutiara Lombok.

---

## 🚀 Cara Menjalankan

Aplikasi ini berbasis Vanilla Web Standards (HTML5, CSS3 murni, dan JavaScript modern) tanpa dependensi runtime atau kompilasi build yang rumit:

1. **Buka Langsung di Browser**:
   - Klik ganda file [index.html](file:///d:/NGODING/CDEPearls/index.html) untuk masuk ke etalase toko.
   - Atau langsung buka [frontend/index.html](file:///d:/NGODING/CDEPearls/frontend/index.html) untuk toko pelanggan.
   - Buka [admin/index.html](file:///d:/NGODING/CDEPearls/admin/index.html) untuk mengakses Pusat Kontrol Super Admin.

2. **Menjalankan via Local Dev Server (Opsional)**:
   - Jika menggunakan VS Code / Antigravity, klik kanan `frontend/index.html` dan pilih **Open with Live Server**.
   - Atau menggunakan Python:
     ```bash
     python -m http.server 3000
     ```
     Lalu buka `http://localhost:3000` di peramban web Anda.

---
*© 2026 CDE Pearls Lombok — Genuine South Sea Pearls Atelier.*
