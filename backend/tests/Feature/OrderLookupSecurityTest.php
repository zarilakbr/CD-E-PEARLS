<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->customerA = User::factory()->create([
        'role' => 'user',
        'email' => 'customerA@cdpearls.com',
    ]);

    $this->customerB = User::factory()->create([
        'role' => 'user',
        'email' => 'customerB@cdpearls.com',
    ]);

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'email' => 'admin@cdpearls.com',
    ]);

    $this->product = Product::create([
        'slug' => 'kalung-mutiara-south-sea-gold-12mm',
        'name' => 'Kalung Mutiara South Sea Gold 12mm',
        'category_slug' => 'kalung',
        'pearl_variety' => 'South Sea',
        'pearl_grade' => 'AAA',
        'pearl_size' => '12mm',
        'price' => 15000000,
        'stock' => 5,
        'status' => 'published',
    ]);

    $this->trackingToken = bin2hex(random_bytes(32));

    $this->order = Order::create([
        'order_number' => 'CDE-2026-0001',
        'user_id' => $this->customerA->id,
        'customer_name' => 'Budi Raharja Rahasia',
        'customer_phone' => '081298765432',
        'customer_address' => 'Jl. Kenanga No. 42 RT 03 RW 05, Sekarbela, Mataram, NTB 83115',
        'subtotal' => 15000000,
        'discount' => 0,
        'shipping_cost' => 50000,
        'insurance_cost' => 25000,
        'total' => 15075000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
        'tracking_token' => $this->trackingToken,
    ]);

    OrderItem::create([
        'order_id' => $this->order->id,
        'product_id' => $this->product->id,
        'product_name' => $this->product->name,
        'price' => 15000000,
        'quantity' => 1,
        'subtotal' => 15000000,
    ]);
});

test('U-2: tamu menebak nomor pesanan tanpa token dan 4 digit telepon ditolak (404) dan tidak mendapat PII', function () {
    $response = $this->getJson('/api/v1/orders/lookup/CDE-2026-0001');

    $response->assertStatus(404);
    $response->assertJsonMissing(['customer_address' => 'Jl. Kenanga No. 42 RT 03 RW 05, Sekarbela, Mataram, NTB 83115']);
    $response->assertJsonMissing(['customer_phone' => '081298765432']);
    $response->assertJsonMissing(['customer_name' => 'Budi Raharja Rahasia']);
});

test('U-2: tamu dengan token salah atau 4 digit telepon salah mendapat respons 404 seragam', function () {
    $res1 = $this->getJson('/api/v1/orders/lookup/CDE-2026-0001?tracking_token=invalidtoken123456789012345678901234&phone_last4=5432');
    $res1->assertStatus(404);

    $res2 = $this->getJson('/api/v1/orders/lookup/CDE-2026-0001?tracking_token=' . $this->trackingToken . '&phone_last4=9999');
    $res2->assertStatus(404);

    expect($res1->json('message'))->toBe($res2->json('message'));
});

test('U-2: tamu dengan token dan 4 digit telepon valid hanya menerima ringkasan status tanpa PII lengkap', function () {
    $response = $this->getJson('/api/v1/orders/lookup/CDE-2026-0001?tracking_token=' . $this->trackingToken . '&phone_last4=5432');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'data' => [
            'order_number',
            'order_status',
            'payment_status',
            'customer_name_masked',
            'customer_phone_masked',
            'city',
            'subtotal',
            'total',
            'items',
        ],
    ]);

    $data = $response->json('data');
    expect(json_encode($data))->not->toContain('Jl. Kenanga No. 42 RT 03 RW 05');
    expect($data['customer_phone_masked'] ?? null)->not->toBe('081298765432');
    expect($data['customer_phone_masked'] ?? '')->toContain('5432');
    expect($data['customer_phone_masked'] ?? '')->toContain('****');
});

test('U-2: pelanggan terautentikasi lain ditolak 403 saat mencoba melihat pesanan orang lain', function () {
    $response = $this->actingAs($this->customerB)
        ->getJson('/api/v1/orders/lookup/CDE-2026-0001');

    $response->assertStatus(403);
});

test('U-2: pemilik pesanan dan admin berhak melihat rincian pesanan', function () {
    $ownerResponse = $this->actingAs($this->customerA)
        ->getJson('/api/v1/orders/lookup/CDE-2026-0001');
    $ownerResponse->assertStatus(200);
    $ownerResponse->assertJsonPath('data.order_number', 'CDE-2026-0001');

    $adminResponse = $this->actingAs($this->admin)
        ->getJson('/api/v1/orders/lookup/CDE-2026-0001');
    $adminResponse->assertStatus(200);
    $adminResponse->assertJsonPath('data.order_number', 'CDE-2026-0001');
});

test('pelanggan A tidak bisa melihat, membatalkan, atau mengunggah bukti bayar pesanan pelanggan B, baik lewat id maupun order_number (403 atau 404)', function () {
    // Pesanan milik Customer B
    $orderB = Order::create([
        'order_number' => 'CDE-2026-9999',
        'user_id' => $this->customerB->id,
        'customer_name' => 'Customer B Rahasia',
        'customer_phone' => '081211112222',
        'customer_address' => 'Jl. Melati No. 99, Mataram',
        'subtotal' => 10000000,
        'discount' => 0,
        'shipping_cost' => 50000,
        'insurance_cost' => 25000,
        'total' => 10075000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
        'tracking_token' => bin2hex(random_bytes(32)),
    ]);

    $file = \Illuminate\Http\UploadedFile::fake()->image('bukti.jpg');

    // 1. Melihat pesanan (GET /orders/{id} & GET /orders/{order_number})
    $resShowId = $this->actingAs($this->customerA)->getJson("/api/v1/orders/{$orderB->id}");
    expect(in_array($resShowId->status(), [403, 404]))->toBeTrue();

    $resShowNum = $this->actingAs($this->customerA)->getJson("/api/v1/orders/{$orderB->order_number}");
    expect(in_array($resShowNum->status(), [403, 404]))->toBeTrue();

    // 2. Membatalkan pesanan (POST /orders/{id}/cancel & POST /orders/{order_number}/cancel)
    $resCancelId = $this->actingAs($this->customerA)->postJson("/api/v1/orders/{$orderB->id}/cancel");
    expect(in_array($resCancelId->status(), [403, 404]))->toBeTrue();

    $resCancelNum = $this->actingAs($this->customerA)->postJson("/api/v1/orders/{$orderB->order_number}/cancel");
    expect(in_array($resCancelNum->status(), [403, 404]))->toBeTrue();

    // 3. Mengunggah bukti bayar (POST /orders/{id}/payment-proof & POST /orders/{order_number}/payment-proof)
    $resProofId = $this->actingAs($this->customerA)->postJson("/api/v1/orders/{$orderB->id}/payment-proof", [
        'proof_image' => $file,
    ]);
    expect(in_array($resProofId->status(), [403, 404]))->toBeTrue();

    $resProofNum = $this->actingAs($this->customerA)->postJson("/api/v1/orders/{$orderB->order_number}/payment-proof", [
        'proof_image' => $file,
    ]);
    expect(in_array($resProofNum->status(), [403, 404]))->toBeTrue();
});
