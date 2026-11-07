import { describe, it, expect } from 'vitest';
import { resolveLoginError } from '../lib/login-errors';

describe('Tahap V2 - Butir 6: Pesan Galat Login Tanpa Membocorkan Akun (Anti-Enumeration)', () => {
  // 1. Kasus 401: Salah sandi atau email tidak terdaftar
  it('1. 401 Salah Kredensial: menghasilkan pesan seragam tanpa membocorkan eksistensi akun', () => {
    // 1a. Simulasi respon ketika email tidak terdaftar di database
    const errUnregistered = {
      response: {
        status: 401,
        data: {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Email atau kata sandi tidak valid',
        },
      },
    };
    const resUnregistered = resolveLoginError(errUnregistered);
    expect(resUnregistered.code).toBe('INVALID_CREDENTIALS');
    expect(resUnregistered.message).toBe('Email atau kata sandi tidak valid. Silakan periksa kembali.');

    // 1b. Simulasi respon ketika password salah untuk email yang ada di database
    const errWrongPassword = {
      response: {
        status: 401,
        data: {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Email atau kata sandi tidak valid',
        },
      },
    };
    const resWrongPassword = resolveLoginError(errWrongPassword);
    expect(resWrongPassword.code).toBe('INVALID_CREDENTIALS');
    expect(resWrongPassword.message).toBe('Email atau kata sandi tidak valid. Silakan periksa kembali.');

    // Keduanya harus identik sempurna (Anti-Enumeration)
    expect(resUnregistered.message).toBe(resWrongPassword.message);
  });

  // 2. Kasus 422: Turnstile gagal atau kedaluwarsa
  it('2. 422 Turnstile: pesan galat verifikasi keamanan Turnstile', () => {
    const errTurnstile = {
      response: {
        status: 422,
        data: {
          success: false,
          error: 'INVALID_TURNSTILE',
          message: 'Verifikasi keamanan gagal.',
        },
      },
    };
    const resTurnstile = resolveLoginError(errTurnstile);
    expect(resTurnstile.code).toBe('INVALID_TURNSTILE');
    expect(resTurnstile.message).toContain('Turnstile');
    expect(resTurnstile.message).toContain('coba lagi');
    expect(resTurnstile.isTurnstile).toBe(true);
  });

  // 3. Kasus 429: Batas percobaan masuk terlampaui (Rate Limit)
  it('3. 429 Batas: pesan galat rate limit dengan penunjuk detik tunggu', () => {
    const errRateLimit = {
      response: {
        status: 429,
        data: {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: 'Terlalu banyak permintaan untuk Login. Silakan tunggu 45 detik.',
          retry_after: 45,
        },
      },
    };
    const resRateLimit = resolveLoginError(errRateLimit);
    expect(resRateLimit.code).toBe('RATE_LIMITED');
    expect(resRateLimit.retryAfter).toBe(45);
    expect(resRateLimit.message).toContain('45 detik');
    expect(resRateLimit.message).toContain('Terlalu banyak percobaan masuk');
  });

  // 4. Kasus 403: Status akun khusus (Dibekukan SPI / Nonaktif / Belum Terverifikasi)
  it('4. 403 Akun Dibekukan: pesan pencegahan akses oleh Satuan Pengawas Internal (SPI)', () => {
    const errFrozen = {
      response: {
        status: 403,
        data: {
          success: false,
          error: 'ACCOUNT_FROZEN',
          message: 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.',
        },
      },
    };
    const resFrozen = resolveLoginError(errFrozen);
    expect(resFrozen.code).toBe('ACCOUNT_FORBIDDEN');
    expect(resFrozen.message).toContain('dibekukan');
    expect(resFrozen.message).toContain('Satuan Pengawas Internal');
  });

  it('4b. 403 Akun Nonaktif: pesan hubungi layanan pelanggan', () => {
    const errInactive = {
      response: {
        status: 403,
        data: {
          success: false,
          error: 'ACCOUNT_INACTIVE',
          message: 'Akun Anda tidak aktif. Silakan hubungi layanan pelanggan untuk informasi lebih lanjut.',
        },
      },
    };
    const resInactive = resolveLoginError(errInactive);
    expect(resInactive.code).toBe('ACCOUNT_FORBIDDEN');
    expect(resInactive.message).toContain('tidak aktif');
  });

  it('4c. 403 Akun Belum Verifikasi Email: penanda isUnverified aktif', () => {
    const errUnverified = {
      response: {
        status: 403,
        data: {
          success: false,
          error: 'ACCOUNT_UNVERIFIED',
          message: 'Akun Anda belum diverifikasi.',
        },
      },
    };
    const resUnverified = resolveLoginError(errUnverified);
    expect(resUnverified.code).toBe('ACCOUNT_FORBIDDEN');
    expect(resUnverified.isUnverified).toBe(true);
    expect(resUnverified.message).toContain('belum diverifikasi');
  });

  // 5. Kasus 5xx: Server Error
  it('5. 5xx Server Error: pesan gangguan server umum tanpa membocorkan rincian teknis internal', () => {
    const err500 = {
      response: {
        status: 500,
        data: {
          message: 'Server Error',
        },
      },
    };
    const res500 = resolveLoginError(err500);
    expect(res500.code).toBe('SERVER_ERROR');
    expect(res500.message).toContain('gangguan pada sistem server kami');

    const err503 = {
      response: {
        status: 503,
        data: {},
      },
    };
    const res503 = resolveLoginError(err503);
    expect(res503.code).toBe('SERVER_ERROR');
    expect(res503.message).toContain('gangguan pada sistem server kami');
  });

  // 6. Kasus Jaringan: Network Error / Offline / Timeout
  it('6. Jaringan Error: pesan ramah koneksi internet saat gagal menghubungi host', () => {
    const errNetwork = {
      code: 'ERR_NETWORK',
      message: 'Network Error',
    };
    const resNetwork = resolveLoginError(errNetwork);
    expect(resNetwork.code).toBe('NETWORK_ERROR');
    expect(resNetwork.message).toBe('Gagal terhubung ke server. Periksa koneksi internet Anda.');

    const errTimeout = {
      error: 'NETWORK_ERROR',
    };
    const resTimeout = resolveLoginError(errTimeout);
    expect(resTimeout.code).toBe('NETWORK_ERROR');
    expect(resTimeout.message).toContain('Periksa koneksi internet Anda');
  });
});
