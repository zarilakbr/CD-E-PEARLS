<?php

use Illuminate\Support\Facades\DB;

test('1. GET /api/v1/health publik dapat diakses tanpa autentikasi dan mengembalikan status ok dengan ms', function () {
    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'ms',
            'database',
            'timestamp',
        ])
        ->assertJson([
            'status' => 'ok',
            'database' => 'ok',
        ]);

    $data = $response->json();
    expect($data['ms'])->toBeNumeric();
    expect($data['ms'])->toBeGreaterThanOrEqual(0);
    expect($data['status'])->toBe('ok');
});

test('2. GET /api/v1/health menangani degradasi database dengan mengembalikan status degraded dan 503', function () {
    DB::shouldReceive('select')
        ->once()
        ->with('SELECT 1')
        ->andThrow(new \Exception('Database connection failed mock'));

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(503)
        ->assertJson([
            'status' => 'degraded',
            'database' => 'disconnected',
        ]);

    expect($response->json('ms'))->toBeNumeric();
});
