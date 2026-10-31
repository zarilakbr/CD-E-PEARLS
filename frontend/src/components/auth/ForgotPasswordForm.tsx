import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useTranslation } from 'react-i18next';

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const isProd = import.meta.env.PROD;
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const siteKey = (isLocalhost && !isProd)
    ? '1x00000000000000000000AA'
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY || (isProd ? '' : '1x00000000000000000000AA'));
  const isTurnstileConfigured = Boolean(siteKey);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);

    if (isProd && !isTurnstileConfigured) {
      setServerError('Verifikasi keamanan Cloudflare tidak terkonfigurasi.');
      return;
    }

    if (isTurnstileConfigured && !turnstileToken) {
      setServerError('Selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.');
      return;
    }

    setIsLoading(true);

    try {
      const effectiveToken = turnstileToken || ((isLocalhost && !isProd) ? '1x00000000000000000000AA' : undefined);
      await authApi.forgotPassword({
        email: data.email,
        turnstile_token: effectiveToken,
      });

      setSuccessEmail(data.email);
      setCooldown(60);
    } catch (err: any) {
      // Security best practice: don't reveal whether user exists
      setSuccessEmail(data.email);
      setCooldown(60);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !successEmail) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword({
        email: successEmail,
        turnstile_token: turnstileToken || undefined,
      });
      setCooldown(60);
    } catch {
      setCooldown(60);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          {t('auth.forgotPasswordTitle', 'Atur Ulang Kata Sandi')}
        </h2>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] mt-1 font-light">
          {t('auth.forgotPasswordSubtitle', 'Masukkan email terdaftar untuk menerima instruksi pemulihan akun Anda.')}
        </p>
      </div>

      {successEmail ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 space-y-4 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Tautan Pemulihan Dikirim
            </h3>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-2 leading-relaxed">
              Tautan atur ulang kata sandi telah dikirim ke <strong>{successEmail}</strong> jika terdaftar di sistem CD'E Pearls.
              Silakan periksa kotak masuk atau folder spam Anda.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#E6DDD0] dark:border-white/10 text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0 ? `Kirim Ulang (${cooldown}d)` : 'Kirim Ulang Tautan'}
              </span>
            </button>

            <Link
              to="/masuk"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#D9B877]" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
              >
                {t('auth.email', 'Alamat Email Terdaftar')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@domain.com"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                  className={`w-full min-h-[44px] pl-10 pr-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-[#E6DDD0] dark:border-white/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p id="forgot-email-error" className="text-[11px] text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            {isTurnstileConfigured && (
              <div className="pt-2 flex justify-center">
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setServerError('Verifikasi keamanan Cloudflare gagal.')}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: 'auto', size: 'normal' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (isTurnstileConfigured && !turnstileToken)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all text-xs font-semibold cursor-pointer shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim Tautan...</span>
                </>
              ) : (
                <>
                  <span>Kirim Tautan Atur Ulang</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B877]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#E6DDD0] dark:border-white/10">
            <Link
              to="/masuk"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
