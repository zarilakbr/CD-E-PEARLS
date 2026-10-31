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
   CREATE USER cde_admin WITH ENCRYPTED PASSWORD 'RahasiaKuatMutiara2026!';
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

# PostgreSQL Connection
DB_CONNECTION=pgsql
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=5432
DB_DATABASE=cde_pearls
DB_USERNAME=postgres
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
   Pastikan seluruh 43 pengujian fitur (Autentikasi, Kunci Akun, RBAC, IDOR, Otorisasi SPI, Google OAuth, Rate Limit, Turnstile, Logout) berstatus **PASSED (100%)**.
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


