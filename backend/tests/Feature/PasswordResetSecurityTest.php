<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'name' => 'Budi Sandi',
        'email' => 'budi.sandi@example.com',
        'password' => Hash::make('Lama12345!'),
        'role' => 'user',
        'status' => 'active',
    ]);
});

test('U-6: token reset kata sandi yang lebih tua dari 60 menit ditolak (kedaluwarsa)', function () {
    $token = 'expiredtoken1234567890123456789012345678901234567890123456789012';

    DB::table('password_reset_tokens')->insert([
        'email' => $this->user->email,
        'token' => Hash::make($token),
        'created_at' => Carbon::now()->subMinutes(65),
    ]);

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'email' => $this->user->email,
        'token' => $token,
        'password' => 'Baru12345678!',
        'password_confirmation' => 'Baru12345678!',
    ]);

    $response->assertStatus(422);
    expect($response->json('message'))->toContain('tidak valid atau telah kedaluwarsa');
});

test('U-6: token reset kata sandi bersifat single-use dan langsung hangus setelah dipakai (replay ditolak)', function () {
    $token = 'singletouse1234567890123456789012345678901234567890123456789012';

    DB::table('password_reset_tokens')->insert([
        'email' => $this->user->email,
        'token' => Hash::make($token),
        'created_at' => Carbon::now()->subMinutes(5),
    ]);

    // Percobaan pertama: Sukses
    $res1 = $this->postJson('/api/v1/auth/reset-password', [
        'email' => $this->user->email,
        'token' => $token,
        'password' => 'Baru12345678!',
        'password_confirmation' => 'Baru12345678!',
    ]);
    $res1->assertStatus(200);

    // Percobaan kedua (replay): Ditolak 422
    $res2 = $this->postJson('/api/v1/auth/reset-password', [
        'email' => $this->user->email,
        'token' => $token,
        'password' => 'BaruLagi12345!',
        'password_confirmation' => 'BaruLagi12345!',
    ]);
    $res2->assertStatus(422);
});

test('U-6: reset kata sandi mencabut (revoke) seluruh token Sanctum aktif milik pengguna', function () {
    // Buat 3 personal access token aktif untuk pengguna ini
    $token1 = $this->user->createToken('session_mobile')->plainTextToken;
    $token2 = $this->user->createToken('session_desktop')->plainTextToken;
    $token3 = $this->user->createToken('session_ipad')->plainTextToken;

    expect($this->user->tokens()->count())->toBe(3);

    $token = 'validresettoken123456789012345678901234567890123456789012345678';
    DB::table('password_reset_tokens')->insert([
        'email' => $this->user->email,
        'token' => Hash::make($token),
        'created_at' => Carbon::now()->subMinutes(10),
    ]);

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'email' => $this->user->email,
        'token' => $token,
        'password' => 'KataSandiBaru#2026',
        'password_confirmation' => 'KataSandiBaru#2026',
    ]);

    $response->assertStatus(200);

    // Verifikasi seluruh token Sanctum pengguna telah dihapus
    expect($this->user->tokens()->count())->toBe(0);
});

test('U-6: email tidak terdaftar tetap menerima respons seragam (anti-enumerasi pengguna)', function () {
    $token = 'randomvalidtoken1234567890123456789012345678901234567890123456';

    $response = $this->postJson('/api/v1/auth/reset-password', [
        'email' => 'tidak.terdaftar@example.com',
        'token' => $token,
        'password' => 'SandiBaru123!',
        'password_confirmation' => 'SandiBaru123!',
    ]);

    // Respons harus 422 seragam, tidak boleh 404 "Pengguna tidak ditemukan."
    $response->assertStatus(422);
    expect($response->json('message'))->toContain('tidak valid atau telah kedaluwarsa');
});
