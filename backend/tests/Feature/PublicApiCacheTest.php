<?php

use App\Models\User;

test('1. GET /api/v1/products publik mengirim Cache-Control dan ETag, serta mendukung 304 Not Modified', function () {
    $res = $this->get('/api/v1/products');

    $res->assertStatus(200);
    $res->assertHeader('Cache-Control', 'max-age=30, public, s-maxage=60');
    expect($res->headers->has('ETag'))->toBeTrue();

    $etag = $res->headers->get('ETag');
    expect($etag)->not->toBeEmpty();

    $res304 = $this->withHeaders(['If-None-Match' => $etag])->get('/api/v1/products');
    $res304->assertStatus(304);
    $res304->assertHeader('ETag', $etag);
});

test('2. GET /api/v1/categories publik mengirim Cache-Control dan ETag, serta mendukung 304 Not Modified', function () {
    $res = $this->get('/api/v1/categories');

    $res->assertStatus(200);
    $res->assertHeader('Cache-Control', 'max-age=30, public, s-maxage=60');
    expect($res->headers->has('ETag'))->toBeTrue();

    $etag = $res->headers->get('ETag');
    expect($etag)->not->toBeEmpty();

    $res304 = $this->withHeaders(['If-None-Match' => $etag])->get('/api/v1/categories');
    $res304->assertStatus(304);
    $res304->assertHeader('ETag', $etag);
});

test('3. Endpoint yang butuh login tidak mengirim Cache-Control public', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $res = $this->actingAs($admin, 'sanctum')->get('/api/v1/admin/dashboard');

    $res->assertStatus(200);
    $cacheControl = $res->headers->get('Cache-Control', '');
    expect($cacheControl)->not->toContain('public');
    expect($cacheControl)->toContain('no-cache');
});

test('4. CORS preflight OPTIONS request mengembalikan header Access-Control-Max-Age 7200', function () {
    $response = $this->withHeaders([
        'Origin' => 'https://cdepearlslombok.id',
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'Content-Type, Authorization, X-Requested-With',
    ])->options('/api/v1/products');

    $response->assertStatus(204);
    $response->assertHeader('Access-Control-Max-Age', '7200');
    $response->assertHeader('Access-Control-Allow-Origin', 'https://cdepearlslombok.id');
});
