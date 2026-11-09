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

test('4. Admin DILARANG memproses atau mengirim pesanan (hanya berwenang memverifikasi pembayaran) ditolak 403', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAID', 'PAID');

    // Admin mencoba mengubah order_status ke PROCESSING -> ditolak 403
    $res1 = $this->actingAs($this->admin)->putJson("/api/v1/admin/orders/{$order->id}/order-status", [
        'order_status' => 'PROCESSING',
    ]);
    $res1->assertStatus(403);
    expect($res1->json('message'))->toContain('Admin operasional tidak berwenang');

    // Admin mencoba mengatur nomor resi pengiriman -> ditolak 403
    $res2 = $this->actingAs($this->admin)->putJson("/api/v1/admin/orders/{$order->id}/tracking", [
        'tracking_number' => 'JNE12345678',
        'courier' => 'JNE Express',
    ]);
    $res2->assertStatus(403);

    // Admin mencoba memanggil rute SPI secara langsung -> ditolak 403
    $res3 = $this->actingAs($this->admin)->postJson("/api/v1/spi/orders/{$order->id}/process");
    $res3->assertStatus(403);

    $res4 = $this->actingAs($this->admin)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => 'JNE-REG-8829910',
        'courier' => 'JNE Express',
    ]);
    $res4->assertStatus(403);

    $res5 = $this->actingAs($this->admin)->postJson("/api/v1/spi/orders/{$order->id}/complete");
    $res5->assertStatus(403);
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

test('8. SPI DITOLAK 403 saat verify atau reject pembayaran; SPI hanya boleh override via direct-execute yang tercatat di audit log', function () {
    $order = createTestOrder($this->customer, $this->product, 'PAYMENT_REVIEW', 'PENDING');
    Payment::create([
        'order_id' => $order->id,
        'amount' => $order->total,
        'payment_method' => 'TRANSFER_BANK',
        'proof_path' => 'payments/dummy.jpg',
        'status' => 'PENDING',
    ]);

    // SPI mencoba verify-payment -> 403
    $resVerify = $this->actingAs($this->spi)->postJson("/api/v1/orders/{$order->id}/verify-payment");
    $resVerify->assertStatus(403);

    // SPI mencoba reject-payment -> 403
    $resReject = $this->actingAs($this->spi)->postJson("/api/v1/orders/{$order->id}/reject-payment", [
        'reason' => 'Ditolak pengawas SPI',
    ]);
    $resReject->assertStatus(403);

    // SPI mencoba update-payment-status -> 403
    $resUpdatePay = $this->actingAs($this->spi)->putJson("/api/v1/orders/{$order->id}/payment-status", [
        'payment_status' => 'PAID',
    ]);
    $resUpdatePay->assertStatus(403);

    // SPI melakukan Direct-Execute otorisasi pelunasan -> 200 dan tercatat di audit log
    $resDirect = $this->actingAs($this->spi)->postJson('/api/v1/spi/direct-execute', [
        'action_type' => 'payment_override',
        'target_id' => $order->order_number,
        'note' => 'Otorisasi darurat pelunasan oleh SPI setelah validasi rekening koran',
        'new_value' => ['payment_status' => 'PAID'],
    ]);
    $resDirect->assertStatus(200);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->spi->id,
        'action' => 'SPI_DIRECT_EXECUTE_PAYMENT_OVERRIDE',
        'target_id' => $order->order_number,
    ]);
});

test('9. Lompat status ilegal ditolak (belum lunas langsung kirim, atau processing langsung selesai tanpa kirim)', function () {
    $order = createTestOrder($this->customer, $this->product, 'WAITING_PAYMENT', 'PENDING');

    // Coba langsung kirim pesanan yang belum lunas -> 422
    $resJump1 = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => 'JNE-998811',
        'courier' => 'JNE Express',
    ]);
    $resJump1->assertStatus(422);
    expect($resJump1->json('message'))->toContain('belum berstatus Lunas');

    // Pesanan sudah diproses (PROCESSING), tapi coba langsung diselesaikan tanpa dikirim (SHIPPED) -> 422
    $order->update(['payment_status' => 'PAID', 'order_status' => 'PROCESSING']);
    $resJump2 = $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/complete");
    $resJump2->assertStatus(422);
    expect($resJump2->json('message'))->toContain('hanya dapat diselesaikan setelah berstatus \'SHIPPED\'');
});

test('10. Siklus Nyata: Tolak bukti -> Pembeli unggah ulang -> Admin verifikasi lunas -> SPI kirim resi', function () {
    $order = createTestOrder($this->customer, $this->product, 'WAITING_PAYMENT', 'PENDING');

    // Langkah 1: Pembeli unggah bukti pertama
    $file1 = UploadedFile::fake()->image('bukti_salah.jpg');
    $this->actingAs($this->customer)->postJson("/api/v1/orders/{$order->id}/upload-proof", [
        'proof_image' => $file1,
        'notes' => 'Bukti bayar awal',
    ])->assertStatus(200);
    expect($order->fresh()->payment_status)->toBe('PAYMENT_REVIEW');

    // Langkah 2: Admin tolak karena bukti tidak valid
    $this->actingAs($this->admin)->postJson("/api/v1/admin/orders/{$order->id}/reject-payment", [
        'reason' => 'Foto bukti terpotong dan nominal transfer tidak terlihat.',
    ])->assertStatus(200);
    expect($order->fresh()->payment_status)->toBe('WAITING_PAYMENT');

    // Langkah 3: Pembeli unggah ulang bukti yang benar
    $file2 = UploadedFile::fake()->image('bukti_benar.jpg');
    $this->actingAs($this->customer)->postJson("/api/v1/orders/{$order->id}/upload-proof", [
        'proof_image' => $file2,
        'notes' => 'Bukti mutasi lengkap dari m-BCA',
    ])->assertStatus(200);
    expect($order->fresh()->payment_status)->toBe('PAYMENT_REVIEW');

    // Langkah 4: Admin verifikasi pembayaran sah
    $this->actingAs($this->admin)->postJson("/api/v1/admin/orders/{$order->id}/verify-payment", [
        'notes' => 'Bukti sah, mutasi bank sudah sesuai nominal tagihan.',
    ])->assertStatus(200);
    expect($order->fresh()->payment_status)->toBe('PAID');

    // Langkah 5: SPI proses dan kirim dengan resi
    $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/process")->assertStatus(200);
    $this->actingAs($this->spi)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => 'JNE-SIKLUS-12345',
        'courier' => 'JNE Express (Berasuransi)',
    ])->assertStatus(200);

    $freshOrder = $order->fresh();
    expect($freshOrder->order_status)->toBe('SHIPPED');
    expect($freshOrder->tracking_number)->toBe('JNE-SIKLUS-12345');
});

test('11. Pelanggan biasa DITOLAK 403 saat mengakses seluruh rute Admin maupun SPI', function () {
    $order = createTestOrder($this->customer, $this->product, 'WAITING_PAYMENT', 'PENDING');

    // Pelanggan coba panggil rute verifikasi admin -> 403
    $this->actingAs($this->customer)->postJson("/api/v1/admin/orders/{$order->id}/verify-payment")
        ->assertStatus(403);

    // Pelanggan coba panggil rute tolak admin -> 403
    $this->actingAs($this->customer)->postJson("/api/v1/admin/orders/{$order->id}/reject-payment", ['reason' => 'test test'])
        ->assertStatus(403);

    // Pelanggan coba panggil rute SPI process -> 403
    $this->actingAs($this->customer)->postJson("/api/v1/spi/orders/{$order->id}/process")
        ->assertStatus(403);

    // Pelanggan coba panggil rute SPI ship -> 403
    $this->actingAs($this->customer)->postJson("/api/v1/spi/orders/{$order->id}/ship", [
        'tracking_number' => 'TEST',
        'courier' => 'TEST',
    ])->assertStatus(403);

    // Pelanggan coba panggil rute SPI direct execute -> 403
    $this->actingAs($this->customer)->postJson('/api/v1/spi/direct-execute', [
        'action_type' => 'test',
        'target_id' => '1',
        'note' => 'testing',
    ])->assertStatus(403);
});
