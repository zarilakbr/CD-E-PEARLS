<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

test('tamu ditolak 401 dan pelanggan biasa ditolak 403 saat mengakses CRUD kategori', function () {
    $guestStore = $this->postJson('/api/v1/categories', ['name' => 'Koleksi Gelang']);
    $guestStore->assertStatus(401);

    $customer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $customerStore = $this->actingAs($customer)->postJson('/api/v1/categories', ['name' => 'Koleksi Gelang']);
    $customerStore->assertStatus(403);

    $cat = Category::create([
        'name' => 'Bros Eksklusif',
        'slug' => 'bros-eksklusif',
        'image' => '/storage/categories/dummy.jpg',
        'webp_url' => '/storage/categories/dummy.webp',
        'is_active' => true,
    ]);

    $customerUpdate = $this->actingAs($customer)->putJson("/api/v1/categories/{$cat->id}", ['name' => 'Bros Emas']);
    $customerUpdate->assertStatus(403);

    $customerDelete = $this->actingAs($customer)->deleteJson("/api/v1/categories/{$cat->id}");
    $customerDelete->assertStatus(403);
});

test('tambah kategori tanpa gambar ditolak validasi 422 dengan pesan Indonesia yang jelas', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $response = $this->actingAs($admin)->postJson('/api/v1/categories', [
        'name' => 'Koleksi Mahkota Mutiara',
        'description' => 'Mahkota mutiara agung ratu samudera',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['image'])
        ->assertJsonFragment([
            'image' => ['Foto kategori perhiasan mutiara wajib diunggah.'],
        ]);
});

test('tambah kategori dengan gambar melebihi 4000 piksel ditolak validasi 422', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $oversizedFile = UploadedFile::fake()->image('oversized-category.jpg', 4001, 3000);

    $response = $this->actingAs($admin)->postJson('/api/v1/categories', [
        'name' => 'Kategori Super Jumbo',
        'image' => $oversizedFile,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
    expect(json_encode($response->json()))->toContain('4000 piksel');
});

test('admin 201: berhasil menambah kategori dengan gambar valid <= 4000px, EXIF dibersihkan, companion WebP disimpan, dan URL absolut', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $validImage = UploadedFile::fake()->image('kategori-tiara.png', 1200, 900);

    $response = $this->actingAs($admin)->postJson('/api/v1/categories', [
        'name' => 'Tiara Pengantin Mutiara',
        'description' => 'Tiara mutiara air laut lombok bertatahkan emas',
        'image' => $validImage,
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Kategori perhiasan berhasil ditambahkan.',
        ]);

    $data = $response->json('data');
    expect($data['name'])->toBe('Tiara Pengantin Mutiara');
    expect($data['slug'])->toBe('tiara-pengantin-mutiara');
    expect($data['image'])->toStartWith(config('app.url'));
    expect($data['webp_url'])->toStartWith(config('app.url'));
    expect($data['webp_url'])->toEndWith('.webp');

    $cat = Category::where('slug', 'tiara-pengantin-mutiara')->first();
    expect($cat)->not->toBeNull();
    expect($cat->image)->not->toBeNull();

    $cleanPath = str_replace('/storage/', '', $cat->image);
    $cleanWebp = str_replace('/storage/', '', $cat->webp_url);
    Storage::disk('public')->assertExists($cleanPath);
    Storage::disk('public')->assertExists($cleanWebp);
});

test('update kategori boleh tanpa gambar baru bila kategori sudah punya gambar', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $cat = Category::create([
        'name' => 'Kalung Klasik',
        'slug' => 'kalung-klasik',
        'image' => '/storage/categories/dummy_existing.jpg',
        'webp_url' => '/storage/categories/dummy_existing.webp',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->putJson("/api/v1/categories/{$cat->id}", [
        'name' => 'Kalung Mewah Klasik',
        'description' => 'Deskripsi diperbarui',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
        ]);

    expect($response->json('data.name'))->toBe('Kalung Mewah Klasik');
    expect($response->json('data.image'))->toContain('dummy_existing.jpg');
});

test('update kategori mengganti gambar baru menghapus berkas gambar lama dan WebP lama', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    Storage::disk('public')->put('categories/old_file.jpg', 'old-content');
    Storage::disk('public')->put('categories/old_file.webp', 'old-webp-content');

    $cat = Category::create([
        'name' => 'Cincin Berlian Mutiara',
        'slug' => 'cincin-berlian-mutiara',
        'image' => '/storage/categories/old_file.jpg',
        'webp_url' => '/storage/categories/old_file.webp',
        'is_active' => true,
    ]);

    $newImage = UploadedFile::fake()->image('cincin-baru.png', 800, 800);

    $response = $this->actingAs($admin)->putJson("/api/v1/categories/{$cat->id}", [
        'name' => 'Cincin Berlian Mutiara Terbaru',
        'image' => $newImage,
    ]);

    $response->assertStatus(200);

    Storage::disk('public')->assertMissing('categories/old_file.jpg');
    Storage::disk('public')->assertMissing('categories/old_file.webp');

    $cat->refresh();
    $newCleanPath = str_replace('/storage/', '', $cat->image);
    $newCleanWebp = str_replace('/storage/', '', $cat->webp_url);
    Storage::disk('public')->assertExists($newCleanPath);
    Storage::disk('public')->assertExists($newCleanWebp);
});

test('hapus kategori yang masih memiliki produk ditolak HTTP 409 dengan pesan Indonesia yang jelas', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $cat = Category::create([
        'name' => 'Kategori Berisi Produk',
        'slug' => 'kategori-berisi-produk',
        'image' => '/storage/categories/cat_filled.jpg',
        'is_active' => true,
    ]);

    Product::create([
        'code' => 'PRD-TEST-CAT-01',
        'name' => 'Kalung Mutiara Mewah',
        'category_slug' => $cat->slug,
        'price' => 5000000,
        'stock' => 5,
        'stock_on_hand' => 5,
        'status' => 'published',
    ]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/categories/{$cat->id}");

    $response->assertStatus(409)
        ->assertJson([
            'success' => false,
            'message' => 'Kategori masih memiliki produk, silakan pindahkan atau hapus produk terlebih dahulu.',
        ]);

    expect(Category::find($cat->id))->not->toBeNull();
});

test('hapus kategori kosong berhasil 200 dan menghapus berkas gambar dari storage', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    Storage::disk('public')->put('categories/delete_me.jpg', 'fake-jpg');
    Storage::disk('public')->put('categories/delete_me.webp', 'fake-webp');

    $cat = Category::create([
        'name' => 'Kategori Kosong Siap Dihapus',
        'slug' => 'kategori-kosong-siap-dihapus',
        'image' => '/storage/categories/delete_me.jpg',
        'webp_url' => '/storage/categories/delete_me.webp',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->deleteJson("/api/v1/categories/{$cat->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ]);

    expect(Category::find($cat->id))->toBeNull();
    Storage::disk('public')->assertMissing('categories/delete_me.jpg');
    Storage::disk('public')->assertMissing('categories/delete_me.webp');
});
