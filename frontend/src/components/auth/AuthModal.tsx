import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: 'user' | 'admin' | 'spi', name: string) => void;
  initialRole?: 'user' | 'admin' | 'spi';
  initialTab?: 'login' | 'register' | 'forgot';
}

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().min(8, 'Nomor telepon/WhatsApp minimal 8 digit'),
    password: z
      .string()
      .min(10, 'Kata sandi minimal 10 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf besar')
      .regex(/[a-z]/, 'Wajib mengandung minimal 1 huruf kecil')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    agree_terms: z.boolean().refine((val) => val === true, {
      message: 'Anda wajib menyetujui Ketentuan Layanan & Kebijakan Privasi',
    }),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  const { i18n } = useTranslation();
  const { resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [canResendVerify, setCanResendVerify] = useState(false);

  // Sync initialTab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setServerError(null);
      setServerSuccess(null);
      setCanResendVerify(false);
    }
  }, [isOpen, initialTab]);

  // Check Google OAuth availability from backend
  useEffect(() => {
    let isMounted = true;
    authApi.getProviders().then((res) => {
      if (isMounted) {
        setIsGoogleEnabled(res.google);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      agree_terms: true,
      address: '',
    },
  });

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setServerSuccess(null);
    setIsLoading(true);
    try {
      const res = await authApi.login({
        email: data.email,
        password: data.password,
        remember: data.remember,
        turnstile_token: turnstileToken || undefined,
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user.role, res.user.name);
        onClose();
      } else {
        setServerError(res.message || 'Login gagal.');
      }
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.error === 'ACCOUNT_UNVERIFIED') {
        setCanResendVerify(true);
      }
      setServerError(
        data?.message || 'Email atau kata sandi tidak cocok dengan catatan butik kami.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setServerSuccess(null);
    setIsLoading(true);
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        address: data.address,
        turnstile_token: turnstileToken || undefined,
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user.role, res.user.name);
        onClose();
      } else {
        setServerError(res.message || 'Pendaftaran gagal.');
      }
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || 'Gagal mendaftarkan akun. Periksa kembali format data Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);
    if (!forgotEmail) {
      setServerError('Harap masukkan alamat email Anda.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail, turnstileToken || undefined);
      setServerSuccess(res.message || 'Instruksi reset kata sandi telah dikirimkan ke email Anda.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Gagal memproses permohonan reset sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setServerError(null);
    setServerSuccess(null);
    try {
      const res = await authApi.resendVerification(turnstileToken || undefined);
      setServerSuccess(res.message || 'Tautan verifikasi email berhasil dikirim ulang.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength calculation
  const registerPwd = registerForm.watch('password');
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Kosong', score: 0, color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Lemah', score, color: 'bg-red-400' };
    if (score <= 4) return { label: 'Sedang', score, color: 'bg-amber-400' };
    return { label: 'Kuat (Aman)', score, color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(registerPwd);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#12263A]/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#12263A] rounded-3xl shadow-2xl border border-[#E6DDD0] dark:border-[#8A6A2F]/30 overflow-hidden my-6 max-h-[92vh] flex flex-col text-[var(--text)]">
        {/* Header Ribbon */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#F4F1EB] dark:border-white/10 bg-[#FBF8F3]/60 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#12263A] dark:bg-[#D9B877] flex items-center justify-center text-[#D9B877] dark:text-[#12263A]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                CD'E Pearls Lombok
              </span>
              <h2 id="auth-modal-title" className="font-serif text-xl font-semibold text-[#12263A] dark:text-white">
                {activeTab === 'login' && 'Masuk ke Akun'}
                {activeTab === 'register' && 'Daftar Akun Baru'}
                {activeTab === 'forgot' && 'Reset Kata Sandi'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#4A5666] dark:text-white/70 hover:text-[#12263A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-[#F4F1EB] dark:border-white/10 bg-[#FBF8F3]/30 dark:bg-white/5 px-6 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setServerError(null);
                setServerSuccess(null);
              }}
              className={`pb-2.5 text-xs font-semibold tracking-wider uppercase transition-colors relative cursor-pointer mr-6 ${
                activeTab === 'login'
                  ? 'text-[#12263A] dark:text-[#D9B877] border-b-2 border-[#8A6A2F] dark:border-[#D9B877]'
                  : 'text-[#4A5666] dark:text-white/60 hover:text-[#12263A] dark:hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setServerError(null);
                setServerSuccess(null);
              }}
              className={`pb-2.5 text-xs font-semibold tracking-wider uppercase transition-colors relative cursor-pointer ${
                activeTab === 'register'
                  ? 'text-[#12263A] dark:text-[#D9B877] border-b-2 border-[#8A6A2F] dark:border-[#D9B877]'
                  : 'text-[#4A5666] dark:text-white/60 hover:text-[#12263A] dark:hover:text-white'
              }`}
            >
              Pendaftaran Baru
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-[#12263A] dark:text-white">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 text-xs flex flex-col gap-2 animate-shake">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p className="leading-relaxed flex-1">{serverError}</p>
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

          {/* Server Success Alert */}
          {serverSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <p className="leading-relaxed">{serverSuccess}</p>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Optional Google OAuth Button */}
              {isGoogleEnabled && (
                <>
                  <a
                    href={authApi.getGoogleLoginUrl()}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#E6DDD0] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-[#FBF8F3] dark:hover:bg-white/10 text-[#12263A] dark:text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Masuk dengan Google</span>
                  </a>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#E6DDD0] dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                      <span className="bg-white dark:bg-[#12263A] px-2 text-[#4A5666] dark:text-white/60">
                        atau email & sandi
                      </span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                    <input
                      type="email"
                      {...loginForm.register('email')}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F] dark:focus:ring-[#D9B877] transition-all"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setServerError(null);
                        setServerSuccess(null);
                      }}
                      className="text-[11px] font-medium text-[#8A6A2F] dark:text-[#D9B877] hover:underline cursor-pointer"
                    >
                      Lupa Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...loginForm.register('password')}
                      placeholder="••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F] dark:focus:ring-[#D9B877] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5666] dark:text-white/50 hover:text-[#12263A] dark:hover:text-white cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    {...loginForm.register('remember')}
                    className="w-4 h-4 text-[#8A6A2F] border-[#E6DDD0] rounded focus:ring-[#8A6A2F]"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-xs text-[#4A5666] dark:text-white/70">
                    Ingat saya di perangkat ini
                  </label>
                </div>

                {/* Cloudflare Turnstile Widget */}
                <div className="flex justify-center py-1">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] font-semibold text-xs tracking-wider uppercase hover:bg-[#1A3652] dark:hover:bg-[#E5C98F] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isLoading ? (
                    <span>Memverifikasi Akun...</span>
                  ) : (
                    <>
                      <span>Masuk ke Butik</span>
                      <ArrowRight className="w-4 h-4 text-[#D9B877] dark:text-[#12263A]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type="text"
                    {...registerForm.register('name')}
                    placeholder="Contoh: Siti Rahmawati"
                    className="w-full pl-10 pr-4 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type="email"
                    {...registerForm.register('email')}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type="tel"
                    {...registerForm.register('phone')}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                </div>
                {registerForm.formState.errors.phone && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {registerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Kata Sandi (Min. 10 Karakter, Huruf Besar, Kecil, Angka)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerForm.register('password')}
                    placeholder="Kombinasi kuat..."
                    className="w-full pl-10 pr-10 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5666] dark:text-white/50 hover:text-[#12263A] dark:hover:text-white cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength meter */}
                {registerPwd && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                        style={{ width: `${Math.min(100, (pwdStrength.score / 5) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                      {pwdStrength.label}
                    </span>
                  </div>
                )}
                {registerForm.formState.errors.password && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerForm.register('password_confirmation')}
                    placeholder="Konfirmasi kata sandi"
                    className="w-full pl-10 pr-4 py-2 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                </div>
                {registerForm.formState.errors.password_confirmation && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {registerForm.formState.errors.password_confirmation.message}
                  </p>
                )}
              </div>

              <div className="flex items-start">
                <input
                  id="agree-terms"
                  type="checkbox"
                  {...registerForm.register('agree_terms')}
                  className="mt-0.5 w-4 h-4 text-[#8A6A2F] border-[#E6DDD0] rounded focus:ring-[#8A6A2F]"
                />
                <label htmlFor="agree-terms" className="ml-2 text-[11px] text-[#4A5666] dark:text-white/70 leading-snug">
                  Saya menyetujui Ketentuan Layanan & Kebijakan Privasi Butik CD'E Pearls Lombok.
                </label>
              </div>
              {registerForm.formState.errors.agree_terms && (
                <p className="text-[11px] text-red-600">
                  {registerForm.formState.errors.agree_terms.message}
                </p>
              )}

              {/* Turnstile Widget */}
              <div className="flex justify-center py-1">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] font-semibold text-xs tracking-wider uppercase hover:bg-[#1A3652] dark:hover:bg-[#E5C98F] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <span>Mendaftarkan Akun...</span>
                ) : (
                  <>
                    <span>Daftar Akun Pelanggan</span>
                    <ArrowRight className="w-4 h-4 text-[#D9B877] dark:text-[#12263A]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-[#4A5666] dark:text-white/70 leading-relaxed">
                Masukkan alamat email yang terdaftar. Tautan atau token penyetelan ulang kata sandi akan dikirimkan ke kotak masuk Anda.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#12263A] dark:text-white/90 mb-1">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5666] dark:text-white/50" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FBF8F3]/50 dark:bg-white/5 border border-[#E6DDD0] dark:border-white/15 rounded-xl text-xs text-[#12263A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2F]"
                  />
                </div>
              </div>

              {/* Turnstile Widget */}
              <div className="flex justify-center py-1">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setServerError(null);
                    setServerSuccess(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-white/20 text-xs font-semibold text-[#4A5666] dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Kembali ke Masuk
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold hover:bg-[#1A3652] disabled:opacity-50"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Tautan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
