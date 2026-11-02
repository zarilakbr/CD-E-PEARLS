# Progress Pelaksanaan & Hasil Verifikasi TAHAP U

Dokumen ini memuat catatan progres teknis pelaksanaan **TAHAP U: GABUNGAN S-5 + T + RE-AUDIT** pada branch `tahap-s`. Seluruh pengujian dijalankan dengan metodologi TDD ketat (Verifikasi Kode Awal -> Tes MERAH pada worktree base commit 6d0d995 -> Remediasi Kode -> Tes HIJAU pada branch aktif).

---

## Tabel Status Butir U-1 Sampai U-10

| Butir | Cakupan Remediasi Keamanan | Status di Disk | Status Commit | Bukti MERAH | Bukti HIJAU | Status Pengujian |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **U-1** | Manipulasi Harga & Diskon Klien di OrderController (~115-186) | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (17 assertions) | **LULUS** |
| **U-2** | Lookup Pesanan Publik & Pencegahan Enumerasi PII (~420-558) | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (14 assertions) | **LULUS** |
| **U-3** | Hoarding Stok Mutiara, Turnstile Tamu, & Expire Reservation | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (9 assertions) | **LULUS** |
| **U-4** | Whitelist Subnet Cloudflare & Anti-Spoofing Trusted Proxy | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (5 assertions) | **LULUS** |
| **U-5** | Single-Use Authorization Code OAuth 64-Karakter (?code= / exchange) | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (4 assertions) | **LULUS** |
| **U-6** | Password Reset Token Expiry 60 Menit & Revokasi Sanctum Total | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (8 assertions) | **LULUS** |
| **U-7** | Bukti Transfer Privat, Middleware Akun Beku, Traversal PDF, Whitelist Settings | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (10 assertions) | **LULUS** |
| **U-8** | SalesReport Auth Bearer, Formula Injection Sanitasi, Multipart Only, Ambang Harga SPI | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (8 assertions) | **LULUS** |
| **U-9** | Konsolidasi Rute Duplikat, Clamping per_page Controller, APP_DEBUG False, Penyelarasan API URL | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (12 assertions) | **LULUS** |
| **U-10** | Masking Excel SPI, 5 Menu Terpadu (Audit Log Sub-tab), E2E Form & Aksesibilitas WCAG | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (Playwright + Axe) | **LULUS** |
| **U-11** | E2E Frontend Playwright Lengkap, Axe WCAG Target 0 Pelanggaran, dan Matriks Tangkapan Layar 360px/1280px | Ada | Tersimpan | Ada (worktree 6d0d995) | Ada (8 suite Playwright + Axe) | **LULUS** |

---

## Rincian Verifikasi & Bukti Pelaksanaan

### U-1: CRITICAL Validasi Harga Database & Kode Voucher Server
- **Temuan Awal**: `backend/app/Http/Controllers/Api/OrderController.php` baris 115, 122, 183-186 menerima input `discount` dan `price` langsung dari JSON request klien tanpa memvalidasi ke tabel `products`.
- **Perbaikan**:
  1. Hapus input `discount` dari request.
  2. `product_id` diwajibkan (`required|integer|exists:products,id`), memastikan produk aktif (`status = 'published'`).
  3. Harga (`price`) dibaca langsung dari kolom database produk dengan penguncian baris pesimistik (`lockForUpdate()`).
  4. Diskon hanya dihitung bila klien mengirimkan `voucher_code` yang sah, aktif, belum kedaluwarsa, memenuhi minimal belanja, dan memiliki sisa kuota (tabel `vouchers`).
- **Bukti Tes**: `OrderSecurityAndVoucherTest.php` (5 pengujian lulus).

### U-2: HIGH Proteksi Lookup Pesanan Publik & PII Tamu
- **Temuan Awal**: Rute `/api/v1/orders/lookup/{orderNumber}` menampilkan data lengkap termasuk nama, telepon, dan alamat tanpa otorisasi.
- **Perbaikan**:
  1. Akses hanya diizinkan untuk:
     - Pengguna terautentikasi pemilik pesanan (`user_id`).
     - Admin atau SPI.
     - Tamu yang menyertakan `tracking_token` acak (panjang 64 karakter) dan verifikasi 4 digit akhir nomor telepon (`phone_last4`).
  2. Respons tamu dimaskir: nama parsial (`B***`), telepon disensor (`0812****5432`), alamat hanya menampilkan nama kota/kabupaten.
  3. Diterapkan `throttle:10,1` dan respons 404 seragam saat lookup gagal.
  4. Format nomor pesanan diseragamkan ke format `CDE-YYYY-XXXX`.
- **Bukti Tes**: `OrderLookupSecurityTest.php` (5 pengujian lulus).

### U-3: HIGH Penimbunan Stok (Stock Hoarding) & Batas Reservasi
- **Temuan Awal**: Pemesanan tanpa batas tanpa pembayaran dapat menahan stok mutiara langka secara permanen.
- **Perbaikan**:
  1. Checkout tamu wajib menyertakan verifikasi Cloudflare Turnstile yang divalidasi fail-closed di backend.
  2. Pembatasan maksimal 3 pesanan aktif berstatus `WAITING_PAYMENT` per akun atau nomor telepon.
  3. Dibuat Artisan command `orders:expire-reservations` yang membatalkan pesanan kedaluwarsa (> 2 jam), mengembalikan kuota stok, dan mencatat mutasi di `stock_movements`.
  4. Pembatalan stok bersifat idempoten.
- **Bukti Tes**: `OrderStockHoardingTest.php` (4 pengujian lulus).

### U-4: HIGH Kepercayaan Proxy Cloudflare & Pencegahan IP Spoofing
- **Temuan Awal**: Aplikasi belum mengonfigurasi rentang IP proxy tepercaya Cloudflare secara ketat, berisiko terhadap pemalsuan header `X-Forwarded-For`.
- **Perbaikan**:
  1. Dibuat `backend/config/trustedproxy.php` berisi daftar subnet resmi IPv4 dan IPv6 Cloudflare (diambil November 2026).
  2. Didaftarkan pada `backend/bootstrap/app.php` melalui `$middleware->trustProxies(at: ...)`.
  3. Didokumentasikan prosedur pembaruan berkala di `docs/DEPLOY.md`.
- **Bukti Tes**: `TrustCloudflareProxiesTest.php` (2 pengujian lulus).

### U-5: HIGH Single-Use Authorization Code OAuth Google
- **Temuan Awal**: Potensi kebocoran token otentikasi melalui query parameter URL saat redirect callback.
- **Perbaikan**:
  1. Backend menerbitkan authorization code acak 64 karakter single-use (TTL 60 detik) yang disimpan ber-hash SHA-256 di cache server.
  2. Frontend menukar kode via `POST /api/v1/auth/exchange` untuk memperoleh Sanctum Bearer token.
  3. Frontend `AuthContext.tsx` segera menghapus query parameter `code` atau `auth_code` dari bilah alamat URL peramban menggunakan `window.history.replaceState`.
- **Bukti Tes**: `OAuthAuthorizationCodeTest.php` (4 pengujian lulus).

### U-6: HIGH Pembatasan Waktu Token Reset Password & Revokasi Sesi
- **Temuan Awal**: Token reset password lama tidak memiliki validasi waktu kadaluwarsa yang ketat dan tidak membatalkan sesi lama setelah ganti password.
- **Perbaikan**:
  1. Validasi token kadaluwarsa jika lebih tua dari 60 menit berdasarkan `created_at` pada tabel `password_reset_tokens`.
  2. Token reset langsung dihapus setelah satu kali pakai (single-use).
  3. Setelah reset berhasil, seluruh token Sanctum aktif milik pengguna dicabut (`$user->tokens()->delete()`).
  4. Respons seragam anti-enumerasi pengguna dan `throttle:6,1`.
- **Bukti Tes**: `PasswordResetSecurityTest.php` (4 pengujian lulus).

### U-7: HIGH Remediasi Audit Tambahan
- **Perbaikan**:
  1. Unggahan bukti transfer disimpan ke disk privat (`private`) dengan nama UUID acak, diakses melalui endpoint berotorisasi `GET /api/v1/orders/{id}/payments/{paymentId}/proof`.
  2. Command migrasi `php artisan storage:migrate-proofs-private` dibuat untuk memindahkan berkas bukti lama.
  3. Middleware `EnsureAccountNotFrozen` dipasang global pada rute `auth:sanctum`.
  4. `CertificateController` memvalidasi traversal path (`..`, null bytes) dan mewajibkan URL HTTPS.
  5. `SettingController` membatasi pengembalian data publik ke whitelist kunci yang aman.
- **Bukti Tes**: `AuditRemediationsTest.php` (4 pengujian lulus).

### U-8: HIGH Remediasi Re-Audit & Proteksi Ekspor
- **Perbaikan**:
  1. `SalesReportExporter` menolak otentikasi query parameter `?token=` dan mewajibkan header `Authorization: Bearer`.
  2. Sanitasi formula injection pada seluruh berkas CSV dan Excel: menghapus spasi awal (`ltrim`), mendeteksi karakter pemicu `= + - @ \t \r \n | %`, dan memberikan prefix petik satu (`'`).
  3. `AdminProductRequest` menolak string foto mentah dari JSON payload dan mewajibkan format file multipart.
  4. Produk baru dengan harga di luar ambang batas dinamis (`min_product_price_threshold` dan `max_product_price_threshold`) otomatis disetel `pending_approval` dan memerlukan otorisasi SPI.
- **Bukti Tes**: `ReAuditRemediationsTest.php` (4 pengujian lulus).

### U-9: MEDIUM & LOW Pembersihan Teknis
- **Perbaikan**:
  1. Menghapus rute duplikat `/api/v1/spi/audit-logs` di `backend/routes/api.php`.
  2. Menambahkan pembatasan ukuran pagination (`min(max((int)$perPage, 1), 100)`) pada seluruh controller API.
  3. Mengonfigurasi `APP_DEBUG=false` pada `backend/.env.example`.
  4. Menyelaraskan basis URL API pada `frontend/src/services/api.ts` dan `frontend/src/lib/api.ts` menggunakan environment variable.
- **Bukti Tes**: 107 tes backend lulus.

### U-10: Frontend S-2, S-3 & S-5 Sesuai Desain
- **Perbaikan**:
  1. Halaman Lacak Pesanan (`OrderTrackingPage.tsx`) meminta Nomor Pesanan, Token Pelacakan Tamu (64 karakter), dan 4 digit akhir nomor telepon pemesan.
  2. Halaman Checkout (`CheckoutPage.tsx`) mengirimkan hanya `product_id` dan `quantity`, mendukung input voucher opsional dengan pesan kesalahan jelas, dan menampilkan token pelacakan tamu untuk disimpan setelah pesanan dibuat.
  3. Pusat Kendali SPI (`SpiPortal.tsx` & `SpiDashboardLayout.tsx`) terstandarisasi dengan 5 menu navigasi utama (Ringkasan, Pesanan, Produk & Stok, Pengguna, Pengaturan Toko), di mana Log Audit Forensik diintegrasikan sebagai sub-tab di dalam menu Ringkasan.
  4. Seluruh unduhan Excel menggunakan `apiClient` Axios ber-header otentikasi Bearer dan responseType blob.
- **Bukti Tes**: Playwright E2E (`spi-control-center`, `spi-excel-export`, `admin-product-crud`, `auth-roles-form-login`, `accessibility-theme-audit`).

### U-11: Penutupan Sisa U (E2E Frontend Playwright, Audit Aksesibilitas Axe WCAG, & Matriks Tangkapan Layar)
- **Cakupan Pengujian**:
  1. **E2E 1.a & 1.e**: Alur Checkout Pelanggan lewat form nyata, validasi kode voucher salah (pesan kesalahan jelas) dan voucher valid, assertion payload jaringan tanpa field `price` atau `discount`, verifikasi total layar identik dengan total database server (diuji pada viewport 320px dan 1280px).
  2. **E2E 1.b**: Pelanggan melihat pesanan sendiri pada `/akun/pesanan`; tamu melacak pesanan menggunakan nomor pesanan + tracking token 64 karakter + 4 digit akhir nomor telepon (verifikasi proteksi PII: nama disensor `B***`, nomor telepon disensor `0812****7890`, alamat lengkap jalan tidak bocor dan hanya menampilkan kota); verifikasi token/digit salah menampilkan respons seragam (diuji pada 320px dan 1280px).
  3. **E2E 1.c**: Tamu checkout tanpa verifikasi Cloudflare Turnstile ditolak dengan pesan kesalahan yang jelas dan fail-closed.
  4. **E2E 1.d**: Google OAuth callback menerima `?code=`, menukar kode via `POST /api/v1/auth/exchange`, URL segera dibersihkan dengan `window.history.replaceState` (tanpa query parameter `code`), dan penukaran kode salah menampilkan pesan error yang aman tanpa menyimpan token palsu.
  5. **Aksesibilitas Axe WCAG 2.1 AA**: Audit otomatis menggunakan `@axe-core/playwright` pada seluruh halaman kritis:
     - `/lacak-pesanan`: 0 critical, 0 serious.
     - `/checkout`: 0 critical, 0 serious.
     - `/akun`: 0 critical, 0 serious.
     - `/admin/produk`: 0 critical, 0 serious.
     - `/spi [Ringkasan]`: 0 critical, 0 serious.
     - `/spi [Pesanan]`: 0 critical, 0 serious.
     - `/spi [Produk & Stok]`: 0 critical, 0 serious.
     - `/spi [Pengguna]`: 0 critical, 0 serious.
     - `/spi [Pengaturan Toko]`: 0 critical, 0 serious.
     - `/spi [Log Audit Forensik]`: 0 critical, 0 serious.
     **Hasil**: Seluruh halaman mencapai target 0 pelanggaran critical maupun serious.
  6. **Matriks Tangkapan Layar Lengkap**: Tangkapan layar PNG asli beresolusi 360px (mobile) dan 1280px (desktop), mode terang dan gelap, serta bahasa Indonesia (ID) dan Inggris (EN) tersimpan pada direktori artifact:
     - Formulir Tambah/Ubah Produk (Modal Admin)
     - Dashboard SPI (Ringkasan Metrik)
     - Tab Log Audit Forensik SPI
     - Modal Ekspor Laporan Penjualan Excel (.xlsx)
     - Formulir Penyelesaian Pesanan (Checkout)
     - Pelacakan Status Pesanan Tamu
- **Status Pengujian**: **LULUS** (8 passed dari 8 suite Playwright; 113 passed backend; 7 passed vitest).
