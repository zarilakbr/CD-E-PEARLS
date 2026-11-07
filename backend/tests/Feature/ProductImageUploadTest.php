<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->admin = User::factory()->create([
        'name' => 'Admin Permata',
        'email' => 'admin.permata@cdepearls.com',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'name' => 'Auditor SPI',
        'email' => 'spi.permata@cdepearls.com',
        'role' => 'spi',
        'status' => 'active',
    ]);

    $this->customer = User::factory()->create([
        'name' => 'Pelanggan Biasa',
        'email' => 'customer.biasa@cdepearls.com',
        'role' => 'user',
        'status' => 'active',
    ]);

    $this->category = Category::create([
        'name' => 'Kalung Mutiara',
        'slug' => 'kalung-mutiara',
        'description' => 'Koleksi kalung mutiara laut selatan',
    ]);
});

test('1. otorisasi upload gambar produk: admin dan spi diizinkan, pelanggan ditolak 403', function () {
    $image = UploadedFile::fake()->image('pearl-necklace.jpg', 600, 600)->size(1024);

    // Customer (user) ditolak 403
    $resCustomer = $this->actingAs($this->customer)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $image,
    ]);
    $resCustomer->assertStatus(403);

    // Admin diizinkan (201)
    $resAdmin = $this->actingAs($this->admin)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $image,
    ]);
    $resAdmin->assertStatus(201)
        ->assertJson([
            'success' => true,
        ]);
    expect($resAdmin->json('url'))->toStartWith('/storage/products/');

    // SPI diizinkan (201)
    $imageSpi = UploadedFile::fake()->image('pearl-ring.png', 500, 500)->size(500);
    $resSpi = $this->actingAs($this->spi)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $imageSpi,
    ]);
    $resSpi->assertStatus(201);
});

test('2. validasi tipe file gambar (hanya jpg, png, webp) dan batas ukuran maks 5MB', function () {
    // 2a. File bukan gambar (PDF / TXT) ditolak 422
    $invalidDoc = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');
    $resDoc = $this->actingAs($this->admin)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $invalidDoc,
    ]);
    $resDoc->assertStatus(422)
        ->assertJsonValidationErrors(['image']);

    // 2b. File lebih dari 5MB (5120 KB) ditolak 422
    $oversizedImage = UploadedFile::fake()->image('huge-pearl.jpg', 4000, 4000)->size(6000); // 6MB
    $resOversized = $this->actingAs($this->admin)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $oversizedImage,
    ]);
    $resOversized->assertStatus(422)
        ->assertJsonValidationErrors(['image']);

    // 2c. File gambar valid (WebP 2MB) diterima sukses 201
    $validWebp = UploadedFile::fake()->image('authentic-pearl.webp', 1200, 1200)->size(2048);
    $resWebp = $this->actingAs($this->admin)->postJson('/api/v1/admin/products/upload-image', [
        'image' => $validWebp,
    ]);
    $resWebp->assertStatus(201);
});

test('3. upload saat tambah produk menghasilkan url acak dan tersimpan di storage publik', function () {
    $photo = UploadedFile::fake()->image('kalung-exclusive.jpg', 800, 800)->size(1500);

    $res = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', [
        'name' => 'Kalung Mutiara Barok Royal Gold',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea Pearl',
        'grade' => 'AAA',
        'ukuran_mm' => '13.5',
        'kelompok_warna' => 'emas',
        'price' => 25000000,
        'stock' => 3,
        'image' => $photo,
    ]);

    $res->assertStatus(201);
    $product = Product::where('name', 'Kalung Mutiara Barok Royal Gold')->first();
    expect($product)->not->toBeNull();
    expect($product->image)->toStartWith('/storage/products/');

    // Bukti tersimpan di storage publik dengan nama acak
    $storagePath = str_replace('/storage/', '', $product->image);
    Storage::disk('public')->assertExists($storagePath);
});

test('4. ganti gambar produk menghapus file gambar lama dari storage', function () {
    $photo1 = UploadedFile::fake()->image('initial-pearl.jpg', 600, 600)->size(800);

    $createRes = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', [
        'name' => 'Cincin Mutiara Lavender',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'Freshwater Pearl',
        'grade' => 'AA',
        'ukuran_mm' => '10.5',
        'kelompok_warna' => 'putih',
        'price' => 8500000,
        'stock' => 5,
        'image' => $photo1,
    ]);
    $createRes->assertStatus(201);
    $productId = $createRes->json('data.id');
    $oldImageUrl = $createRes->json('data.image');
    $oldStoragePath = str_replace('/storage/', '', $oldImageUrl);
    Storage::disk('public')->assertExists($oldStoragePath);

    // Ganti dengan gambar baru
    $photo2 = UploadedFile::fake()->image('updated-pearl.png', 800, 800)->size(900);
    $updateRes = $this->actingAs($this->admin)->putJson("/api/v1/admin/products/{$productId}", [
        'image' => $photo2,
    ]);
    $updateRes->assertStatus(200);

    $newImageUrl = $updateRes->json('data.image');
    $newStoragePath = str_replace('/storage/', '', $newImageUrl);

    // Gambar baru harus ada
    Storage::disk('public')->assertExists($newStoragePath);

    // File gambar lama harus TERHAPUS dari storage publik
    Storage::disk('public')->assertMissing($oldStoragePath);
});
