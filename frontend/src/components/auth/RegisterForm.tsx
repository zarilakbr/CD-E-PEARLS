import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const phoneRegex = /^(?:\+62|62|0)[2-9]\d{7,12}$/;

const registerSchema = z
  .object({
    name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().regex(phoneRegex, 'Format nomor telepon tidak valid (contoh: 08123456789)'),
    password: z
      .string()
      .min(10, 'Kata sandi minimal 10 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf besar')
      .regex(/[a-z]/, 'Wajib mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Anda harus menyetujui syarat & ketentuan dan kebijakan privasi',
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  nextPath?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, nextPath }) => {
  const { t } = useTranslation();
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);

  // Turnstile fail-closed check
  const isProd = import.meta.env.PROD;
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const siteKey = (isLocalhost && !isProd)
    ? '1x00000000000000000000AA'
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY || (isProd ? '' : '1x00000000000000000000AA'));
  const isTurnstileConfigured = Boolean(siteKey);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      terms: false as any,
    },
  });

  const passwordValue = watch('password') || '';

  // Calculate password strength score (0 to 4)
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  // Check Google OAuth status
  useEffect(() => {
    let isMounted = true;
    authApi.getProviders().then((res) => {
      if (isMounted) setIsGoogleEnabled(res.google);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Autofocus first error
  useEffect(() => {
    if (errors.name) setFocus('name');
    else if (errors.email) setFocus('email');
    else if (errors.phone) setFocus('phone');
    else if (errors.password) setFocus('password');
    else if (errors.password_confirmation) setFocus('password_confirmation');
  }, [errors, setFocus]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    if (isProd && !isTurnstileConfigured) {
      setServerError('Verifikasi keamanan Cloudflare tidak terkonfigurasi. Hubungi administrator butik.');
      return;
    }

    if (isTurnstileConfigured && !turnstileToken) {
      setServerError('Mohon selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.');
      return;
    }

    setIsLoading(true);

    try {
      const effectiveToken = turnstileToken || ((isLocalhost && !isProd) ? '1x00000000000000000000AA' : undefined);
      const result = await registerAuth({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        turnstile_token: effectiveToken,
      });

      if (result.success) {
        if (onSuccess) onSuccess();
        const nextParam = nextPath || searchParams.get('next');
        const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/verifikasi-email';
        navigate(safeNext, { replace: true });
      } else {
        setServerError(result.message || 'Pendaftaran gagal. Periksa data Anda.');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Terjadi kesalahan sistem saat mendaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const nextParam = nextPath || searchParams.get('next');
    window.location.href = authApi.getGoogleAuthUrl('user', nextParam || undefined);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{serverError}</div>
        </div>
      )}

      {/* Google Quick Button */}
      {isGoogleEnabled && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full min-h-[44px] flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.continueGoogle', 'Daftar dengan Google')}</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6DDD0] dark:border-white/10" />
            </div>
            <span className="relative bg-[#FBF8F3] dark:bg-[#0D1C2B] px-3 text-[11px] uppercase tracking-wider text-[#4A5666] dark:text-[#D9B877]/80">
              {t('common.or', 'atau dengan formulir')}
            </span>
          </div>
        </div>
      )}

      {/* Main Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Nama Lengkap */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-name"
            className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
          >
            {t('auth.fullName', 'Nama Lengkap')}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Contoh: Siti Nurhaliza"
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-base sm:text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                errors.name
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#E6DDD0] dark:border-white/10'
              }`}
            />
          </div>
          {errors.name && (
            <p id="register-name-error" className="text-[11px] text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
          >
            {t('auth.email', 'Alamat Email')}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="nama@domain.com"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-base sm:text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                errors.email
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#E6DDD0] dark:border-white/10'
              }`}
            />
          </div>
          {errors.email && (
            <p id="register-email-error" className="text-[11px] text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Nomor Telepon */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-phone"
            className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
          >
            {t('auth.phone', 'Nomor WhatsApp / Seluler')}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="08123456789"
              {...register('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'register-phone-error' : undefined}
              className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-base sm:text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                errors.phone
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#E6DDD0] dark:border-white/10'
              }`}
            />
          </div>
          {errors.phone && (
            <p id="register-phone-error" className="text-[11px] text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Kata Sandi */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
          >
            {t('auth.password', 'Kata Sandi Baru')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimal 10 karakter (huruf besar, kecil & angka)"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="register-password-strength"
              className={`w-full min-h-[44px] pl-10 pr-10 py-2 text-base sm:text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                errors.password
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#E6DDD0] dark:border-white/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5666] hover:text-[#12263A] dark:hover:text-[#FBF8F3] p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {passwordValue.length > 0 && (
            <div id="register-password-strength" className="space-y-1 pt-1">
              <div className="flex gap-1 h-1.5 w-full bg-[#E6DDD0]/50 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strengthScore <= 2
                      ? 'w-1/3 bg-red-500'
                      : strengthScore <= 3
                      ? 'w-2/3 bg-amber-500'
                      : 'w-full bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#4A5666] dark:text-[#D9B877]">
                <span>
                  Kekuatan:{' '}
                  {strengthScore <= 2 ? 'Lemah' : strengthScore <= 3 ? 'Sedang' : 'Kuat & Aman'}
                </span>
                <span>(Min 10 karakter + kombinasi)</span>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="text-[11px] text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Konfirmasi Kata Sandi */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-password-confirm"
            className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
          >
            {t('auth.confirmPassword', 'Ulangi Kata Sandi')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="register-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ketik ulang kata sandi yang sama"
              {...register('password_confirmation')}
              aria-invalid={Boolean(errors.password_confirmation)}
              aria-describedby={
                errors.password_confirmation ? 'register-password-confirm-error' : undefined
              }
              className={`w-full min-h-[44px] pl-10 pr-10 py-2 text-base sm:text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                errors.password_confirmation
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-[#E6DDD0] dark:border-white/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5666] hover:text-[#12263A] dark:hover:text-[#FBF8F3] p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p id="register-password-confirm-error" className="text-[11px] text-red-600 dark:text-red-400">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        {/* Checkbox Syarat & Ketentuan */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 text-xs text-[#4A5666] dark:text-[#D9B877] cursor-pointer">
            <input
              type="checkbox"
              {...register('terms')}
              className="mt-0.5 rounded-sm border-[#E6DDD0] text-[#12263A] focus:ring-[#8A6A2F] w-4 h-4 cursor-pointer"
            />
            <span className="leading-relaxed">
              Saya menyetujui{' '}
              <Link
                to="/syarat-ketentuan"
                target="_blank"
                className="text-[#8A6A2F] dark:text-[#D9B877] font-semibold underline hover:text-[#12263A]"
              >
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link
                to="/kebijakan-privasi"
                target="_blank"
                className="text-[#8A6A2F] dark:text-[#D9B877] font-semibold underline hover:text-[#12263A]"
              >
                Kebijakan Privasi
              </Link>{' '}
              butik CD'E Pearls Lombok.
            </span>
          </label>
          {errors.terms && (
            <p className="text-[11px] text-red-600 dark:text-red-400">{errors.terms.message}</p>
          )}
        </div>

        {/* Cloudflare Turnstile */}
        {isTurnstileConfigured && (
          <div className="pt-2 w-full max-w-full overflow-hidden flex justify-center">
            <div className="scale-90 xs:scale-100 origin-center max-w-full">
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setServerError('Verifikasi keamanan Cloudflare gagal.')}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: 'auto',
                  size: 'normal',
                }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (isTurnstileConfigured && !turnstileToken)}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-xs font-semibold cursor-pointer shadow-md"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Membuat Akun Koleksi...</span>
            </>
          ) : (
            <>
              <span>Daftar Akun Koleksi</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877]" />
            </>
          )}
        </button>
      </form>

      {/* Alternative Link to Login */}
      <div className="text-center pt-2 border-t border-[#E6DDD0] dark:border-white/10">
        <p className="text-xs text-[#4A5666] dark:text-[#D9B877]">
          Sudah memiliki akun koleksi?{' '}
          <Link
            to={`/masuk${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''}`}
            className="font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline"
          >
            Masuk ke Akun
          </Link>
        </p>
      </div>
    </div>
  );
};
