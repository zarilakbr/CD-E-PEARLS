<?php

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'user', 'status' => 'active']);
    $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $this->spi = User::factory()->create(['role' => 'spi', 'status' => 'active']);

    $this->product = Product::create([
        'code' => 'SS-BR-001',
        'name' => 'Gelang Mutiara Emas South Sea 14mm',
        'category_slug' => 'gelang',
        'pearl_variety' => 'South Sea',
        'pearl_grade' => 'AAA',
        'pearl_size' => '14mm',
        'pearl_weight' => '12.5g',
        'pearl_shape' => 'Round',
        'color_group' => 'emas',
        'color_variant' => 'Champagne Gold',
        'price' => 15000000,
        'stock' => 5,
        'status' => 'published',
        'is_active' => true,
    ]);

    $this->order = Order::create([
        'order_number' => 'ORD-20261102-001',
        'user_id' => $this->user->id,
        'customer_name' => 'Ibu Ratna Dewi',
        'customer_email' => 'ratna.dewi@example.com',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Udayana No. 12, Mataram, NTB',
        'subtotal' => 15000000,
        'shipping_cost' => 50000,
        'discount' => 0,
        'total' => 15050000,
        'order_status' => 'COMPLETED',
        'payment_status' => 'PAID',
        'payment_method' => 'BANK_TRANSFER',
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

test('tamu ditolak 401 saat meminta ekspor excel', function () {
    $res = $this->get('/api/v1/spi/reports/sales/export');
    $res->assertStatus(401);
});

test('pelanggan biasa ditolak 403 saat meminta ekspor excel', function () {
    $res = $this->actingAs($this->user)->get('/api/v1/spi/reports/sales/export');
    $res->assertStatus(403);
});

test('admin operasional ditolak 403 saat meminta ekspor excel (khusus SPI)', function () {
    $res = $this->actingAs($this->admin)->get('/api/v1/spi/reports/sales/export');
    $res->assertStatus(403);
});

test('SPI berhasil mengekspor excel 200 dengan MIME dan header xlsx yang valid', function () {
    $res = $this->actingAs($this->spi)->get('/api/v1/spi/reports/sales/export');

    $res->assertStatus(200);
    $res->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect($res->headers->get('content-disposition'))->toContain('attachment');
    expect($res->headers->get('content-disposition'))->toContain('.xlsx');

    // Audit log harus tercatat
    $log = AuditLog::where('action', 'SPI_EXPORT_SALES_REPORT')->first();
    expect($log)->not->toBeNull();
    expect($log->actor_id)->toBe($this->spi->id);
    expect($log->target_type)->toBe('report');
});

test('SPI dapat memfilter ekspor excel berdasarkan status pesanan dan kategori', function () {
    $res = $this->actingAs($this->spi)->get('/api/v1/spi/reports/sales/export?status=COMPLETED&category=gelang');

    $res->assertStatus(200);
    $res->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});
