<?php

use App\Models\Certificate;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->customer = User::factory()->create([
        'name' => 'Pelanggan Asli',
        'email' => 'customer@cdpearls.com',
        'role' => 'user',
        'status' => 'active',
    ]);

    $this->otherCustomer = User::factory()->create([
        'name' => 'Pelanggan Lain',
        'email' => 'other@cdpearls.com',
        'role' => 'user',
        'status' => 'active',
    ]);

    $this->frozenCustomer = User::factory()->create([
        'name' => 'Pelanggan Dibekukan',
        'email' => 'frozen@cdpearls.com',
        'role' => 'user',
        'status' => 'frozen',
    ]);

    $this->admin = User::factory()->create([
        'name' => 'Admin Atelier',
        'email' => 'admin@cdpearls.com',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'name' => 'SPI Controller',
        'email' => 'spi@cdpearls.com',
        'role' => 'spi',
        'status' => 'active',
    ]);

    $this->order = Order::create([
        'order_number' => 'CDE-2026-7788',
        'user_id' => $this->customer->id,
        'customer_name' => 'Pelanggan Asli',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Mawar 123',
        'subtotal' => 10000000,
        'total' => 10070000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
    ]);
});

test('U-7.a: upload bukti transfer disimpan ke private disk dengan nama UUID dan unduhan berotorisasi', function () {
    Storage::fake('private');

    $file = UploadedFile::fake()->image('bukti_transfer.jpg', 600, 600)->size(1024); // 1MB

    $response = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$this->order->id}/upload-proof", [
        'proof_image' => $file,
    ]);

    $response->assertStatus(200);

    $payment = Payment::where('order_id', $this->order->id)->latest()->first();
    expect($payment)->not->toBeNull();

    // Verifikasi nama berkas berformat UUID dan tidak mengandung order_number di nama berkas
    $storedFilename = basename($payment->proof_path);
    expect($storedFilename)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i');
    expect($storedFilename)->not->toContain('CDE-2026-7788');

    // Pastikan berkas tersimpan di disk private, bukan public
    Storage::disk('private')->assertExists($payment->proof_path);

    // Pemilik pesanan dapat mengunduh bukti
    $downloadRes = $this->actingAs($this->customer)->get("/api/v1/orders/{$this->order->id}/payments/{$payment->id}/proof");
    $downloadRes->assertStatus(200);

    // SPI & Admin dapat mengunduh bukti
    $spiDownloadRes = $this->actingAs($this->spi)->get("/api/v1/orders/{$this->order->id}/payments/{$payment->id}/proof");
    $spiDownloadRes->assertStatus(200);

    // Pengguna lain ditolak 403
    $otherDownloadRes = $this->actingAs($this->otherCustomer)->get("/api/v1/orders/{$this->order->id}/payments/{$payment->id}/proof");
    $otherDownloadRes->assertStatus(403);
});

test('U-7.b: akun dibekukan (frozen) diblokir dari semua rute terotentikasi oleh EnsureAccountNotFrozen', function () {
    // Pengguna dengan status 'frozen' mencoba mengakses endpoint profil atau wishlist
    $response = $this->actingAs($this->frozenCustomer)->getJson('/api/v1/auth/me');

    $response->assertStatus(403);
    expect($response->json('error'))->toBe('ACCOUNT_FROZEN');
});

test('U-7.c: CertificateController menolak pdf_path dengan traversal (..) dan skema non-https', function () {
    // Coba simpan sertifikat dengan traversal path
    $traversalRes = $this->actingAs($this->admin)->postJson('/api/v1/admin/certificates', [
        'nomor' => 'CERT-TRAV-001',
        'lab' => 'Gemological Institute',
        'grade' => 'AAA',
        'ukuran' => '12mm',
        'tanggal' => '2026-03-01',
        'pdf_path' => '../../../../etc/passwd',
    ]);
    $traversalRes->assertStatus(422);

    // Coba simpan sertifikat dengan skema javascript: atau file:
    $schemeRes = $this->actingAs($this->admin)->postJson('/api/v1/admin/certificates', [
        'nomor' => 'CERT-XSS-001',
        'lab' => 'Gemological Institute',
        'grade' => 'AAA',
        'ukuran' => '12mm',
        'tanggal' => '2026-03-01',
        'pdf_path' => 'javascript:alert(1)',
    ]);
    $schemeRes->assertStatus(422);
});

test('U-7.d: GET /api/v1/settings hanya mengembalikan key publik dan menyembunyikan konfigurasi internal', function () {
    Setting::set('store_name', "CD'E Pearls Lombok");
    Setting::set('contact_phone', '081234567890');
    Setting::set('shipping_flat_cost', 50000);
    Setting::set('spi_internal_api_secret', 'SUPER_SECRET_KEY_NOT_FOR_PUBLIC');
    Setting::set('admin_override_code', '998811');

    $response = $this->getJson('/api/v1/settings');

    $response->assertStatus(200);
    $data = $response->json('data');

    expect($data)->toHaveKey('store_name');
    expect($data)->toHaveKey('contact_phone');
    expect($data)->toHaveKey('shipping_flat_cost');

    // Konfigurasi rahasia internal tidak boleh bocor
    expect($data)->not->toHaveKey('spi_internal_api_secret');
    expect($data)->not->toHaveKey('admin_override_code');
    expect(json_encode($data))->not->toContain('SUPER_SECRET_KEY_NOT_FOR_PUBLIC');
});
