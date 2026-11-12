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

// Skenario 1b: Validasi Panjang Minimum Password >= 12 Karakter
test('1b. register dengan password kurang dari 12 karakter ditolak dengan validasi 422', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Pendek User',
        'email' => 'shortpass@cdepearls.com',
        'phone' => '081234567890',
        'password' => 'Short123!', // 9 karakter (kurang dari 12)
        'password_confirmation' => 'Short123!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
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
test('5. login salah password mengembalikan pesan generik dan tidak mengunci akun di database', function () {
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
    expect($user->locked_until)->toBeNull();
});

// Skenario 6: Anti-DoS Rate Limiter (Blokir IP/Akun via Cache, Bukan Kunci Database)
test('6. rate limiter memblokir brute force per-IP (429) tanpa mengunci akun korban di database (Anti-DoS)', function () {
    $user = User::create([
        'name' => 'Lockout Victim',
        'email' => 'locktest@cdepearls.com',
        'password' => Hash::make('TargetPassword2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'failed_logins' => 0,
    ]);

    $emailKey = Str::transliterate('login:locktest@cdepearls.com|127.0.0.1');
    RateLimiter::clear($emailKey);
    RateLimiter::clear('login:ip:127.0.0.1');

    // 5 percobaan gagal dari IP penyerang (127.0.0.1)
    for ($i = 1; $i <= 5; $i++) {
        $res = $this->postJson('/api/v1/auth/login', [
            'email' => 'locktest@cdepearls.com',
            'password' => 'WrongPassAttempt' . $i,
            'turnstile_token' => '1x00000000000000000000AA',
        ]);
        $res->assertStatus(401);
    }

    // Percobaan ke-6 dari IP penyerang langsung diblokir Rate Limiter (429 Too Many Requests)
    $resBlocked = $this->postJson('/api/v1/auth/login', [
        'email' => 'locktest@cdepearls.com',
        'password' => 'WrongPassAttempt6',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);
    $resBlocked->assertStatus(429)
        ->assertJson([
            'success' => false,
            'error' => 'TOO_MANY_REQUESTS',
        ]);

    // Bukti Anti-DoS: Akun korban di database TIDAK dikunci (locked_until tetap NULL)
    $user->refresh();
    expect($user->locked_until)->toBeNull();

    // Bukti Anti-DoS: Pengguna sah yang login dari IP berbeda tetap bisa masuk dengan sukses (200 OK)
    $resLegit = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])->postJson('/api/v1/auth/login', [
        'email' => 'locktest@cdepearls.com',
        'password' => 'TargetPassword2026!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);
    $resLegit->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);
});

// Skenario 6b: Akun yang dikunci secara administratif oleh SPI/Admin ditolak dengan status 423
test('6b. akun yang dikunci manual oleh admin (locked_until di masa depan) ditolak login 423', function () {
    $user = User::create([
        'name' => 'Admin Locked User',
        'email' => 'adminlocked@cdepearls.com',
        'password' => Hash::make('TargetPassword2026!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
        'locked_until' => now()->addMinutes(15),
    ]);

    $res = $this->postJson('/api/v1/auth/login', [
        'email' => 'adminlocked@cdepearls.com',
        'password' => 'TargetPassword2026!',
        'turnstile_token' => '1x00000000000000000000AA',
    ]);

    $res->assertStatus(423)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_LOCKED',
        ]);
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

test('akun staf dengan must_change_password=true ditolak di rute admin dan spi luar v1', function () {
    $adminStaff = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
        'must_change_password' => true,
    ]);

    $spiStaff = User::factory()->create([
        'role' => 'spi',
        'status' => 'active',
        'must_change_password' => true,
    ]);

    // Akses ke /api/v1/admin/products ditolak 403 MUST_CHANGE_PASSWORD
    $this->actingAs($adminStaff)->getJson('/api/v1/admin/products')
        ->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'MUST_CHANGE_PASSWORD',
        ]);

    // Akses ke /api/v1/spi/summary ditolak 403 MUST_CHANGE_PASSWORD
    $this->actingAs($spiStaff)->getJson('/api/v1/spi/summary')
        ->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'MUST_CHANGE_PASSWORD',
        ]);

    // Dan jika akun frozen, juga ditolak 403 ACCOUNT_FROZEN
    $adminStaff->update(['must_change_password' => false, 'status' => 'frozen']);
    $this->actingAs($adminStaff)->getJson('/api/v1/admin/products')
        ->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_FROZEN',
        ]);
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

