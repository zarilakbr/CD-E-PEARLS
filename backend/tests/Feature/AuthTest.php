<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    RateLimiter::clear('login:siti.rahma@gmail.com|127.0.0.1');
});

test('user can register with valid strong password and details', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Siti Aisyah',
        'email' => 'aisyah.test@cdepearls.com',
        'phone' => '081299887766',
        'password' => 'MutiaraLombok2026!',
        'password_confirmation' => 'MutiaraLombok2026!',
        'address' => 'Senggigi Resort No. 12',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);

    $this->assertDatabaseHas('users', [
        'email' => 'aisyah.test@cdepearls.com',
        'role' => 'user',
        'status' => 'active',
    ]);
});

test('registration rejects weak password or missing confirmations', function () {
    // Password too short (<10 chars)
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Test User',
        'email' => 'weak@test.com',
        'phone' => '08123456789',
        'password' => 'Short1!',
        'password_confirmation' => 'Short1!',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

test('login succeeds with correct credentials and returns token', function () {
    $user = User::create([
        'name' => 'Test Buyer',
        'email' => 'buyer@cdepearls.com',
        'phone' => '08123456780',
        'password' => Hash::make('Mutiara2026Valid!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'buyer@cdepearls.com',
        'password' => 'Mutiara2026Valid!',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['token', 'user']);
});

test('login fails with invalid credentials', function () {
    $user = User::create([
        'name' => 'Test Buyer',
        'email' => 'buyer.fail@cdepearls.com',
        'phone' => '08123456780',
        'password' => Hash::make('Mutiara2026Valid!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'buyer.fail@cdepearls.com',
        'password' => 'WrongPassword123!',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'INVALID_CREDENTIALS',
        ]);
});

test('frozen account cannot log in', function () {
    $user = User::create([
        'name' => 'Frozen Staf',
        'email' => 'frozen@cdepearls.com',
        'password' => Hash::make('Mutiara2026Valid!'),
        'role' => 'admin',
        'status' => 'frozen',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'frozen@cdepearls.com',
        'password' => 'Mutiara2026Valid!',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_FROZEN',
        ]);
});

test('account is locked after 10 failed login attempts', function () {
    $user = User::create([
        'name' => 'Lockout Target',
        'email' => 'lockout@cdepearls.com',
        'password' => Hash::make('ValidPassword2026!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    // Perform 10 failed attempts
    for ($i = 0; $i < 10; $i++) {
        RateLimiter::clear(Str::transliterate("login:lockout@cdepearls.com|127.0.0.1"));
        $this->postJson('/api/v1/auth/login', [
            'email' => 'lockout@cdepearls.com',
            'password' => 'WrongPassword!',
        ]);
    }

    $user->refresh();
    expect($user->locked_until)->not->toBeNull();

    // 11th attempt should report locked
    RateLimiter::clear(Str::transliterate("login:lockout@cdepearls.com|127.0.0.1"));
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'lockout@cdepearls.com',
        'password' => 'ValidPassword2026!',
    ]);

    $response->assertStatus(423)
        ->assertJson([
            'success' => false,
            'error' => 'ACCOUNT_LOCKED',
        ]);
});

test('authenticated user can view profile and update password', function () {
    $user = User::create([
        'name' => 'Siti Rahma',
        'email' => 'siti.rahma@gmail.com',
        'phone' => '081239887711',
        'password' => Hash::make('OldPassword2026!'),
        'role' => 'user',
        'status' => 'active',
        'must_change_password' => true,
    ]);

    $token = $user->createToken('test')->plainTextToken;

    // View profile
    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $meResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'user' => [
                'email' => 'siti.rahma@gmail.com',
            ],
        ]);

    // Update password
    $pwdResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'OldPassword2026!',
            'password' => 'NewStrongPassword2026#',
            'password_confirmation' => 'NewStrongPassword2026#',
        ]);

    $pwdResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    $user->refresh();
    expect($user->must_change_password)->toBeFalse();
    expect(Hash::check('NewStrongPassword2026#', $user->password))->toBeTrue();
});

