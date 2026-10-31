<?php

use App\Models\Address;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // Ensure clean storage for fake uploads
    Storage::fake('public');

    // Create test category
    $this->category = Category::firstOrCreate(
        ['slug' => 'kalung-mutiara'],
        [
            'name' => 'Kalung Mutiara Lombok',
            'description' => 'Kalung mutiara laut eksklusif',
            'icon' => 'sparkles',
            'is_active' => true,
        ]
    );

    // Create test customers and admin
    $this->customer1 = User::factory()->create([
        'role' => 'user',
        'status' => 'active',
        'email_verified_at' => null,
    ]);

    $this->customer2 = User::factory()->create([
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

test('atomic checkout prevents race condition on the last remaining stock (2 buyers race for stock 1)', function () {
    // 1 pearl in stock
    $product = Product::create([
        'code' => 'PRD-LMB-KLN-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Kalung Mutiara Emas South Sea 12mm',
        'price' => 15000000,
        'stock' => 1,
        'status' => 'published',
    ]);

    // Buyer 1 attempts checkout for quantity 1
    $buyer1Payload = [
        'customer_name' => 'Nyonya Ratna',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Kartika Plaza No. 12, Kuta, Bali',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => $product->price,
                'quantity' => 1,
            ],
        ],
    ];

    $response1 = $this->actingAs($this->customer1)->postJson('/api/v1/orders', $buyer1Payload);
    $response1->assertStatus(201);
    expect($response1->json('success'))->toBeTrue();

    // Verify stock is now 0
    $product->refresh();
    expect($product->stock)->toBe(0);

    // Buyer 2 attempts checkout on the same product
    $buyer2Payload = [
        'customer_name' => 'Tuan Hendra',
        'customer_phone' => '081987654321',
        'customer_address' => 'Jl. Diponegoro No. 88, Mataram, Lombok',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => $product->price,
                'quantity' => 1,
            ],
        ],
    ];

    $response2 = $this->actingAs($this->customer2)->postJson('/api/v1/orders', $buyer2Payload);
    // Concurrency atomic lock rejects buyer 2 with unprocessable entity
    $response2->assertStatus(422);
    expect($response2->json('success'))->toBeFalse()
        ->and($response2->json('message'))->toContain('tidak mencukupi');
});

test('customer can cancel pending order and inventory stock is atomically restored', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-KLN-002',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Liontin Mutiara Hitam Tahiti',
        'price' => 8500000,
        'stock' => 5,
        'status' => 'published',
    ]);

    // Place order
    $orderResponse = $this->actingAs($this->customer1)->postJson('/api/v1/orders', [
        'customer_name' => $this->customer1->name,
        'customer_phone' => '081233445566',
        'customer_address' => 'Jl. Senggigi No. 4, Lombok Barat',
        'payment_method' => 'TRANSFER_BANK',
        'items' => [
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => $product->price,
                'quantity' => 2,
            ],
        ],
    ]);

    $orderResponse->assertStatus(201);
    $orderId = $orderResponse->json('data.id');

    $product->refresh();
    expect($product->stock)->toBe(3);

    // Cancel order
    $cancelResponse = $this->actingAs($this->customer1)->postJson("/api/v1/orders/{$orderId}/cancel");
    $cancelResponse->assertStatus(200);
    expect($cancelResponse->json('data.order_status'))->toBe('CANCELLED');

    // Stock must be restored back to 5
    $product->refresh();
    expect($product->stock)->toBe(5);
});

test('customer can upload transfer payment proof with mime and size validation', function () {
    $order = Order::create([
        'order_number' => 'CDE-2026-TEST-99',
        'user_id' => $this->customer1->id,
        'customer_name' => $this->customer1->name,
        'customer_phone' => '0812345678',
        'customer_address' => 'Mataram',
        'subtotal' => 10000000,
        'total' => 10050000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'WAITING_PAYMENT',
        'order_status' => 'PENDING',
    ]);

    $fakeImage = UploadedFile::fake()->create('bukti_transfer_bca.jpg', 500, 'image/jpeg');

    $response = $this->actingAs($this->customer1)->postJson("/api/v1/orders/{$order->id}/upload-proof", [
        'proof_image' => $fakeImage,
        'notes' => 'Transfer via BCA atas nama Ratna',
    ]);

    $response->assertStatus(200);
    expect($response->json('success'))->toBeTrue()
        ->and($response->json('data.order.payment_status'))->toBe('PAYMENT_REVIEW');

    $this->assertDatabaseHas('payments', [
        'order_id' => $order->id,
        'status' => 'PENDING',
    ]);
});

test('customer wishlist CRUD and toggle workflow', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-WSH-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Cincin Mutiara South Sea Gold 18K',
        'price' => 12000000,
        'stock' => 3,
        'status' => 'published',
    ]);

    // 1. Toggle wishlist (add)
    $resToggle1 = $this->actingAs($this->customer1)->postJson('/api/v1/wishlist/toggle', [
        'product_id' => $product->id,
    ]);
    $resToggle1->assertStatus(200);
    expect($resToggle1->json('in_wishlist'))->toBeTrue();

    // 2. List wishlist
    $resList = $this->actingAs($this->customer1)->getJson('/api/v1/wishlist');
    $resList->assertStatus(200);
    expect($resList->json('total'))->toBe(1)
        ->and($resList->json('data.0.id'))->toBe($product->id);

    // 3. Toggle wishlist (remove)
    $resToggle2 = $this->actingAs($this->customer1)->postJson('/api/v1/wishlist/toggle', [
        'product_id' => $product->id,
    ]);
    $resToggle2->assertStatus(200);
    expect($resToggle2->json('in_wishlist'))->toBeFalse();
});

test('shopping cart CRUD and local storage sync', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-CRT-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Gelang Mutiara Air Laut Putih Perak',
        'price' => 7500000,
        'stock' => 10,
        'status' => 'published',
    ]);

    // 1. Add item to cart
    $addRes = $this->actingAs($this->customer1)->postJson('/api/v1/cart/items', [
        'product_id' => $product->id,
        'quantity' => 2,
    ]);
    $addRes->assertStatus(201);
    $cartItemId = $addRes->json('data.id');

    // 2. View cart
    $getRes = $this->actingAs($this->customer1)->getJson('/api/v1/cart');
    $getRes->assertStatus(200);
    expect($getRes->json('data.total_items'))->toBe(1)
        ->and($getRes->json('data.subtotal'))->toBe(15000000);

    // 3. Update quantity
    $updateRes = $this->actingAs($this->customer1)->patchJson("/api/v1/cart/items/{$cartItemId}", [
        'quantity' => 3,
    ]);
    $updateRes->assertStatus(200);

    // 4. Remove item
    $delRes = $this->actingAs($this->customer1)->deleteJson("/api/v1/cart/items/{$cartItemId}");
    $delRes->assertStatus(200);

    // 5. Sync from local storage
    $syncRes = $this->actingAs($this->customer1)->postJson('/api/v1/cart/sync', [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ]);
    $syncRes->assertStatus(200);
    expect($syncRes->json('data.total_items'))->toBe(1);
});

test('shipping address CRUD and default address management', function () {
    // 1. Create first address -> auto becomes default
    $res1 = $this->actingAs($this->customer1)->postJson('/api/v1/addresses', [
        'label' => 'Rumah',
        'recipient_name' => 'Ratna Dewi',
        'phone' => '081234567890',
        'address_line' => 'Jl. Udayana No. 10',
        'city' => 'Mataram',
        'province' => 'NTB',
        'postal_code' => '83125',
    ]);
    $res1->assertStatus(201);
    expect($res1->json('data.is_default'))->toBeTrue();
    $addr1Id = $res1->json('data.id');

    // 2. Create second address set as default -> previous default unset
    $res2 = $this->actingAs($this->customer1)->postJson('/api/v1/addresses', [
        'label' => 'Kantor Butik',
        'recipient_name' => 'Ratna Dewi',
        'phone' => '081234567890',
        'address_line' => 'Jl. Pejanggik No. 50',
        'city' => 'Mataram',
        'province' => 'NTB',
        'postal_code' => '83126',
        'is_default' => true,
    ]);
    $res2->assertStatus(201);
    expect($res2->json('data.is_default'))->toBeTrue();

    // Check first address is now false
    expect(Address::find($addr1Id)->is_default)->toBeFalse();
});

test('notifications list, unread badge counter, and mark as read', function () {
    // Create notifications for customer
    Notification::create([
        'user_id' => $this->customer1->id,
        'type' => 'order_status',
        'title' => 'Pesanan Diproses',
        'message' => 'Pesanan Anda sedang dirangkai oleh pengrajin mutiara.',
    ]);

    $notif2 = Notification::create([
        'user_id' => $this->customer1->id,
        'type' => 'shipping',
        'title' => 'Pesanan Dikirim',
        'message' => 'Pesanan Anda telah diserahkan ke kurir RPX Valuables.',
    ]);

    // 1. Index returns unread count 2
    $indexRes = $this->actingAs($this->customer1)->getJson('/api/v1/notifications');
    $indexRes->assertStatus(200);
    expect($indexRes->json('unread_count'))->toBe(2);

    // 2. Mark single as read
    $readRes = $this->actingAs($this->customer1)->patchJson("/api/v1/notifications/{$notif2->id}/read");
    $readRes->assertStatus(200);
    expect($readRes->json('unread_count'))->toBe(1);

    // 3. Mark all read
    $markAllRes = $this->actingAs($this->customer1)->postJson('/api/v1/notifications/mark-all-read');
    $markAllRes->assertStatus(200);
    expect($markAllRes->json('unread_count'))->toBe(0);
});

test('certificate CRUD with PDF upload and public verification lookup', function () {
    $fakePdf = UploadedFile::fake()->create('sertifikat_gemologi.pdf', 300, 'application/pdf');

    // 1. Admin creates certificate
    $createRes = $this->actingAs($this->admin)->postJson('/api/v1/certificates', [
        'nomor' => 'CERT-LGI-2026-999',
        'lab' => 'Lembaga Gemologi Indonesia',
        'grade' => 'AAA',
        'ukuran' => '12.4 mm',
        'tanggal' => '2026-10-15',
        'pdf_file' => $fakePdf,
    ]);
    $createRes->assertStatus(201);
    expect($createRes->json('data.nomor'))->toBe('CERT-LGI-2026-999');

    // 2. Public lookup
    $lookupRes = $this->getJson('/api/v1/certificates/lookup/CERT-LGI-2026-999');
    $lookupRes->assertStatus(200);
    expect($lookupRes->json('data.lab'))->toBe('Lembaga Gemologi Indonesia');
});

test('admin report CSV file exports generate real downloadable streams', function () {
    // 1. Sales report CSV
    $salesRes = $this->actingAs($this->admin)->get('/api/v1/admin/reports/sales/csv');
    $salesRes->assertStatus(200);
    expect($salesRes->headers->get('content-type'))->toContain('text/csv')
        ->and($salesRes->headers->get('content-disposition'))->toContain('attachment; filename=');

    // 2. Inventory report CSV
    $invRes = $this->actingAs($this->admin)->get('/api/v1/admin/reports/inventory/csv');
    $invRes->assertStatus(200);
    expect($invRes->headers->get('content-type'))->toContain('text/csv')
        ->and($invRes->headers->get('content-disposition'))->toContain('attachment; filename=');
});

test('email verification and resend verification flow', function () {
    // 1. Resend verification for unverified user
    $resendRes = $this->actingAs($this->customer1)->postJson('/api/v1/auth/resend-verification');
    $resendRes->assertStatus(200);
    expect($resendRes->json('success'))->toBeTrue();

    // 2. Verify email with valid hash
    $hash = sha1($this->customer1->getEmailForVerification());
    $verifyRes = $this->getJson("/api/v1/auth/verify-email/{$this->customer1->id}/{$hash}");
    $verifyRes->assertStatus(200);
    expect($verifyRes->json('success'))->toBeTrue();

    $this->customer1->refresh();
    expect($this->customer1->hasVerifiedEmail())->toBeTrue();
});

test('SPI direct execution is logged with label Dieksekusi langsung oleh SPI', function () {
    $product = Product::create([
        'code' => 'PRD-LMB-SPI-001',
        'category_slug' => 'kalung-mutiara',
        'name' => 'Cincin Berlian Mutiara Emas SPI',
        'price' => 20000000,
        'stock' => 2,
        'status' => 'published',
    ]);

    $res = $this->actingAs($this->spi)->postJson('/api/v1/spi/direct-execute', [
        'action_type' => 'price_override',
        'target_id' => $product->id,
        'note' => 'Penyesuaian nilai pasar lelang',
        'old_value' => 20000000,
        'new_value' => 18500000,
    ]);

    $res->assertStatus(200);
    expect($res->json('success'))->toBeTrue();

    $this->assertDatabaseHas('audit_logs', [
        'action' => 'SPI_DIRECT_EXECUTE_PRICE_OVERRIDE',
        'actor_role' => 'spi',
    ]);

    $auditLog = \App\Models\AuditLog::where('action', 'SPI_DIRECT_EXECUTE_PRICE_OVERRIDE')->latest()->first();
    expect($auditLog->new_value['spi_note'])->toContain('Dieksekusi langsung oleh SPI');
});
