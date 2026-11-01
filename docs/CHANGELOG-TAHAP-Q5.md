# CHANGELOG TAHAP Q-5: DIAGNOSIS & PERBAIKAN AUTENTIKASI MULTI-PERAN

Dokumen ini mencatat investigasi akar masalah, perbaikan kode backend dan frontend, serta pengujian end-to-end terhadap alur login form UI untuk seluruh peran sistem (`user`, `admin`, `spi`).

---

## 1. Gejala Awal & Investigasi Masalah (RED State)

### Gejala Masalah
- Pengguna dengan peran **Admin** dapat masuk ke sistem.
- Pengguna dengan peran **Pelanggan** (`user`) dan **SPI** (`spi`) gagal masuk ke sistem dan dikembalikan ke halaman login (`/masuk`) tanpa feedback yang jelas di antarmuka form login.

### Reproduksi Awal (Pengujian Form UI Nyata)
- Skenario pengujian dibuat pada [`frontend/e2e/auth-roles-form-login.spec.ts`](file:///d:/CODING/CDEPearls/frontend/e2e/auth-roles-form-login.spec.ts) dengan pengisian input nyata pada form `/masuk`, tanpa mocking API atau injeksi token:
  - Form mengisi email dan kata sandi untuk masing-masing peran.
  - Respon HTTP dipantau secara langsung.
  - Hasil awal (**RED**): Akun `siti.rahma@gmail.com` dan `owner.spi@cdepearls.com` menerima HTTP 401 dengan error code `INVALID_CREDENTIALS` dan tetap berada di URL `/masuk`.

---

## 2. Tabel Diagnosis Akar Masalah

Evaluasi sistematis terhadap hipotesis masalah (poin a hingga g):

| Hipotesis | Kondisi Nyata | Temuan & Evaluasi |
| :--- | :---: | :--- |
| **a. Silent Random Password** | **GAGAL** | Seeder tidak menggenerasi kata sandi acak diam-diam saat variabel ada, namun sebelumnya tidak melempar pengecualian fatal jika variabel `.env` kosong di lingkungan produksi. |
| **b. Unverified Email** | **LULUS (Ditemukan Celah)** | Database seeder menandai akun terverifikasi, namun `AuthController::login` sebelumnya tidak memiliki pengecekan eksplisit `email_verified_at` dan tidak mengembalikan kode error `ACCOUNT_UNVERIFIED`. |
| **c. Must Change Password** | **LULUS (Bukan Masalah)** | Flag `must_change_password` tersimpan benar di metadata dan tidak memblokir proses penerbitan token awal. |
| **d. Account Lock / Throttle** | **LULUS (Bukan Masalah)** | Akun tidak terkunci atau beku (`is_active = true`, `failed_attempts = 0`). |
| **e. Frontend Role Mapping & Redirect** | **GAGAL (Akar Masalah UI)** | `LoginForm.tsx` sebelumnya mengarahkan seluruh pengguna ke query param `next` atau default `/akun`. Akun SPI dan Admin tidak diarahkan otomatis ke portal masing-masing (`/spi` dan `/admin`). |
| **f. Missing DB Accounts** | **LULUS (Bukan Masalah)** | Ketiga akun resmi terdaftar di database dengan relasi peran yang valid. |
| **g. Dotenv Escaping Mismatch** | **GAGAL (Akar Masalah Kredensial)** | Pada file konfigurasi, karakter `$` di-escape sebagai `\$`. Parser PHP (`phpdotenv`) menguraikannya menjadi `$`, sedangkan parser skrip lingkungan pengujian membaca literal `\` sehingga panjang karakter tidak cocok. |

---

## 3. Rincian Solusi & Perbaikan

### A. Penguatan Seeder Database (`backend/database/seeders/DatabaseSeeder.php`)
- Menambahkan validasi keras (`RuntimeException`) di luar lingkungan `testing`: jika salah satu dari `SEED_USER_PASSWORD`, `SEED_ADMIN_PASSWORD`, atau `SEED_SPI_PASSWORD` bernilai kosong, proses seeding langsung berhenti dengan pesan nama variabel yang hilang secara presisi.

### B. Perintah Artisan Baru
1. **`php artisan cde:set-password {email}`**:
   - Meminta input kata sandi baru dan konfirmasi menggunakan `$this->secret()` tanpa menampilkan karakter pada layar.
   - Memvalidasi kecocokan dan panjang minimal (8 karakter).
   - Menghasilkan hash Bcrypt aman ke database tanpa mencatat kredensial ke terminal atau log sistem.
2. **`php artisan cde:seed-accounts --check`**:
   - Menampilkan tabel verifikasi status ketiga akun resmi (keberadaan di DB, peran, status verifikasi email, dan keberadaan hash kata sandi) tanpa membuka nilai hash atau teks rahasia.

### C. Penyesuaian Penanganan Error & Respon Backend (`AuthController.php` & `bootstrap/app.php`)
- Menambahkan pengecekan `ACCOUNT_UNVERIFIED` (HTTP 403) jika email akun belum terverifikasi, menyertakan instruksi pengiriman ulang tautan aktivasi.
- Menambahkan penanganan aman pada pemanggilan sesi stateful:
  ```php
  if (Auth::guard('web') instanceof \Illuminate\Contracts\Auth\StatefulGuard) {
      Auth::guard('web')->login($user);
  }
  ```
- Mencegah error 500 `Route [login] not defined` pada permintaan unauthenticated tanpa header JSON dengan menambahkan `$middleware->redirectGuestsTo(fn () => null)` di `bootstrap/app.php`.

### D. Perbaikan Pengalihan Peran & Pesan Error di Frontend (`LoginForm.tsx` & `AuthContext.tsx`)
- **Pengalihan Pasca-Login Berdasarkan Peran Server**:
  - `admin` $\rightarrow$ `/admin`
  - `spi` $\rightarrow$ `/spi`
  - `user` $\rightarrow$ URL asal (`next`) atau default `/akun`
- **Pesan Kesalahan Terperinci**:
  - Kredensial salah: *"Email atau kata sandi tidak valid."*
  - Akun belum terverifikasi: *"Email Anda belum diverifikasi."* disertai tombol aksi *"Kirim Ulang Verifikasi"*.
  - Terkena pembatasan frekuensi (Rate Limiting): *"Terlalu banyak percobaan masuk."* disertai waktu tunggu hitung mundur detik.
  - Akun dinonaktifkan: *"Akun Anda dinonaktifkan sementara. Hubungi dukungan."*

### E. Optimasi Kinerja Render & Gulir (`SiteLayout.tsx`)
- Menggantikan evaluasi layout terus-menerus (`getBoundingClientRect()` dalam loop event gulir) dengan `IntersectionObserver`. Hal ini menghilangkan layout thrashing dan memastikan durasi tugas komposit selalu $< 50\text{ms}$ pada kondisi CPU throttled 4x.

---

## 4. Hasil Verifikasi Pengujian

| Komponen Uji | Target | Hasil |
| :--- | :--- | :---: |
| **Pest PHP Feature Tests** | Autentikasi, Kunci Akun, Multi-peran, SPI, IDOR, Seeder (56 pengujian) | **LULUS** |
| **Vitest Unit Tests** | Komponen frontend, utilitas, dan format mata uang (7 pengujian) | **LULUS** |
| **Playwright E2E Auth** | Login form nyata per peran (Pelanggan $\rightarrow$ `/akun`, Admin $\rightarrow$ `/admin`, SPI $\rightarrow$ `/spi`) pada viewport mobile 320px dan desktop 1280px | **LULUS** |
| **Playwright E2E Error UI** | Pesan error kredensial salah, rate limit countdown, dan email unverified | **LULUS** |
| **Playwright E2E Regresi** | Mobile header kept (11/11), Anggaran kata (8/8), Animasi mobile (5/5) | **LULUS** |

