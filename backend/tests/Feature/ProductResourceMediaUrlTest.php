<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->category = Category::firstOrCreate(
        ['slug' => 'kalung-mutiara'],
        ['name' => 'Kalung Mutiara', 'description' => 'Kategori Kalung', 'icon' => 'sparkles', 'is_active' => true]
    );

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);
});

test('1. GET /api/v1/products mengembalikan URL absolut (berbasis APP_URL) pada image dan webp_url', function () {
    $appUrl = rtrim(config('app.url'), '/');

    Product::create([
        'code' => 'PRD-LMB-KLG-001',
        'name' => 'Kalung Mutiara Hitam Lombok',
        'category_slug' => 'kalung-mutiara',
        'price' => 12500000,
        'stock' => 5,
        'image' => '/storage/products/kalung-hitam.jpg',
        'images' => [
            ['url' => '/storage/products/kalung-hitam-1.jpg', 'is_primary' => true, 'order' => 1],
            ['url' => '/storage/products/kalung-hitam-2.png', 'is_primary' => false, 'order' => 2],
        ],
        'status' => 'published',
    ]);

    $response = $this->getJson('/api/v1/products');
    $response->assertStatus(200);

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();

    $item = collect($data)->firstWhere('code', 'PRD-LMB-KLG-001');
    expect($item)->not->toBeNull();
    expect($item['image'])->toBe($appUrl . '/storage/products/kalung-hitam.jpg');
    expect($item['webp_url'])->toBe($appUrl . '/storage/products/kalung-hitam.webp');

    // Cek array images
    expect($item['images'][0]['url'])->toBe($appUrl . '/storage/products/kalung-hitam-1.jpg');
    expect($item['images'][0]['webp_url'])->toBe($appUrl . '/storage/products/kalung-hitam-1.webp');
    expect($item['images'][1]['url'])->toBe($appUrl . '/storage/products/kalung-hitam-2.png');
    expect($item['images'][1]['webp_url'])->toBe($appUrl . '/storage/products/kalung-hitam-2.webp');
});

test('2. GET /api/v1/products/{id} mengembalikan URL absolut pada detail produk', function () {
    $appUrl = rtrim(config('app.url'), '/');

    $product = Product::create([
        'code' => 'PRD-LMB-KLG-002',
        'name' => 'Kalung Mutiara Emas Royal',
        'category_slug' => 'kalung-mutiara',
        'price' => 25000000,
        'stock' => 3,
        'image' => '/storage/products/kalung-emas.png',
        'status' => 'published',
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}");
    $response->assertStatus(200);

    $data = $response->json('data');
    expect($data['image'])->toBe($appUrl . '/storage/products/kalung-emas.png');
    expect($data['webp_url'])->toBe($appUrl . '/storage/products/kalung-emas.webp');
});

test('3. URL eksternal yang sudah absolut (https://) tetap dipertahankan tanpa prefix ganda', function () {
    $externalUrl = 'https://images.unsplash.com/photo-1544005313?w=500';

    $product = Product::create([
        'code' => 'PRD-LMB-KLG-003',
        'name' => 'Kalung Mutiara Eksotik',
        'category_slug' => 'kalung-mutiara',
        'price' => 17000000,
        'stock' => 2,
        'image' => $externalUrl,
        'status' => 'published',
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}");
    $response->assertStatus(200);

    $data = $response->json('data');
    expect($data['image'])->toBe($externalUrl);
    expect($data['webp_url'])->toBe($externalUrl);
});

test('4. Produk tanpa gambar mengembalikan image dan webp_url bernilai null', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-KLG-004',
        'name' => 'Mutiara Butir Lepas Sample',
        'category_slug' => 'kalung-mutiara',
        'price' => 5000000,
        'stock' => 10,
        'image' => null,
        'status' => 'published',
    ]);

    $response = $this->getJson("/api/v1/products/{$product->id}");
    $response->assertStatus(200);

    $data = $response->json('data');
    expect($data['image'])->toBeNull();
    expect($data['webp_url'])->toBeNull();
});

test('5. GET /api/v1/admin/products mengembalikan URL absolut untuk portal admin', function () {
    $appUrl = rtrim(config('app.url'), '/');

    Product::create([
        'code' => 'PRD-LMB-KLG-005',
        'name' => 'Kalung Admin Master',
        'category_slug' => 'kalung-mutiara',
        'price' => 30000000,
        'stock' => 4,
        'image' => '/storage/products/admin-test.jpg',
        'status' => 'published',
    ]);

    $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/products');
    $response->assertStatus(200);

    $data = $response->json('data');
    $item = collect($data)->firstWhere('code', 'PRD-LMB-KLG-005');
    expect($item)->not->toBeNull();
    expect($item['image'])->toBe($appUrl . '/storage/products/admin-test.jpg');
    expect($item['webp_url'])->toBe($appUrl . '/storage/products/admin-test.webp');
});
