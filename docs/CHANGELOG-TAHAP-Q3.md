# CHANGELOG TAHAP Q-3: Hapus Header/Navbar Atas di Mobile (< 1024px) & Infrastruktur Deploy

## Ringkasan Perubahan
Sesuai keputusan pemilik butik pada spesifikasi Tahap Q-3:
1. **Penghapusan Header / Navbar Mobile (< 1024px / < lg)**
   - Semua elemen `<header>`, bar atas, navbar, atau `[role="banner"]` disembunyikan/ditiadakan di seluruh layar mobile (`< 1024px`).
   - Konten halaman kini dimulai tepat di tepi atas layar (`y <= 16px` + safe-area-inset).
   - Seluruh offset/padding atas lama (`pt-14`, `top-14`, dsb) dieliminasi.
   - Meta `theme-color` disinkronkan dinamis dengan tema aktif (`#0B1622` untuk gelap, `#FBF8F3` untuk terang).

2. **Konsolidasi Kontrol Tunggal (Single Control per Function)**
   - **Logo**: Hanya hadir di halaman Beranda (`/`) pada banner hero kiri atas dengan gradien gelap halus. Halaman publik lainnya bersih tanpa logo di mobile.
   - **Pencarian**:
     - Beranda: Tombol pil pencarian di bawah banner hero yang memicu Dialog/Command pencarian instan (`SearchOverlay`).
     - Katalog: Toolbar pencarian sticky di posisi `top-0` yang menyatukan kolom input pencarian dan tombol filter modal.
     - Halaman lain: Akses pencarian diarahkan melalui tab navigasi Katalog.
   - **Dashboard (/admin, /spi, /akun)**:
     - Bar atas dashboard mobile dihilangkan.
     - Satu tombol bundar melayang (`rounded-full`) di pojok kiri atas membuka Sheet navigasi lengkap (Profil, Bahasa, Tema, dan Keluar).
   - **Halaman Dalam (Cart, Wishlist, Checkout, Tracking, dsb)**:
     - Satu baris judul konten memuat tombol kembali (ikon panah `<ArrowLeft />`) dan elemen heading primer `h1`.
     - Bukan bar: tanpa status sticky, tanpa latar belakang kontras, tanpa garis bawah, tanpa bayangan (mengikuti gulir halaman).
   - **Detail Produk**:
     - Tombol bulat melayang di atas galeri foto produk (tombol kembali di kiri atas, ikon tas belanja dengan badge di kanan atas).
     - Tombol favorit tetap terpusat eksklusif pada bilah aksi bawah (*bottom bar*).

3. **Infrastruktur Build & Deploy Cloudflare**
   - Mengunci versi `wrangler` pada devDependencies (`4.156.0`).
   - Penambahan skrip generator `frontend/scripts/generate-version.js` yang otomatis menghasilkan berkas `/version.json` saat proses build, memuat `commit`, `buildTime`, dan `version`.
   - Penambahan indikator versi commit dinamis pada footer Hub Akun Tamu (`GuestAccountHub.tsx`, `data-testid="app-version"`).
   - Dokumentasi variabel build Cloudflare, konfigurasi backend, dan arsitektur otentikasi Sanctum Bearer token di `docs/DEPLOY.md`.
   - Penambahan suite smoke test Playwright produksi di `frontend/e2e/smoke-prod.spec.ts`.

