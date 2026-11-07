# Panduan Deploy Produksi CD'E Pearls Lombok

Dokumen ini menjelaskan tata cara deployment aplikasi **CD'E Pearls Lombok** (Laravel 12/13 API + React 19 Vite TypeScript Frontend) ke lingkungan produksi Hostinger (hPanel / Cloud / VPS) dan Cloudflare dengan arsitektur MySQL/MariaDB berkinerja tinggi.

---

## 1. Arsitektur Produksi

```
[ Klien / Browser Web ]
       │
       ├─── https://cdepearlslombok.id ─────────► [ Cloudflare Pages / Hostinger CDN ]
       │                                            (React 19 + Vite SPA)
       │
       └─── https://api.cdepearlslombok.id/api/v1 ─► [ Hostinger hPanel / VPS Ubuntu ]
                                                     (Laravel 12/13 + PHP 8.3/8.4)
                                                                 │
                                                                 ▼
                                                    [ MySQL 8.0+ / MariaDB 10.11+ ]
```

---

## 2. Persiapan Database MySQL / MariaDB (Hostinger hPanel)

1. **Buat Database via hPanel**:
   - Masuk ke **Hostinger hPanel** -> **Databases** -> **MySQL Databases**.
   - Buat nama database baru (misal `u123456789_cde`) dan username (`u123456789_admin`).
   - Masukkan kata sandi database yang kuat.

2. **Karakter dan Kolasi**:
   - Database otomatis menggunakan `utf8mb4` dengan kolasi `utf8mb4_unicode_ci` untuk mendukung karakter internasional dan simbol gemologi mutiara.

---

## 3. Konfigurasi Backend (`backend/.env`)

Salin `backend/.env.example` ke `backend/.env` pada server produksi dan sesuaikan nilai berikut:

```env
APP_NAME="CD'E Pearls Lombok"
APP_ENV=production
APP_KEY=base64:vXqVj294/97yHN+FVs2C0WlXjIu0AZWAVzXXDkATZ1E=
APP_DEBUG=false
APP_URL=https://api.cdepearlslombok.id
FRONTEND_URL=https://cdepearlslombok.id

# MySQL / MariaDB Connection (Hostinger hPanel)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u123456789_cde
DB_USERNAME=u123456789_admin
DB_PASSWORD=YOUR_STRONG_PASSWORD

# Sanctum Stateful Cookies & Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=.cdepearlslombok.id
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS="cdepearlslombok.id,www.cdepearlslombok.id"

# Bcrypt Cost Security
BCRYPT_ROUNDS=12

# File Storage (Produk & Sertifikat Mutiara)
FILESYSTEM_DISK=public

# Mail Notification
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=YOUR_SENDGRID_KEY
MAIL_FROM_ADDRESS="info@cdepearlslombok.id"
MAIL_FROM_NAME="CD'E Pearls Lombok"

# Seed Accounts Setup (Force Change Password on First Login)
SEED_USER_EMAIL="siti.rahma@gmail.com"
SEED_USER_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
SEED_ADMIN_EMAIL="admin@cdepearls.com"
SEED_ADMIN_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
SEED_SPI_EMAIL="owner.spi@cdepearls.com"
SEED_SPI_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
SEED_TEST_PRODUCTS=false
```

Jalankan perintah inisialisasi Laravel melalui SSH atau terminal hPanel:
```bash
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> [!NOTE]
> `SEED_TEST_PRODUCTS=false` memastikan katalog di produksi dimulai dalam keadaan bersih (0 produk uji), data katalog hanya bersumber dari entri nyata via portal Admin.

---

## 4. Deploy Backend ke Hostinger (hPanel / VPS)

1. **Deployment Otomatis via Git di hPanel**:
   - Masuk ke **hPanel** -> **Advanced** -> **Git**.
   - Masukkan URL Repositori: `https://github.com/OWNER/CDEPearls.git`.
   - Pilih Cabang: `main`.
   - Direktori Instalasi: `public_html/api` (atau subdirektori terkait).
   - Klik **Create & Deploy**.

2. **Konfigurasi Web Server (Apache `.htaccess` / Nginx)**:
   - Pastikan document root mengarah ke folder `backend/public/`.
   - Pastikan modul PHP `pdo_mysql`, `gd`, `fileinfo`, `mbstring`, dan `openssl` aktif di menu **PHP Configuration > PHP Extensions**.

3. **Symlink Storage Publik**:
   ```bash
   php artisan storage:link
   ```
   Aset foto produk dan versi WebP akan tersimpan di `storage/app/public/products` dan dapat diakses publik via `/storage/products/...`.

4. **Health Check Publik**:
   - Endpoint: `GET https://api.cdepearlslombok.id/api/v1/health`
   - Respon standar: `{"status":"ok"}` (HTTP 200).
   - Bila koneksi database terganggu, merespons `{"status":"degraded"}` (HTTP 503).

---

## 5. Deploy Frontend ke Cloudflare Pages / Hostinger CDN

### A. Build Configuration di Cloudflare Dashboard
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### B. Variabel Lingkungan Build
Variabel berikut wajib diisi pada dashboard Cloudflare (Settings > Environment variables):
- `VITE_API_URL`: `https://api.cdepearlslombok.id/api/v1`
- `VITE_TURNSTILE_SITE_KEY`: Site key widget Cloudflare Turnstile yang terdaftar untuk domain `cdepearlslombok.id`.

### C. Pengaturan SPA Routing (`_routes.json` / `_headers`)
Pastikan rewrite SPA aktif agar seluruh rute (`/katalog`, `/admin`, `/spi`, `/akun`) diarahkan ke `index.html`.

---

## 6. Ketentuan Unggah & Pemrosesan Gambar Produk

Sistem backend mengimplementasikan proteksi ketat untuk berkas gambar produk:
1. **Otorisasi**: Hanya akun dengan peran `admin` atau `spi` yang diizinkan mengunggah gambar produk (pengguna biasa menerima 403 Forbidden).
2. **Validasi**:
   - Ekstensi diizinkan: `jpg`, `jpeg`, `png`, `webp`.
   - Ukuran maksimum: `5 MB` (`max:5120`).
   - Dimensi maksimum: `4000 px` pada sisi terpanjang (`dimensions:max_width=4000,max_height=4000`).
3. **Pembersihan EXIF & Konversi WebP Otomatis**:
   - Metadata sensitif (lokasi GPS, model kamera) dibersihkan menggunakan pemrosesan ulang citra via GD library.
   - Setiap berkas JPG atau PNG yang diunggah otomatis dibuatkan berkas pendamping berformat `.webp` berkinerja tinggi.
   - Mengganti atau menghapus produk otomatis membersihkan berkas gambar lama beserta berkas `.webp` pendampingnya dari disk publik.

---

## 7. Kebijakan Keamanan Login (Anti-Enumeration & Anti-DoS)

1. **Respons Seragam Kredensial (Anti-Enumeration)**:
   - Salah sandi untuk email yang terdaftar maupun email yang belum terdaftar menghasilkan respon **HTTP 401** seragam: `Email atau kata sandi tidak valid. Silakan periksa kembali.`.
   - Status akun belum diverifikasi (**HTTP 403 `ACCOUNT_UNVERIFIED`**) hanya dikembalikan **setelah kata sandi diverifikasi benar**.
2. **Pencegahan DoS Penguncian Akun**:
   - Kegagalan kata sandi tidak lagi mengunci baris pengguna di tabel `users` (`locked_until` tetap `null`).
   - Pembatasan brute-force dikelola murni via cache rate limiter per-IP dan per-kombinasi email+IP (HTTP 429). Penyerang dari IP tertentu tidak dapat melumpuhkan akses pengguna sah dari perangkat/IP lain.
3. **Standar Sandi**: Seluruh pendaftaran dan pembaruan sandi mewajibkan minimal 12 karakter.

---

## 8. Verifikasi Pasca Deploy

1. Jalankan pengujian backend otomatis di server:
   ```bash
   php -d memory_limit=512M artisan test
   ```
   Pastikan seluruh 140 pengujian fitur (Autentikasi, RBAC, Otorisasi SPI, Unggah Gambar WebP, Health Check, Race Condition Stok Paralel MySQL) berstatus **PASSED**.

2. Jalankan pemeriksaan health check:
   ```bash
   curl -i https://api.cdepearlslombok.id/api/v1/health
   ```
   Respon yang diharapkan:
   ```http
   HTTP/2 200
   content-type: application/json

   {"status":"ok"}
   ```

3. Jalankan pengujian frontend:
   ```bash
   npm test -- --run
   ```
   Pastikan seluruh pengujian Vitest dan Playwright berstatus hijau.
