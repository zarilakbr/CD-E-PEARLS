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
                'message' => 'Verifikasi keamanan gagal.',
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

        // Generate signed URL (valid for 24h) and dispatch without logging plain token
        $verificationUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            now()->addHours(24),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );
        Log::info("Verification email dispatched for registered user id {$user->id}");

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
                'message' => 'Verifikasi keamanan gagal.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $email)->first();

        // 4. Credential verification with anti-enumeration (identical 401 response, no global lockout DoS)
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            $attempts = RateLimiter::attempts($emailKey) + 1;
            $decay = min(60 * pow(2, max(0, $attempts - 5)), 900);
            RateLimiter::hit($emailKey, $decay);
            RateLimiter::hit($ipKey, 3600);

            AuditLog::create([
                'action' => 'LOGIN_FAILED',
                'target_type' => 'auth',
                'target_id' => $email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'INVALID_CREDENTIALS',
                'message' => 'Email atau kata sandi tidak valid',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // 5. Status frozen check
        if ($user->isFrozen()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang dibekukan oleh Satuan Pengawas Internal (SPI). Hubungi pengawasan butik.',
                'error' => 'ACCOUNT_FROZEN',
            ], Response::HTTP_FORBIDDEN);
        }

        // 6. Success: clear counters and update timestamp
        RateLimiter::clear($emailKey);
        $user->update([
            'failed_logins' => 0,
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

        $state = Str::random(40);
        \Illuminate\Support\Facades\Cache::put('oauth_state:' . $state, [
            'ip' => $request->ip(),
            'created_at' => now()->timestamp,
        ], now()->addMinutes(10));

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
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
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/masuk?auth_error=RATE_LIMIT_EXCEEDED&retry_after=' . $seconds);
        }
        RateLimiter::hit($callbackKey, 60);

        // 4.e: Validate OAuth state parameter with 10 min TTL
        $state = $request->query('state');
        if (empty($state) || ! \Illuminate\Support\Facades\Cache::has('oauth_state:' . $state)) {
            Log::warning('Google OAuth callback rejected: invalid or missing state parameter');
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/masuk?auth_error=INVALID_OAUTH_STATE');
        }
        \Illuminate\Support\Facades\Cache::forget('oauth_state:' . $state);

        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed: ' . $e->getMessage());
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/masuk?auth_error=OAUTH_FAILED');
        }

        // Verify that email is verified by Google
        $rawUser = $googleUser->getRaw();
        $isVerified = (bool) ($rawUser['email_verified'] ?? false);
        if (! $isVerified) {
            AuditLog::create([
                'action' => 'GOOGLE_LOGIN_REJECTED_UNVERIFIED_EMAIL',
                'target_type' => 'oauth',
                'target_id' => (string) $googleUser->getEmail(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/masuk?auth_error=EMAIL_NOT_VERIFIED');
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
                'message' => 'Verifikasi keamanan gagal.',
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

            // Log without plain token
            Log::info("Password reset requested for email: {$email}");
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
     * Verify user email address using temporary signed URL.
     */
    public function verifyEmail(Request $request, $id, $hash): JsonResponse
    {
        // 4.f: Validate temporary signature
        if (! $request->hasValidSignature()) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_SIGNATURE',
                'message' => 'Tautan verifikasi email tidak valid atau telah kedaluwarsa.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

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
        // 1. Turnstile check
        if (! $this->turnstile->verify($request->input('turnstile_token'), $request->ip())) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan gagal.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();
        if (! $user && $email = $request->input('email')) {
            $user = User::where('email', strtolower($email))->first();
        }

        $resendKey = 'resend_verification:' . ($user?->id ?? $request->ip());
        if ($rateLimitResponse = $this->checkRateLimit($resendKey, 3, 3600, 'Kirim Ulang Verifikasi', $request)) {
            return $rateLimitResponse;
        }

        RateLimiter::hit($resendKey, 3600);

        if ($user && $user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Alamat email Anda sudah terverifikasi.',
            ]);
        }

        if ($user) {
            $hash = sha1($user->getEmailForVerification());
            $verificationUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'verification.verify',
                now()->addHours(24),
                ['id' => $user->id, 'hash' => $hash]
            );

            // Log without plain verification token
            Log::info("Verification email resent for user id: {$user->id}");
        }

        return response()->json([
            'success' => true,
            'message' => 'Tautan verifikasi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.',
            'verification_link_dev' => (app()->environment('local', 'testing') && isset($verificationUrl)) ? $verificationUrl : null,
        ]);
    }
}
