<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('regular user cannot access admin or spi routes', function () {
    $user = User::create([
        'name' => 'Customer Biasa',
        'email' => 'user@test.com',
        'password' => Hash::make('Mutiara2026!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $token = $user->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/dashboard')
        ->assertStatus(403);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/spi/summary')
        ->assertStatus(403);
});

test('admin can access admin routes but cannot access spi routes', function () {
    $admin = User::create([
        'name' => 'Admin CD\'E',
        'email' => 'admin@test.com',
        'password' => Hash::make('Admin2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    $token = $admin->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/dashboard')
        ->assertStatus(200);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/spi/summary')
        ->assertStatus(403);
});

test('spi has full supervisory access to both admin and spi routes', function () {
    $spi = User::create([
        'name' => 'Auditor SPI',
        'email' => 'spi@test.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/spi/summary')
        ->assertStatus(200);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/admin/dashboard')
        ->assertStatus(200);
});

test('idor prevention prevents customer from viewing another customer order', function () {
    $userA = User::create([
        'name' => 'User A',
        'email' => 'userA@test.com',
        'password' => Hash::make('Mutiara2026!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $userB = User::create([
        'name' => 'User B',
        'email' => 'userB@test.com',
        'password' => Hash::make('Mutiara2026!'),
        'role' => 'user',
        'status' => 'active',
    ]);

    $orderB = Order::create([
        'order_number' => 'ORD-TEST-999',
        'user_id' => $userB->id,
        'customer_name' => 'User B',
        'customer_phone' => '08123456789',
        'customer_address' => 'Alamat B',
        'subtotal' => 5000000,
        'discount' => 0,
        'shipping_cost' => 50000,
        'insurance_cost' => 10000,
        'total' => 5060000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
    ]);

    $tokenA = $userA->createToken('test')->plainTextToken;

    // User A attempts to view Order B -> must be 404 Not Found
    $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->getJson("/api/v1/orders/{$orderB->id}")
        ->assertStatus(404);
});

