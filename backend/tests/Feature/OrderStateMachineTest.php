<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('private');

    $this->customer = User::factory()->create([
        'name' => 'Siti Nurhaliza',
        'role' => 'user',
        'email' => 'siti@example.com',
    ]);

    $this->admin = User::factory()->create([
        'name' => 'Budi Admin Operasional',
        'role' => 'admin',
        'email' => 'admin@cdpearls.com',
    ]);

    $this->spi = User::factory()->create([
        'name' => 'Hendra Pengawas SPI',
        'role' => 'spi',
        'email' => 'spi@cdpearls.com',
    ]);

    $this->product = Product::create([
        'name' => 'Gelang Mutiara South Sea Gold 13mm',
        'slug' => 'gelang-mutiara-south-sea-gold-13mm',
        'category_slug' => 'gelang',
        'price' => 12500000,
        'stock' => 10,
        'stock_on_hand' => 10,
        'stock_reserved' => 0,
        'status' => 'published',
    ]);
});

function createTestOrder($user, $product, $paymentStatus = 'WAITING_PAYMENT', $orderStatus = 'PENDING') {
    $order = Order::create([
        'order_number' => 'ORD-' . strtoupper(bin2hex(random_bytes(4))),
        'user_id' => $user->id,
        'customer_name' => $user->name,
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Pariwisata Senggigi No. 10, Lombok Barat',
        'subtotal' => 12500000,
        'shipping_cost' => 50000,
        'total' => 12550000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => $paymentStatus,
        'order_status' => $orderStatus,
        'tracking_token' => bin2hex(random_bytes(32)),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => $product->price,
        'quantity' => 1,
        'subtotal' => $product->price,
    ]);

    return $order;
}

test('1. Pembeli mengunggah bukti: WAITING_PAYMENT -> PAYMENT_REVIEW, notifikasi terbuat, audit log tercatat, versi sinkron naik', function () {
    $order = createTestOrder($this->customer, $this->product, 'WAITING_PAYMENT', 'PENDING');
    $initialVersion = $order->fresh()->updated_at?->toISOString();

    // Tunggu sedikit agar timestamp berbeda
    sleep(1);

    $file = UploadedFile::fake()->image('bukti_transfer.jpg');

    $response = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$order->id}/upload-proof", [
        'proof_image' => $file,
        'notes' => 'Transfer via BCA atas nama Siti',
    ]);

    $response->assertStatus(200);
    $order->refresh();

    expect($order->payment_status)->toBe('PAYMENT_REVIEW');
    expect($order->payments)->toHaveCount(1);
    expect($order->payments->first()->status)->toBe('PENDING');

    // Notifikasi terbuat
    $this->assertDatabaseHas('notifications', [
        'user_id' => $this->customer->id,
        'type' => 'order_status',
    ]);

    // Audit log tercatat
    $this->assertDatabaseHas('audit_logs', [
        'action' => 'ORDER_PROOF_UPLOADED',
        'target_id' => $order->order_number,
    ]);

    // Versi sinkron naik
    $syncRes = $this->actingAs($this->customer)->getJson('/api/v1/sync/status');
    $syncRes->assertStatus(200);
    expect($syncRes->json('data.orders_version'))->not->toBe($initialVersion);
});

test('2. Admin memverifikasi lunas: PAYMENT_REVIEW -> PAID, notifikasi dan audit log tercatat', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAYMENT_REVIEW', 'PENDING');
    Payment::create([
        'order_id' => $order->id,
        'amount' => $order->total,
        'payment_method' => 'TRANSFER_BANK',
        'proof_path' => 'payments/dummy.jpg',
        'status' => 'PENDING',
    ]);

    $response = $this->actingAs($this->admin)->postJson("/api/v1/admin/orders/{$order->id}/verify-payment", [
        'notes' => 'Dana mutasi BCA telah masuk rekening operasional.',
    ]);

    $response->assertStatus(200);
    $order->refresh();

    expect($order->payment_status)->toBe('PAID');
    expect($order->order_status)->toBe('PAID');
    expect($order->payments->first()->status)->toBe('VERIFIED');

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->admin->id,
        'action' => 'ORDER_PAYMENT_VERIFIED',
        'target_id' => $order->order_number,
    ]);
});

test('3. Admin menolak pembayaran: PAYMENT_REVIEW -> WAITING_PAYMENT dengan alasan wajib (minimal 5 karakter)', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAYMENT_REVIEW', 'PENDING');
    Payment::create([
        'order_id' => $order->id,
        'amount' => $order->total,
        'payment_method' => 'TRANSFER_BANK',
        'proof_path' => 'payments/dummy.jpg',
        'status' => 'PENDING',
    ]);

    // Tolak tanpa alasan -> 422
    $resFail = $this->actingAs($this->admin)->postJson("/api/v1/admin/orders/{$order->id}/reject-payment", [
        'reason' => 'abc', // < 5 karakter
    ]);
    $resFail->assertStatus(422);

    // Tolak dengan alasan valid -> 200
    $resOk = $this->actingAs($this->admin)->postJson("/api/v1/admin/orders/{$order->id}/reject-payment", [
        'reason' => 'Bukti buram, nominal transfer tidak terbaca.',
    ]);
    $resOk->assertStatus(200);
    $order->refresh();

    expect($order->payment_status)->toBe('WAITING_PAYMENT');
    expect($order->order_status)->toBe('PENDING');
    expect($order->payments->first()->status)->toBe('REJECTED');

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->admin->id,
        'action' => 'ORDER_PAYMENT_REJECTED',
        'target_id' => $order->order_number,
    ]);
});

test('4. Admin DILARANG memproses atau mengirim pesanan (hanya berwenang memverifikasi pembayaran)', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAID', 'PAID');

    // Admin mencoba mengubah order_status ke PROCESSING -> ditolak 422
    $res1 = $this->actingAs($this->admin)->putJson("/api/v1/admin/orders/{$order->id}/order-status", [
        'order_status' => 'PROCESSING',
    ]);
    $res1->assertStatus(422);
    expect($res1->json('message'))->toContain('Admin operasional hanya berwenang memverifikasi pembayaran');

    // Admin mencoba mengatur nomor resi pengiriman -> ditolak 422
    $res2 = $this->actingAs($this->admin)->putJson("/api/v1/admin/orders/{$order->id}/tracking", [
        'tracking_number' => 'JNE12345678',
        'courier' => 'JNE Express',
    ]);
    $res2->assertStatus(422);
});

test('5. SPI memproses pesanan: PAID -> PROCESSING, dan mengirim pesanan dengan resi + kurir wajib', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAID', 'PAID');

    // SPI proses pesanan -> 200
    $resProcess = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/process", [
        'notes' => 'Pesanan diambil dari brankas dan dikemas khusus.',
    ]);
    $resProcess->assertStatus(200);
    expect($order->fresh()->order_status)->toBe('PROCESSING');

    // SPI kirim tanpa resi/kurir -> 422
    $resFailShip = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => '',
        'courier' => '',
    ]);
    $resFailShip->assertStatus(422);

    // SPI kirim dengan resi + kurir lengkap -> 200
    $resShip = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => 'JNE-REG-8829910',
        'courier' => 'JNE Express (Berasuransi)',
        'notes' => 'Diserahkan ke kurir jemputan cabang Mataram',
    ]);
    $resShip->assertStatus(200);
    $order->refresh();

    expect($order->order_status)->toBe('SHIPPED');
    expect($order->tracking_number)->toBe('JNE-REG-8829910');
    expect($order->courier)->toBe('JNE Express (Berasuransi)');

    // SPI selesaikan pesanan: SHIPPED -> COMPLETED
    $resComp = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/complete");
    $resComp->assertStatus(200);
    expect($order->fresh()->order_status)->toBe('COMPLETED');
});

test('6. Pembeli membatalkan pesanan saat WAITING_PAYMENT: stok kembali tepat 1 kali (idempoten)', function () {
    $this->product->update(['stock' => 5, 'stock_on_hand' => 5]);
    $order = createTestOrder($this->customer, $this->product, 'WAITING_PAYMENT', 'PENDING');
    $this->product->update(['stock' => 4, 'stock_on_hand' => 4]);

    // Pembatalan pertama -> 200, stok kembali ke 5
    $res1 = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$order->id}/cancel");
    $res1->assertStatus(200);
    expect($order->fresh()->order_status)->toBe('CANCELLED');
    expect($this->product->fresh()->stock)->toBe(5);

    // Pembatalan kedua (idempoten) -> 200, stok TIDAK bertambah lagi
    $res2 = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$order->id}/cancel");
    $res2->assertStatus(200);
    expect($this->product->fresh()->stock)->toBe(5);
});

test('7. Pembeli DILARANG membatalkan pesanan jika pembayaran sedang diverifikasi atau sudah lunas', function () {
    $orderReview = createTestOrder($this->customer, $this->product, 'PAYMENT_REVIEW', 'PENDING');

    $res1 = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$orderReview->id}/cancel");
    $res1->assertStatus(422);
    expect($res1->json('message'))->toContain('tidak dapat dibatalkan');

    $orderPaid = createTestOrder($this->customer, $this->product, 'PAID', 'PROCESSING');
    $res2 = $this->actingAs($this->customer)->postJson("/api/v1/orders/{$orderPaid->id}/cancel");
    $res2->assertStatus(422);
});
