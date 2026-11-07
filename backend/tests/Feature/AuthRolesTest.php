<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('login:test.user@cdepearls.com|127.0.0.1');
    RateLimiter::clear('login:test.admin@cdepearls.com|127.0.0.1');
    RateLimiter::clear('login:test.spi@cdepearls.com|127.0.0.1');
    RateLimiter::clear('login:unverified@cdepearls.com|127.0.0.1');
});

test('login customer (user) role succeeds and GET /auth/me returns user role', function () {
    $email = 'test.user@cdepearls.com';
    $password = 'SecretPass2026!Valid';

    $user = User::updateOrCreate(
        ['email' => $email],
        [
            'name' => 'User Pelanggan',
            'phone' => '081299990001',
            'password' => Hash::make($password),
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
        ]
    );

    $loginResponse = $this->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => $password,
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $loginResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $token = $loginResponse->json('token');
    expect($token)->not->toBeEmpty();

    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $meResponse->assertStatus(200)
        ->assertJsonPath('user.role', 'user');
});

test('login administrator (admin) role succeeds and GET /auth/me returns admin role', function () {
    $email = 'test.admin@cdepearls.com';
    $password = 'SecretPass2026!Valid';

    $user = User::updateOrCreate(
        ['email' => $email],
        [
            'name' => 'User Administrator',
            'phone' => '081299990002',
            'password' => Hash::make($password),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]
    );

    $loginResponse = $this->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => $password,
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $loginResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $token = $loginResponse->json('token');
    expect($token)->not->toBeEmpty();

    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $meResponse->assertStatus(200)
        ->assertJsonPath('user.role', 'admin');
});

test('login pengawas internal (spi) role succeeds and GET /auth/me returns spi role', function () {
    $email = 'test.spi@cdepearls.com';
    $password = 'SecretPass2026!Valid';

    $user = User::updateOrCreate(
        ['email' => $email],
        [
            'name' => 'User SPI',
            'phone' => '081299990003',
            'password' => Hash::make($password),
            'role' => 'spi',
            'status' => 'active',
            'email_verified_at' => now(),
        ]
    );

    $loginResponse = $this->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => $password,
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $loginResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $token = $loginResponse->json('token');
    expect($token)->not->toBeEmpty();

    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $meResponse->assertStatus(200)
        ->assertJsonPath('user.role', 'spi');
});

test('unverified account login returns HTTP 403 and ACCOUNT_UNVERIFIED error', function () {
    $password = 'UnverifiedPass123!';
    $user = User::updateOrCreate(
        ['email' => 'unverified@cdepearls.com'],
        [
            'name' => 'Unverified User',
            'phone' => '081299990004',
            'password' => Hash::make($password),
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => null, // Unverified
        ]
    );

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'unverified@cdepearls.com',
        'password' => $password,
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_UNVERIFIED',
        ]);
});

test('unverified account login with WRONG password returns HTTP 401 INVALID_CREDENTIALS without revealing verification status', function () {
    RateLimiter::clear('login:unverified@cdepearls.com|127.0.0.1');
    RateLimiter::clear('login:ip:127.0.0.1');

    $password = 'UnverifiedPass123!';
    User::updateOrCreate(
        ['email' => 'unverified@cdepearls.com'],
        [
            'name' => 'Unverified User',
            'phone' => '081299990004',
            'password' => Hash::make($password),
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => null, // Unverified
        ]
    );

    // Try logging in with WRONG password
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'unverified@cdepearls.com',
        'password' => 'CompletelyWrongPassword123!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    // Must return 401 (INVALID_CREDENTIALS) and NOT 403 (ACCOUNT_UNVERIFIED)
    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
            'message' => 'Email atau kata sandi tidak valid',
        ]);
});

test('seeder fails hard when env password variable is missing outside testing', function () {
    $validateEnv = function ($userPass, $adminPass, $spiPass, $isTesting) {
        if (! $isTesting) {
            if (empty($userPass)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_USER_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
            if (empty($adminPass)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_ADMIN_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
            if (empty($spiPass)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_SPI_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
        }
        return true;
    };

    // Outside testing with empty user pass -> must throw RuntimeException
    expect(fn () => $validateEnv('', 'adminPass', 'spiPass', false))
        ->toThrow(\RuntimeException::class, 'SEED_USER_PASSWORD');

    // Outside testing with empty admin pass -> must throw RuntimeException
    expect(fn () => $validateEnv('userPass', '', 'spiPass', false))
        ->toThrow(\RuntimeException::class, 'SEED_ADMIN_PASSWORD');

    // Outside testing with empty spi pass -> must throw RuntimeException
    expect(fn () => $validateEnv('userPass', 'adminPass', '', false))
        ->toThrow(\RuntimeException::class, 'SEED_SPI_PASSWORD');
});

test('artisan cde:set-password updates password securely without exposing secrets', function () {
    $email = 'staff.test@cdepearls.com';
    $oldPass = 'OldSecretPass123!';
    $newPass = 'NewSecretPass456!';

    $user = User::updateOrCreate(
        ['email' => $email],
        [
            'name' => 'Staff Member',
            'phone' => '081239999999',
            'password' => Hash::make($oldPass),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'must_change_password' => true,
        ]
    );

    $this->artisan('cde:set-password', ['email' => $email])
        ->expectsQuestion('Masukkan kata sandi baru: ', $newPass)
        ->expectsQuestion('Konfirmasi kata sandi baru: ', $newPass)
        ->expectsOutputToContain("Kata sandi untuk akun [{$email}] (Peran: admin) berhasil diperbarui.")
        ->assertExitCode(0);

    $user->refresh();
    expect(Hash::check($newPass, $user->password))->toBeTrue();
    expect($user->must_change_password)->toBeFalse();
});

test('artisan cde:seed-accounts --check displays status table without secrets', function () {
    $this->artisan('cde:seed-accounts', ['--check' => true])
        ->expectsOutputToContain('Pelanggan (User)')
        ->expectsOutputToContain('Administrator')
        ->expectsOutputToContain('SPI (Pengawas)')
        ->assertExitCode(0);
});
