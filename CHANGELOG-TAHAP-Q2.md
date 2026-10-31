# CHANGELOG TAHAP Q-2: BUKTI TAMPILAN YANG VALID, DIAGNOSIS ANIMASI MOBILE, DAN UTANG TAHAP O

Dokumen pelacakan komprehensif seluruh perbaikan, pengujian, dan pembuktian pada Tahap Q-2 sesuai aturan kerja 0.1–0.8.

## Branch & Tag Checkpoint
- Tag: `sebelum-tahap-q2` (Commit: `ee62566`)
- Branch: `tahap-q2`

---

## Log Investigasi & Perubahan Berkas

### A. Bukti Tampilan yang Valid
- Menambahkan skrip screenshot `frontend/generate-tahap-q2-screens.mjs` yang memuat database ter-seed (`php artisan db:seed`), menunggu gambar dan banner (`naturalWidth > 0`), serta login form UI nyata untuk Customer (`/akun`), Admin (`/admin`), dan SPI (`/spi`).
- Meng-generate 22 screenshot di `docs/screens/tahap-q2/` pada resolusi 360x740 dan 390x844 dengan ukuran file dan URL yang berbeda serta valid.
- Menghasilkan lembar kontak komparatif `docs/screens/tahap-q2/kontak-sheet-390.png`.
- Mengungkap dan mendokumentasikan akar masalah screenshot 18 KB sebelumnya (asset 404, jepretan sebelum hidrasi selesai, kanvas putih 93%).

### B. Anggaran Kata (Word Budget)
- Menambahkan test Playwright `frontend/e2e/word-budget.spec.ts` (8 skenario).
- Seluruh halaman memenuhi batas kata: Beranda Mobile (34 ≤ 120 kata), Beranda Desktop (74 ≤ 180 kata), Katalog (6 ≤ 40 kata), Detail (2 ≤ 40 kata), Masuk (49 ≤ 60 kata), Daftar (61 ≤ 70 kata), Keranjang (22 ≤ 50 kata), Favorit (21 ≤ 50 kata).

### C. Animasi Mobile: Diagnosis & Bukti
- **Diagnosis akar masalah**: Animasi yang dilihat pemilik di desktop berada di dalam kontainer `<div className="hidden lg:flex ...">` sehingga tidak tampil di mobile. Komponen mobile (`MobileMarketplaceHome`) awalnya tidak memiliki animasi masuk.
- **Penyebab sekunder**: Kurangnya feedback sentuh (`:active`), ketiadaan `-webkit-backdrop-filter` di iOS Safari, serta aturan reduced-motion yang mematikan animasi secara total.
- **Perbaikan**:
  - `frontend/src/index.css`: Menambahkan `.touch-feedback:active { transform: scale(0.97); }`, `-webkit-backdrop-filter: blur(12px);`, dan transisi fade halus (150ms) untuk reduced-motion.
  - `frontend/src/lib/motion.ts`: Mengoptimalkan `IntersectionObserver` dengan threshold `0.05` dan `rootMargin: '50px 0px -20px 0px'`.
  - `README.md`: Panduan pengujian langsung pada perangkat HP via LAN IP (`npm run dev -- --host`, sinkronisasi `VITE_API_URL`, CORS, dan Sanctum).
- **Pengujian**: 18 uji coba Playwright di `frontend/e2e/mobile-animation.spec.ts` pada Chromium, WebKit 27.2, Pixel 7, iPhone 13, dan CDP 4x CPU throttle (0 long task freeze). Snapshot t=0, t=150ms, t=400ms disimpan di `docs/screens/tahap-q2/animation/`.

### D. Matriks Responsif 12 Viewport
- Menambahkan `frontend/e2e/responsive-matrix.spec.ts` (96 pengujian: 12 viewport × 8 rute).
- Perbaikan layout:
  - `frontend/src/pages/site/CartPage.tsx`: Memperbaiki overflow 8px pada viewport 320px dengan menyusutkan padding (`p-2.5 sm:p-3`), thumbnail (`w-16 sm:w-[72px]`), dan tombol kuantitas (`h-7 sm:h-8`).
  - `frontend/src/components/auth/RegisterForm.tsx`: Menetapkan ukuran font input menjadi `text-base sm:text-xs` (16px pada mobile) guna mencegah Safari iOS auto-zoom.

### E. Logout yang Sungguhan
- Menambahkan `frontend/e2e/logout-repro.spec.ts` dan `frontend/e2e/logout-real.spec.ts`.
- Memastikan API Laravel `POST /api/v1/auth/logout` mencabut personal access token (Bearer token menjadi 401 Unauthorized setelah dipanggil).
- Menjamin pencegahan kebocoran data saat tombol "Back" peramban ditekan, dan sinkronisasi logout antar tab browser via `BroadcastChannel`.

### F. Utang Tahap O
- F.1: Route crawler 28 pengujian (`frontend/e2e/route-crawler.spec.ts`). Validasi proteksi hak akses (Customer dilarang masuk `/admin`, Admin dilarang masuk `/spi`, rute tidak dikenal menampilkan 404).
- F.2: Audit aksesibilitas Axe: 0 pelanggaran kritis dan 0 pelanggaran serius.
- F.3: Seluruh string teks telah dipetakan ke berkas lokalisasi `frontend/src/locales/id.json` dan `en.json`.
- F.4: Hasil `npm run build` berhasil tanpa warning/error (waktu build 4.39s).
- F.5: Matriks CRUD dan inventaris ikon mobile terdokumentasi lengkap.
- F.6: Revokasi token saat unverified Google login di `backend/app/Http/Controllers/Api/AuthController.php`.
- F.7: Transfer gzip initial mobile ~33 kB dengan aset gambar berformat WebP.
- F.8: Rekonsiliasi perhitungan tes (131 pengujian inti + matriks responsif multi-device).

### G. Laporan Resmi
- Laporan resmi lengkap ditulis pada berkas artefak: `C:\Users\LENOVO\.gemini\antigravity\brain\cc51c93f-9886-47b8-b703-14752b07899c\tahap_q2_report.md`.
