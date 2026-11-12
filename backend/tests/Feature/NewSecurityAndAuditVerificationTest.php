<?php

use App\Models\Approval;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->customer = User::factory()->create([
        'role' => 'user',
        'status' => 'active',
        'phone' => '081234567890',
    ]);

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'role' => 'spi',
        'status' => 'active',
    ]);

    Category::firstOrCreate(
        ['slug' => 'kalung-mutiara'],
        ['name' => 'Kalung Mutiara', 'description' => 'Kategori Kalung', 'icon' => 'sparkles', 'is_active' => true]
    );

    $this->product = Product::create([
        'code' => 'PRD-TEST-THROT-001',
        'name' => 'Kalung Mutiara Test Throttle',
        'category_slug' => 'kalung-mutiara',
        'price' => 5000000,
        'stock' => 10,
        'status' => 'published',
    ]);
});

/*
|--------------------------------------------------------------------------
| 1. Throttle Lookup Pesanan (Maks 10 req/menit -> 429)
|--------------------------------------------------------------------------
*/
test('U-11.3: throttle lookup pesanan membatasi 10 request per menit dan mengembalikan HTTP 429', function () {
    $order = Order::create([
        'order_number' => 'CDE-2026-9999',
        'tracking_token' => str_repeat('a', 64),
        'customer_name' => 'Siti Rahma',
        'customer_phone' => '081234567890',
        'customer_address' => 'Mataram, Lombok',
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
        'subtotal' => 5000000,
        'total' => 5070000,
    ]);

    $lastResponse = null;

    // 10 request pertama diperbolehkan (meskipun 404 karena kredensial salah)
    for ($i = 0; $i < 10; $i++) {
        $lastResponse = $this->getJson('/api/v1/orders/lookup/CDE-2026-9999?tracking_token=wrong&phone_last4=0000');
        expect($lastResponse->status())->toBe(404);
    }

    // Request ke-11 harus diblokir oleh rate limiter dengan status HTTP 429 Too Many Requests
    $throttledResponse = $this->getJson('/api/v1/orders/lookup/CDE-2026-9999?tracking_token=wrong&phone_last4=0000');
    expect($throttledResponse->status())->toBe(429);
});

/*
|--------------------------------------------------------------------------
| 2. Clamping per_page=100000 Menjadi Maksimal 100 di SEMUA Endpoint Daftar
|--------------------------------------------------------------------------
*/
test('U-11.3: per_page=100000 dibatasi (clamped) menjadi maksimal 100 di semua endpoint daftar', function () {
    $endpoints = [
        ['name' => 'Katalog Publik', 'url' => '/api/v1/products', 'user' => null, 'key' => 'per_page'],
        ['name' => 'Pesanan Admin', 'url' => '/api/v1/orders', 'user' => $this->admin, 'key' => 'per_page'],
        ['name' => 'Produk Admin', 'url' => '/api/v1/admin/products', 'user' => $this->admin, 'key' => 'per_page'],
        ['name' => 'Pesanan SPI', 'url' => '/api/v1/spi/orders', 'user' => $this->spi, 'key' => 'per_page'],
        ['name' => 'Stok SPI', 'url' => '/api/v1/spi/stock', 'user' => $this->spi, 'key' => 'per_page'],
        ['name' => 'Pengguna SPI', 'url' => '/api/v1/spi/users', 'user' => $this->spi, 'key' => 'per_page'],
        ['name' => 'Temuan Audit SPI', 'url' => '/api/v1/spi/audit-findings', 'user' => $this->spi, 'key' => 'per_page'],
        ['name' => 'Log Audit SPI', 'url' => '/api/v1/spi/audit-logs', 'user' => $this->spi, 'key' => 'per_page'],
    ];

    foreach ($endpoints as $ep) {
        $req = $ep['user'] ? $this->actingAs($ep['user']) : $this;
        $response = $req->getJson($ep['url'].'?per_page=100000');

        $response->assertStatus(200);

        // Cari field per_page baik di root maupun di dalam objek data
        $perPage = $response->json('per_page')
            ?? $response->json('data.per_page')
            ?? $response->json('meta.per_page');

        expect($perPage)->toBeLessThanOrEqual(100, "Endpoint {$ep['name']} ({$ep['url']}) gagal membatasi per_page ke 100");
    }
});

/*
|--------------------------------------------------------------------------
| 3. storage:migrate-proofs-private & Unduhan Berotorisasi
|--------------------------------------------------------------------------
*/
test('U-11.3: command storage:migrate-proofs-private memindahkan file bukti transfer dan unduhan tetap berotorisasi', function () {
    Storage::fake('public');
    Storage::fake('private');

    $order = Order::create([
        'order_number' => 'CDE-2026-8888',
        'user_id' => $this->customer->id,
        'customer_name' => $this->customer->name,
        'customer_phone' => $this->customer->phone,
        'customer_address' => 'Mataram, Lombok',
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
        'subtotal' => 2500000,
        'total' => 2570000,
    ]);

    $legacyFilePath = 'payments/legacy_proof_transfer.jpg';
    Storage::disk('public')->put($legacyFilePath, 'isi-gambar-bukti-transfer-rahasia');

    $payment = Payment::create([
        'order_id' => $order->id,
        'amount' => 2570000,
        'payment_method' => 'TRANSFER_BANK',
        'status' => 'PENDING',
        'proof_path' => $legacyFilePath,
    ]);

    // Jalankan command migrasi
    $exitCode = Artisan::call('storage:migrate-proofs-private');
    expect($exitCode)->toBe(0);

    // Buktikan file lama di disk publik telah dihapus
    expect(Storage::disk('public')->exists($legacyFilePath))->toBeFalse();

    // Buktikan file telah berpindah ke disk privat
    expect(Storage::disk('private')->exists($legacyFilePath))->toBeTrue();

    // Pengguna lain (tamu / customer lain) ditolak 404
    $stranger = User::factory()->create(['role' => 'user', 'status' => 'active']);
    $this->actingAs($stranger)
        ->getJson("/api/v1/orders/{$order->id}/payments/{$payment->id}/proof")
        ->assertStatus(404);

    // Pemilik pesanan sah berhak mengunduh bukti transfer
    $ownerRes = $this->actingAs($this->customer)
        ->get("/api/v1/orders/{$order->id}/payments/{$payment->id}/proof");
    $ownerRes->assertStatus(200);

    // Admin berhak mengunduh bukti transfer
    $adminRes = $this->actingAs($this->admin)
        ->get("/api/v1/orders/{$order->id}/payments/{$payment->id}/proof");
    $adminRes->assertStatus(200);
});

/*
|--------------------------------------------------------------------------
| 4. Ambang Harga Dinamis Minimum DAN Maksimum dari Pengaturan SPI
|--------------------------------------------------------------------------
*/
test('U-11.3: ambang harga minimum DAN maksimum dari pengaturan SPI dipatuhi secara dinamis', function () {
    // Setel ambang di database Setting: min Rp 200.000, max Rp 50.000.000
    Setting::updateOrCreate(['key' => 'min_product_price_threshold'], ['value' => '200000']);
    Setting::updateOrCreate(['key' => 'max_product_price_threshold'], ['value' => '50000000']);

    $photo = UploadedFile::fake()->image('pearl_test.jpg', 600, 600);

    // Kasus 1: Harga Rp 150.000 (di bawah minimum Rp 200.000) -> pending_approval
    $resMin = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', [
        'name' => 'Liontin Mutiara Dibawah Ambang Min',
        'description' => 'Mutiara dengan harga terlalu rendah',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'Freshwater',
        'grade' => 'A',
        'ukuran_mm' => '10.0',
        'kelompok_warna' => 'putih',
        'price' => 150000,
        'stock' => 3,
        'photos' => [$photo],
    ]);

    $resMin->assertStatus(201);
    expect($resMin->json('data.status'))->toBe('pending_approval');
    expect(Approval::where('target_id', (string) $resMin->json('data.id'))->exists())->toBeTrue();

    // Kasus 2: Harga Rp 5.000.000 (berada di dalam rentang wajar Rp 200.000 - Rp 50.000.000) -> published
    $photo2 = UploadedFile::fake()->image('pearl_normal.jpg', 600, 600);
    $resNormal = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', [
        'name' => 'Kalung Mutiara Rentang Wajar',
        'description' => 'Mutiara dengan harga wajar sesuai pasar',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AA',
        'ukuran_mm' => '12.0',
        'kelompok_warna' => 'emas',
        'price' => 5000000,
        'stock' => 5,
        'photos' => [$photo2],
    ]);

    $resNormal->assertStatus(201);
    expect($resNormal->json('data.status'))->toBe('published');

    // Kasus 3: Harga Rp 60.000.000 (di atas maksimum Rp 50.000.000) -> pending_approval
    $photo3 = UploadedFile::fake()->image('pearl_expensive.jpg', 600, 600);
    $resMax = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', [
        'name' => 'Kalung Mutiara Diatas Ambang Max',
        'description' => 'Mutiara super langka dengan harga di atas ambang batas standar',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AAA',
        'ukuran_mm' => '18.0',
        'kelompok_warna' => 'langka',
        'price' => 60000000,
        'stock' => 1,
        'photos' => [$photo3],
    ]);

    $resMax->assertStatus(201);
    expect($resMax->json('data.status'))->toBe('pending_approval');
    expect(Approval::where('target_id', (string) $resMax->json('data.id'))->exists())->toBeTrue();
});
