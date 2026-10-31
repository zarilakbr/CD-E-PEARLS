# 👑 CD'E PEARLS LOMBOK
### Platform E-Commerce & Atelier Perhiasan Mutiara Samudera (*South Sea Pearls*)

Platform digital terpadu untuk **CD'E Pearls Lombok**, memadukan estetika perhiasan mewah bertaraf internasional dengan visualizer 3D WebGL (Three.js), Customer Portal (`/akun`), Admin Portal (`/admin`), dan portal pengawasan khusus **Satuan Pengawas Internal (SPI)** (`/spi`) yang terisolasi dengan Role-Based Access Control (RBAC) ketat dan alur persetujuan (*Four-Eyes Principle*).

---

## 🏛️ Arsitektur Tiga Peran & Hak Akses

| Peran Pengguna | Jalur Route | Hak Akses Utama | Alur Otorisasi Sensitif |
| :--- | :--- | :--- | :--- |
| **Pelanggan** (`user`) | `/akun` | Riwayat pesanan sendiri, alamat pengiriman, checkout | - |
| **Admin** (`admin`) | `/admin` | Manajemen katalog, stok, update pesanan, data pembeli | Aksi sensitif (ubah harga >10%, hapus produk, batal order) wajib diajukan ke SPI |
| **SPI** (`spi`) | `/spi` & `/admin` | Ringkasan KPI, Log Aktivitas (append-only), Antrean Persetujuan, Tata Kelola Staf, Laporan Audit | Memiliki hak super-admin untuk menyetujui, menolak, atau mengeksekusi langsung |

---

## 🛠️ Tech Stack

- **Backend**: Laravel 12/13 (PHP 8.3+), PostgreSQL (Produksi) / SQLite (Dev & Test), Laravel Sanctum (Cookie SPA & Bearer Token), Pest PHP testing framework.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, React Hook Form, Zod, Recharts, Lucide Icons, Three.js 3D WebGL Studio.
- **Palet Warna Luxury**: Ivory (`#FBF8F3`), Champagne (`#F3EBDD`), Blush (`#F1E4DC`), Navy (`#12263A`), Emas (`#8A6A2F` & `#D9B877`).
- **Tipografi**: *Cormorant Garamond* (Judul & Angka KPI), *Jost* (Teks isi).

---

## 🚀 Panduan Menjalankan Sistem Lokal

### 1. Backend (Laravel API)
```bash
cd backend

# Salin konfigurasi environment
cp .env.example .env

# Jalankan migrasi dan seeding data resmi
php artisan migrate:fresh --seed

# Jalankan automated tests (Pest)
php vendor/bin/pest

# Jalankan web server Laravel
php artisan serve --port=8000
```

### 2. Frontend (React Vite SPA)
```bash
cd frontend

# Install dependensi
npm install

# Jalankan development server dengan Vite proxy ke http://127.0.0.1:8000
npm run dev

# Build produksi dengan code-splitting
npm run build
```

---

## 📱 Panduan Pengujian Langsung di Ponsel Fisik (LAN / Wi-Fi)

Agar animasi, tata letak marketplace mobile, safe-area, dan interaksi sentuhan dapat diuji langsung dari browser HP pada jaringan Wi-Fi lokal yang sama:

1. **Jalankan Frontend dengan Expose Host**:
   ```bash
   cd frontend
   npm run dev -- --host 0.0.0.0
   ```
2. **Konfigurasi Alamat IP Laptop (Bukan `localhost`)**:
   - Cari IP lokal laptop Anda (misal: `192.168.1.50` via `ipconfig` pada Windows).
   - Di `frontend/.env.development` (atau konfigurasi runtime), arahkan:
     ```env
     VITE_API_URL=http://192.168.1.50:8000
     ```
3. **Konfigurasi Backend Laravel**:
   - Di `backend/.env`, tambahkan IP lokal laptop ke whitelist Sanctum dan CORS:
     ```env
     SANCTUM_STATEFUL_DOMAINS=192.168.1.50:5173,localhost:5173,127.0.0.1:5173
     CORS_ALLOWED_ORIGINS=http://192.168.1.50:5173,http://localhost:5173,http://127.0.0.1:5173
     ```
   - Jalankan backend dengan binding host lokal:
     ```bash
     cd backend
     php artisan serve --host=0.0.0.0 --port=8000
     ```
4. **Buka di Browser Ponsel**:
   Akses `http://192.168.1.50:5173` di Safari iOS atau Chrome Android. Semua animasi sentuhan (`touch-feedback`), dialog filter Sheet, bottom tab bar, dan efek blur header akan aktif secara native.

---

## 🔑 Akun Bawaan Seeder Resmi

Akun disemai secara otomatis dari variabel lingkungan `.env` lokal Anda:

| Peran | Email | Kata Sandi | Portal Akses |
| :--- | :--- | :--- | :--- |
| **Pelanggan** | `siti.rahma@gmail.com` | *Dikonfigurasi di `.env` lokal* (`SEED_USER_PASSWORD`) | `/akun` |
| **Admin** | `admin@cdepearls.com` | *Dikonfigurasi di `.env` lokal* (`SEED_ADMIN_PASSWORD`) | `/admin` |
| **SPI** | `owner.spi@cdepearls.com` | *Dikonfigurasi di `.env` lokal* (`SEED_SPI_PASSWORD`) | `/spi` & `/admin` |

---

## 📑 Panduan Deployment Produksi

Dokumentasi lengkap tata cara deployment ke **Railway** (Backend + Managed PostgreSQL) dan **Vercel** (Frontend SPA) tersedia di [docs/DEPLOY.md](docs/DEPLOY.md).
