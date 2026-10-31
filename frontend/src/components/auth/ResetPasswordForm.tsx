import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { useTranslation } from 'react-i18next';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Kata sandi minimal 10 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf besar')
      .regex(/[a-z]/, 'Wajib mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const isProd = import.meta.env.PROD;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (isProd ? '' : '1x00000000000000000000AA');
  const isTurnstileConfigured = Boolean(siteKey);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  });

  const passwordValue = watch('password') || '';

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

  if (!token || !email) {
    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-lg font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Tautan Tidak Valid atau Kedaluwarsa
        </h3>
        <p className="text-xs text-[#4A5666] dark:text-[#D9B877] leading-relaxed">
          Tautan atur ulang kata sandi tidak lengkap atau masa berlakunya telah habis demi alasan keamanan. Silakan ajukan permintaan baru.
        </p>
        <Link
          to="/lupa-kata-sandi"
          className="inline-flex items-center justify-center w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-all cursor-pointer"
        >
          Minta Tautan Baru
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
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
      await authApi.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        turnstile_token: turnstileToken || undefined,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || 'Gagal mengatur ulang kata sandi. Tautan mungkin telah kedaluwarsa.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          {t('auth.resetPasswordTitle', 'Kata Sandi Baru')}
        </h2>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] mt-1 font-light">
          Atur kata sandi baru untuk akun <strong>{email}</strong>.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 space-y-4 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Kata Sandi Berhasil Diperbarui
            </h3>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-2 leading-relaxed">
              Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.
            </p>
          </div>
          <Link
            to="/masuk"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-all cursor-pointer"
          >
            <span>Masuk dengan Kata Sandi Baru</span>
            <ArrowRight className="w-4 h-4 text-[#D9B877]" />
          </Link>
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
            {/* Kata Sandi Baru */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-password"
                className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
              >
                {t('auth.newPassword', 'Kata Sandi Baru')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimal 10 karakter kombinasi"
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="reset-password-strength"
                  className={`w-full min-h-[44px] pl-10 pr-10 py-2 text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
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
                <div id="reset-password-strength" className="space-y-1 pt-1">
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
                    <span>(Min 10 karakter + huruf besar, kecil & angka)</span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div className="space-y-1.5">
              <label
                htmlFor="reset-password-confirm"
                className="block text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]"
              >
                {t('auth.confirmPassword', 'Ulangi Kata Sandi Baru')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-password-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Ketik ulang kata sandi baru"
                  {...register('password_confirmation')}
                  aria-invalid={Boolean(errors.password_confirmation)}
                  aria-describedby={
                    errors.password_confirmation ? 'reset-password-confirm-error' : undefined
                  }
                  className={`w-full min-h-[44px] pl-10 pr-10 py-2 text-xs rounded-xl border bg-white dark:bg-[#12263A] text-[#12263A] dark:text-[#FBF8F3] placeholder:text-[#4A5666]/60 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F] transition-all ${
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
                <p id="reset-password-confirm-error" className="text-[11px] text-red-600 dark:text-red-400">
                  {errors.password_confirmation.message}
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
                  <span>Menyimpan Kata Sandi Baru...</span>
                </>
              ) : (
                <>
                  <span>Simpan Kata Sandi Baru</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B877]" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
