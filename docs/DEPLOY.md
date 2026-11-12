# Panduan Deploy Produksi CD'E Pearls Lombok

Dokumen ini menjelaskan tata cara deployment aplikasi **CD'E Pearls Lombok** (Laravel API + React 19 Vite SPA Frontend) ke lingkungan produksi **Hostinger** (hPanel / Cloud Hosting / VPS) dan **Cloudflare** dengan arsitektur MySQL / MariaDB yang aman, berkinerja tinggi, dan teruji.

---

## 1. Arsitektur Produksi

```
[ Klien / Browser Web ]
       │
       ├─── https://cdepearlslombok.id ─────────► [ Cloudflare Workers: "cdepearlslombok" ]
       │                                            (React 19 + Vite TypeScript SPA)
       │
       └─── https://api.cdepearlslombok.id/api/v1 ─► [ Hostinger hPanel ]
                                                     (Laravel 12/13 + PHP 8.4 via Alt-PHP)
                                                                 │
                                                                 ▼
                                                    [ MariaDB 10.11+ / MySQL 8.0+ ]
```

---

## 2. Struktur Direktori & Keamanan Server (Di Luar `public_html`)

Demi menjaga keamanan kode sumber dan berkas konfigurasi sensitif (`.env`, log sistem, database credentials, storage internal), repositori aplikasi **wajib diletakkan di luar `public_html`**.

### Hierarki Folder di Server Hostinger:
```
/home/USERNAME/
├── cdepearls/                         <-- Direktori repositori (DI LUAR public_html)
│   ├── backend/
│   │   ├── app/
│   │   ├── config/
│   │   ├── public/                    <-- Document root asli backend Laravel
│   │   │   ├── index.php
│   │   │   └── storage/               <-- Symlink ke ../storage/app/public
│   │   ├── storage/
│   │   │   └── app/public/products/   <-- Berkas asli gambar produk & WebP
│   │   ├── .env                       <-- Konfigurasi rahasia produksi
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
Dengan struktur ini, pengunjung web yang mengakses `https://api.cdepearlslombok.id` hanya dapat menjangkau berkas publik di `backend/public/`, sementara kode sumber dan database terlindung sepenuhnya di luar root web.

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

## 4. Konfigurasi DNS & Domain (Cloudflare Nameservers)

1. **Pengelolaan Nameserver**:
   - Seluruh DNS domain `cdepearlslombok.id` dikelola secara terpusat di **Cloudflare**.
   - Nameserver domain tetap mengarah ke nameserver Cloudflare (misal: `*.ns.cloudflare.com`).
2. **Peringatan Integrasi Domain di Hostinger**:
   > [!WARNING]
   > **JANGAN menambahkan ulang atau mengatur ulang domain `cdepearlslombok.id` di menu Domain hPanel Hostinger**, karena Hostinger akan mencoba mengambil alih DNS/nameserver secara sepihak. Pengaturan domain cukup dilakukan dengan mengarahkan DNS record (A / CNAME) sub-domain `api.cdepearlslombok.id` dari Cloudflare Dashboard ke alamat IP server Hostinger.

---

## 5. Konfigurasi Record Email Anti-Spam (SPF, DMARC, DKIM)

Demi memastikan seluruh email transaksional (verifikasi akun, notifikasi pesanan) terkirim langsung ke kotak masuk (Inbox) pelanggan tanpa masuk folder Spam, konfigurasikan record DNS berikut pada **Cloudflare DNS Manager**:

### A. SPF (Sender Policy Framework)
- **Tipe**: `TXT`
- **Name**: `@`
- **Content**:
  ```text
  v=spf1 include:_spf.mail.hostinger.com ~all
  ```

### B. DMARC (Domain-based Message Authentication)
- **Tipe**: `TXT`
- **Name**: `_dmarc` (atau `_dmarc.cdepearlslombok.id`)
- **Content**:
  ```text
  v=DMARC1; p=none
  ```

### C. DKIM (DomainKeys Identified Mail)
Hostinger menyediakan 3 selector DKIM CNAME. Tambahkan ketiga record CNAME tersebut:
1. **Host**: `hostingermail-a._domainkey`
2. **Host**: `hostingermail-b._domainkey`
3. **Host**: `hostingermail-c._domainkey`

> [!IMPORTANT]
> Seluruh record DKIM CNAME (`hostingermail-a/b/c._domainkey`) **WAJIB berstatus DNS Only** (Proxy disabled / ikon awan abu-abu di Cloudflare). Jika diaktifkan Proxied (awan oranye), verifikasi kriptografis DKIM oleh penyedia email seperti Gmail dan Yahoo akan gagal.

---

## 6. Persiapan Database MariaDB / MySQL

1. Masuk ke **Hostinger hPanel** -> **Databases** -> **Management**.
2. Buat database baru (misal `u123456789_cde`) dan pengguna database (misal `u123456789_admin`).
3. Tetapkan kata sandi database yang kuat dan catat nama database, username, dan password untuk konfigurasi `.env`.

---

## 7. Konfigurasi Backend (`backend/.env`)

Salin berkas contoh konfigurasi di folder `backend/`:
```bash
cp /home/USERNAME/cdepearls/backend/.env.example /home/USERNAME/cdepearls/backend/.env
```

Sesuaikan parameter berikut pada berkas `backend/.env` (jangan pernah membagikan atau mengunggah nilai rahasia asli ke repositori publik):

```env
APP_NAME="CD'E Pearls Lombok"
APP_ENV=production
APP_KEY=base64:GENERATE_DENGAN_ARTISAN_KEY_GENERATE
APP_DEBUG=false
APP_URL=https://api.cdepearlslombok.id
FRONTEND_URL=https://cdepearlslombok.id

# Database MariaDB / MySQL (Hostinger hPanel)
DB_CONNECTION=mariadb
DB_HOST=localhost
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

# Konfigurasi Email SMTP Hostinger
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=owner@cdepearlslombok.id
MAIL_PASSWORD=YOUR_EMAIL_PASSWORD
MAIL_FROM_ADDRESS=owner@cdepearlslombok.id
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

## 8. Symlink Storage Manual (`ln -sfn`)

> [!IMPORTANT]
> Pada paket shared hosting Hostinger, fungsi PHP `exec` dan `shell_exec` dinonaktifkan secara bawaan demi keamanan. Akibatnya, perintah bawaan `php artisan storage:link` akan gagal.
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

## 9. Prosedur Migrasi Database Produksi

Sebelum menerapkan migrasi skema tabel baru di server produksi, patuhi prosedur keamanan database berikut:

### A. Cadangkan Database Terlebih Dahulu (Wajib)
Selalu lakukan pencadangan (*backup*) penuh database sebelum menjalankan migrasi apa pun. Pencadangan dapat dilakukan melalui dua cara:
1. **Via SSH Terminal (`mysqldump`)**:
   ```bash
   mysqldump -u DB_USERNAME -p DB_DATABASE > ~/backup_cde_$(date +%Y%m%d_%H%M%S).sql
   ```
   *(Sistem akan meminta kata sandi database secara interaktif tanpa mengeksposnya dalam riwayat terminal).*
2. **Via Menu Backup hPanel**:
   Buka **hPanel -> Database -> Manajemen Database -> phpMyAdmin -> Export** (atau gunakan menu **Cadangan / Backups** di hPanel Hostinger).

### B. Periksa Status Migrasi yang Tertunda
Periksa berkas migrasi mana saja yang belum teraplikasikan ke database produksi:
```bash
cd /home/USERNAME/cdepearls/backend
/opt/alt/php84/usr/bin/php artisan migrate:status
```

### C. Eksekusi Migrasi dengan Bendera `--force`
Pada lingkungan produksi (`APP_ENV=production`), Laravel secara otomatis memblokir eksekusi migrasi tanpa konfirmasi kecuali bendera `--force` disertakan:
```bash
cd /home/USERNAME/cdepearls/backend
/opt/alt/php84/usr/bin/php artisan migrate --force
```

### D. Verifikasi Pasca Migrasi
Pastikan seluruh batch migrasi telah berstatus `Ran`:
```bash
/opt/alt/php84/usr/bin/php artisan migrate:status
```

---

## 10. Inisialisasi & Optimasi Laravel (via PHP 8.4)

Jalankan perintah inisialisasi dan kompilasi cache menggunakan binary PHP 8.4:

```bash
cd /home/USERNAME/cdepearls/backend

# 1. Generate App Key (bila pertama kali)
/opt/alt/php84/usr/bin/php artisan key:generate --force

# 2. Optimasi Cache Konfigurasi, Event, Rute, & Tampilan
/opt/alt/php84/usr/bin/php artisan optimize
```

---

## 11. Seed Akun Resmi (Role-Based Seeding)

Inisialisasi akun resmi untuk operasional sistem (Admin, Pengawas Internal SPI, dan Pelanggan awal) dilakukan menggunakan variabel lingkungan spesifik:

```bash
cd /home/USERNAME/cdepearls/backend

# Atur variabel akun awal di sesi terminal SSH
export SEED_ADMIN_NAME="Administrator CD'E"
export SEED_ADMIN_EMAIL="admin@cdepearls.com"
export SEED_ADMIN_PASSWORD="KATA_SANDI_ADMIN_KUAT_MIN_12_KARAKTER"

export SEED_SPI_NAME="Pengawas Internal SPI"
export SEED_SPI_EMAIL="owner.spi@cdepearls.com"
export SEED_SPI_PASSWORD="KATA_SANDI_SPI_KUAT_MIN_12_KARAKTER"

export SEED_USER_NAME="Siti Rahma"
export SEED_USER_EMAIL="siti.rahma@gmail.com"
export SEED_USER_PASSWORD="KATA_SANDI_USER_KUAT_MIN_12_KARAKTER"

# Jalankan seeder akun
/opt/alt/php84/usr/bin/php artisan db:seed --class=UserSeeder --force
```

> [!CAUTION]
> **JANGAN PERNAH menjalankan `php artisan db:seed` secara polos** tanpa menetapkan variabel lingkungan `SEED_ADMIN_*`, `SEED_SPI_*`, `SEED_USER_*`.
> Pastikan variabel `SEED_TEST_PRODUCTS=false` tetap aktif agar sistem tidak menginjeksi produk dummy ke database produksi.

---

## 12. Konfigurasi Cron Job Laravel Scheduler (Tiap Menit)

Laravel Scheduler berfungsi sebagai pengelola jadwal internal aplikasi. Cron host pada Hostinger dijalankan **setiap 1 menit (`* * * * *`)** karena mesin Laravel sendiri yang mengevaluasi ekspresi interval tiap tugas di `backend/routes/console.php`, sehingga tugas 5 menitan, 10 menitan, atau harian tetap presisi tanpa perlu mendaftarkan banyak entri cron manual.

### Daftar Tugas Terjadwal Saat Ini (`backend/routes/console.php`):
- **`orders:expire-reservations` (`everyTenMinutes()`)** — Kelas `App\Console\Commands\ExpireOrderReservationsCommand`: memindai pesanan berstatus `payment_status = 'WAITING_PAYMENT'` dan `order_status != 'CANCELLED'` yang melewati batas waktu reservasi (`reservation_hours` / `payment_timeout_hours`, default 24 jam), membatalkannya (`order_status = 'CANCELLED'`, `payment_status = 'FAILED'`), mengembalikan `stock` & mengurangi `stock_reserved` secara transaksional (`lockForUpdate`), serta mencatat `StockMovement` (`reservation_expired`) dan `OrderStatusHistory`.

### Langkah Pemasangan di Hostinger hPanel:
1. Buka **Hostinger hPanel** -> **Advanced** -> **Cron Jobs**.
2. Pilih jenis jadwal: **Custom**.
3. Atur frekuensi setiap menit: `* * * * *`.
4. Masukkan baris perintah wajib berikut (sesuaikan path `~/cde-app` dengan direktori repo aktif di server Anda):
   ```bash
   * * * * * cd ~/cde-app/backend && php artisan schedule:run >> /dev/null 2>&1
   ```
   *(Catatan: Jika PHP CLI bawaan server belum PHP 8.4, gunakan binary `/opt/alt/php84/usr/bin/php`, misal `* * * * * cd ~/cde-app/backend && /opt/alt/php84/usr/bin/php artisan schedule:run >> /dev/null 2>&1`).*
5. Simpan pengaturan Cron Job.

---

## 13. Aturan Unggah Gambar Produk & Konversi WebP

Sistem backend mengimplementasikan kebijakan ketat untuk manajemen citra produk:
- **Otorisasi**: Hanya peran `admin` atau `spi` yang diizinkan mengunggah gambar produk (pelanggan ditolak HTTP 403).
- **Validasi Dimensi & Format**:
  - Format didukung: `jpg`, `jpeg`, `png`, `webp`.
  - Ukuran file maksimum: `5 MB`.
  - **Dimensi maksimum**: Gambar dengan dimensi melebihi **4000 piksel** pada sisi terpanjang langsung ditolak dengan pesan galat bahasa Indonesia yang jelas: `Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.` (HTTP 422).
  - Gambar dengan dimensi tepat 4000 piksel atau lebih kecil diterima secara normal.
- **Pembersihan EXIF & Konversi WebP Otomatis**:
  - Metadata sensitif (informasi koordinat GPS / data kamera EXIF) dibersihkan secara otomatis.
  - Setiap berkas JPG atau PNG yang diunggah otomatis dibuatkan berkas pendamping berformat `.webp` berkinerja tinggi pada direktori `storage/products/`.
  - Menghapus atau mengganti foto produk otomatis membersihkan berkas utama beserta berkas pendamping `.webp`-nya dari disk.

---

## 14. Kebijakan Keamanan Autentikasi (Anti-Enumeration)

1. **Respons Seragam Kredensial**:
   - Kata sandi salah untuk email terdaftar maupun email belum terdaftar menghasilkan respon **HTTP 401** seragam: `Email atau kata sandi tidak valid. Silakan periksa kembali.` (mencegah penyerang mendeteksi keberadaan akun pengguna).
   - Status akun belum diverifikasi (**HTTP 403 `ACCOUNT_UNVERIFIED`**) hanya dikembalikan **setelah kata sandi diverifikasi benar**.
2. **Pencegahan DoS Penguncian Akun**:
   - Kegagalan kata sandi tidak mengunci akun di level database (`locked_until` tetap `null`).
   - Rate limiting dikelola secara terisolasi via cache per-IP dan per-kombinasi email+IP (HTTP 429), melindungi pengguna sah dari serangan penolakan layanan (Denial of Service).
3. **Standar Password**: Pendaftaran dan pembaruan kata sandi mewajibkan minimal 12 karakter dengan kombinasi aman.

---

## 15. Endpoint Health Check Publik

Backend menyediakan endpoint pemantauan ketersediaan sistem:
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
- Endpoint ini bersih dan ramping: tidak mengekspos field database internal, latency ms, maupun timestamp ke publik.

---

## 16. Deploy Frontend ke Cloudflare WORKERS (Otomatis via Workers Builds)

Frontend di-deploy secara otomatis dari branch **`main`** melalui **Cloudflare Workers Builds** (worker `cdepearlslombok`, konfigurasi `frontend/wrangler.jsonc`):

1. **Konfigurasi Project di Cloudflare Dashboard (Workers & Pages -> `cdepearlslombok`)**:
   - **Platform**: Cloudflare **Workers** (bukan Pages)
   - **Branch Produksi**: `main` (build & deploy otomatis saat merge ke `main`)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` *(menjalankan `generate-version.js`, `tsc -b`, `vite build`, `vite build --ssr`, dan `scripts/prerender.mjs` ke `dist/`)*
   - **Edge Worker Entry**: `frontend/worker/index.ts` (menangani `/robots.txt`, `/sitemap.xml`, `HTMLRewriter` untuk `/produk/:id`, serta `X-Robots-Tag: noindex, nofollow` pada rute privat)
2. **Variabel Lingkungan Build (Cloudflare Environment Variables)**:
   - `VITE_API_URL`: `https://api.cdepearlslombok.id/api/v1`
   - `VITE_TURNSTILE_SITE_KEY`: Site key Cloudflare Turnstile resmi untuk domain `cdepearlslombok.id`
   - `VITE_ALLOW_INDEXING`: **Biarkan tidak disetel (`true` secara default) di produksi.** Setel `VITE_ALLOW_INDEXING=false` **HANYA untuk build non-produksi** (preview/staging) agar crawler tidak mengindeks lingkungan uji.
3. **Manual Deploy CLI (bila diperlukan dari lokal)**:
   ```bash
   cd frontend
   npm run build
   npx wrangler deploy
   ```

---

## 17. Urutan Deploy Backend di Hostinger (Update Produksi)

Setiap kali ada pembaruan kode baru yang di-merge ke branch `main`, jalankan urutan deploy berikut via SSH pada server Hostinger *(sesuaikan `~/cde-app` dengan path aktual, atau `/home/USERNAME/cdepearls` bila folder server memakai nama lama)*:

```bash
cd ~/cde-app && git pull origin main && cd backend
```

1. **Perbarui dependensi Composer (jika `composer.json`/`composer.lock` berubah)**:
   ```bash
   composer install --no-dev --optimize-autoloader
   # atau dengan PHP 8.4 eksplisit: /opt/alt/php84/usr/bin/php $(which composer) install --no-dev --optimize-autoloader
   ```
2. **Jalankan migrasi database HANYA bila ada berkas migrasi baru** *(wajib cadangkan DB `.sql` terlebih dahulu sesuai Bagian 9)*:
   ```bash
   php artisan migrate --force
   ```
3. **Bersihkan cache lama dan bangun ulang cache produksi**:
   ```bash
   php artisan optimize:clear && php artisan optimize
   ```
4. **Cek kesehatan endpoint API**:
   ```bash
   curl -i https://api.cdepearlslombok.id/api/v1/health
   # Wajib mengembalikan HTTP 200 {"status":"ok"} dan header X-Robots-Tag: noindex
   ```

Ringkas satu baris (ketika tidak ada perubahan Composer):
```bash
cd ~/cde-app && git pull origin main && cd backend && php artisan migrate --force && php artisan optimize:clear && php artisan optimize
```
*(Lewati `php artisan migrate --force` jika tidak ada migrasi baru).*

---

## 18. Verifikasi Pasca Deploy

> [!CAUTION]
> **JANGAN jalankan `artisan test` di produksi!**
> 
> Seluruh unit testing, integration testing, dan race condition testing (Pest/PHPUnit) telah dijalankan dan diverifikasi 100% lulus di lingkungan pengujian CI/lokal dengan database uji `cde_test`. Menjalankan pengujian otomatis di server produksi berisiko mengotori data transaksi riil dan mengonsumsi memori server secara berlebih.

### A. Verifikasi Status API (Health Check)
Jalankan perintah berikut melalui terminal atau browser:
```bash
curl -i https://api.cdepearlslombok.id/api/v1/health
```
**Respon wajib HTTP 200**:
```json
{"status":"ok"}
```

### B. Daftar Uji Manual (Browser Checklist)
Lakukan tiga pengujian verifikasi manual berikut pada lingkungan produksi:
1. **Login Administrator**:
   - Buka `https://cdepearlslombok.id/masuk`.
   - Masuk menggunakan akun admin resmi (`admin@cdepearls.com`).
   - Pastikan berhasil diarahkan ke dashboard `/admin` tanpa kendala sesi atau cookie.
2. **Katalog Awal Bersih**:
   - Buka halaman katalog publik `https://cdepearlslombok.id/katalog`.
   - Pastikan halaman menampilkan keadaan kosong yang rapi tanpa produk uji (bebas dari produk mock/dummy).
3. **Unggah Produk Bergambar Asli**:
   - Dari dashboard Admin, buka menu Manajemen Produk lalu tambahkan 1 produk baru beserta berkas gambar asli.
   - Pastikan gambar berhasil diunggah, versi `.webp` terbuat secara otomatis di storage, dan gambar produk tampil sempurna di:
     - Halaman Katalog Publik (`/katalog`)
     - Halaman Detail Produk (`/produk/{id}`)
     - Tabel Daftar Produk Admin (`/admin/produk`)

---

## 19. Prosedur Rollback (Darurat Produksi)

### A. Rollback Backend (Hostinger)
1. Identifikasi commit stabil terakhir sebelum deploy bermasalah:
   ```bash
   cd ~/cde-app && git log --oneline -8
   ```
2. Kembalikan kode ke commit stabil `<commit>`, lalu bangun ulang cache Laravel:
   ```bash
   cd ~/cde-app && git checkout <commit> && cd backend && php artisan optimize:clear && php artisan optimize
   ```
   *(Catatan: Jika deploy sebelumnya membawa perubahan skema database yang merusak kompatibilitas mundur, lakukan pemulihan dari cadangan `.sql` sebelum `git checkout`. Setelah kondisi pulih di cabang utama, kembalikan `HEAD` ke `main` setelah commit revert/perbaikan masuk).*
3. Pastikan `/api/v1/health` kembali mengembalikan `HTTP 200 {"status":"ok"}`.

### B. Rollback Frontend (Cloudflare Workers)
1. Buka **Cloudflare Dashboard -> Workers & Pages -> `cdepearlslombok`**.
2. Buka tab **Deployments**.
3. Pilih deployment versi stabil sebelumnya lalu klik **Rollback** untuk memulihkan versi Worker dan aset statis secara instan tanpa menunggu rebuild.
