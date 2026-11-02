<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $this->product = Product::create([
        'code' => 'PRD-GOLD-001',
        'name' => 'Kalung Mutiara Emas 14mm',
        'category_slug' => 'kalung',
        'pearl_variety' => 'South Sea',
        'pearl_grade' => 'AAA',
        'pearl_size' => '14mm',
        'price' => 10000000,
        'stock' => 5,
        'status' => 'published',
    ]);
});

test('U-1: tolak product_id null pada item pesanan (422)', function () {
    $payload = [
        'customer_name' => 'Budi Santoso',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mataram No. 1',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => null,
                'product_name' => 'Mutiara Palsu',
                'price' => 1,
                'quantity' => 1,
            ],
        ],
    ];

    $res = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);

    $res->assertStatus(422);
    $res->assertJsonValidationErrors(['items.0.product_id']);
});

test('U-1: abaikan input discount dan price dari klien, hitung total asli dari database server', function () {
    $payload = [
        'customer_name' => 'Budi Santoso',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mataram No. 1',
        'payment_method' => 'TRANSFER_BANK',
        'discount' => 9999999, // Klien manipulasi diskon besar
        'items' => [
            [
                'product_id' => $this->product->id,
                'product_name' => 'Nama Klien',
                'price' => 1, // Klien manipulasi harga Rp 1
                'quantity' => 1,
            ],
        ],
    ];

    $res = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);

    $res->assertStatus(201);

    $order = Order::latest('id')->first();
    expect((float) $order->subtotal)->toBe(10000000.0);
    expect((float) $order->discount)->toBe(0.0); // Diskon klien harus 0 karena tanpa voucher valid
    expect((float) $order->shipping_cost)->toBe(50000.0);
    expect((float) $order->insurance_cost)->toBe(20000.0);
    expect((float) $order->total)->toBe(10070000.0);
});

test('U-1: diskon hanya berlaku lewat kode voucher server yang valid (fixed & percent)', function () {
    $voucher = Voucher::create([
        'code' => 'MUTIARABERCAHAYA',
        'type' => 'fixed',
        'value' => 500000,
        'quota' => 10,
        'used_count' => 0,
        'min_spend' => 5000000,
        'expires_at' => now()->addDays(7),
        'is_active' => true,
    ]);

    $payload = [
        'customer_name' => 'Budi Santoso',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mataram No. 1',
        'payment_method' => 'TRANSFER_BANK',
        'voucher_code' => 'MUTIARABERCAHAYA',
        'items' => [
            [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'quantity' => 1,
            ],
        ],
    ];

    $res = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);

    $res->assertStatus(201);
    $order = Order::latest('id')->first();
    expect((float) $order->discount)->toBe(500000.0);
    expect((float) $order->total)->toBe(10070000.0 - 500000.0);
    expect($voucher->fresh()->used_count)->toBe(1);
});

test('U-1: tolak voucher yang tidak valid atau kedaluwarsa (422)', function () {
    $voucherExpired = Voucher::create([
        'code' => 'EXPIREDVOUCHER',
        'type' => 'fixed',
        'value' => 100000,
        'quota' => 10,
        'used_count' => 0,
        'min_spend' => 100000,
        'expires_at' => now()->subDay(),
        'is_active' => true,
    ]);

    $payload = [
        'customer_name' => 'Budi Santoso',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mataram No. 1',
        'payment_method' => 'TRANSFER_BANK',
        'voucher_code' => 'EXPIREDVOUCHER',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ],
        ],
    ];

    $res = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);
    $res->assertStatus(422);
    $res->assertJsonFragment(['message' => 'Kode voucher telah kedaluwarsa.']);
});

test('U-1: tolak checkout produk yang tidak aktif atau diarsipkan (422)', function () {
    $archivedProduct = Product::create([
        'code' => 'PRD-ARCHIVED-001',
        'name' => 'Cincin Mutiara Arsip',
        'category_slug' => 'cincin',
        'price' => 5000000,
        'stock' => 5,
        'status' => 'archived',
    ]);

    $payload = [
        'customer_name' => 'Budi Santoso',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mataram No. 1',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $archivedProduct->id,
                'quantity' => 1,
            ],
        ],
    ];

    $res = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);
    $res->assertStatus(422);
    $res->assertJsonFragment(['message' => "Produk ID {$archivedProduct->id} tidak aktif atau tidak ditemukan dalam katalog."]);
});
