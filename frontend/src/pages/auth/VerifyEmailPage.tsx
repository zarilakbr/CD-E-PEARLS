import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { authApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refetchUser } = useAuth();

  const id = searchParams.get('id');
  const hash = searchParams.get('hash');
  const expires = searchParams.get('expires');
  const signature = searchParams.get('signature');

  const hasVerifyParams = Boolean(id && hash);

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>(
    hasVerifyParams ? 'verifying' : 'idle'
  );
  const [message, setMessage] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const isProd = import.meta.env.PROD;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (isProd ? '' : '1x00000000000000000000AA');
  const isTurnstileConfigured = Boolean(siteKey);

  // Auto-verify if params exist
  useEffect(() => {
    if (!hasVerifyParams || !id || !hash) return;

    let isMounted = true;
    setStatus('verifying');

    const queryParams: Record<string, string> = {};
    if (expires) queryParams.expires = expires;
    if (signature) queryParams.signature = signature;

    authApi
      .verifyEmail(id, hash, queryParams)
      .then(async (res) => {
        if (!isMounted) return;
        setStatus('success');
        setMessage(res.message || 'Email Anda berhasil diverifikasi!');
        await refetchUser();
        // Redirect to dashboard in 3 seconds
        setTimeout(() => {
          navigate('/akun', { replace: true });
        }, 3000);
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.'
        );
      });

    return () => {
      isMounted = false;
    };
  }, [hasVerifyParams, id, hash, expires, signature, navigate, refetchUser]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    try {
      const res = await authApi.resendVerification(turnstileToken || undefined);
      setResendSuccess(true);
      if (res.verification_link_dev) {
        setDevVerificationUrl(res.verification_link_dev);
      }
      setCooldown(60);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.');
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle="Keamanan akun koleksi butik mutiara laut selatan CD'E Pearls Lombok."
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {status === 'verifying' && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-center space-y-4 shadow-sm">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-[#E6DDD0]" />
              <div className="absolute inset-0 rounded-full border-2 border-[#8A6A2F] border-t-transparent animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Memverifikasi Email Anda...
            </h2>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877]">
              Menghubungkan ke sistem otentikasi CD'E Pearls. Mohon tunggu sebentar.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Verifikasi Berhasil!
            </h2>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877] leading-relaxed">
              {message || 'Email Anda telah berhasil diverifikasi. Mengalihkan ke dashboard Anda dalam 3 detik...'}
            </p>
            <Link
              to="/akun"
              className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-all cursor-pointer"
            >
              <span>Lanjut ke Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877]" />
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 space-y-5 shadow-sm text-center">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                status === 'error'
                  ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                  : 'bg-[#12263A] text-[#D9B877]'
              }`}
            >
              {status === 'error' ? <AlertCircle className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
                {status === 'error' ? 'Verifikasi Gagal' : 'Verifikasi Alamat Email'}
              </h2>
              <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-2 leading-relaxed">
                {status === 'error'
                  ? message
                  : user?.email
                  ? `Kami telah mengirimkan tautan verifikasi ke ${user.email}. Silakan periksa kotak masuk atau spam email Anda.`
                  : 'Silakan periksa kotak masuk email Anda dan klik tautan verifikasi yang telah kami kirimkan.'}
              </p>
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs">
                ✓ Tautan verifikasi baru berhasil dikirimkan ke email Anda.
              </div>
            )}

            {devVerificationUrl && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-left text-xs break-all">
                <span className="font-semibold block mb-1">Tautan Verifikasi (Lingkungan Uji):</span>
                <a
                  href={devVerificationUrl}
                  className="text-blue-600 underline font-mono text-[11px]"
                >
                  {devVerificationUrl}
                </a>
              </div>
            )}

            {isTurnstileConfigured && (
              <div className="pt-2 flex justify-center">
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => {}}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: 'auto', size: 'normal' }}
                />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {cooldown > 0
                    ? `Kirim Ulang Email (${cooldown}d)`
                    : 'Kirim Ulang Email Verifikasi'}
                </span>
              </button>

              <Link
                to="/masuk"
                className="inline-flex items-center justify-center w-full min-h-[44px] px-4 py-2 text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline cursor-pointer"
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
