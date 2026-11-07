<?php

use Illuminate\Support\Facades\DB;

test('1. GET /api/v1/health publik dapat diakses tanpa autentikasi dan hanya menyisakan field status', function () {
    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(200)
        ->assertExactJson([
            'status' => 'ok',
        ])
        ->assertJsonMissing([
            'database',
            'timestamp',
            'ms',
        ]);

    expect($response->json())->toBe(['status' => 'ok']);
});

test('2. GET /api/v1/health menangani degradasi database dengan mengembalikan status degraded 503 tanpa membocorkan field internal', function () {
    DB::shouldReceive('select')
        ->once()
        ->with('SELECT 1')
        ->andThrow(new \Exception('Database connection failed mock'));

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(503)
        ->assertExactJson([
            'status' => 'degraded',
        ])
        ->assertJsonMissing([
            'database',
            'timestamp',
            'ms',
        ]);
});
