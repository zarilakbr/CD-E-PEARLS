<?php

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->user = User::factory()->create([
        'email' => 'customer_csrf@cdepearlslombok.id',
        'password' => Hash::make('PasswordValid123!'),
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
});

afterEach(function () {
    // Kembalikan environment ke testing dan bersihkan state CSRF
    $this->app['env'] = 'testing';
    PreventRequestForgery::flushState();
});

test('di lingkungan production, POST dengan cookie sesi dan referer stateful tanpa token CSRF ditolak 419', function () {
    // 1. Simulasikan environment produksi
    $this->app['env'] = 'production';
    config(['app.env' => 'production']);
    config(['sanctum.stateful' => ['localhost', 'cdepearlslombok.id', '127.0.0.1']]);

    // Pastikan pengecualian api/* bersih pada PreventRequestForgery di produksi
    PreventRequestForgery::flushState();

    // 2. Buat rute uji stateful POST yang melalui middleware api
    Route::post('/api/v1/test-csrf-protected', function () {
        return response()->json(['success' => true]);
    })->middleware('api');

    // 3. Kirim permintaan POST dari domain frontend stateful dengan cookie sesi, TANPA X-XSRF-TOKEN
    $response = $this->withHeaders([
        'Referer' => 'https://cdepearlslombok.id/checkout',
        'Origin' => 'https://cdepearlslombok.id',
        'Accept' => 'application/json',
    ])->withSession([
        '_token' => 'valid-server-session-token-12345',
        'user_id' => $this->user->id,
    ])->postJson('/api/v1/test-csrf-protected', [
        'amount' => 100000,
    ]);

    // Harus ditolak dengan status HTTP 419 (CSRF Token Mismatch)
    $response->assertStatus(419);
});

test('login produksi tetap berjalan normal (POST /api/v1/auth/login mengembalikan token)', function () {
    // 1. Simulasikan environment produksi
    $this->app['env'] = 'production';
    config(['app.env' => 'production']);
    config(['services.turnstile.secret_key' => 'valid-production-secret-key-real']);

    \Illuminate\Support\Facades\Http::fake([
        'challenges.cloudflare.com/*' => \Illuminate\Support\Facades\Http::response(['success' => true], 200),
    ]);

    PreventRequestForgery::flushState();

    // 2. Permintaan login API normal dari klien/aplikasi
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'customer_csrf@cdepearlslombok.id',
        'password' => 'PasswordValid123!',
        'turnstile_token' => 'real-turnstile-token-success',
    ]);

    // Login produksi harus berhasil 200 dan menghasilkan token Sanctum
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'message',
        'token',
        'user' => ['id', 'email', 'role'],
    ]);
});
