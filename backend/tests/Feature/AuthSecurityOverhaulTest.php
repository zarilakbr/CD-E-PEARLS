<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/*
|--------------------------------------------------------------------------
| Authentication & Authorization Security Overhaul Feature Tests
| Covering the 9 mandatory security scenarios:
| 1. Register sukses
| 2. Register dengan email duplikat
| 3. Register tidak bisa menyuntik role=admin
| 4. Login sukses
| 5. Login salah password
| 6. Akun terkunci setelah 5 kali gagal
| 7. Akun status non-aktif ditolak
| 8. must_change_password memaksa redirect
| 9. Logout
|--------------------------------------------------------------------------
*/

beforeEach(function () {
    // Clear any test rate limiter keys before each test
    RateLimiter::clear(Str::transliterate('login:audittest@cdepearls.com|127.0.0.1'));
    RateLimiter::clear(Str::transliterate('login:locktest@cdepearls.com|127.0.0.1'));
    RateLimiter::clear('login:ip:127.0.0.1');
});

// Skenario 1: Register Sukses
test('1. register sukses dengan data valid dan password kuat', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => '  Budi Santoso  ',
        'email' => '  BUDI.Santoso@cdepearls.com  ',
        'phone' => '081234567890',
        'password' => 'MutiaraLombok2026!',
        'password_confirmation' => 'MutiaraLombok2026!',
        'address' => 'Jl. Pariwisata Pantai Senggigi No. 8',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $user = User::where('email', 'budi.santoso@cdepearls.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('Budi Santoso');
    expect($user->role)->toBe('user');
    expect($user->status)->toBe('active');
    expect($user->locale)->toBe('id');
    expect($user->theme)->toBe('light');
    expect($user->uuid)->not->toBeEmpty();
    expect($user->failed_logins)->toBe(0);
    expect($user->locked_until)->toBeNull();
    expect($user->must_change_password)->toBeFalse();
});

// Skenario 2: Register Dengan Email Duplikat
test('2. register dengan email duplikat ditolak dengan validasi 422', function () {
    User::create([
        'name' => 'Existing Customer',
        'email' => 'duplicate.test@cdepearls.com',
        'phone' => '081234567891',
        'password' => Hash::make('ExistingPass123!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Duplicate Impostor',
        'email' => 'DUPLICATE.test@cdepearls.com', // Test case normalization & uniqueness
        'phone' => '081234567892',
        'password' => 'NewSecurePassword2026!',
        'password_confirmation' => 'NewSecurePassword2026!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

// Skenario 3: Register Tidak Bisa Menyuntik role=admin (Mass Assignment Protection)
test('3. register tidak bisa menyuntik role=admin atau status privileged', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Privilege Escalation Attacker',
        'email' => 'attacker.role@cdepearls.com',
        'password' => 'AttackerPass2026!',
        'password_confirmation' => 'AttackerPass2026!',
        'role' => 'admin',
        'status' => 'spi',
        'must_change_password' => true,
        'failed_logins' => 99,
        'locked_until' => now()->addDays(10),
        'email_verified_at' => now(),
    ]);

    $response->assertStatus(201);

    $user = User::where('email', 'attacker.role@cdepearls.com')->first();
    expect($user)->not->toBeNull();
    // Role MUST strictly remain 'user'
    expect($user->role)->toBe('user');
    expect($user->status)->toBe('active');
    expect($user->must_change_password)->toBeFalse();
    expect($user->failed_logins)->toBe(0);
    expect($user->locked_until)->toBeNull();
    expect($user->email_verified_at)->toBeNull();
});

// Skenario 4: Login Sukses
test('4. login sukses dengan kredensial valid dan mengembalikan token', function () {
    $user = User::create([
        'name' => 'Valid User',
        'email' => 'valid.buyer@cdepearls.com',
        'password' => Hash::make('ValidSecret2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'failed_logins' => 2,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'VALID.BUYER@cdepearls.com', // Case-insensitive
        'password' => 'ValidSecret2026!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $user->refresh();
    expect($user->failed_logins)->toBe(0);
    expect($user->locked_until)->toBeNull();
    expect($user->last_login_at)->not->toBeNull();
});

// Skenario 5: Login Salah Password
test('5. login salah password mengembalikan pesan generik dan menambah failed_logins', function () {
    $user = User::create([
        'name' => 'Wrong Password User',
        'email' => 'wrongpass.user@cdepearls.com',
        'password' => Hash::make('CorrectPassword2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'failed_logins' => 0,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'wrongpass.user@cdepearls.com',
        'password' => 'TotallyWrongPassword999!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
            'message' => 'Email atau kata sandi tidak valid',
        ]);

    $user->refresh();
    expect($user->failed_logins)->toBe(1);
    expect($user->locked_until)->toBeNull();
});

// Skenario 6: Akun Terkunci Setelah 5 Kali Gagal
test('6. akun terkunci selama 15 menit setelah 5 kali gagal dan menampilkan sisa waktu kunci', function () {
    $user = User::create([
        'name' => 'Lockout Victim',
        'email' => 'locktest@cdepearls.com',
        'password' => Hash::make('TargetPassword2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'failed_logins' => 0,
    ]);

    // Lakukan 4 percobaan gagal pertama
    for ($i = 1; $i <= 4; $i++) {
        RateLimiter::clear(Str::transliterate('login:locktest@cdepearls.com|127.0.0.1'));
        RateLimiter::clear('login:ip:127.0.0.1');

        $res = $this->postJson('/api/v1/auth/login', [
            'email' => 'locktest@cdepearls.com',
            'password' => 'WrongPassAttempt' . $i,
            'turnstile_token' => '1x00000000000000000000AA',
        ]);

        $res->assertStatus(401);
    }

    $user->refresh();
    expect($user->failed_logins)->toBe(4);
    expect($user->locked_until)->toBeNull();

    // Percobaan ke-5 (Mencapai batas penguncian 5 gagal)
    RateLimiter::clear(Str::transliterate('login:locktest@cdepearls.com|127.0.0.1'));
    RateLimiter::clear('login:ip:127.0.0.1');

    $res5 = $this->postJson('/api/v1/auth/login', [
        'email' => 'locktest@cdepearls.com',
        'password' => 'WrongPassAttempt5',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $res5->assertStatus(423)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_LOCKED',
        ]);

    $user->refresh();
    expect($user->failed_logins)->toBe(5);
    expect($user->locked_until)->not->toBeNull();
    expect($user->isLocked())->toBeTrue();

    // Percobaan berikutnya saat akun masih terkunci langsung ditolak dengan info sisa waktu
    RateLimiter::clear(Str::transliterate('login:locktest@cdepearls.com|127.0.0.1'));
    RateLimiter::clear('login:ip:127.0.0.1');

    $resLocked = $this->postJson('/api/v1/auth/login', [
        'email' => 'locktest@cdepearls.com',
        'password' => 'TargetPassword2026!', // Password benar pun tetap ditolak saat locked
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $resLocked->assertStatus(423)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_LOCKED',
        ]);
    expect($resLocked->json('message'))->toContain('menit');
    expect($resLocked->json('retry_after_seconds'))->toBeGreaterThan(0);
});

// Skenario 7: Akun Status Non-Aktif Ditolak
test('7. akun dengan status non-aktif (frozen/inactive) ditolak login dengan pesan jelas', function () {
    // 7a. Status Frozen
    User::create([
        'name' => 'Frozen User',
        'email' => 'frozen.user@cdepearls.com',
        'password' => Hash::make('CorrectPassword2026!'),
        'role' => 'user',
        'status' => 'frozen',
        'email_verified_at' => now(),
    ]);

    $resFrozen = $this->postJson('/api/v1/auth/login', [
        'email' => 'frozen.user@cdepearls.com',
        'password' => 'CorrectPassword2026!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $resFrozen->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_FROZEN',
        ]);

    // 7b. Status Inactive
    User::create([
        'name' => 'Inactive User',
        'email' => 'inactive.user@cdepearls.com',
        'password' => Hash::make('CorrectPassword2026!'),
        'role' => 'user',
        'status' => 'inactive',
        'email_verified_at' => now(),
    ]);

    $resInactive = $this->postJson('/api/v1/auth/login', [
        'email' => 'inactive.user@cdepearls.com',
        'password' => 'CorrectPassword2026!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $resInactive->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_INACTIVE',
        ]);
});

// Skenario 8: must_change_password Memaksa Redirect
test('8. must_change_password memaksa redirect sebelum akses fitur lain, dan di-clear setelah ganti password', function () {
    $user = User::create([
        'name' => 'Must Change Password User',
        'email' => 'mustchange@cdepearls.com',
        'password' => Hash::make('TemporaryPass2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    // Akses ke fitur lain (misalnya wishlist) harus dicegat oleh middleware
    $resBlocked = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/wishlist');

    $resBlocked->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'MUST_CHANGE_PASSWORD',
            'must_change_password' => true,
            'redirect' => '/auth/change-password',
        ]);

    // Endpoint penggantian kata sandi (/password) TETAP diizinkan untuk diakses
    $resChange = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'TemporaryPass2026!',
            'password' => 'NewPermanentPass2026!',
            'password_confirmation' => 'NewPermanentPass2026!',
        ]);

    $resChange->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    $user->refresh();
    expect($user->must_change_password)->toBeFalse();

    // Setelah kata sandi diperbarui, akses ke wishlist langsung terbuka
    $resAllowed = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/wishlist');

    $resAllowed->assertStatus(200);
});

// Skenario 9: Logout
test('9. logout mencabut token dan mengakhiri sesi autentikasi', function () {
    $user = User::create([
        'name' => 'Logout Test User',
        'email' => 'logout.test@cdepearls.com',
        'password' => Hash::make('LogoutPass2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    // Verifikasi token aktif
    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');
    $meResponse->assertStatus(200);

    // Lakukan logout
    $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout');

    $logoutResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    // Verifikasi token telah dicabut (401 Unauthorized)
    $afterLogoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $afterLogoutResponse->assertStatus(401);
});

