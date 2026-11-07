<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    // Seed essential roles if needed
});

test('unauthenticated request to /api/v1/sync/status is rejected with 401', function () {
    $response = $this->getJson('/api/v1/sync/status');
    $response->assertStatus(401);
});

test('role authorization: admin, spi, and customer receive role-tailored status summaries', function () {
    $admin = User::factory()->create([
        'email' => 'admin.sync.test@cdepearls.com',
        'role' => 'admin',
    ]);

    Sanctum::actingAs($admin);
    $adminRes = $this->getJson('/api/v1/sync/status');
    $adminRes->assertStatus(200)
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonStructure([
            'success',
            'data' => [
                'role',
                'total_orders',
                'pending_orders',
                'processing_orders',
                'low_stock_count',
            ],
        ]);

    $spi = User::factory()->create([
        'email' => 'spi.sync.test@cdepearls.com',
        'role' => 'spi',
    ]);

    Sanctum::actingAs($spi);
    $spiRes = $this->getJson('/api/v1/sync/status');
    $spiRes->assertStatus(200)
        ->assertJsonPath('data.role', 'spi')
        ->assertJsonStructure([
            'success',
            'data' => [
                'role',
                'today_revenue',
                'pending_approvals_count',
                'orders_by_status',
            ],
        ]);

    $customer = User::factory()->create([
        'email' => 'customer.sync.test@cdepearls.com',
        'role' => 'user',
    ]);

    Sanctum::actingAs($customer);
    $custRes = $this->getJson('/api/v1/sync/status');
    $custRes->assertStatus(200)
        ->assertJsonPath('data.role', 'user')
        ->assertJsonStructure([
            'success',
            'data' => [
                'role',
                'orders_count',
                'active_orders_count',
                'pending_payment_count',
            ],
        ]);
});

test('strict IDOR protection: customer A cannot see or leak customer B orders', function () {
    $customerA = User::factory()->create([
        'email' => 'customer.a.idor@cdepearls.com',
        'role' => 'user',
    ]);

    $customerB = User::factory()->create([
        'email' => 'customer.b.idor@cdepearls.com',
        'role' => 'user',
    ]);

    $orderA = Order::create([
        'order_number' => 'ORD-IDOR-A-001',
        'user_id' => $customerA->id,
        'customer_name' => 'Customer A',
        'customer_phone' => '08111111111',
        'customer_address' => 'Alamat A',
        'subtotal' => 5000000,
        'discount' => 0,
        'shipping_cost' => 0,
        'insurance_cost' => 0,
        'total' => 5000000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'UNPAID',
        'order_status' => 'PROCESSING',
    ]);

    $orderB = Order::create([
        'order_number' => 'ORD-IDOR-B-002',
        'user_id' => $customerB->id,
        'customer_name' => 'Customer B',
        'customer_phone' => '08222222222',
        'customer_address' => 'Alamat B',
        'subtotal' => 12000000,
        'discount' => 0,
        'shipping_cost' => 0,
        'insurance_cost' => 0,
        'total' => 12000000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'PAID',
        'order_status' => 'SHIPPED',
    ]);

    // Query as Customer A
    Sanctum::actingAs($customerA);
    $resA = $this->getJson('/api/v1/sync/status');
    $resA->assertStatus(200);
    expect($resA->json('data.orders_count'))->toBe(1);
    expect($resA->json('data.active_orders_count'))->toBe(1);
    expect($resA->json('data.latest_order.order_number'))->toBe('ORD-IDOR-A-001');

    // Query as Customer B
    Sanctum::actingAs($customerB);
    $resB = $this->getJson('/api/v1/sync/status');
    $resB->assertStatus(200);
    expect($resB->json('data.orders_count'))->toBe(1);
    expect($resB->json('data.active_orders_count'))->toBe(1);
    expect($resB->json('data.latest_order.order_number'))->toBe('ORD-IDOR-B-002');
});

test('etag and 304 Not Modified support: identical polling requests return 304 without body', function () {
    $user = User::factory()->create([
        'email' => 'customer.etag@cdepearls.com',
        'role' => 'user',
    ]);

    Sanctum::actingAs($user);

    // Initial request receives 200 with ETag header
    $res1 = $this->getJson('/api/v1/sync/status');
    $res1->assertStatus(200);
    $etag = $res1->headers->get('ETag');
    expect($etag)->not->toBeEmpty();

    // Subsequent request with matching If-None-Match header receives 304 Not Modified
    $res2 = $this->withHeaders(['If-None-Match' => $etag])->get('/api/v1/sync/status');
    $res2->assertStatus(304);
    expect($res2->getContent())->toBeEmpty();

    // After state changes, new ETag is generated and 200 is returned
    Order::create([
        'order_number' => 'ORD-NEW-ETAG-003',
        'user_id' => $user->id,
        'customer_name' => 'ETag Customer',
        'customer_phone' => '08333333333',
        'customer_address' => 'Alamat C',
        'subtotal' => 2000000,
        'discount' => 0,
        'shipping_cost' => 0,
        'insurance_cost' => 0,
        'total' => 2000000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'UNPAID',
        'order_status' => 'PENDING',
    ]);

    $res3 = $this->withHeaders(['If-None-Match' => $etag])->get('/api/v1/sync/status');
    $res3->assertStatus(200);
    $newEtag = $res3->headers->get('ETag');
    expect($newEtag)->not->toBe($etag);
});

