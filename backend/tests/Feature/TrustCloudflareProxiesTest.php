<?php

use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::get('/api/test-ip', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'ip' => $request->ip(),
            'remote_addr' => $request->server('REMOTE_ADDR'),
        ]);
    });
});

test('U-4: penyerang dengan IP non-Cloudflare tidak bisa memalsukan IP lewat header X-Forwarded-For', function () {
    $untrustedClientIp = '203.0.113.195';
    $spoofedIp = '1.1.1.1';

    $response = $this->withServerVariables([
        'REMOTE_ADDR' => $untrustedClientIp,
        'HTTP_X_FORWARDED_FOR' => $spoofedIp,
    ])->getJson('/api/test-ip');

    $response->assertStatus(200);

    // IP yang dideteksi Laravel HARUS REMOTE_ADDR asli, BUKAN IP palsu dari X-Forwarded-For
    expect($response->json('ip'))->toBe($untrustedClientIp);
    expect($response->json('ip'))->not->toBe($spoofedIp);
});

test('U-4: reverse proxy resmi Cloudflare dipercaya dan meneruskan IP klien asli', function () {
    $cloudflareProxyIp = '173.245.48.50'; // IP resmi dalam rentang Cloudflare 173.245.48.0/20
    $realClientIp = '180.252.160.88';

    $response = $this->withServerVariables([
        'REMOTE_ADDR' => $cloudflareProxyIp,
        'HTTP_X_FORWARDED_FOR' => $realClientIp,
    ])->getJson('/api/test-ip');

    $response->assertStatus(200);
    expect($response->json('ip'))->toBe($realClientIp);
});
