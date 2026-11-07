<?php

use App\Models\User;
use App\Services\TurnstileService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    RateLimiter::clear('login:security.victim@cdepearls.com|127.0.0.1');
    RateLimiter::clear('login:ip:127.0.0.1');
    RateLimiter::clear('register:ip:127.0.0.1');
    RateLimiter::clear('forgot_password:security.victim@cdepearls.com|127.0.0.1');
});

/*
|--------------------------------------------------------------------------
| 4.a & 4.b: Turnstile Fail-Closed & Sensitive Endpoints
|--------------------------------------------------------------------------
*/

test('turnstile rejects missing or fake token on all 4 sensitive public routes', function () {
    Config::set('services.turnstile.enforce_in_testing', true);

    $routes = [
        ['post', '/api/v1/auth/login', ['email' => 'test@example.com', 'password' => 'Password123!']],
        ['post', '/api/v1/auth/register', ['name' => 'Tamu', 'email' => 'tamu@example.com', 'phone' => '08123456789', 'password' => 'Password123!', 'password_confirmation' => 'Password123!']],
        ['post', '/api/v1/auth/forgot-password', ['email' => 'test@example.com']],
        ['post', '/api/v1/auth/resend-verification', ['email' => 'test@example.com']],
    ];

    foreach ($routes as [$method, $uri, $payload]) {
        // Without turnstile token
        $resMissing = $this->{$method . 'Json'}($uri, $payload);
        $resMissing->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan gagal.',
            ]);

        // With fake turnstile token
        $payloadWithFake = array_merge($payload, ['turnstile_token' => 'fake_invalid_token']);
        $resFake = $this->{$method . 'Json'}($uri, $payloadWithFake);
        $resFake->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'INVALID_TURNSTILE',
                'message' => 'Verifikasi keamanan gagal.',
            ]);
    }
});

test('turnstile fails closed in production when secret is missing or dummy test key is used', function () {
    $service = new TurnstileService();

    // Mock production environment
    app()->detectEnvironment(fn () => 'production');

    // Missing secret
    Config::set('services.turnstile.secret_key', null);
    expect($service->verify('any-token', '127.0.0.1'))->toBeFalse();

    // Dummy secret
    Config::set('services.turnstile.secret_key', '1x0000000000000000000000000000000AA');
    expect($service->verify('any-token', '127.0.0.1'))->toBeFalse();

    // Dummy test token
    Config::set('services.turnstile.secret_key', 'valid-secret-key-prod');
    expect($service->verify('1x00000000000000000000AA', '127.0.0.1'))->toBeFalse();

    // Restore environment
    app()->detectEnvironment(fn () => 'testing');
});

/*
|--------------------------------------------------------------------------
| 4.c: TrustCloudflareProxies Header Spoofing Prevention
|--------------------------------------------------------------------------
*/

test('trust cloudflare proxies ignores cf-connecting-ip when trust is disabled or ip is untrusted', function () {
    Config::set('services.cloudflare.trust', false);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '1.2.3.4'])
        ->withHeaders(['CF-Connecting-IP' => '8.8.8.8'])
        ->getJson('/api/v1/categories');

    $response->assertStatus(200);

    // When trust is enabled but connecting from non-cloudflare IP
    Config::set('services.cloudflare.trust', true);
    $responseUntrusted = $this->withServerVariables(['REMOTE_ADDR' => '1.2.3.4'])
        ->withHeaders(['CF-Connecting-IP' => '8.8.8.8'])
        ->getJson('/api/v1/categories');

    $responseUntrusted->assertStatus(200);
});

/*
|--------------------------------------------------------------------------
| 4.d: No Global Account Lockout DoS & Identical 401 Anti-Enumeration
|--------------------------------------------------------------------------
*/

test('failed login returns HTTP 401 with identical message for wrong password and unknown email', function () {
    $victim = User::create([
        'name' => 'Victim User',
        'email' => 'security.victim@cdepearls.com',
        'password' => Hash::make('CorrectPassword123!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    // 1. Wrong password on existing email
    $resWrongPass = $this->postJson('/api/v1/auth/login', [
        'email' => 'security.victim@cdepearls.com',
        'password' => 'WrongPassword999!',
        'turnstile_token' => 'valid_turnstile_token',
    ]);

    $resWrongPass->assertStatus(401)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
            'message' => 'Email atau kata sandi tidak valid',
        ]);

    // 2. Non-existent email
    $resUnknownEmail = $this->postJson('/api/v1/auth/login', [
        'email' => 'unknown.ghost@cdepearls.com',
        'password' => 'AnyPassword123!',
        'turnstile_token' => 'valid_turnstile_token',
    ]);

    $resUnknownEmail->assertStatus(401)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
            'message' => 'Email atau kata sandi tidak valid',
        ]);

    // Responses must be completely identical
    expect($resWrongPass->json())->toEqual($resUnknownEmail->json());

    // 3. 5 failed logins triggers rate limiting on IP without locking user account in DB (Anti-DoS)
    for ($i = 0; $i < 4; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'security.victim@cdepearls.com',
            'password' => 'WrongPassword999!',
            'turnstile_token' => 'valid_turnstile_token',
        ]);
    }

    $resBlocked = $this->postJson('/api/v1/auth/login', [
        'email' => 'security.victim@cdepearls.com',
        'password' => 'WrongPassword999!',
        'turnstile_token' => 'valid_turnstile_token',
    ]);
    $resBlocked->assertStatus(429);

    $victim->refresh();
    expect($victim->locked_until)->toBeNull();
});

/*
|--------------------------------------------------------------------------
| 4.e: Google OAuth State Validation
|--------------------------------------------------------------------------
*/

test('google oauth callback requires valid state parameter', function () {
    Config::set('services.google.client_id', 'mock-google-client-id');
    Config::set('services.google.client_secret', 'mock-secret');

    // Missing state
    $resMissing = $this->get('/api/v1/auth/google/callback');
    $resMissing->assertStatus(302);
    expect($resMissing->headers->get('Location'))->toContain('auth_error=INVALID_OAUTH_STATE');

    // Invalid state
    $resInvalid = $this->get('/api/v1/auth/google/callback?state=invalid-tampered-state');
    $resInvalid->assertStatus(302);
    expect($resInvalid->headers->get('Location'))->toContain('auth_error=INVALID_OAUTH_STATE');
});

/*
|--------------------------------------------------------------------------
| 4.f: Signed URL Verification for Email
|--------------------------------------------------------------------------
*/

test('email verification requires valid temporary signed URL', function () {
    $user = User::create([
        'name' => 'Verify Test',
        'email' => 'verify.test@cdepearls.com',
        'password' => Hash::make('Password123!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => null,
    ]);

    $hash = sha1($user->getEmailForVerification());

    // Unsigned direct request should be rejected
    $unsignedRes = $this->getJson("/api/v1/auth/verify-email/{$user->id}/{$hash}");
    $unsignedRes->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_SIGNATURE',
        ]);

    // Valid signed URL should succeed
    $signedUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addHours(24),
        ['id' => $user->id, 'hash' => $hash]
    );

    $signedRes = $this->getJson($signedUrl);
    $signedRes->assertStatus(200)
        ->assertJson(['success' => true]);

    $user->refresh();
    expect($user->email_verified_at)->not->toBeNull();
});

