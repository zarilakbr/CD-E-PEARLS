export type LoginErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TURNSTILE'
  | 'RATE_LIMITED'
  | 'ACCOUNT_FORBIDDEN'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface LoginErrorResult {
  code: LoginErrorCode;
  message: string;
  retryAfter?: number;
  isTurnstile?: boolean;
  isUnverified?: boolean;
}

/**
 * Resolves API/network errors into distinct Indonesian user-facing error messages
 * without leaking account existence (anti-enumeration security principle).
 */
export function resolveLoginError(err: any): LoginErrorResult {
  // 1. Network Error (no response received or network error code)
  const isNetworkFailure =
    (!err?.response && (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error')) ||
    err?.isNetworkError === true ||
    err?.error === 'NETWORK_ERROR';

  if (isNetworkFailure) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    };
  }

  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data ?? (typeof err === 'object' && err !== null ? err : {});
  const errorCode = data?.error ?? err?.error;
  const serverMsg = data?.message ?? err?.message;

  // 2. 401 Unauthorized (Wrong password or unregistered email) - Anti-enumeration
  if (status === 401 || errorCode === 'INVALID_CREDENTIALS') {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau kata sandi tidak valid. Silakan periksa kembali.',
    };
  }

  // 3. 422 Unprocessable Entity (Turnstile verification failure)
  if (status === 422 || errorCode === 'INVALID_TURNSTILE') {
    return {
      code: 'INVALID_TURNSTILE',
      message: 'Verifikasi keamanan Turnstile gagal atau kadaluarsa. Silakan coba lagi.',
      isTurnstile: true,
    };
  }

  // 4. 429 Too Many Requests (Rate limit hit)
  if (status === 429 || errorCode === 'TOO_MANY_REQUESTS') {
    const retry = data?.retry_after ?? data?.retry_after_seconds ?? err?.retryAfter ?? 60;
    return {
      code: 'RATE_LIMITED',
      message: `Terlalu banyak percobaan masuk. Demi keamanan, silakan tunggu ${retry} detik sebelum mencoba lagi.`,
      retryAfter: retry,
    };
  }

  // 423 Locked (Administrative or brute force temporary lock)
  if (status === 423 || errorCode === 'ACCOUNT_LOCKED') {
    const retry = data?.retry_after_seconds ?? err?.retryAfter ?? 900;
    return {
      code: 'RATE_LIMITED',
      message: serverMsg || `Akun Anda terkunci sementara. Silakan coba lagi dalam beberapa menit atau hubungi administrator.`,
      retryAfter: retry,
    };
  }

  // 5. 403 Forbidden (Account inactive, frozen by SPI, or unverified)
  if (
    status === 403 ||
    errorCode === 'ACCOUNT_FROZEN' ||
    errorCode === 'ACCOUNT_INACTIVE' ||
    errorCode === 'ACCOUNT_UNVERIFIED'
  ) {
    if (errorCode === 'ACCOUNT_FROZEN') {
      return {
        code: 'ACCOUNT_FORBIDDEN',
        message: serverMsg || 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.',
      };
    }
    if (errorCode === 'ACCOUNT_UNVERIFIED') {
      return {
        code: 'ACCOUNT_FORBIDDEN',
        message: serverMsg || 'Akun Anda belum diverifikasi. Silakan periksa email Anda atau kirim ulang tautan verifikasi.',
        isUnverified: true,
      };
    }
    return {
      code: 'ACCOUNT_FORBIDDEN',
      message: serverMsg || 'Akun Anda tidak aktif atau dinonaktifkan. Silakan hubungi layanan pelanggan.',
    };
  }

  // 6. 5xx Server Error (500, 502, 503, 504)
  if (typeof status === 'number' && status >= 500 && status <= 599) {
    return {
      code: 'SERVER_ERROR',
      message: 'Terjadi gangguan pada sistem server kami. Silakan coba beberapa saat lagi.',
    };
  }

  // Fallback (Safe default: anti-enumeration)
  return {
    code: 'UNKNOWN',
    message: serverMsg || 'Email atau kata sandi tidak valid. Silakan periksa kembali.',
  };
}
