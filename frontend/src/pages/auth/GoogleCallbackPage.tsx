import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authChannel } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const authToken = searchParams.get('auth_token') || searchParams.get('token');
  const authError = searchParams.get('auth_error') || searchParams.get('error');
  const retryAfter = searchParams.get('retry_after');
  const nextParam = searchParams.get('next');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('cde_auth_token', authToken);
      authChannel?.postMessage({ type: 'LOGIN', timestamp: Date.now() });
      try {
        localStorage.setItem('cde_auth_sync', JSON.stringify({ event: 'LOGIN', timestamp: Date.now() }));
      } catch {}

      refetchUser().then(() => {
        const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
          ? nextParam
          : '/akun';
        navigate(safeNext, { replace: true });
      });
    } else if (authError) {
      switch (authError) {
        case 'ROLE_NOT_PERMITTED':
          setErrorMessage(
            'Akun Google hanya diperuntukkan bagi pelanggan butik. Akun staf (Admin & SPI) wajib masuk menggunakan kredensial internal butik.'
          );
          break;
        case 'EMAIL_NOT_VERIFIED':
          setErrorMessage('Alamat email Google Anda belum diverifikasi oleh pihak Google.');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          setErrorMessage(
            `Terlalu banyak percobaan autentikasi Google. Harap tunggu ${retryAfter || 'beberapa'} detik sebelum mencoba lagi.`
          );
          break;
        case 'INVALID_STATE':
          setErrorMessage('Sesi otentikasi Google telah kedaluwarsa atau tidak valid demi alasan keamanan.');
          break;
        default:
          setErrorMessage('Autentikasi Google dibatalkan atau terjadi kegagalan koneksi.');
          break;
      }
    } else {
      // If reached without token or error, redirect to /masuk
      navigate('/masuk', { replace: true });
    }
  }, [authToken, authError, retryAfter, nextParam, navigate, refetchUser]);

  return (
    <AuthLayout
      title="Autentikasi Google"
      subtitle="Menghubungkan akun Google dengan sistem butik CD'E Pearls Lombok."
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {errorMessage ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 space-y-5 shadow-sm text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
                Gagal Masuk dengan Google
              </h2>
              <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-2 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <Link
              to="/masuk"
              className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-[#D9B877]" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-center space-y-4 shadow-sm">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-[#E6DDD0]" />
              <div className="absolute inset-0 rounded-full border-2 border-[#8A6A2F] border-t-transparent animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Menyelesaikan Masuk Google...
            </h2>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877]">
              Menyinkronkan sesi butik Anda. Harap tunggu sebentar.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default GoogleCallbackPage;
