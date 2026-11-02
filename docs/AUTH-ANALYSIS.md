# Analisis Keamanan & Arsitektur Otentikasi: `localStorage` Bearer Token vs `httpOnly` Cookie + CSRF

Dokumen analisis ini disusun untuk membandingkan dua pendekatan otentikasi web modern dalam konteks aplikasi **CD'E Pearls Lombok**, mencakup trade-off keamanan (XSS vs CSRF), kompatibilitas multi-domain/mobile, dan rekomendasi implementasi.

---

## 1. Perbandingan Ringkas

| Parameter | Pendekatan A: `localStorage` + Bearer Token | Pendekatan B: `httpOnly` Cookie + CSRF Token | Pendekatan Terpasang (Hybrid CD'E Pearls) |
| :--- | :--- | :--- | :--- |
| **Penyimpanan Klien** | Browser `localStorage` (JavaScript accessible) | Cookie dengan flag `HttpOnly; Secure; SameSite` | Dual: Header `Authorization: Bearer` + `withCredentials` |
| **Ketahanan terhadap XSS** | Rentan: Skrip injeksi dapat membaca token langsung | Sangat Baik: JavaScript tidak dapat membaca isi cookie | Dilindungi CSP ketat, sanitasi input, Turnstile, & enkripsi |
| **Ketahanan terhadap CSRF** | Kebal CSRF: Browser tidak otomatis menyertakan header | Membutuhkan proteksi CSRF aktif (`X-XSRF-TOKEN`) | Validasi CSRF Sanctum aktif saat cookie digunakan |
| **Arsitektur Multi-Domain** | Sangat Fleksibel (Vercel ke Railway / domain berbeda) | Kaku: Terblokir third-party cookie policy jika domain berbeda | Mendukung deployment terpisah maupun satu domain |
| **Dukungan Mobile App** | Alami & Standar (iOS/Android HTTP headers) | Membutuhkan CookieJar / manajemen session manual | Siap untuk integrasi Flutter / Android CLI |
| **Revokasi Sesi** | Server-side revokasi (Sanctum database tokens) | Server-side revokasi session / cookie expiration | Instan: `$user->tokens()->delete()` pada logout & reset |

---

## 2. Analisis Mendalam: Keamanan (Security Posture)

### A. Risiko XSS (Cross-Site Scripting)
- **`localStorage`**: Jika terjadi celah XSS (misalnya injeksi HTML atau dependensi npm pihak ketiga yang terkompromi), token dapat dicuri oleh skrip penyerang via `localStorage.getItem('cde_auth_token')`.
- **`httpOnly` Cookie**: Cookie dengan atribut `HttpOnly` diisolasi di tingkat browser networking engine. JavaScript tidak memiliki akses API ke cookie tersebut, sehingga token tidak dapat diekstraksi meskipun terjadi XSS.
- **Mitigasi di CD'E Pearls**:
  1. Sanitasi ketat di backend FormRequest dan Blade/React rendering.
  2. Implementasi Cloudflare Turnstile pada checkout tamu & form otentikasi.
  3. Format token Sanctum dengan SHA-256 hash di database server.

### B. Risiko CSRF (Cross-Site Request Forgery)
- **`localStorage`**: Karena token dikirim manual melalui header HTTP `Authorization: Bearer <token>`, peramban web **tidak akan pernah** melampirkan token tersebut secara otomatis saat ada permintaan lintas situs (cross-origin form submission atau iframe). Oleh karena itu, serangan CSRF secara inheren tidak mempan.
- **Cookie**: Peramban mengirim cookie secara otomatis pada setiap permintaan ke domain target. Tanpa proteksi token CSRF ganda (`X-XSRF-TOKEN`), pengguna yang sedang login dapat dieksploitasi oleh situs jahat untuk melakukan transaksi tanpa disadari.

---

## 3. Analisis Mendalam: Arsitektur & Deployment (Architecture Posture)

### A. Tantangan Multi-Domain & Modern Jamstack
Dalam skenario hosting modern di mana:
- Frontend di-host di CDN global (misalnya `cdepearls.vercel.app` atau `cdepearls.pages.dev`).
- Backend API di-host di PaaS (misalnya `api-cdepearls.up.railway.app`).

Peramban modern (Safari ITP, Google Chrome Privacy Sandbox, Firefox ETP) memperlakukan cookie lintas domain tersebut sebagai **Third-Party Cookie** dan memblokirnya secara default. Jika aplikasi hanya mengandalkan `httpOnly` cookie tanpa custom domain terpadu, login akan gagal total di peramban pengguna.

Bearer token via `localStorage` / HTTP headers bekerja secara independen tanpa mempedulikan perbedaan origin antara frontend dan backend.

### B. Kesiapan Aplikasi Mobile & Agen Otomatisasi
Aplikasi seluler (Android CLI, Flutter, React Native) serta agen backend tidak beroperasi dengan model peramban berbasis cookie. Menggunakan Bearer token standar RFC 6750 memungkinkan satu backend API melayani web SPA, mobile apps, dan API konsumen secara seragam.

---

## 4. Rekomendasi & Desain Hibrida CD'E Pearls

Aplikasi CD'E Pearls mengadopsi **Desain Hibrida (Defense-in-Depth)**:
1. **Frontend Client (`apiClient`)**:
   - Mengirim header `Authorization: Bearer <token>` jika tersedia.
   - Mengaktifkan `withCredentials: true` dan `withXSRFToken: true` untuk memanfaatkan session cookie saat di-deploy di bawah root domain yang sama (`.cdepearls.com`).
2. **Lifecycle & Revokasi Token**:
   - Authorization code OAuth berumur 60 detik, single-use, di-hash SHA-256 (U-5).
   - Password reset langsung menghanguskan seluruh token Sanctum aktif milik akun terkait (U-6).
   - Akun yang dibekukan (`status = 'frozen'`) langsung ditolak di semua rute API melalui middleware `EnsureAccountNotFrozen` (U-7).
   - Sinkronisasi status logout antar tab peramban via `BroadcastChannel('cde_auth_channel')`.

