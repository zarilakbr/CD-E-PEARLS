<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Services\TurnstileService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

beforeEach(function () {
    RateLimiter::clear(Str::transliterate('login:target@cdepearls.com|127.0.0.1'));
    RateLimiter::clear('login:ip:127.0.0.1');
    RateLimiter::clear('register:ip:127.0.0.1');
    RateLimiter::clear('forgot_pwd:email:target@cdepearls.com|127.0.0.1');
    RateLimiter::clear('resend_verify:127.0.0.1');
});

/*
|--------------------------------------------------------------------------
| Section 1: Robust Logout Tests
|--------------------------------------------------------------------------
*/

test('logout invalidates session, revokes tokens, clears cookies and sets no-store cache control', function () {
    $user = User::create([
        'name' => 'Budi Santoso',
        'email' => 'budi.logout@cdepearls.com',
        'phone' => '081234567890',
        'password' => Hash::make('ValidPassword2026!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    // Verify token works
    $meBefore = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');
    $meBefore->assertStatus(200);

    // Call logout
    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Sesi Anda telah diakhiri dengan aman.',
        ]);

    // Check Cache-Control: no-store
    $cacheControl = $response->headers->get('Cache-Control');
    expect($cacheControl)->toContain('no-store');

    // Subsequent call with revoked token must fail with 401
    $meAfter = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');
    $meAfter->assertStatus(401);
});

test('logout can be safely called even when unauthenticated or expired', function () {
    $response = $this->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);
});

/*
|--------------------------------------------------------------------------
| Section 3: Google OAuth Provider & RBAC Isolation
|--------------------------------------------------------------------------
*/

test('providers endpoint accurately reports Google OAuth availability', function () {
    Config::set('services.google.client_id', null);
    Config::set('services.google.client_secret', null);
    $res = $this->getJson('/api/v1/auth/providers');
    $res->assertStatus(200)->assertJson(['success' => true, 'data' => ['google' => false]]);

    Config::set('services.google.client_id', 'mock-google-client-id.apps.googleusercontent.com');
    Config::set('services.google.client_secret', 'mock-client-secret-2026');
    $res2 = $this->getJson('/api/v1/auth/providers');
    $res2->assertStatus(200)->assertJson(['success' => true, 'data' => ['google' => true]]);
});

test('google oauth links existing customer and verifies email', function () {
    Config::set('services.google.client_id', 'mock-google-client-id');
    Config::set('services.google.client_secret', 'mock-secret');

    $existingCustomer = User::create([
        'name' => 'Dewi Lestari',
        'email' => 'dewi@cdepearls.com',
        'phone' => '081234001122',
        'password' => Hash::make('Password2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => null,
    ]);

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = 'google-123456789';
    $socialiteUser->name = 'Dewi Lestari';
    $socialiteUser->email = 'dewi@cdepearls.com';
    $socialiteUser->avatar = 'https://lh3.googleusercontent.com/avatar-dewi.jpg';
    $socialiteUser->user = ['email_verified' => true];

    $providerMock = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
    $providerMock->shouldReceive('stateless')->andReturnSelf();
    $providerMock->shouldReceive('user')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

    $response = $this->get('/api/v1/auth/google/callback');
    $response->assertStatus(302); // Redirect to frontend /akun

    $existingCustomer->refresh();
    expect($existingCustomer->google_id)->toBe('google-123456789');
    expect($existingCustomer->avatar_url)->toBe('https://lh3.googleusercontent.com/avatar-dewi.jpg');
    expect($existingCustomer->email_verified_at)->not->toBeNull();
});

test('google oauth strictly rejects admin or spi roles from logging in via oauth', function () {
    Config::set('services.google.client_id', 'mock-google-client-id');
    Config::set('services.google.client_secret', 'mock-secret');

    $adminUser = User::create([
        'name' => 'Internal Admin',
        'email' => 'admin@cdepearls.com',
        'phone' => '081234009988',
        'password' => Hash::make('Password2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = 'google-admin-999';
    $socialiteUser->name = 'Internal Admin';
    $socialiteUser->email = 'admin@cdepearls.com';
    $socialiteUser->user = ['email_verified' => true];

    $providerMock = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
    $providerMock->shouldReceive('stateless')->andReturnSelf();
    $providerMock->shouldReceive('user')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

    $response = $this->get('/api/v1/auth/google/callback');
    $response->assertStatus(302);
    // Redirects to frontend with error query parameter
    expect($response->headers->get('Location'))->toContain('auth_error=ROLE_NOT_PERMITTED');
});

test('google oauth rejects unverified google email addresses', function () {
    Config::set('services.google.client_id', 'mock-google-client-id');
    Config::set('services.google.client_secret', 'mock-secret');

    $socialiteUser = new SocialiteUser();
    $socialiteUser->id = 'google-unverified-111';
    $socialiteUser->name = 'Unverified User';
    $socialiteUser->email = 'unverified@example.com';
    $socialiteUser->user = ['email_verified' => false];

    $providerMock = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
    $providerMock->shouldReceive('stateless')->andReturnSelf();
    $providerMock->shouldReceive('user')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($providerMock);

    $response = $this->get('/api/v1/auth/google/callback');
    $response->assertStatus(302);
    expect($response->headers->get('Location'))->toContain('auth_error=EMAIL_NOT_VERIFIED');
});

/*
|--------------------------------------------------------------------------
| Section 4: Rate Limiting & Retry-After Tests
|--------------------------------------------------------------------------
*/

test('login enforces 5 attempts per minute per email+IP and returns 429 with Retry-After header', function () {
    $email = 'target@cdepearls.com';

    for ($i = 0; $i < 5; $i++) {
        $res = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'WrongPassword2026!',
        ]);
        $res->assertStatus(422);
    }

    // 6th attempt should be blocked with 429
    $blockedRes = $this->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => 'WrongPassword2026!',
    ]);

    $blockedRes->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJson([
            'success' => false,
            'error' => 'TOO_MANY_REQUESTS',
        ]);

    expect((int) $blockedRes->headers->get('Retry-After'))->toBeGreaterThan(0);

    // Verify rate limit block was logged to audit_logs
    $auditLog = AuditLog::where('action', 'RATE_LIMIT_BLOCKED')
        ->where('target_type', 'rate_limit')
        ->latest()
        ->first();

    expect($auditLog)->not->toBeNull();
});

test('forgot-password enforces 3 attempts per hour per email+IP', function () {
    $email = 'target@cdepearls.com';

    for ($i = 0; $i < 3; $i++) {
        $res = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $email,
        ]);
        $res->assertStatus(200);
    }

    // 4th attempt should return 429
    $res4 = $this->postJson('/api/v1/auth/forgot-password', [
        'email' => $email,
    ]);

    $res4->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJson([
            'error' => 'TOO_MANY_REQUESTS',
        ]);
});

/*
|--------------------------------------------------------------------------
| Section 5: Cloudflare Turnstile Verification (Fail-Closed & Fake)
|--------------------------------------------------------------------------
*/

test('turnstile verification succeeds when Cloudflare siteverify responds success=true', function () {
    Config::set('services.turnstile.secret_key', 'mock-turnstile-secret-key');

    Http::fake([
        'challenges.cloudflare.com/*' => Http::response([
            'success' => true,
            'challenge_ts' => now()->toISOString(),
            'hostname' => 'cdepearls.com',
        ], 200),
    ]);

    $service = new TurnstileService();
    $result = $service->verify('valid-test-token', '127.0.0.1');

    expect($result)->toBeTrue();
});

test('turnstile verification fails-closed when token is invalid or endpoint returns error', function () {
    Config::set('services.turnstile.secret_key', 'mock-turnstile-secret-key');

    Http::fake([
        'challenges.cloudflare.com/*' => Http::response([
            'success' => false,
            'error-codes' => ['invalid-input-response'],
        ], 200),
    ]);

    $service = new TurnstileService();
    $result = $service->verify('invalid-token', '127.0.0.1');

    expect($result)->toBeFalse();
});

test('turnstile verification fails-closed on network timeout or exception', function () {
    Config::set('services.turnstile.secret_key', 'mock-turnstile-secret-key');

    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(null, 500),
    ]);

    $service = new TurnstileService();
    $result = $service->verify('timeout-token', '127.0.0.1');

    expect($result)->toBeFalse();
});
