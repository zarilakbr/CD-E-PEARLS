# Panduan Deploy Produksi CD'E Pearls Lombok

Dokumen ini menjelaskan tata cara deployment aplikasi **CD'E Pearls Lombok** (Laravel 12/13 API + React Vite TypeScript Frontend) ke lingkungan produksi menggunakan arsitektur modern berkinerja tinggi.

---

## 1. Arsitektur Produksi

```
[ Klien / Browser Web ]
       │
       ├─── https://cdepearls.com ────────────► [ Vercel / Cloudflare ]
       │                                         (React 19 + Vite SPA)
       │
       └─── https://api.cdepearls.com/api/v1 ─► [ Railway / VPS Ubuntu ]
                                                 (Laravel 12/13 + PHP 8.3+)
                                                             │
                                                             ▼
                                                [ Managed PostgreSQL 16 ]
```

---

## 2. Persiapan Database PostgreSQL

1. **Buat Database PostgreSQL**:
   ```sql
   CREATE DATABASE cde_pearls;
   CREATE USER cde_admin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DATABASE_PASSWORD';
   GRANT ALL PRIVILEGES ON DATABASE cde_pearls TO cde_admin;
   ```

2. **Ekstensi UUID (Opsional / Otomatis)**:
   Laravel schema generator secara otomatis mengelola UUID tanpa membutuhkan dependensi manual eksternal.

---

## 3. Konfigurasi Backend (`backend/.env`)

Salin `backend/.env.example` ke `backend/.env` pada server produksi dan sesuaikan nilai berikut:

```env
APP_NAME="CD'E Pearls Lombok"
APP_ENV=production
APP_KEY=base64:vXqVj294/97yHN+FVs2C0WlXjIu0AZWAVzXXDkATZ1E=
APP_DEBUG=false
APP_URL=https://api.cdepearls.com
FRONTEND_URL=https://cdepearls.com

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
SESSION_DOMAIN=.cdepearls.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS="cdepearls.com,www.cdepearls.com"

# Bcrypt Cost Security
BCRYPT_ROUNDS=12

# File Storage
FILESYSTEM_DISK=public

# Mail Notification
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=YOUR_SENDGRID_KEY
MAIL_FROM_ADDRESS="info@cdepearls.com"
MAIL_FROM_NAME="CD'E Pearls Lombok"

# Seed Accounts Setup (Force Change Password on First Login)
SEED_USER_EMAIL="siti.rahma@gmail.com"
SEED_USER_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
SEED_ADMIN_EMAIL="admin@cdepearls.com"
SEED_ADMIN_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
SEED_SPI_EMAIL="owner.spi@cdepearls.com"
SEED_SPI_PASSWORD="[GENERATE_HIGH_ENTROPY_RANDOM_PASSWORD]"
```

Jalankan perintah inisialisasi Laravel:
```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 4. Deploy Backend ke Railway

1. Hubungkan repositori GitHub ke **Railway.app**.
2. Tambahkan **PostgreSQL Plugin** dari dashboard Railway.
3. Sambungkan variabel database Railway ke konfigurasi `backend/.env`.
4. Tambahkan `Nixpacks` build configuration atau `Procfile` di folder `backend/`:
   ```Procfile
   web: php artisan serve --host=0.0.0.0 --port=$PORT
   ```
   Atau untuk Nginx + PHP-FPM:
   ```bash
   php artisan migrate --force && php artisan config:cache && php artisan route:cache
   ```
5. Set Healthcheck path ke `/up` atau `/api/v1/settings`.

---

## 5. Deploy Frontend ke Vercel

1. Hubungkan folder `frontend` ke **Vercel**.
2. Konfigurasi Proyek di Vercel:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Konfigurasi `vercel.json` untuk SPA Rewrite:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://api.cdepearls.com/api/$1" },
       { "source": "/sanctum/(.*)", "destination": "https://api.cdepearls.com/sanctum/$1" },
       { "source": "/storage/(.*)", "destination": "https://api.cdepearls.com/storage/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
4. Variabel Lingkungan di Vercel:
   - `VITE_API_URL`: `https://api.cdepearls.com/api/v1`

---

## 5B. Deploy Frontend ke Cloudflare Pages / Workers

Untuk deployment frontend ke Cloudflare (Workers Static Assets / Cloudflare Pages):

### A. Build Configuration di Cloudflare Dashboard
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### B. Variabel Lingkungan Build (Cloudflare Build Variables)
Variabel berikut wajib diisi di dashboard Cloudflare (Settings > Environment variables / Build variables):
- `VITE_API_URL`: Endpoint basis API backend (contoh: `https://api.cdepearls.com/api/v1`).
- `VITE_TURNSTILE_SITE_KEY`: Site key widget Cloudflare Turnstile yang terdaftar untuk domain frontend.

> [!NOTE]
> Variabel berawalan `VITE_*` dibaca saat proses kompilasi (`npm run build`) dan tertanam langsung ke dalam aset statis JavaScript/HTML.

### C. Konfigurasi Backend Terkait
Di sisi backend (`backend/.env`), pastikan variabel berikut diselaraskan:
- `FRONTEND_URL`: URL publik frontend (misal `https://cdepearlslombok.workers.dev` atau `https://cdepearls.com`).
- **Origin CORS**: Origin frontend wajib diizinkan di middleware CORS backend (misal via `cors.php` atau `SANCTUM_STATEFUL_DOMAINS` / `CORS_ALLOWED_ORIGINS`).
- `GOOGLE_REDIRECT_URI`: URI callback OAuth Google (`${APP_URL}/api/v1/auth/google/callback`).
- **Hostname Turnstile**: Tambahkan domain frontend ke daftar domain yang diizinkan pada dashboard Cloudflare Turnstile.

### D. Arsitektur Autentikasi: Bearer Token vs Cookie Sesi
Aplikasi ini menggunakan autentikasi **Bearer Token (Laravel Sanctum Personal Access Token)**:
- Token disimpan di `localStorage` peramban klien dan dikirimkan pada setiap panggilan API via header `Authorization: Bearer <token>`.
- Karena tidak bergantung pada cookie sesi stateful (`Set-Cookie`), **domain frontend dan domain backend API boleh berada pada hostname/domain yang berbeda** (misal: frontend di Cloudflare `cdepearls.workers.dev` dan API di VPS `api.cdepearls.com`).
- **Persyaratan Wajib**: Backend API harus mengizinkan origin frontend pada response header CORS (`Access-Control-Allow-Origin: <FRONTEND_URL>`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers: Authorization, Content-Type`).

---

## 6. Daftar Akun Awal & Kredensial Resmi

Setelah migrasi awal dan seeding dijalankan, 3 akun resmi aktif tersedia untuk login:

| Peran | Email | Kata Sandi | Akses Portal | Ketentuan Keamanan |
| :--- | :--- | :--- | :--- | :--- |
| **Pelanggan** | `siti.rahma@gmail.com` | Ditetapkan di `.env` lokal | `/akun` | Wajib ganti sandi pada login perdana |
| **Admin** | `admin@cdepearls.com` | Ditetapkan di `.env` lokal | `/admin` | Wajib ganti sandi pada login perdana |
| **SPI** | `owner.spi@cdepearls.com` | Ditetapkan di `.env` lokal | `/spi` & `/admin` | Wajib ganti sandi pada login perdana |

---

## 7. Verifikasi Pasca Deploy

1. Jalankan pengujian backend otomatis di server:
   ```bash
   php artisan test
   ```
   Pastikan seluruh 56 pengujian fitur (Autentikasi, Kunci Akun, RBAC, IDOR, Otorisasi SPI, Google OAuth, Rate Limit, Turnstile, Logout, Role Redirection) berstatus **PASSED**.
2. Buka URL frontend dan verifikasi cookie `laravel_session` serta token CSRF tersimpan dengan flag `SameSite=Lax` dan `Secure`.
3. Verifikasi alur otorisasi sensitif: perubahan harga produk di atas 10% wajib masuk ke antrean persetujuan `/spi`.

---

## 8. Konfigurasi Google Cloud Console & Cloudflare Turnstile

### A. Google OAuth 2.0 Web Client
1. Buka [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Klik **Create Credentials** -> **OAuth Client ID**.
3. Pilih Application Type: **Web application**.
4. Isi Nama Klien: `CD'E Pearls Lombok Web`.
5. **Authorized JavaScript origins**:
   - Produksi: `https://cdepearls.com`
   - Pengembangan: `http://localhost:5173`
6. **Authorized redirect URIs**:
   - Produksi: `https://api.cdepearls.com/api/v1/auth/google/callback`
   - Pengembangan: `http://localhost:8000/api/v1/auth/google/callback`
7. Simpan nilai Client ID dan Client Secret ke environment variable server (jangan pernah simpan kunci rahasia di kode sumber atau repositori publik):
   ```env
   # backend/.env
   GOOGLE_CLIENT_ID="[ISI_DARI_GOOGLE_CLOUD_CONSOLE]"
   GOOGLE_CLIENT_SECRET="[ISI_DARI_GOOGLE_CLOUD_CONSOLE]"
   GOOGLE_REDIRECT_URI="${APP_URL}/api/v1/auth/google/callback"
   ```
8. Lingkup akses (Scopes) yang diminta: `openid`, `email`, `profile`.

### B. Cloudflare Turnstile (Anti-Bot / Captcha)
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Turnstile**.
2. Klik **Add Widget**:
   - Widget name: `CD'E Pearls Atelier Security`
   - Domain: `cdepearls.com` (dan `localhost` untuk pengujian)
   - Widget Mode: **Managed**
3. Konfigurasi variabel lingkungan:
   ```env
   # backend/.env
   TURNSTILE_SECRET_KEY="[ISI_DARI_CLOUDFLARE_DASHBOARD]"

   # frontend/.env
   VITE_TURNSTILE_SITE_KEY="[ISI_DARI_CLOUDFLARE_DASHBOARD]"
   ```
4. Kunci Uji Coba Cloudflare (Testing Mode):
   - Sitekey Dummy Testing: `1x00000000000000000000AA` (selalu lolos di lingkungan dev/staging)
   - Secret Key Dummy Testing: `1x0000000000000000000000000000000AA`

---

## 9. Manajemen Akun Staf via Artisan CLI

Manajemen kredensial akun staf internal (`admin@cdepearls.com`, `owner.spi@cdepearls.com`, dan `siti.rahma@gmail.com`) dikelola secara aman melalui perintah Artisan tanpa mengekspos kata sandi atau hash di log konsol.

> [!CAUTION]
> **PERINGATAN KEAMANAN PRODUKSI**:
> DILARANG KERAS menjalankan perintah modifikasi akun atau kata sandi pada database produksi tanpa izin tertulis eksplisit dari pemilik sistem. Seluruh tindakan audit tercatat di log internal.

### A. Memeriksa Status Akun Resmi (`cde:seed-accounts --check`)

Perintah ini memeriksa apakah akun seed dan peran sistem terdaftar di database tanpa membocorkan hash kata sandi:

```bash
# Di lingkungan lokal atau Railway shell:
php artisan cde:seed-accounts --check
```

Perintah akan menampilkan tabel status:
- Email pengguna
- Nama
- Peran (`user`, `admin`, `spi`)
- Status verifikasi email (`Terverifikasi` / `Belum`)
- Status kata sandi terkonfigurasi (`Tersedia` / `Kosong`)

### B. Mengubah Kata Sandi Staf Secara Aman (`cde:set-password`)

Untuk mengubah atau mereset kata sandi staf secara langsung via shell server (misal Railway CLI / SSH container) tanpa meninggalkan jejak plain text di riwayat terminal:

```bash
# Sintaks perintah:
php artisan cde:set-password <email>

# Contoh:
php artisan cde:set-password admin@cdepearls.com
```

Mekanisme keamanan:
1. Input kata sandi baru diminta melalui prompt rahasia yang tersembunyi (`$this->secret()`) tanpa echo karakter di layar.
2. Input konfirmasi kata sandi wajib cocok persis dengan input pertama.
3. Panjang kata sandi minimal 8 karakter.
4. Kata sandi di-hash menggunakan algoritma Bcrypt dengan cost standar tinggi sebelum disimpan ke database.
5. Tidak ada kredensial yang dicetak ke output terminal, riwayat shell (`~/.bash_history`), maupun log sistem.




---

## 9. Konfigurasi Trusted Reverse Proxy & Keamanan IP Klien (U-4 & U-11)

Untuk memastikan bahwa IP klien (`$request->ip()`) yang dideteksi oleh rate limiter, security gate, dan audit log adalah alamat IP pengunjung sebenarnya (anti-IP spoofing), backend menggunakan konfigurasi proxy berlapis yang fleksibel:

- **Sumber Resmi Subnet Cloudflare**:
  - IPv4: `https://www.cloudflare.com/ips-v4`
  - IPv6: `https://www.cloudflare.com/ips-v6`
- **Tanggal Pengambilan Data**: November 2026
- **Berkas Konfigurasi**: `backend/config/trustedproxy.php`
- **Integrasi Framework**: Terdaftar di `backend/bootstrap/app.php` melalui `$middleware->trustProxies(at: (require __DIR__.'/../config/trustedproxy.php')['proxies'])`.

### A. Konfigurasi Fleksibel via Environment (`.env`)
Backend mendukung penambahan proxy host lain (misal: Nginx upstream, AWS ALB, Traefik, Railway Private Network) tanpa mengubah kode:
```env
# Aktifkan kepercayaan pada subnet resmi Cloudflare (default: true)
TRUST_CLOUDFLARE_PROXIES=true

# Tambahkan subnet atau IP proxy privat host backend (dipisahkan koma)
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1
```

### B. Cara Memeriksa IP Klien di Host Backend
Untuk memverifikasi bahwa host backend mendeteksi IP klien asli dengan benar:
1. **Melalui Tinker**:
   ```bash
   php artisan tinker --execute="echo request()->ip();"
   ```
2. **Melalui Audit Log**:
   Setiap aksi otentikasi atau perubahan data mencatat kolom `ip_address` pada tabel `audit_logs`. Periksa apakah IP yang tercatat cocok dengan IP publik klien (bukan IP internal reverse proxy).
3. **Melalui Log Nginx/Apache**:
   Pastikan format log menyertakan `$http_cf_connecting_ip` atau `$http_x_forwarded_for` bersama dengan `$remote_addr`.

### C. Prosedur Pembaruan Berkala IP Cloudflare
Jika Cloudflare merilis rentang IP baru:
1. Unduh daftar IP terbaru:
   ```bash
   curl -s https://www.cloudflare.com/ips-v4
   curl -s https://www.cloudflare.com/ips-v6
   ```
2. Perbarui daftar di `backend/config/trustedproxy.php`.
3. Jalankan tes verifikasi:
   ```bash
   php artisan test tests/Feature/TrustCloudflareProxiesTest.php
   ```
4. **Penting**: Jangan pernah menyetel `'proxies' => '*'` di lingkungan produksi untuk mencegah serangan header injection (`X-Forwarded-For`).

---

## 10. Catatan Operasional & Kebijakan Sistem (U-11)

### A. Masa Reservasi Stok Pesanan (`reservation_hours`)
- Masa waktu tunggu pembayaran sebelum pesanan kedaluwarsa dan stok dikembalikan otomatis kini dapat dikonfigurasi melalui pengaturan SPI dengan kunci `reservation_hours`.
- Nilai awal default sistem adalah **24 jam**.
- Command terjadwal `orders:expire-reservations` membaca nilai ini secara dinamis dari database (fallback ke `payment_timeout_hours` atau 24 jam).

### B. Status Modul Kelola Voucher
- Basis data tabel `vouchers` dan API validasi server telah aktif penuh (mencegah manipulasi harga/diskon di sisi klien).
- Antarmuka pengguna (UI) khusus untuk admin/SPI menambah atau mengubah voucher saat ini belum diimplementasikan; pembuatan voucher saat ini dikelola melalui database seeder atau konsol administrasi.

### C. Penjelasan Temuan Status Git Duplikat `ApprovalController.php`
- Pada sesi sebelumnya, `git status` sempat menampilkan `ApprovalController.php` dua kali karena variasi resolusi case-sensitive vs case-insensitive pada sistem file NTFS Windows (antara `Api/Spi/` dan representasi path relatif).
- Telah diverifikasi bahwa hanya terdapat tepat satu berkas fisik di disk pada lokasi `backend/app/Http/Controllers/Api/Spi/ApprovalController.php`. Tidak ada controller duplikat di repositori.


---

## 11. Pengendalian Pengindeksan Mesin Pencari (Search Engine Indexing Control)

Untuk mencegah perayap mesin pencari (Googlebot, Bingbot, dll.) mengindeks situs selama fase pengujian di domain gratisan Cloudflare:

### A. Kebijakan Default (Noindex Terkendali)
Secara bawaan tanpa variabel environment (`VITE_ALLOW_INDEXING` bernilai `false` atau tidak diatur):
1. **Meta Tag**: `<meta name="robots" content="noindex, nofollow" />` disematkan pada berkas `index.html`.
2. **Robots.txt**: Berkas `dist/robots.txt` berisi:
   ```text
   User-agent: *
   Disallow: /
   ```
3. **HTTP Header Cloudflare**: Berkas konfigurasi aset `dist/_headers` menyertakan header:
   ```text
   /*
     X-Robots-Tag: noindex, nofollow
   ```

### B. Prosedur Pencabutan Noindex Saat Peluncuran Resmi (Go-Live)
Ketika domain utama resmi butik telah siap dan diizinkan untuk diindeks publik:
1. Masuk ke Cloudflare Dashboard > **Workers & Pages** > Pilih proyek `cdepearlslombok`.
2. Buka menu **Settings** > **Variables and Secrets** > **Add variable**.
3. Tambahkan variabel baru:
   - Nama: `VITE_ALLOW_INDEXING`
   - Nilai: `true`
4. Jalankan deploy ulang (melalui push Git atau perintah CLI `npm run build && npx wrangler deploy`).
5. Skrip otomatis build akan:
   - Mengubah meta robots menjadi `<meta name="robots" content="index, follow" />`.
   - Mengubah `robots.txt` menjadi `User-agent: *\nAllow: /`.
   - Menghapus header `X-Robots-Tag: noindex` dari `_headers`.
