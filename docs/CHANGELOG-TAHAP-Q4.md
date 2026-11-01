# CHANGELOG TAHAP Q-4: KOREKSI HEADER & RESTORASI BILAH ATAS MOBILE

Dokumen ini mencatat keputusan penyesuaian file dan restorasi struktur header mobile pada Tahap Q-4, mengoreksi kekeliruan pemahaman instruksi pada Tahap Q-3 sebelumnya.

---

## 1. Ringkasan Keputusan Desain

- **Bilah Pengumuman Biru Navy Atas**:
  - Tiga baris pesan (*"Pengiriman Gratis & Berasuransi..."*, *"Konsultasi Private via WhatsApp"*, *"Sertifikat Gemologi Keaslian 100%..."*) **hanya dihapus pada viewport mobile (< 1024px)**.
  - Pada viewport desktop (`lg` ke atas / $\ge 1024\text{px}$), bilah pengumuman biru navy tetap dipertahankan seperti semula.
  - Elemen pengumuman dibungkus kondisi responsif sehingga tidak ada node DOM atau stylesheet yang bocor ke viewport mobile.
- **Header Mobile**:
  - Header mobile satu baris dipertahankan secara utuh: Logo CD'E Pearls di sebelah kiri dan tombol pencarian berbentuk pil (`[data-slot="search-pill"]`) di sebelah kanan.
  - Perilaku: transparan saat posisi gulir `y = 0`, bertransisi menjadi `bg-background/90` dengan efek `backdrop-blur-md` saat scroll $> 8\text{px}$, serta tetap menempel (`sticky top-0 z-50`).
  - Tidak ada duplikasi kontrol navigasi (Favorit, Keranjang, Akun, Bahasa, dan Tema tetap berada di bottom navigation bar dan hub `/akun`).

---

## 2. Matriks Keputusan File (Patch Q-3 -> Q-4)

Sebelum pemulihan, seluruh diff Q-3 telah diarsipkan secara permanen di [`docs/q3-header-removal.patch`](file:///d:/CODING/CDEPearls/docs/q3-header-removal.patch).

| File | Keputusan | Alasan Teknis |
| :--- | :---: | :--- |
| `frontend/src/layouts/SiteLayout.tsx` | **Sebagian** | Mengembalikan komponen header mobile (logo + search pill), menyembunyikan bilah pengumuman biru navy khusus di bawah breakpoint `lg` (`!isDesktop`), mengoptimalkan pendeteksi dark section via `IntersectionObserver` agar tidak memicu long-task. |
| `frontend/src/layouts/DashboardLayout.tsx` | **Dikembalikan** | Menghapus floating action button menu darurat Q-3; mengembalikan header dashboard standar dengan tombol profil, bahasa, dan logout yang terintegrasi. |
| `frontend/src/layouts/SpiDashboardLayout.tsx` | **Dikembalikan** | Mengembalikan tata letak baris atas SPI dashboard standar; membatalkan perubahan tombol melayang Q-3. |
| `frontend/src/components/home/MobileMarketplaceHome.tsx` | **Sebagian** | Menghapus logo ganda di dalam banner hero; mengembalikan search pill tepat di bawah banner; memperbaiki inkonsistensi gambar kategori Kalung (`hero_pearl_shell.jpg`) dan placeholder perhiasan netral. |
| `frontend/src/pages/customer/CartPage.tsx` | **Dikembalikan** | Membatalkan penambahan baris judul manual + tombol kembali yang disisipkan saat header mobile dihapus di Q-3. |
| `frontend/src/pages/customer/CheckoutPage.tsx` | **Dikembalikan** | Mengembalikan tata letak standar checkout tanpa baris judul buatan Q-3. |
| `frontend/src/pages/customer/WishlistPage.tsx` | **Dikembalikan** | Mengembalikan tata letak wishlist standar tanpa modifikasi tombol kembali lokal. |
| `frontend/src/pages/customer/OrderTrackingPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/CertificateCheckPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/ProductDetailPage.tsx` | **Dikembalikan** | Menghapus tombol bulat melayang (kembali dan keranjang badge) di atas galeri yang dibuat di Q-3; mengembalikan navigasi detail produk standar. |
| `frontend/src/pages/customer/Studio3DPage.tsx` | **Dikembalikan** | Mengembalikan tata letak 3D studio tanpa header overlay lokal Q-3. |
| `frontend/src/pages/customer/AboutPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/EducationPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/ContactPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/HelpCenterPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/PrivacyPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/TermsPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/error/AccessDeniedPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/error/NotFoundPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/error/ServerErrorPage.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/components/auth/AuthLayout.tsx` | **Dikembalikan** | Membatalkan baris judul manual lokal Q-3. |
| `frontend/src/pages/customer/CatalogPage.tsx` | **Dikembalikan** | Membatalkan toolbar lekat buatan Q-3; menyelaraskan pencarian dengan header mobile terpadu. |
| `frontend/package.json` | **Dipertahankan** | Mengunci versi wrangler pada `3.114.16` untuk kestabilan deployment Cloudflare Workers. |
| `docs/DEPLOY.md` | **Dipertahankan** | Dokumentasi alur deployment Cloudflare Pages / Workers, manajemen env, dan verifikasi pasca-deploy. |
| `frontend/scripts/generate-version.js` | **Dipertahankan** | Script build-time otomatis untuk menghasilkan hash commit git, branch, dan timestamp build. |
| `frontend/public/version.json` | **Dipertahankan** | Ditambahkan ke `.gitignore` agar tidak mengotori riwayat git saat proses build lokal maupun CI. |
| `frontend/src/pages/customer/GuestAccountHub.tsx` | **Dipertahankan** | Penanda versi build dan commit hash pada kartu informasi akun tamu. |
| `frontend/e2e/smoke-prod.spec.ts` | **Dipertahankan** | Pengujian integrasi live production untuk verifikasi version header dan healthcheck. |
| `frontend/e2e/word-budget.spec.ts` | **Dipertahankan** | Pengujian kepatuhan anggaran kata (word budget) pada seluruh tampilan mobile. |
| `frontend/e2e/mobile-animation.spec.ts` | **Dipertahankan** | Pengujian performa animasi mobile dan pencegahan long task (> 50ms) dengan throttling CPU 4x. |
| `frontend/e2e/mobile-header-kept.spec.ts` | **Dipertahankan** | Suite pengujian otomatis Playwright untuk memvalidasi keberadaan header mobile (logo + search pill) dan ketiadaan bar biru navy di mobile. |

---

## 3. Hasil Pengujian Verifikasi Q-4

- `e2e/mobile-header-kept.spec.ts`: **LULUS** (11/11 tests across 320px, 360px, 390px, 414px, 600px, 768px, 1023px, and 1280px).
- `e2e/word-budget.spec.ts`: **LULUS** (8/8 tests).
- `e2e/mobile-animation.spec.ts`: **LULUS** (5/5 tests, verifikasi kelancaran transisi gulir dan batasan task CPU di bawah 50ms).
- Tangkapan Layar: 20 file screenshot tersimpan di `docs/screens/tahap-q4/` untuk resolusi 360x740 dan 390x844.

