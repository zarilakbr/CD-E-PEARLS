<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

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
        'role' => 'user',
        'status' => 'active',
    ]);

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'role' => 'spi',
        'status' => 'active',
    ]);
});

test('tamu 401 saat mengakses manajemen produk admin', function () {
    $this->postJson('/api/admin/products', [])->assertStatus(401);
    $this->putJson('/api/admin/products/1', [])->assertStatus(401);
    $this->deleteJson('/api/admin/products/1')->assertStatus(401);
});

test('pelanggan 403 saat mengakses manajemen produk admin', function () {
    $this->actingAs($this->customer)
        ->postJson('/api/admin/products', [])
        ->assertStatus(403);

    $this->actingAs($this->customer)
        ->putJson('/api/admin/products/1', [])
        ->assertStatus(403);

    $this->actingAs($this->customer)
        ->deleteJson('/api/admin/products/1')
        ->assertStatus(403);
});

test('validasi 422 per field: tolak harga < 0, stok < 0, ukuran luar 9-21mm, varietas, grade, kelompok warna, mime palsu', function () {
    $basePayload = [
        'name' => 'Kalung Mutiara Ratu Laut',
        'description' => 'Kilau nacre tebal perairan Sekotong',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AAA',
        'ukuran_mm' => '12.5',
        'berat' => '5.2 gr',
        'bentuk' => 'Bulat',
        'kelompok_warna' => 'emas',
        'varian_warna' => 'Emas Champagne 24K',
        'price' => 15000000,
        'stock' => 5,
        'status' => 'published',
    ];

    // 1. Tolak harga < 0
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['price' => -1000]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['price']);

    // 2. Tolak stok < 0
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['stock' => -5]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['stock']);

    // 3. Tolak ukuran_mm di luar 9-21 mm (misal 8 mm atau 25 mm)
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['ukuran_mm' => '8.0']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ukuran_mm']);

    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['ukuran_mm' => '22.0']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ukuran_mm']);

    // 4. Tolak jenis mutiara tidak valid
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['varietas' => 'Mutiara Plastik']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['varietas']);

    // 5. Tolak grade tidak valid
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['grade' => 'INVALID_GRADE']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['grade']);

    // 6. Tolak kelompok warna tidak valid
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, ['kelompok_warna' => 'neon_green']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['kelompok_warna']);

    // 7. Tolak unggahan bukan MIME gambar asli
    $fakeScriptFile = UploadedFile::fake()->create('malicious.php.png', 100, 'text/x-php');
    $this->actingAs($this->admin)
        ->postJson('/api/admin/products', array_merge($basePayload, [
            'photos' => [$fakeScriptFile],
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['photos.0']);
});

test('admin 201: admin berhasil menambah produk dengan verifikasi foto dan nama acak', function () {
    $realImage = UploadedFile::fake()->image('pearl_necklace_front.jpg', 800, 800)->size(1200);
    $realImage2 = UploadedFile::fake()->image('pearl_necklace_side.png', 800, 800)->size(800);

    $payload = [
        'name' => 'Kalung Mutiara South Sea Gold Edition',
        'description' => 'Kalung mutiara laut selatan pilihan dengan sertifikat orisinalitas.',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AAA',
        'ukuran_mm' => '14.5',
        'berat' => '8.4 gr',
        'bentuk' => 'Bulat',
        'kelompok_warna' => 'emas',
        'varian_warna' => 'Deep Gold',
        'price' => 28500000,
        'stock' => 3,
        'status' => 'published',
        'photos' => [$realImage, $realImage2],
        'photo_alts' => ['Tampak Depan Kalung Mutiara', 'Detail Kilau Mutiara'],
        'primary_photo_index' => 0,
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/admin/products', $payload);

    $response->assertStatus(201);
    expect($response->json('success'))->toBeTrue();

    $productData = $response->json('data');
    expect($productData['name'])->toBe('Kalung Mutiara South Sea Gold Edition');
    expect((float) $productData['price'])->toEqual(28500000.0);
    expect($productData['stock'])->toBe(3);
    expect($productData['status'])->toBe('published');

    // Pastikan foto tersimpan di storage dan nama file diacak (bukan nama asli)
    expect($productData['image'])->not->toBeNull();
    expect($productData['image'])->not->toContain('pearl_necklace_front.jpg');

    $this->assertDatabaseHas('products', [
        'id' => $productData['id'],
        'name' => 'Kalung Mutiara South Sea Gold Edition',
        'status' => 'published',
    ]);
});

test('admin dapat mengubah data produk (PUT)', function () {
    $product = Product::create([
        'code' => 'PRD-TEST-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Kalung Awal',
        'price' => 10000000,
        'stock' => 5,
        'varietas' => 'Freshwater',
        'grade' => 'AA',
        'ukuran_mm' => '10.0',
        'berat' => '4.0 gr',
        'bentuk' => 'Oval',
        'kelompok_warna' => 'putih',
        'varian_warna' => 'Putih Bersih',
        'status' => 'published',
    ]);

    $updatePayload = [
        'name' => 'Kalung Diperbarui',
        'price' => 10500000, // Perubahan kecil wajar < 10%
        'stock' => 8,
        'grade' => 'AAA',
        'ukuran_mm' => '10.5',
    ];

    $response = $this->actingAs($this->admin)->putJson("/api/admin/products/{$product->id}", $updatePayload);

    $response->assertStatus(200);
    expect($response->json('success'))->toBeTrue();

    $product->refresh();
    expect($product->name)->toBe('Kalung Diperbarui');
    expect($product->stock)->toBe(8);
    expect($product->grade)->toBe('AAA');
});

test('admin dapat menonaktifkan produk (soft delete)', function () {
    $product = Product::create([
        'code' => 'PRD-TEST-002',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Kalung Akan Dinonaktifkan',
        'price' => 12000000,
        'stock' => 2,
        'status' => 'published',
    ]);

    // Panggil DELETE untuk menonaktifkan / arsipkan
    $response = $this->actingAs($this->admin)->deleteJson("/api/admin/products/{$product->id}");

    $response->assertStatus(200);
    expect($response->json('success'))->toBeTrue();

    $product->refresh();
    expect($product->status)->toBe('archived');

    // Buktikan produk hilang dari katalog publik
    $catalogResponse = $this->getJson('/api/v1/products');
    $catalogResponse->assertStatus(200);
    $items = collect($catalogResponse->json('data'));
    expect($items->pluck('id'))->not->toContain($product->id);
});
