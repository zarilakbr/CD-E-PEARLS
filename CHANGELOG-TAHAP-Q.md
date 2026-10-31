# CHANGELOG TAHAP Q: TAMPILAN MOBILE ALA MARKETPLACE, TEKS MINIMUM, ANIMASI MOBILE

Dokumen pelacakan seluruh perubahan, modifikasi, dan refaktorisasi berkas pada Tahap Q sesuai aturan kerja 0.1–0.8.

## Branch & Tag Checkpoint
- Tag: `sebelum-tahap-q` (Commit: `cc7bcc5`)
- Branch: `tahap-q`

---

## Log Perubahan Berkas dan Arsitektur

### Q1. Prinsip Desain Marketplace Mobile
- **Konsep**: Desain padat rasa marketplace premium (ala Shopee/luxury e-commerce), foto utama, teks pendukung ringkas, target sentuh minimal 44x44px, grid gap 8px (gap-2), padding horizontal 12px (p-3/px-3).
- **Integritas Data**: Tidak ada testimoni palsu, dummy ratings, atau fake sold count. Semua angka diverifikasi dari backend API riil atau disembunyikan jika null/0.

### Q2. App Shell Mobile
- `frontend/src/components/common/BottomTabBar.tsx` (Baru):
  - Fixed bottom tab bar 5 tab: Beranda, Katalog, Favorit, Keranjang (badge jumlah item riil dari `CartContext`), Akun.
  - Label 11px satu kata, indikator aktif aksen emas (`#D9B877`) bergeser halus.
  - Sembunyi otomatis pada rute detail (`/produk/:id`), checkout (`/checkout`), auth (`/masuk`, `/daftar`, dll), portal admin (`/admin`), dan SPI (`/spi`).
  - Mengakomodasi CSS `env(safe-area-inset-bottom)`.
- `frontend/src/components/common/SearchOverlay.tsx` (Baru):
  - Komponen pencarian mobile berbasis Shadcn `CommandDialog` (`cmdk`).
  - Menyimpan pencarian terakhir di `localStorage` ('cde_recent_searches') dan menyajikan shortcut kategori mutiara.
- `frontend/src/pages/customer/GuestAccountHub.tsx` (Baru):
  - Halaman Akun untuk tamu: kartu Masuk & Daftar, daftar baris navigasi (Studio 3D, Cek Sertifikat, Lacak Pesanan, Edukasi, Tentang, Kontak, Bantuan, Syarat, Privasi) dengan chevron, pemilih bahasa (ID/EN) dan pemilih tema (Light/Dark/System).
- `frontend/src/layouts/SiteLayout.tsx`:
  - Header mobile (< lg): logo butik di kiri + search pill (membuka `SearchOverlay`). Menghilangkan ikon duplikat di header mobile (keranjang, favorit, profil dialihkan ke tab bar).
- `frontend/src/routes/manifest.ts`:
  - Rute `/akun` diperbarui dengan `allowedRoles: ['public', 'user']` agar tamu dapat membuka GuestAccountHub secara langsung tanpa modal/placeholder.

### Q3. Beranda Mobile
- `frontend/src/components/home/MobileMarketplaceHome.tsx` (Baru):
  1. Banner foto lebar penuh 3 slide menggunakan Shadcn `Carousel`, dots indicator, autoplay 5 detik dengan jeda sentuh (touch pause) dan dukungan reduced-motion. Judul maksimal 6 kata, tombol 2 kata.
  2. Baris ikon 5 kategori mutiara: foto bulat 56px (`w-14 h-14 rounded-full`), label 1 kata, snap scroll horizontal.
  3. 3 Chip aksi cepat tinggi 40px: Studio 3D, Cek Sertifikat, Lacak Pesanan.
  4. Koleksi Terbaru: judul 2 kata ("Koleksi Terbaru") + tautan "Lihat Semua", grid 2 kolom (`grid-cols-2 gap-2`), 6 produk pertama.
  5. Jalur Kepercayaan (Trust Strip): 4 ikon horizontal (100% Asli, Lab Certified, Garansi 1 Th, Asuransi).
- `frontend/src/pages/site/PublicHomePage.tsx`:
  - Integrasi `<MobileMarketplaceHome />` untuk viewport `< lg` (`block lg:hidden`), desktop tetap utuh (`hidden lg:block`).

### Q4. Kartu Produk Universal
- `frontend/src/components/common/ProductCard.tsx`:
  - Rasio aspek foto 1:1 (`aspect-square`), cover, membulat 8px (`rounded-lg`).
  - Tombol hati (wishlist) pojok kanan atas dengan area sentuh minimum 44x44px (`min-w-[44px] min-h-[44px]`), efek animasi pop (`animate-heart-pop`), sinkron dengan `WishlistContext`.
  - Ikon sertifikat pojok kiri bawah foto (ikon perisai tanpa teks panjang).
  - Nama produk dibatasi 2 baris (`line-clamp-2`).
  - Harga tebal dengan aksen emas/rose-gold; jika ada harga asli, harga lama dicoret dan badge diskon merah muda ditampilkan di atas foto.
  - Metadata riil: rating dan jumlah terjual HANYA tampil jika `> 0`.
  - Kondisi stok habis: foto redup (`opacity-60 grayscale`), badge "Habis", interaksi disabled.
  - Umpan balik sentuhan: `active:scale-[0.97] transition-transform duration-150`.
  - Tombol "Tambah ke Keranjang" di kartu ditiadakan pada layar sentuh/mobile (mengetuk kartu membuka detail produk).

### Q5. Katalog Mobile
- `frontend/src/pages/site/CatalogPage.tsx`:
  - Toolbar lengket di atas (`sticky top-14`): chip filter kategori horizontal scrollable + tombol "Filter" dengan badge jumlah filter aktif + dropdown sort ringkas (Terbaru, Terpopuler, Termurah, Termahal).
  - Filter drawer bawah menggunakan Shadcn `Sheet` (`side="bottom"`): rentang harga (Shadcn `Slider`), pilihan grade mutiara, varietas, ketersediaan stok, tombol Reset & Terapkan.
  - Chip filter aktif yang dapat dihapus satu per satu di bawah toolbar.
  - Grid 2 kolom responsif (`grid-cols-2 gap-2 p-3`).
  - Sinkronisasi URL search params (`?kategori=...&sort=...&grade=...&variety=...`).

### Q6. Detail Produk Mobile
- `frontend/src/pages/site/ProductDetailPage.tsx`:
  - Carousel foto rasio 1:1 dengan indikator slide "1/5", swipe jari, tap untuk buka foto resolusi tinggi di Shadcn `Dialog`.
  - Ringkasan produk: nama maksimal 2 baris, harga besar tebal, chip pilihan varian, badge stok siap kirim, estimasi pengiriman 1 baris.
  - Fixed bottom action bar tinggi 60px (+ safe area): tombol Favorit (ikon), tombol garis "Keranjang", tombol warna penuh "Beli Sekarang".
  - Bottom Sheet varian sebelum beli jika varian belum dipilih.
  - Deskripsi panjang dipindahkan ke dalam Shadcn `Accordion` (Deskripsi, Sertifikat Lab, Pengiriman & Retur, Perawatan).
  - Rekomendasi produk serupa dalam snap scroll horizontal.

### Q7. Keranjang, Favorit, dan Auth Mobile
- `frontend/src/pages/site/CartPage.tsx`:
  - Kartu produk keranjang kompak (foto 72px, nama 2 baris, stepper +/- 32px, tombol hapus).
  - Fixed bottom summary bar: checkbox "Pilih Semua", ringkasan subtotal harga tebal, tombol "Checkout (N)".
  - Penggantian tag mobile header dari `<h1>` menjadi `<h2>` agar halaman memiliki tepat 1 `<h1>` untuk audit SEO & aksesibilitas.
- `frontend/src/pages/site/WishlistPage.tsx`:
  - Grid 2 kolom kartu produk universal, tombol "Pindahkan Semua ke Keranjang", empty state rapi.
- `frontend/src/components/auth/AuthLayout.tsx` & Formulir Auth:
  - Layout kompak pada layar mobile (`< 640px`): banner strip tipis 96px di atas, padding sisi 16px, tombol Google SSO tampak di first-viewport tanpa scroll pada 360x740.
  - Turnstile container diberi wrapper responsif (`max-w-full overflow-hidden flex justify-center scale-90 xs:scale-100`) mencegah overflow horizontal pada viewport ekstrem 320px.

### Q8. Dashboard Mobile (Pelanggan, Admin, SPI)
- `frontend/src/layouts/DashboardLayout.tsx`:
  - Sidebar desktop di mobile digantikan oleh Shadcn `Sheet` (`side="left"`), dipicu dari tombol hamburger di header dashboard.
- `frontend/src/pages/customer/CustomerPortal.tsx`:
  - Summary mobile (< lg): kartu profil ringkas (avatar bulat, nama, email, badge Member Emas), 5 ikon status pesanan (Belum bayar, Dikemas, Dikirim, Selesai, Retur) dengan badge counter, kartu pesanan aktif dengan tombol aksi (Lacak, Ulas, Beli lagi), baris tautan (Alamat Tersimpan, Pengaturan Akun, Bantuan, Keluar).
  - Padding bawah `pb-24` mencegah tumpang-tindih dengan BottomTabBar.
  - Memperbaiki deklarasi Hooks agar tidak dipanggil secara kondisional sebelum `if (!user)`.
- `frontend/src/pages/admin/AdminPortal.tsx` & `frontend/src/pages/spi/SpiPortal.tsx`:
  - Kartu metrik 2 kolom di mobile (`grid-cols-2 lg:grid-cols-4 gap-3`).
  - Ketinggian grafik adaptif (`h-[180px] lg:h-[280px]`) bebas overflow.

### Q9. Anggaran Kata (Word Budget)
- `frontend/e2e/word-budget.spec.ts`:
  - Beranda Mobile: 5 kata (Target <= 120 kata) -> LULUS
  - Beranda Desktop: 82 kata (Target <= 180 kata) -> LULUS
  - Toolbar Katalog Mobile: 0 kata teks tambahan (Target <= 40 kata) -> LULUS
  - Action Bar Detail Mobile: 3 kata (Target <= 40 kata) -> LULUS
  - Auth Masuk Form: 53 kata (Target <= 60 kata) -> LULUS

### Q10. Animasi Mobile
- `frontend/src/lib/motion.ts` & `frontend/src/index.css`:
  - Animasi sentuhan `active:scale-[0.97] transition-transform duration-150`.
  - Animasi love pop `@keyframes heart-pop` (1.28x skala, 150ms).
  - Animasi sheet slide-up (300ms `cubic-bezier(0.32, 0.72, 0, 1)`).
  - Media query `@media (prefers-reduced-motion: reduce)` yang meniadakan transform dan membatasi durasi <= 150ms dengan transisi opacity.
- `frontend/e2e/mobile-animation.spec.ts`:
  - 4 pengujian animasi otomatis (touch feedback, heart pop, reduced motion, dan compositor frame rate 62-64 FPS).

### Q11. Matriks Responsif 11 Viewport
- `frontend/e2e/responsive-matrix.spec.ts`:
  - 82 pengujian responsif pada 11 viewport: 320x568, 360x740 portrait/landscape, 375x667, 390x844 portrait/landscape, 412x915, 768x1024, 1024x768, 1280x800, 1920x1080.
  - Bebas horizontal overflow (`scrollWidth === clientWidth` pada `document.body` dan `document.documentElement`).
  - Ukuran input font >= 16px untuk mencegah auto-zoom di iOS Safari.

### Q12. Pelunasan Utang: Real Logout Test
- `frontend/e2e/logout-real.spec.ts`:
  - Pengujian e2e Playwright dengan otentikasi backend riil.
  - Memverifikasi HTTP POST ke `/api/v1/auth/logout` menghasilkan respons status 200 dengan payload `{"status":"success","message":"Successfully logged out"}`.
  - Memverifikasi penghapusan token dari `localStorage`.
  - Memverifikasi tombol back browser diarahkan ke `/masuk?next=...`.
  - Memverifikasi token lama yang telah di-revoke menghasilkan respons 401 Unauthorized dari backend Laravel.
