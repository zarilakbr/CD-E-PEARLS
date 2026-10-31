# CHANGELOG TAHAP O: PERBAIKAN RESPONSIF DAN AUDIT KEAMANAN

Sesuai aturan kerja 0.6 dan Bagian 5: Semua perbaikan elemen yang rusak pada viewport tertentu dicatat di berkas ini.

## [Tahap O] - 2026-10-31

### 1. Perbaikan Header & Navbar (SiteLayout.tsx)
- **Viewport Terdampak**: 320px, 375px, 414px (Mobile Kecil & Standar) serta 1024px (Tablet Landscape).
- **Masalah**:
  - Pada viewport mobile 320px, kontrol sisi kanan navbar (Language ID/EN, Theme Switch 56px, Wishlist, Cart, tombol Masuk, dan tombol Daftar) berjejer dalam satu baris flex tanpa wrap sehingga lebar header mencapai 481px (overflow 161px melampaui lebar layar 320px).
  - Pada viewport 1024px, input pencarian header `max-w-xs lg:max-w-sm` tanpa `min-w-0` menyebabkan total elemen header mencapai 1044px (overflow 20px melampaui 1024px).
- **Tindakan Perbaikan**:
  - Pada layar mobile (< 640px / `sm`), kontrol Bahasa (ID/EN) dan Theme Switch dialihkan ke dalam Mobile Drawer navigasi (hamburger menu), dan tombol "Daftar" disembunyikan di header utama namun tetap tersedia penuh di dalam Mobile Drawer.
  - Ditambahkan baris kontrol Pengaturan Bahasa dan Tema di bagian bawah Mobile Drawer khusus tampilan mobile (`sm:hidden`).
  - Ditambahkan kelas `min-w-0 max-w-[170px]` pada wadah pencarian header untuk mencegah dorongan flex melampaui 1024px.
  - Memastikan seluruh kontrol sentuh tombol navbar memiliki dimensi minimal 44x44px atau padding sentuh proporsional.

### 2. Perbaikan Koleksi Produk (CatalogPage.tsx & PublicHomePage.tsx)
- **Viewport Terdampak**: 320px (Mobile Kecil) dan 1024px (Tablet Landscape).
- **Masalah**:
  - Lencana judul *"Haute Joaillerie Atelier • Katalog Lengkap"* dengan `tracking-[0.16em]` dan `uppercase` memiliki lebar statis 376px, melampaui kontainer layar 320px (kontainer 288px).
  - Toolbar sortir dan filter flex-nowrap di mobile mendorong tepi layar.
  - Baris pagination di bagian bawah `CatalogPage.tsx` menggunakan `flex items-center justify-between` tanpa wrap sehingga teks counter dan grup 3 tombol berjejer mendesak lebar hingga 329px pada layar 320px (overflow 9px).
  - Pada viewport 1024px (`lg`), layout grid etalase produk menggunakan `lg:grid-cols-3` (pada katalog dengan sidebar 3-kolom) dan `lg:grid-cols-4` (pada beranda) yang mendesak tombol "Tambah" kartu produk keluar batas viewport (`scrollWidth` 1041px–1044px).
- **Tindakan Perbaikan**:
  - Menambahkan kelas `max-w-full overflow-hidden truncate` dan `shrink-0` pada ikon Sparkles serta menyesuaikan tracking pada viewport mobile.
  - Menambahkan kelas `flex-wrap` dan batas `max-w-[170px] sm:max-w-none` pada elemen `<select>` pengurutan di toolbar mobile.
  - Mengubah baris pagination katalog menjadi `flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left` sehingga tersusun rapi secara vertikal pada layar 320px tanpa overflow horizontal.
  - Mengadaptasi grid responsif pada viewport `lg` (1024px): `CatalogPage.tsx` menggunakan `lg:grid-cols-2 xl:grid-cols-3` dan `PublicHomePage.tsx` menggunakan `lg:grid-cols-3 xl:grid-cols-4`, memberikan ruang kartu yang proporsional dan menghilangkan horizontal overflow (1024px scrollWidth tepat 1024px).


### 3. Perbaikan Keamanan Backend (Turnstile, Rate Limiting, OAuth, Signed URL)
- **Turnstile Service**: Diimplementasikan mode fail-closed. Menolak token dummy uji `1x00000000000000000000AA` dan secret yang tidak tervalidasi pada lingkungan production.
- **Rute Publik Sensitif**: Diterapkan verifikasi Turnstile wajib dengan respons seragam HTTP 422 dan pesan `Verifikasi keamanan gagal.` pada:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/resend-verification`
- **TrustCloudflareProxies**: Divalidasi dengan daftar rentang IP resmi Cloudflare (IPv4 dan IPv6). Header `CF-Connecting-IP` hanya dipercayai jika `services.cloudflare.trust=true` dan koneksi berasal dari IP Cloudflare resmi.
- **Eliminasi DoS Vector Kunci Akun Global**:
  - Dihapus penguncian akun global per-user (`$user->locked_until`) dan dihapus respons HTTP 423 Locked.
  - Diterapkan rate limiting kombinasi email+IP (`RateLimiter`) dan IP level.
  - Diterapkan respons seragam anti-enumerasi HTTP 401 `Email atau kata sandi tidak valid` untuk email tidak terdaftar maupun kata sandi salah.
  - Ditambahkan progressive delay backoff untuk IP yang berulang kali gagal.
- **Google OAuth State**: Diterapkan state parameter dengan TTL Cache 10 menit. State wajib cocok saat callback.
- **Signed URL Verifikasi Email**: Verifikasi email mewajibkan signature sementara yang valid (`URL::temporarySignedRoute()`) dengan masa berlaku 24 jam. Token verifikasi tidak pernah dicatat plain text ke log.
