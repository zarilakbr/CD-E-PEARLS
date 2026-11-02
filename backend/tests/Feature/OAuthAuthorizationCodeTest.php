<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Siti Google Customer',
        'email' => 'siti.google@example.com',
        'role' => 'user',
        'status' => 'active',
    ]);
});

test('U-5: endpoint exchange berhasil menukar authorization code 64-karakter dengan token Sanctum', function () {
    $rawCode = bin2hex(random_bytes(32)); // 64 karakter
    $hashedCode = hash('sha256', $rawCode);

    Cache::put('oauth_auth_code:' . $hashedCode, [
        'user_id' => $this->user->id,
        'created_at' => now()->timestamp,
    ], 60);

    $response = $this->postJson('/api/v1/auth/exchange', [
        'code' => $rawCode,
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'token',
        'user' => ['id', 'name', 'email', 'role'],
    ]);

    expect($response->json('user.email'))->toBe('siti.google@example.com');
    expect($response->json('token'))->not->toBeNull();
});

test('U-5: replay authorization code yang sama langsung ditolak karena single-use (hangus)', function () {
    $rawCode = bin2hex(random_bytes(32));
    $hashedCode = hash('sha256', $rawCode);

    Cache::put('oauth_auth_code:' . $hashedCode, [
        'user_id' => $this->user->id,
        'created_at' => now()->timestamp,
    ], 60);

    // Request pertama: Sukses
    $res1 = $this->postJson('/api/v1/auth/exchange', ['code' => $rawCode]);
    $res1->assertStatus(200);

    // Request kedua (replay attack): Ditolak 401
    $res2 = $this->postJson('/api/v1/auth/exchange', ['code' => $rawCode]);
    $res2->assertStatus(401);
    expect($res2->json('message'))->toContain('tidak valid');
});

test('U-5: authorization code kedaluwarsa atau tidak terdaftar ditolak (401)', function () {
    $rawCode = str_repeat('a', 64);

    $response = $this->postJson('/api/v1/auth/exchange', [
        'code' => $rawCode,
    ]);

    $response->assertStatus(401);
});

test('U-5: authorization code dengan panjang tidak sesuai ditolak validasi (422)', function () {
    $response = $this->postJson('/api/v1/auth/exchange', [
        'code' => 'shortcode123',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['code']);
});
