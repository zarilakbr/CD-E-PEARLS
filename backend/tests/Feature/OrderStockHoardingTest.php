<?php

use App\Models\Approval;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'role' => 'user',
        'email' => 'hoarder@example.com',
    ]);

    $this->spi = User::factory()->create([
        'role' => 'spi',
        'email' => 'spi@cdepearls.com',
    ]);

    $this->product = Product::create([
        'slug' => 'anting-mutiara-south-sea-10mm',
        'name' => 'Anting Mutiara South Sea 10mm',
        'category_slug' => 'anting',
        'pearl_variety' => 'South Sea',
        'pearl_grade' => 'AA',
        'pearl_size' => '10mm',
        'price' => 5000000,
        'stock' => 10,
        'stock_on_hand' => 10,
        'stock_reserved' => 0,
        'status' => 'published',
    ]);
});

test('U-3: pemesanan tamu tanpa login dan tanpa turnstile valid ditolak fail-closed (422)', function () {
    $payload = [
        'customer_name' => 'Tamu Misterius',
        'customer_phone' => '081299998888',
        'customer_address' => 'Jl. Anonim No. 9, Mataram',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ],
        ],
    ];

    $response = $this->postJson('/api/v1/orders', $payload);
    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['turnstile_token']);
});

test('U-3: akun tidak dapat menimbun pesanan jika melebihi batas 3 pesanan aktif WAITING_PAYMENT (422)', function () {
    // Buat 3 pesanan aktif dengan status WAITING_PAYMENT
    for ($i = 1; $i <= 3; $i++) {
        Order::create([
            'order_number' => sprintf('CDE-2026-%04d', 100 + $i),
            'user_id' => $this->user->id,
            'customer_name' => 'Hoarder',
            'customer_phone' => '081234567890',
            'customer_address' => 'Jl. Kenanga 123',
            'subtotal' => 5000000,
            'discount' => 0,
            'shipping_cost' => 50000,
            'insurance_cost' => 10000,
            'total' => 5060000,
            'payment_method' => 'TRANSFER_BANK',
            'payment_status' => 'WAITING_PAYMENT',
            'order_status' => 'PENDING',
        ]);
    }

    $payload = [
        'customer_name' => 'Hoarder',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Kenanga 123',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => 1,
            ],
        ],
    ];

    $response = $this->actingAs($this->user)->postJson('/api/v1/orders', $payload);
    $response->assertStatus(422);
    expect($response->json('message'))->toContain('Batas maksimal');
});

test('U-3: command orders:expire-reservations membatalkan pesanan kedaluwarsa dan mengembalikan stok utuh', function () {
    $this->product->update([
        'stock' => 8,
        'stock_reserved' => 2,
    ]);

    $order = Order::create([
        'order_number' => 'CDE-2026-9901',
        'user_id' => $this->user->id,
        'customer_name' => 'Pelanggan Lupa Bayar',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mawar 45',
        'subtotal' => 10000000,
        'discount' => 0,
        'shipping_cost' => 50000,
        'insurance_cost' => 20000,
        'total' => 10070000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
    ]);

    // Set created_at to 25 hours ago bypassing automatic timestamp updates
    Order::where('id', $order->id)->update([
        'created_at' => now()->subHours(25),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'product_name' => $this->product->name,
        'price' => 5000000,
        'quantity' => 2,
        'subtotal' => 10000000,
    ]);

    $exitCode = Artisan::call('orders:expire-reservations');
    expect($exitCode)->toBe(0);

    $order->refresh();
    expect($order->order_status)->toBe('CANCELLED');
    expect($order->payment_status)->toBe('FAILED');

    $this->product->refresh();
    expect($this->product->stock)->toBe(10);
    expect($this->product->stock_reserved)->toBe(0);

    $movement = StockMovement::where('reference_type', 'reservation_expired')
        ->where('reference_id', 'CDE-2026-9901')
        ->first();

    expect($movement)->not->toBeNull();
    expect($movement->type)->toBe('in');
    expect($movement->quantity)->toBe(2);
});

test('U-3: pembatalan pesanan atau otorisasi SPI mengembalikan stok tepat satu kali (idempoten)', function () {
    $this->product->update([
        'stock' => 7,
        'stock_reserved' => 3,
    ]);

    $order = Order::create([
        'order_number' => 'CDE-2026-9902',
        'user_id' => $this->user->id,
        'customer_name' => 'Pelanggan Batal',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mawar 45',
        'subtotal' => 15000000,
        'discount' => 0,
        'shipping_cost' => 50000,
        'insurance_cost' => 30000,
        'total' => 15080000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $this->product->id,
        'product_name' => $this->product->name,
        'price' => 5000000,
        'quantity' => 3,
        'subtotal' => 15000000,
    ]);

    // Batalkan pertama kali via API
    $res1 = $this->actingAs($this->user)->postJson('/api/v1/orders/' . $order->id . '/cancel');
    $res1->assertStatus(200);

    $this->product->refresh();
    expect($this->product->stock)->toBe(10);
    expect($this->product->stock_reserved)->toBe(0);

    // Coba batalkan kedua kali -> harus tolak atau tidak menambah stok lagi
    $res2 = $this->actingAs($this->user)->postJson('/api/v1/orders/' . $order->id . '/cancel');
    // Stok harus tetap 10, tidak boleh jadi 13!
    $this->product->refresh();
    expect($this->product->stock)->toBe(10);
});
