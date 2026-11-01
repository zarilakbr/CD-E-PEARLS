import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  nextPath?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, nextPath }) => {
  const { t, i18n } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [canResendVerify, setCanResendVerify] = useState(false);

  // Turnstile production check (Bagian 4.a)
  const isProd = import.meta.env.PROD;
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const siteKey = (isLocalhost && !isProd)
    ? '1x00000000000000000000AA'
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY || (isProd ? '' : '1x00000000000000000000AA'));
  const isTurnstileConfigured = Boolean(siteKey);

  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  // Check Google OAuth provider
  useEffect(() => {
    let isMounted = true;
    authApi.getProviders().then((res) => {
      if (isMounted) setIsGoogleEnabled(res.google);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer for 429
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setServerError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  // Handle focus on first error
  useEffect(() => {
    if (errors.email) {
      setFocus('email');
    } else if (errors.password) {
      setFocus('password');
    }
  }, [errors, setFocus]);

  const targetNext = nextPath || searchParams.get('next') || '';
  const safeNext = targetNext.startsWith('/') && !targetNext.startsWith('//') ? targetNext : '';

  const onSubmit = async (data: LoginFormData) => {
    if (isProd && !isTurnstileConfigured) {
      setServerError('Layanan verifikasi Turnstile belum dikonfigurasi di lingkungan produksi.');
      return;
    }

    setServerError(null);
    setIsLoading(true);

    try {
      const effectiveToken = turnstileToken || ((isLocalhost && !isProd) ? '1x00000000000000000000AA' : undefined);
      const res = await login({
        email: data.email,
        password: data.password,
        remember: data.remember,
        turnstile_token: effectiveToken,
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Resolve role strictly from server via authApi.getMe() or authenticated response
          const currentUser = await authApi.getMe().catch(() => res.user || null);
          const role = currentUser?.role || res.user?.role || 'user';
          if (role === 'spi') {
            navigate(safeNext && safeNext.startsWith('/spi') ? safeNext : '/spi', { replace: true });
          } else if (role === 'admin') {
            navigate(safeNext && safeNext.startsWith('/admin') ? safeNext : '/admin', { replace: true });
          } else if (safeNext && !safeNext.startsWith('/admin') && !safeNext.startsWith('/spi') && !safeNext.startsWith('/masuk') && !safeNext.startsWith('/daftar')) {
            navigate(safeNext, { replace: true });
          } else {
            navigate('/akun', { replace: true });
          }
        }
      } else {
        if (res.error === 'ACCOUNT_UNVERIFIED') {
          setCanResendVerify(true);
          setServerError(res.message || 'Akun Anda belum diverifikasi. Silakan periksa email Anda atau kirim ulang tautan verifikasi.');
        } else if (res.error === 'TOO_MANY_REQUESTS') {
          const retry = res.retryAfter || 60;
          setRetryCountdown(retry);
          setServerError(`Terlalu banyak percobaan. Harap tunggu ${retry} detik sebelum mencoba kembali.`);
        } else if (res.error === 'ACCOUNT_FROZEN') {
          setServerError(res.message || 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.');
        } else {
          setServerError(res.message || 'Email atau kata sandi tidak valid');
        }
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      if (err.response?.status === 429) {
        const retry = responseData?.retry_after || 60;
        setRetryCountdown(retry);
        setServerError(`Terlalu banyak percobaan. Harap tunggu ${retry} detik sebelum mencoba kembali.`);
      } else if (responseData?.error === 'ACCOUNT_FROZEN') {
        setServerError(responseData.message || 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.');
      } else if (responseData?.error === 'ACCOUNT_UNVERIFIED') {
        setCanResendVerify(true);
        setServerError(responseData.message || 'Akun Anda belum diverifikasi. Silakan periksa kotak masuk email Anda.');
      } else {
        setServerError(responseData?.message || 'Email atau kata sandi tidak valid');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const email = emailInputRef.current?.value;
      const res = await authApi.resendVerification(turnstileToken || undefined, email);
      setServerError(null);
      alert(res.message || 'Tautan verifikasi email berhasil dikirim ulang.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const { ref: formEmailRef, ...emailRest } = register('email');

  return (
    <div className="space-y-4">
      {/* Alert Error Region dengan aria-live */}
      <div aria-live="polite" aria-atomic="true">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="leading-relaxed flex-1">
                {serverError}
                {retryCountdown !== null && (
                  <span className="block font-semibold mt-1">
                    Coba lagi dalam {retryCountdown} detik...
                  </span>
                )}
              </p>
            </div>
            {canResendVerify && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isLoading}
                className="self-start text-[11px] font-semibold text-[#8A6A2F] dark:text-[#D9B877] underline hover:opacity-80 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Kirim ulang email verifikasi</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Google OAuth Button */}
      {isGoogleEnabled && (
        <>
          <a
            href={authApi.getGoogleLoginUrl()}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E6DDD0] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-[#FBF8F3] dark:hover:bg-white/10 text-[#12263A] dark:text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t('auth.loginWithGoogle', 'Masuk dengan Google')}</span>
          </a>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E6DDD0] dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white dark:bg-[#12263A] px-2 text-[#4A5666] dark:text-white/60">
                atau alamat email & kata sandi
              </span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              ref={(el) => {
                formEmailRef(el);
                emailInputRef.current = el;
              }}
              {...emailRest}
              placeholder="nama@email.com"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-base sm:text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F] dark:focus:ring-[#D9B877] transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#12263A] dark:text-white/90">
              Kata Sandi
            </label>
            <Link
              to="/lupa-kata-sandi"
              className="text-[11px] font-medium text-[#8A6A2F] dark:text-[#D9B877] hover:underline"
            >
              Lupa Sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder="••••••••••"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-base sm:text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F] dark:focus:ring-[#D9B877] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#4A5666] dark:text-white/50 hover:text-[#12263A] dark:hover:text-white cursor-pointer"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="login-remember-me"
            type="checkbox"
            {...register('remember')}
            className="w-4 h-4 text-[#8A6A2F] border-[#E6DDD0] rounded focus:ring-[#8A6A2F]"
          />
          <label htmlFor="login-remember-me" className="ml-2 text-xs text-[#4A5666] dark:text-white/70 cursor-pointer">
            Ingat saya di perangkat ini
          </label>
        </div>

        {/* Turnstile Widget (dengan scaling aman di layar 320px) */}
        {isTurnstileConfigured ? (
          <div className="w-full max-w-full overflow-hidden flex justify-center py-1">
            <div className="scale-90 xs:scale-100 origin-center max-w-full">
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                  language: i18n.language?.startsWith('en') ? 'en' : 'id',
                  size: 'normal',
                }}
              />
            </div>
          </div>
        ) : isProd ? (
          <p className="text-xs text-amber-600 text-center">
            Peringatan: VITE_TURNSTILE_SITE_KEY belum diatur di lingkungan produksi.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || (retryCountdown !== null && retryCountdown > 0) || (isProd && !isTurnstileConfigured)}
          className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] font-semibold text-xs tracking-wider uppercase hover:bg-[#1A3652] dark:hover:bg-[#E5C98F] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
        >
          {isLoading ? (
            <span>Memverifikasi Akun...</span>
          ) : (
            <>
              <span>{t('auth.login', 'Masuk ke Butik')}</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877] dark:text-[#12263A]" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-[#4A5666] dark:text-white/70">
            Belum memiliki akun butik?{' '}
            <Link
              to={safeNext ? `/daftar?next=${encodeURIComponent(safeNext)}` : '/daftar'}
              className="font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
