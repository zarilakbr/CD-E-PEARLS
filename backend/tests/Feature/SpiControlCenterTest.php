<?php

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $this->category = Category::firstOrCreate(
        ['slug' => 'kalung-mutiara'],
        [
            'name' => 'Kalung Mutiara',
            'description' => 'Kategori Kalung Mutiara',
            'icon' => 'sparkles',
            'is_active' => true,
        ]
    );

    $this->customer = User::factory()->create([
        'name' => 'Pelanggan Biasa',
        'role' => 'user',
        'status' => 'active',
    ]);

    $this->admin = User::factory()->create([
        'name' => 'Admin Operasional',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'name' => 'Ketua SPI CD\'E Pearls',
        'role' => 'spi',
        'status' => 'active',
    ]);
});

test('tamu 401 saat mengakses seluruh rute pusat kendali SPI', function () {
    $this->getJson('/api/spi/summary')->assertStatus(401);
    $this->getJson('/api/spi/orders')->assertStatus(401);
    $this->getJson('/api/spi/stock')->assertStatus(401);
    $this->getJson('/api/spi/users')->assertStatus(401);
    $this->getJson('/api/spi/audit-logs')->assertStatus(401);
    $this->getJson('/api/spi/settings')->assertStatus(401);
});

test('pelanggan 403 saat mengakses seluruh rute pusat kendali SPI', function () {
    $this->actingAs($this->customer)->getJson('/api/spi/summary')->assertStatus(403);
    $this->actingAs($this->customer)->getJson('/api/spi/orders')->assertStatus(403);
    $this->actingAs($this->customer)->getJson('/api/spi/stock')->assertStatus(403);
    $this->actingAs($this->customer)->getJson('/api/spi/users')->assertStatus(403);
    $this->actingAs($this->customer)->getJson('/api/spi/audit-logs')->assertStatus(403);
    $this->actingAs($this->customer)->getJson('/api/spi/settings')->assertStatus(403);
});

test('admin 403 saat mengakses seluruh rute pusat kendali SPI (Eksklusif SPI)', function () {
    $this->actingAs($this->admin)->getJson('/api/spi/summary')->assertStatus(403);
    $this->actingAs($this->admin)->getJson('/api/spi/orders')->assertStatus(403);
    $this->actingAs($this->admin)->getJson('/api/spi/stock')->assertStatus(403);
    $this->actingAs($this->admin)->getJson('/api/spi/users')->assertStatus(403);
    $this->actingAs($this->admin)->getJson('/api/spi/audit-logs')->assertStatus(403);
    $this->actingAs($this->admin)->getJson('/api/spi/settings')->assertStatus(403);
});

test('spi 200: Ringkasan metrik database nyata (omzet hari ini/7d/30d, pesanan per status, produk terlaris, stok menipis, pelanggan baru)', function () {
    // 1. Buat produk & order riil
    $product = Product::create([
        'code' => 'PRD-LMB-KLN-999',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Kalung Mutiara Terlaris SPI',
        'price' => 10000000,
        'stock' => 2, // Stok menipis <= 3
        'status' => 'published',
    ]);

    $orderToday = Order::create([
        'order_number' => 'ORD-SPI-001',
        'user_id' => $this->customer->id,
        'customer_name' => 'Pembeli Hari Ini',
        'customer_phone' => '081234567890',
        'customer_address' => 'Mataram, Lombok',
        'subtotal' => 10000000,
        'shipping_cost' => 50000,
        'total' => 10050000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'PAID',
        'order_status' => 'PROCESSING',
        'created_at' => Carbon::today()->addHours(2),
    ]);

    OrderItem::create([
        'order_id' => $orderToday->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 10000000,
        'quantity' => 2,
        'subtotal' => 20000000,
    ]);

    $response = $this->actingAs($this->spi)->getJson('/api/spi/summary');

    $response->assertStatus(200);
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    // Verifikasi omzet berasal dari DB
    expect($data['revenue']['today'])->toBeGreaterThanOrEqual(10050000);
    expect($data['revenue']['days_7'])->toBeGreaterThanOrEqual(10050000);
    expect($data['revenue']['days_30'])->toBeGreaterThanOrEqual(10050000);

    // Verifikasi pesanan per status
    expect($data['orders_by_status'])->toBeArray();

    // Verifikasi produk terlaris
    expect($data['top_products'])->toBeArray();
    expect(collect($data['top_products'])->pluck('product_name'))->toContain('Kalung Mutiara Terlaris SPI');

    // Verifikasi stok menipis
    expect($data['low_stock_products'])->toBeArray();
    expect(collect($data['low_stock_products'])->pluck('id'))->toContain($product->id);

    // Verifikasi pelanggan baru
    expect($data['new_customers_count'])->toBeGreaterThanOrEqual(1);
});

test('spi dapat melihat dan mengoreksi stok dengan tercatat di log & stock_movements', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-STK-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Produk Koreksi Stok SPI',
        'price' => 5000000,
        'stock' => 10,
        'status' => 'published',
    ]);

    $response = $this->actingAs($this->spi)->postJson("/api/spi/stock/{$product->id}/adjust", [
        'delta' => -3,
        'reason' => 'Hasil opname brankas kuartal IV ditemukan selisih fisik',
    ]);

    $response->assertStatus(200);
    expect($response->json('success'))->toBeTrue();

    $product->refresh();
    expect($product->stock)->toBe(7);

    // Verifikasi stock_movements
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $product->id,
        'type' => 'adjustment',
        'quantity' => -3,
        'stock_before' => 10,
        'stock_after' => 7,
    ]);

    // Verifikasi AuditLog
    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->spi->id,
        'action' => 'SPI_ADJUST_STOCK',
        'target_id' => (string) $product->id,
    ]);
});

test('spi dapat mengubah status pesanan sesuai state machine', function () {
    $order = Order::create([
        'order_number' => 'ORD-SPI-STATUS-01',
        'user_id' => $this->customer->id,
        'customer_name' => 'Ibu Melinda',
        'customer_phone' => '081234567899',
        'customer_address' => 'Senggigi, Lombok Barat',
        'subtotal' => 12000000,
        'shipping_cost' => 0,
        'total' => 12000000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'PAID',
        'order_status' => 'PROCESSING',
    ]);

    $response = $this->actingAs($this->spi)->putJson("/api/spi/orders/{$order->id}/status", [
        'order_status' => 'SHIPPED',
        'notes' => 'Diserahkan ke kurir berpendingin khusus perhiasan',
    ]);

    $response->assertStatus(200);
    expect($response->json('success'))->toBeTrue();

    $order->refresh();
    expect($order->order_status)->toBe('SHIPPED');

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->spi->id,
        'action' => 'SPI_UPDATE_ORDER_STATUS',
        'target_id' => (string) $order->id,
    ]);
});

test('spi dapat mengelola pengguna tetapi DILARANG menurunkan perannya sendiri atau menonaktifkan dirinya', function () {
    $targetUser = User::factory()->create([
        'name' => 'Pegawai Baru',
        'role' => 'user',
        'status' => 'active',
    ]);

    // 1. SPI mengubah peran user lain menjadi admin -> SUKSES 200
    $res1 = $this->actingAs($this->spi)->putJson("/api/spi/users/{$targetUser->id}/role", [
        'role' => 'admin',
    ]);
    $res1->assertStatus(200);
    expect($targetUser->fresh()->role)->toBe('admin');

    // 2. SPI menonaktifkan user lain -> SUKSES 200
    $res2 = $this->actingAs($this->spi)->putJson("/api/spi/users/{$targetUser->id}/toggle-status");
    $res2->assertStatus(200);
    expect($targetUser->fresh()->status)->toBe('frozen');

    // 3. SPI DILARANG menurunkan dirinya sendiri -> DITOLAK 403
    $res3 = $this->actingAs($this->spi)->putJson("/api/spi/users/{$this->spi->id}/role", [
        'role' => 'admin',
    ]);
    $res3->assertStatus(403);
    expect($this->spi->fresh()->role)->toBe('spi');

    // 4. SPI DILARANG menonaktifkan dirinya sendiri -> DITOLAK 403
    $res4 = $this->actingAs($this->spi)->putJson("/api/spi/users/{$this->spi->id}/toggle-status");
    $res4->assertStatus(403);
    expect($this->spi->fresh()->status)->toBe('active');
});

test('spi dapat melihat dan memperbarui pengaturan toko', function () {
    $settingsPayload = [
        'store_name' => 'CD\'E Pearls Lombok Grand Atelier',
        'contact_phone' => '081239887700',
        'bank_accounts' => 'BCA 056-8899-221 a.n CD\'E Pearls Lombok; Mandiri 161-00-8877-112 a.n CD\'E Pearls',
        'shipping_flat_cost' => 50000,
        'payment_timeout_hours' => 24,
    ];

    $updateRes = $this->actingAs($this->spi)->postJson('/api/spi/settings', $settingsPayload);
    $updateRes->assertStatus(200);
    expect($updateRes->json('success'))->toBeTrue();

    // Verifikasi GET settings
    $getRes = $this->actingAs($this->spi)->getJson('/api/spi/settings');
    $getRes->assertStatus(200);
    $savedSettings = $getRes->json('data');

    expect($savedSettings['store_name'])->toBe('CD\'E Pearls Lombok Grand Atelier');
    expect($savedSettings['contact_phone'])->toBe('081239887700');
    expect((int) $savedSettings['shipping_flat_cost'])->toBe(50000);
});
