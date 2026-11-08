<?php

use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    // 1. Akun Pengujian Tiga Peran
    $this->spi = User::factory()->create([
        'name' => 'Auditor Pengawas SPI',
        'email' => 'spi.audit@cdepearlslombok.id',
        'role' => 'spi',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $this->admin = User::factory()->create([
        'name' => 'Admin Atelier CD\'E',
        'email' => 'admin.atelier@cdepearlslombok.id',
        'role' => 'admin',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $this->customerA = User::factory()->create([
        'name' => 'Pelanggan Alpha',
        'email' => 'pelanggan.a@cdepearlslombok.id',
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $this->customerB = User::factory()->create([
        'name' => 'Pelanggan Beta',
        'email' => 'pelanggan.b@cdepearlslombok.id',
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => now(),
    ]);

    $this->product = Product::create([
        'code' => 'PRD-TEST-TRI-01',
        'name' => 'Cincin Solitaire South Sea',
        'category_slug' => 'cincin-mutiara',
        'price' => 15000000,
        'stock' => 10,
        'status' => 'published',
    ]);
});

test('1. SPI: Melihat seluruh akun (pelanggan, admin, SPI) beserta peran, status, dan tanggal daftar', function () {
    $res = $this->actingAs($this->spi, 'sanctum')->getJson('/api/v1/spi/users');

    $res->assertStatus(200);
    $res->assertJsonStructure([
        'success',
        'data' => [
            '*' => ['id', 'name', 'email', 'phone', 'role', 'status', 'created_at'],
        ],
        'total',
    ]);

    $roles = collect($res->json('data'))->pluck('role')->unique()->all();
    expect($roles)->toContain('spi', 'admin', 'user');
});

test('2. Admin: Hanya melihat pelanggan (user) dan dilarang melihat daftar staf SPI', function () {
    // Akses daftar pelanggan
    $res = $this->actingAs($this->admin, 'sanctum')->getJson('/api/v1/admin/customers');

    $res->assertStatus(200);
    $roles = collect($res->json('data'))->pluck('role')->unique()->all();
    // Hanya pelanggan 'user'
    foreach ($roles as $r) {
        expect($r)->toBe('user');
    }

    // Admin dilarang mengakses panel pengguna SPI (Eksklusif SPI)
    $resSpiUsers = $this->actingAs($this->admin, 'sanctum')->getJson('/api/v1/spi/users');
    $resSpiUsers->assertStatus(403);
});

test('3. Pelanggan: Hanya melihat pesanan dan data miliknya sendiri (Strict IDOR Isolation)', function () {
    // Customer A membuat pesanan
    $orderA = Order::create([
        'order_number' => 'CDE-ORD-ALPHA-01',
        'user_id' => $this->customerA->id,
        'customer_name' => $this->customerA->name,
        'customer_phone' => '081239887711',
        'customer_address' => 'Jl. Pariwisata Senggigi Lombok',
        'subtotal' => 15000000,
        'total' => 15000000,
        'shipping_cost' => 0,
        'insurance_cost' => 0,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
        'tracking_token' => bin2hex(random_bytes(32)),
    ]);

    // Customer B mencoba mengakses pesanan milik Customer A -> DITOLAK 403 atau 404
    $resBViewA = $this->actingAs($this->customerB, 'sanctum')->getJson("/api/v1/orders/{$orderA->id}");
    expect(in_array($resBViewA->status(), [403, 404]))->toBeTrue();

    // Customer A mengakses pesanannya sendiri -> SUKSES 200
    $resAViewA = $this->actingAs($this->customerA, 'sanctum')->getJson("/api/v1/orders/{$orderA->id}");
    $resAViewA->assertStatus(200);

    // Pelanggan dilarang mengakses endpoint manajerial
    $this->actingAs($this->customerA, 'sanctum')->getJson('/api/v1/admin/customers')->assertStatus(403);
    $this->actingAs($this->customerA, 'sanctum')->getJson('/api/v1/spi/users')->assertStatus(403);
});

test('4. SPI: Dapat mengubah status pesanan dan membekukan akun pelanggan, tetapi dilarang membekukan dirinya', function () {
    $order = Order::create([
        'order_number' => 'CDE-ORD-ALPHA-02',
        'user_id' => $this->customerA->id,
        'customer_name' => $this->customerA->name,
        'customer_phone' => '081239887711',
        'customer_address' => 'Jl. Pariwisata Senggigi Lombok',
        'subtotal' => 15000000,
        'total' => 15000000,
        'shipping_cost' => 0,
        'insurance_cost' => 0,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'PAID',
        'order_status' => 'PROCESSING',
        'tracking_token' => bin2hex(random_bytes(32)),
    ]);

    // SPI mengubah status pesanan
    $resStatus = $this->actingAs($this->spi, 'sanctum')->putJson("/api/v1/spi/orders/{$order->id}/status", [
        'status' => 'READY_TO_SHIP',
        'notes' => 'Pemeriksaan integritas SPI selesai',
    ]);
    $resStatus->assertStatus(200);
    expect($order->fresh()->order_status)->toBe('READY_TO_SHIP');

    // SPI membekukan akun Customer A
    $resFreeze = $this->actingAs($this->spi, 'sanctum')->postJson("/api/v1/spi/users/{$this->customerA->id}/toggle-status");
    $resFreeze->assertStatus(200);
    expect($this->customerA->fresh()->status)->toBe('frozen');

    // SPI dilarang membekukan akunnya sendiri
    $resSelfFreeze = $this->actingAs($this->spi, 'sanctum')->postJson("/api/v1/spi/users/{$this->spi->id}/toggle-status");
    $resSelfFreeze->assertStatus(403);
    expect($this->spi->fresh()->status)->toBe('active');
});

test('5. Sinkronisasi Otomatis: GET /api/v1/sync/status memuat versi dan jumlah akun serta pesanan per peran', function () {
    // 1. SPI Sync Status
    $resSpi = $this->actingAs($this->spi, 'sanctum')->getJson('/api/v1/sync/status');
    $resSpi->assertStatus(200);
    $resSpi->assertJsonStructure([
        'success',
        'data' => [
            'role',
            'accounts_count',
            'accounts_version',
            'orders_count',
            'orders_version',
        ],
    ]);
    expect($resSpi->json('data.role'))->toBe('spi');
    expect($resSpi->json('data.accounts_count'))->toBeGreaterThanOrEqual(4);

    // 2. Admin Sync Status
    $resAdmin = $this->actingAs($this->admin, 'sanctum')->getJson('/api/v1/sync/status');
    $resAdmin->assertStatus(200);
    $resAdmin->assertJsonStructure([
        'success',
        'data' => [
            'role',
            'accounts_count',
            'customers_count',
            'accounts_version',
            'total_orders',
            'orders_version',
        ],
    ]);
    expect($resAdmin->json('data.role'))->toBe('admin');
    expect($resAdmin->json('data.accounts_count'))->toBeGreaterThanOrEqual(2); // Customer A dan B

    // 3. Customer Sync Status
    $resCust = $this->actingAs($this->customerA, 'sanctum')->getJson('/api/v1/sync/status');
    $resCust->assertStatus(200);
    $resCust->assertJsonStructure([
        'success',
        'data' => [
            'role',
            'orders_count',
            'orders_version',
            'profile_version',
        ],
    ]);
    expect($resCust->json('data.role'))->toBe('user');
});
