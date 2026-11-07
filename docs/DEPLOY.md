# Panduan Deploy Produksi CD'E Pearls Lombok

Dokumen ini menjelaskan tata cara deployment aplikasi **CD'E Pearls Lombok** (Laravel API + React 19 Vite SPA Frontend) ke lingkungan produksi **Hostinger** (hPanel / Cloud Hosting / VPS) dan **Cloudflare** dengan arsitektur MySQL / MariaDB yang aman dan teruji.

---

## 1. Arsitektur Produksi

```
[ Klien / Browser Web ]
       │
       ├─── https://cdepearlslombok.id ─────────► [ Cloudflare Pages / Hostinger CDN ]
       │                                            (React 19 + Vite TypeScript SPA)
       │
       └─── https://api.cdepearlslombok.id/api/v1 ─► [ Hostinger hPanel ]
                                                     (Laravel 12/13 + PHP 8.4)
                                                                 │
                                                                 ▼
                                                    [ MySQL 8.0+ / MariaDB 10.11+ ]
```

---

## 2. Struktur Direktori & Keamanan Server (Di Luar `public_html`)

Demi menjaga keamanan kode sumber dan berkas konfigurasi sensitif (`.env`, log, storage internal), repositori aplikasi **wajib diletakkan di luar `public_html`**.

### Hierarki Folder di Server Hostinger:
```
/home/USERNAME/
├── cdepearls/                         <-- Direktori repositori (DI LUAR public_html)
│   ├── backend/
│   │   ├── app/
│   │   ├── config/
│   │   ├── public/                    <-- Document root asli backend
│   │   │   ├── index.php
│   │   │   └── storage/               <-- Symlink ke ../storage/app/public
│   │   ├── storage/
│   │   │   └── app/public/products/   <-- Penyimpanan asli gambar produk & WebP
│   │   ├── .env
│   │   └── artisan
│   └── frontend/
└── public_html/
    └── api -> /home/USERNAME/cdepearls/backend/public  <-- Symlink publik
```

### Pembuatan Symlink `public_html/api`:
Jalankan melalui SSH terminal server:
```bash
ln -sfn /home/USERNAME/cdepearls/backend/public /home/USERNAME/public_html/api
```
Dengan struktur ini, pengunjung web yang mengakses `https://api.cdepearlslombok.id` hanya dapat menjangkau berkas publik di `backend/public/`, sementara kode sumber dan database terlindung di luar root web.

---

## 3. Persiapan Binary PHP 8.4 & Composer di Hostinger

Hostinger menyediakan binary PHP versi terbaru pada path CloudLinux / Alt-PHP:

- **Path Eksekusi PHP 8.4**:
  ```bash
  /opt/alt/php84/usr/bin/php
  ```

- **Menjalankan Composer dengan PHP 8.4**:
  ```bash
  /opt/alt/php84/usr/bin/php $(which composer) install --no-dev --optimize-autoloader
  ```

---

## 4. Persiapan Database MySQL / MariaDB

1. Masuk ke **Hostinger hPanel** -> **Databases** -> **MySQL Databases**.
2. Buat database baru dan pengguna database (misal `u123456789_cde`).
3. Tetapkan kata sandi database yang kuat dan catat nama database, username, dan password untuk konfigurasi `.env`.

---

## 5. Konfigurasi Backend (`backend/.env`)

Salin berkas contoh konfigurasi di folder `backend/`:
```bash
cp /home/USERNAME/cdepearls/backend/.env.example /home/USERNAME/cdepearls/backend/.env
```

Sesuaikan parameter berikut pada berkas `backend/.env` (jangan pernah membagikan atau mengunggah berkas ini ke repositori publik):

```env
APP_NAME="CD'E Pearls Lombok"
APP_ENV=production
APP_KEY=base64:GENERATE_DENGAN_ARTISAN_KEY_GENERATE
APP_DEBUG=false
APP_URL=https://api.cdepearlslombok.id
FRONTEND_URL=https://cdepearlslombok.id

# MySQL / MariaDB (Hostinger hPanel)
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

# Keamanan Password (Bcrypt Cost 12)
BCRYPT_ROUNDS=12

# File Storage
FILESYSTEM_DISK=public

# Konfigurasi Email Notifikasi
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=info@cdepearlslombok.id
MAIL_PASSWORD=YOUR_EMAIL_PASSWORD
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="info@cdepearlslombok.id"
MAIL_FROM_NAME="CD'E Pearls Lombok"

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=YOUR_CLOUDFLARE_TURNSTILE_SECRET_KEY

# Google OAuth 2.0
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI="${APP_URL}/api/v1/auth/google/callback"

# Proteksi Katalog Awal Produksi (Tanpa Produk Tiruan)
SEED_TEST_PRODUCTS=false
```

---

## 6. Symlink Storage Manual (`ln -sfn`)

> [!IMPORTANT]
> Pada paket shared hosting Hostinger, fungsi PHP `exec` dan `shell_exec` dinonaktifkan secara bawaan demi keamanan. Akibatnya, perintah `php artisan storage:link` akan gagal.
> 
> Solusinya adalah membuat symlink storage secara manual melalui SSH terminal:

```bash
# Masuk ke direktori backend
cd /home/USERNAME/cdepearls/backend

# Buat symlink dari storage/app/public ke public/storage
ln -sfn /home/USERNAME/cdepearls/backend/storage/app/public /home/USERNAME/cdepearls/backend/public/storage
```

Verifikasi pembuatan symlink:
```bash
ls -la /home/USERNAME/cdepearls/backend/public/storage
# Harus menunjuk ke /home/USERNAME/cdepearls/backend/storage/app/public
```

---

## 7. Inisialisasi & Optimasi Laravel (via PHP 8.4)

Jalankan perintah inisialisasi menggunakan binary PHP 8.4:

```bash
cd /home/USERNAME/cdepearls/backend

# 1. Generate App Key (bila belum)
/opt/alt/php84/usr/bin/php artisan key:generate --force

# 2. Migrasi Database
/opt/alt/php84/usr/bin/php artisan migrate --force

# 3. Optimasi Cache Konfigurasi & Rute
/opt/alt/php84/usr/bin/php artisan config:cache
/opt/alt/php84/usr/bin/php artisan route:cache
/opt/alt/php84/usr/bin/php artisan view:cache
```

---

## 8. Konfigurasi Cron Job Laravel Scheduler (Tiap Menit)

Laravel Scheduler bertugas menangani pembersihan pesanan kedaluwarsa, pembatalan reservasi stok yang tidak dibayar, dan sinkronisasi berkala.

1. Buka **Hostinger hPanel** -> **Advanced** -> **Cron Jobs**.
2. Pilih jenis jadwal: **Custom**.
3. Atur frekuensi setiap menit: `* * * * *`.
4. Masukkan baris perintah berikut:
   ```bash
   * * * * * /opt/alt/php84/usr/bin/php /home/USERNAME/cdepearls/backend/artisan schedule:run >> /dev/null 2>&1
   ```
5. Simpan pengaturan Cron Job.

---

## 9. Aturan Unggah Gambar Produk & Konversi WebP

Sistem backend mengimplementasikan kebijakan ketat untuk manajemen citra:
- **Otorisasi**: Hanya peran `admin` atau `spi` yang diizinkan mengunggah (pelanggan ditolak HTTP 403).
- **Validasi Dimensi & Format**:
  - Format didukung: `jpg`, `jpeg`, `png`, `webp`.
  - Ukuran file maksimum: `5 MB`.
  - **Dimensi maksimum**: Gambar dengan dimensi melebihi **4000 piksel** pada sisi terpanjang langsung ditolak dengan pesan galat bahasa Indonesia yang jelas: `Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.` (HTTP 422).
  - Gambar dengan dimensi tepat 4000 piksel atau lebih kecil diterima secara normal.
- **Pembersihan EXIF & Konversi WebP Otomatis**:
  - Metadata sensitif (informasi lokasi kamera/GPS) dibersihkan.
  - Setiap berkas JPG atau PNG yang diunggah otomatis dibuatkan berkas pendamping berformat `.webp` berkinerja tinggi pada direktori `storage/products/`.
  - Menghapus atau mengganti foto produk otomatis membersihkan berkas utama beserta berkas pendamping `.webp`-nya dari disk.

---

## 10. Kebijakan Keamanan Autentikasi (Anti-Enumeration)

1. **Respons Seragam Kredensial**:
   - Kata sandi salah untuk email terdaftar maupun email belum terdaftar menghasilkan respon **HTTP 401** seragam: `Email atau kata sandi tidak valid. Silakan periksa kembali.` (mencegah penyerang mendeteksi keberadaan akun pengguna).
   - Status akun belum diverifikasi (**HTTP 403 `ACCOUNT_UNVERIFIED`**) hanya dikembalikan **setelah kata sandi diverifikasi benar**.
2. **Pencegahan DoS Penguncian Akun**:
   - Kegagalan kata sandi tidak mengunci akun di level database (`locked_until` tetap `null`).
   - Rate limiting dikelola secara terisolasi via cache per-IP dan per-kombinasi email+IP (HTTP 429), melindungi pengguna sah dari serangan penolakan layanan (Denial of Service).
3. **Standar Password**: Pendaftaran dan pembaruan kata sandi mewajibkan minimal 12 karakter.

---

## 11. Endpoint Health Check Publik

Backend menyediakan endpoint pemantauan status sistem:
- **URL**: `GET https://api.cdepearlslombok.id/api/v1/health`
- **Autentikasi**: Terbuka publik tanpa otorisasi.
- **Respon Normal (HTTP 200)**:
  ```json
  {"status":"ok"}
  ```
- **Respon Gangguan Database (HTTP 503)**:
  ```json
  {"status":"degraded"}
  ```
- Tidak mengekspos field database internal, latency ms, maupun timestamp ke publik.

---

## 12. Deploy Frontend ke Cloudflare Pages

1. **Pengaturan Repositori di Cloudflare Dashboard**:
   - Framework preset: `Vite`
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
2. **Variabel Lingkungan Build (Cloudflare Environment Variables)**:
   - `VITE_API_URL`: `https://api.cdepearlslombok.id/api/v1`
   - `VITE_TURNSTILE_SITE_KEY`: Site key Cloudflare Turnstile resmi untuk domain `cdepearlslombok.id`.
3. **SPA Routing**:
   Pastikan file `public/_headers` atau rewrite rule Cloudflare mengarahkan seluruh rute non-aset ke `/index.html`.

---

## 13. Verifikasi Pasca Deploy

Jalankan pengujian backend otomatis di server melalui SSH:
```bash
/opt/alt/php84/usr/bin/php -d memory_limit=512M artisan test
```
Pastikan seluruh 141 pengujian berstatus **PASSED** (100% hijau di lingkungan MySQL/MariaDB).
