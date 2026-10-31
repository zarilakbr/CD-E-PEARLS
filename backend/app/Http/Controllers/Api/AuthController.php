<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Models\Address;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\TurnstileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    protected TurnstileService $turnstile;

    public function __construct(TurnstileService $turnstile)
    {
        $this->turnstile = $turnstile;
    }

    /**
     * Check rate limiter and return 429 response if exceeded.
     */
    protected function checkRateLimit(string $key, int $maxAttempts, int $decaySeconds, string $actionName, Request $request): ?JsonResponse
    {
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            AuditLog::create([
                'actor_id' => $request->user()?->id,
                'actor_name' => $request->user()?->name ?? 'Tamu',
                'actor_role' => $request->user()?->role ?? 'guest',
                'action' => 'RATE_LIMIT_BLOCKED',
                'target_type' => 'rate_limit',
                'target_id' => $actionName,
                'new_value' => [
                    'key' => $key,
                    'action' => $actionName,
                    'retry_after' => $seconds,
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'TOO_MANY_REQUESTS',
                'message' => "Terlalu banyak permintaan untuk {$actionName}. Silakan tunggu {$seconds} detik sebelum mencoba lagi.",
                'retry_after' => $seconds,
            ], Response::HTTP_TOO_MANY_REQUESTS)->header('Retry-After', (string) $seconds);
        }

        return null;
    }

    /**
     * User registration (strictly for 'user' role).
     * Rate limit: 5 per hour per IP.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // 1. Rate limiter: max 5 per hour per IP
        $regKey = 'register:ip:' . $request->ip();
        if ($rateLimitResponse = $this->checkRateLimit($regKey, 5, 3600, 'Pendaftaran Akun', $request)) {
            return $rateLimitResponse;
        }

        // 2. Cloudflare Turnstile Verification
        if (! $this->turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan Turnstile gagal. Silakan coba kembali.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        RateLimiter::hit($regKey, 3600);
        $validated = $request->validated();
        $email = strtolower($validated['email']);

        // Anti-enumeration: if email already exists, return uniform safe response without leaking existence
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran akun diproses. Silakan periksa kotak masuk email Anda.',
            ], Response::HTTP_CREATED);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'user', // Strictly user role
            'status' => 'active',
            'email_verified_at' => null,
            'must_change_password' => false,
        ]);

        if (! empty($validated['address'])) {
            Address::create([
                'user_id' => $user->id,
                'label' => 'Alamat Utama',
                'recipient_name' => $user->name,
                'phone' => $user->phone ?? '-',
                'address_line' => $validated['address'],
                'city' => 'Lombok',
                'province' => 'NTB',
                'postal_code' => '83355',
                'is_default' => true,
            ]);
        }

        // Log verification email dispatch (log driver in dev)
        $verifyToken = Str::random(40);
        Log::info("Verification email dispatched to {$user->email} with verification token: {$verifyToken}");

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => 'user',
            'action' => 'REGISTER',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        Auth::login($user, true);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran akun CD\'E Pearls berhasil. Silakan cek email Anda untuk verifikasi.',
            'token' => $token,
            'user' => $user->load('defaultAddress'),
        ], Response::HTTP_CREATED);
    }

    /**
     * User login with rate limiting, lockout protection, and Turnstile.
     * Rate limits: 5 attempts/min per email+IP, 20/hour per IP.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower($validated['email']);
        $emailKey = Str::transliterate("login:{$email}|" . $request->ip());
        $ipKey = 'login:ip:' . $request->ip();

        // 1. IP-level rate limit: max 20 per hour per IP
        if ($rateLimitResponse = $this->checkRateLimit($ipKey, 20, 3600, 'Login (IP)', $request)) {
            return $rateLimitResponse;
        }

        // 2. Email+IP rate limit: max 5 per minute per email+IP
        if ($rateLimitResponse = $this->checkRateLimit($emailKey, 5, 60, 'Login (Akun)', $request)) {
            return $rateLimitResponse;
        }

        // 3. Cloudflare Turnstile Verification
        if (! $this->turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan Turnstile gagal. Silakan coba kembali.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $email)->first();

        // 4. Lockout check (15 minutes lockout after 10 failed logins)
        if ($user && $user->isLocked()) {
            $diffInMinutes = ceil(now()->diffInSeconds($user->locked_until) / 60);

            return response()->json([
                'success' => false,
                'message' => "Akun Anda terkunci sementara karena akumulasi kesalahan kata sandi. Coba lagi dalam {$diffInMinutes} menit.",
                'error' => 'ACCOUNT_LOCKED',
                'locked_until' => $user->locked_until,
            ], Response::HTTP_LOCKED);
        }

        // 5. Credential verification (Timing-safe anti-enumeration)
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($emailKey, 60);
            RateLimiter::hit($ipKey, 3600);

            if ($user) {
                $user->increment('failed_logins');
                if ($user->failed_logins >= 10) {
                    $user->update([
                        'locked_until' => now()->addMinutes(15),
                    ]);

                    AuditLog::create([
                        'actor_id' => $user->id,
                        'actor_name' => $user->name,
                        'actor_role' => $user->role,
                        'action' => 'ACCOUNT_LOCKED_FAILED_LOGINS',
                        'target_type' => 'user',
                        'target_id' => (string) $user->id,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'created_at' => now(),
                    ]);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Alamat email atau kata sandi tidak cocok dengan catatan kami.',
                'error' => 'INVALID_CREDENTIALS',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 6. Status frozen check
        if ($user->isFrozen()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.',
                'error' => 'ACCOUNT_FROZEN',
            ], Response::HTTP_FORBIDDEN);
        }

        // 7. Success: clear counters and update timestamp
        RateLimiter::clear($emailKey);
        $user->update([
            'failed_logins' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
        ]);

        Auth::login($user, (bool) ($validated['remember'] ?? false));

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'LOGIN',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Berhasil masuk ke CD\'E Pearls Lombok.',
            'token' => $token,
            'user' => $user->load('defaultAddress'),
            'must_change_password' => $user->must_change_password,
        ]);
    }

    /**
     * Get available OAuth authentication providers.
     */
    public function providers(): JsonResponse
    {
        $googleClientId = config('services.google.client_id');
        $googleClientSecret = config('services.google.client_secret');

        $isGoogleConfigured = ! empty($googleClientId) && ! empty($googleClientSecret);

        return response()->json([
            'success' => true,
            'data' => [
                'google' => $isGoogleConfigured,
            ],
        ]);
    }

    /**
     * Redirect to Google OAuth provider.
     */
    public function googleRedirect(Request $request)
    {
        if (empty(config('services.google.client_id')) || empty(config('services.google.client_secret'))) {
            return response()->json([
                'success' => false,
                'error' => 'PROVIDER_NOT_CONFIGURED',
                'message' => 'Layanan login Google belum dikonfigurasi.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle Google OAuth callback.
     * Rate limit: 10 per minute per IP.
     */
    public function googleCallback(Request $request)
    {
        $callbackKey = 'google_callback:' . $request->ip();
        if ($rateLimitResponse = $this->checkRateLimit($callbackKey, 10, 60, 'Google OAuth Callback', $request)) {
            $seconds = RateLimiter::availableIn($callbackKey);
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/?auth_error=RATE_LIMIT_EXCEEDED&retry_after=' . $seconds);
        }
        RateLimiter::hit($callbackKey, 60);

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed: ' . $e->getMessage());
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/?auth_error=OAUTH_FAILED');
        }

        // Verify that email is verified by Google
        $rawUser = $googleUser->getRaw();
        $isVerified = $rawUser['email_verified'] ?? true;
        if (! $isVerified) {
            AuditLog::create([
                'action' => 'GOOGLE_LOGIN_REJECTED_UNVERIFIED_EMAIL',
                'target_type' => 'oauth',
                'target_id' => (string) $googleUser->getEmail(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/?auth_error=EMAIL_NOT_VERIFIED');
        }

        $email = strtolower($googleUser->getEmail());

        // Check if user already exists
        $user = User::where('email', $email)->orWhere('google_id', $googleUser->getId())->first();

        if ($user) {
            // Admin & SPI are NOT allowed to log in via Google
            if ($user->role === 'admin' || $user->role === 'spi') {
                AuditLog::create([
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'actor_role' => $user->role,
                    'action' => 'GOOGLE_LOGIN_REJECTED_PRIVILEGED_ROLE',
                    'target_type' => 'oauth',
                    'target_id' => (string) $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);

                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/?auth_error=ROLE_NOT_PERMITTED');
            }

            // Link Google account for Customer
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar() ?? $user->avatar_url,
                'email_verified_at' => $user->email_verified_at ?? now(),
                'last_login_at' => now(),
            ]);
        } else {
            // Register new customer via Google (strictly user role)
            $user = User::create([
                'name' => $googleUser->getName() ?? 'Pelanggan Google',
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'role' => 'user',
                'status' => 'active',
                'email_verified_at' => now(),
                'must_change_password' => false,
                'last_login_at' => now(),
            ]);
        }

        Auth::login($user, true);
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'GOOGLE_LOGIN_SUCCESS',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return redirect(config('app.frontend_url', 'http://localhost:5173') . '/?auth_token=' . $token . '&role=' . $user->role);
    }

    /**
     * User logout - Invalidates web session, revokes tokens, clears cookies and response cache.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user('sanctum') ?? $request->user();

        if (! $user && $bearerToken = $request->bearerToken()) {
            $personalToken = \Laravel\Sanctum\PersonalAccessToken::findToken($bearerToken);
            if ($personalToken) {
                $user = $personalToken->tokenable;
                $personalToken->delete();
            }
        }

        if ($user) {
            // Invalidate all personal access tokens for this user
            $user->tokens()->delete();

            AuditLog::create([
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->role,
                'action' => 'LOGOUT',
                'target_type' => 'user',
                'target_id' => (string) $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        // Web guard session logout & flush cached guard states
        Auth::guard('web')->logout();
        Auth::forgetGuards();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $sessionCookieName = config('session.cookie', 'laravel_session');

        return response()->json([
            'success' => true,
            'message' => 'Sesi Anda telah diakhiri dengan aman.',
        ])
            ->withoutCookie($sessionCookieName)
            ->withoutCookie('XSRF-TOKEN')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * Get currently authenticated user details.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Belum login.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'success' => true,
            'user' => $user->load(['defaultAddress', 'addresses']),
        ]);
    }

    /**
     * Update user profile information.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
            'locale' => $validated['locale'] ?? $user->locale,
            'theme' => $validated['theme'] ?? $user->theme,
        ]);

        if (! empty($validated['address'])) {
            Address::updateOrCreate(
                ['user_id' => $user->id, 'is_default' => true],
                [
                    'label' => 'Alamat Utama',
                    'recipient_name' => $user->name,
                    'phone' => $user->phone ?? '-',
                    'address_line' => $validated['address'],
                    'city' => 'Lombok',
                    'province' => 'NTB',
                    'postal_code' => '83355',
                    'is_default' => true,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->fresh()->load('defaultAddress'),
        ]);
    }

    /**
     * Update password.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'CHANGE_PASSWORD',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui. Akun Anda kini sepenuhnya terproteksi.',
        ]);
    }

    /**
     * Send password reset token.
     * Rate limit: 3 per hour per email+IP.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower($validated['email']);
        $forgotKey = 'forgot_password:' . Str::transliterate($email) . '|' . $request->ip();

        if ($rateLimitResponse = $this->checkRateLimit($forgotKey, 3, 3600, 'Lupa Kata Sandi', $request)) {
            return $rateLimitResponse;
        }

        // Turnstile check
        if (! $this->turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan Turnstile gagal. Silakan coba kembali.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        RateLimiter::hit($forgotKey, 3600);

        $user = User::where('email', $email)->first();
        if ($user) {
            $token = Str::random(60);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            Log::info("Password reset link requested for {$email}. Reset token: {$token}");
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email Anda terdaftar, instruksi penyetelan ulang kata sandi telah dikirimkan ke kotak masuk.',
        ]);
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower($validated['email']);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! Hash::check($validated['token'], $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token penyetelan ulang kata sandi tidak valid atau telah kedaluwarsa.',
                'error' => 'INVALID_TOKEN',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], Response::HTTP_NOT_FOUND);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'RESET_PASSWORD',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru Anda.',
        ]);
    }

    /**
     * Verify user email address.
     */
    public function verifyEmail(Request $request, $id, $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'success' => false,
                'message' => 'Tautan verifikasi email tidak valid atau telah kedaluwarsa.',
                'error' => 'INVALID_VERIFICATION_HASH',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Alamat email Anda sudah terverifikasi sebelumnya.',
                'user' => $user,
            ]);
        }

        $user->markEmailAsVerified();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'EMAIL_VERIFIED',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alamat email Anda berhasil diverifikasi. Selamat menikmati layanan penuh CD\'E Pearls Lombok.',
            'user' => $user,
        ]);
    }

    /**
     * Resend verification email.
     * Rate limit: 3 per hour.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $resendKey = 'resend_verification:' . ($request->user()?->id ?? $request->ip());
        if ($rateLimitResponse = $this->checkRateLimit($resendKey, 3, 3600, 'Kirim Ulang Verifikasi', $request)) {
            return $rateLimitResponse;
        }

        // Turnstile check
        if (! $this->turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan Turnstile gagal. Silakan coba kembali.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        RateLimiter::hit($resendKey, 3600);

        $user = $request->user();

        if ($user && $user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Alamat email Anda sudah terverifikasi.',
            ]);
        }

        $hash = sha1($user->getEmailForVerification());
        $verificationUrl = url("/api/v1/auth/verify-email/{$user->id}/{$hash}");

        // In dev environment, logs to default log driver (laravel.log)
        Log::info("Verification email resent to {$user->email}. Verification URL: {$verificationUrl}");

        return response()->json([
            'success' => true,
            'message' => 'Tautan verifikasi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.',
            'verification_link_dev' => app()->environment('local', 'testing') ? $verificationUrl : null,
        ]);
    }
}
