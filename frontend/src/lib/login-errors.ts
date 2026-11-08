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

let hasHadSuccessfulConnection = false;

export function markConnectionSuccessful(): void {
  hasHadSuccessfulConnection = true;
}

export function resetConnectionState(): void {
  hasHadSuccessfulConnection = false;
}

export function hasPreviousSuccessfulConnection(): boolean {
  return hasHadSuccessfulConnection;
}

export interface ResolveLoginErrorOptions {
  wasPreviouslyConnected?: boolean;
}

/**
 * Resolves API/network errors into distinct Indonesian user-facing error messages
 * without leaking account existence (anti-enumeration security principle).
 *
 * Handles HTTP 429 rate limits, including empty responses or CORS failures
 * caused by upstream rate-limiters (e.g., Hostinger 429 without CORS headers)
 * when a previous request in the session succeeded.
 */
export function resolveLoginError(err: any, options?: ResolveLoginErrorOptions): LoginErrorResult {
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data ?? (typeof err === 'object' && err !== null ? err : {});
  const errorCode = data?.error ?? err?.error;
  const serverMsg = data?.message ?? err?.message;

  // 1. Explicit 429 Too Many Requests (Rate limit hit)
  if (status === 429 || errorCode === 'TOO_MANY_REQUESTS' || errorCode === 'RATE_LIMITED') {
    const retry = data?.retry_after ?? data?.retry_after_seconds ?? err?.retryAfter;
    const message = retry
      ? `Terlalu banyak percobaan masuk. Demi keamanan, silakan tunggu ${retry} detik sebelum mencoba lagi.`
      : 'Terlalu banyak permintaan. Mohon tunggu beberapa saat.';

    return {
      code: 'RATE_LIMITED',
      message,
      retryAfter: typeof retry === 'number' ? retry : undefined,
    };
  }

  // 2. 423 Locked (Administrative or brute force temporary lock)
  if (status === 423 || errorCode === 'ACCOUNT_LOCKED') {
    const retry = data?.retry_after_seconds ?? err?.retryAfter ?? 900;
    return {
      code: 'RATE_LIMITED',
      message: serverMsg || `Akun Anda terkunci sementara. Silakan coba lagi dalam beberapa menit atau hubungi administrator.`,
      retryAfter: retry,
    };
  }

  // 3. Network or CORS Error handling
  const wasConnected = options?.wasPreviouslyConnected ?? hasHadSuccessfulConnection ?? err?.wasConnected;
  const isCorsOrNetworkDrop =
    (!err?.response && (
      err?.code === 'ERR_NETWORK' ||
      err?.message === 'Network Error' ||
      err?.code === 'ERR_CORS' ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('cors'))
    )) ||
    err?.isNetworkError === true ||
    err?.error === 'NETWORK_ERROR';

  if (isCorsOrNetworkDrop) {
    // If the client was previously connected without issues, an empty response / CORS failure
    // indicates an upstream rate limit (e.g. Hostinger WAF returning 429 without CORS headers)
    if (wasConnected) {
      return {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak permintaan. Mohon tunggu beberapa saat.',
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    };
  }

  // 4. 401 Unauthorized (Wrong password or unregistered email) - Anti-enumeration
  if (status === 401 || errorCode === 'INVALID_CREDENTIALS') {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau kata sandi tidak valid. Silakan periksa kembali.',
    };
  }

  // 5. 422 Unprocessable Entity (Turnstile verification failure)
  if (status === 422 || errorCode === 'INVALID_TURNSTILE') {
    return {
      code: 'INVALID_TURNSTILE',
      message: 'Verifikasi keamanan Turnstile gagal atau kadaluarsa. Silakan coba lagi.',
      isTurnstile: true,
    };
  }

  // 6. 403 Forbidden (Account inactive, frozen by SPI, or unverified)
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

  // 7. 5xx Server Error (500, 502, 503, 504)
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
