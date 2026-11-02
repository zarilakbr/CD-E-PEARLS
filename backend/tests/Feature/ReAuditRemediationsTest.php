<?php

use App\Models\Approval;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use OpenSpout\Reader\XLSX\Reader;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create([
        'name' => 'Admin Mutiara',
        'email' => 'admin.mutiara@example.com',
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->spi = User::factory()->create([
        'name' => 'SPI Auditor',
        'email' => 'spi.auditor@example.com',
        'role' => 'spi',
        'status' => 'active',
    ]);

    Category::firstOrCreate(
        ['slug' => 'liontin-mutiara'],
        ['name' => 'Liontin Mutiara', 'description' => 'Liontin mutiara lombok asli']
    );

    Category::firstOrCreate(
        ['slug' => 'bros-mutiara'],
        ['name' => 'Bros Mutiara', 'description' => 'Bros mutiara lombok asli']
    );
});

test('U-8.a: SalesReportExporter menolak token di query param URL (?token=) dan mewajibkan Authorization Bearer', function () {
    $token = $this->spi->createToken('spi_token')->plainTextToken;

    // Akses dengan query param ?token= HARUS ditolak (401/403)
    $responseWithQueryToken = $this->get('/api/v1/spi/reports/sales/export?token=' . $token);
    expect(in_array($responseWithQueryToken->status(), [401, 403], true))->toBeTrue();

    // Akses dengan header resmi Authorization Bearer HARUS diterima (200)
    $responseWithBearer = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->get('/api/v1/spi/reports/sales/export');
    $responseWithBearer->assertStatus(200);
});

test('U-8.b: formula injection dicegah ketat pada CSV & Excel (ltrim, trigger lengkap, diawali petik satu)', function () {
    // Buat pesanan dengan nama pelanggan dan catatan berisi formula injection
    $payloadCustomerName = ' =1+1';
    $payloadNotes = "\t@SUM(A1)";
    $payloadItemName = '-2+3';
    $payloadAddress = '@x';

    $product = Product::create([
        'slug' => 'liontin-mutiara-tahitian-hitam-11mm',
        'name' => $payloadItemName,
        'category_slug' => 'liontin-mutiara',
        'pearl_variety' => 'Tahitian',
        'pearl_grade' => 'AAA',
        'pearl_size' => '11mm',
        'price' => 12000000,
        'stock' => 5,
        'status' => 'published',
    ]);

    $order = Order::create([
        'order_number' => 'CDE-2026-9955',
        'customer_name' => $payloadCustomerName,
        'customer_phone' => '081299998888',
        'customer_address' => $payloadAddress,
        'notes' => $payloadNotes,
        'subtotal' => 12000000,
        'total' => 12075000,
        'payment_method' => 'TRANSFER_BANK',
        'payment_status' => 'PAID',
        'order_status' => 'COMPLETED',
        'tracking_token' => bin2hex(random_bytes(32)),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => 12000000,
        'quantity' => 1,
        'subtotal' => 12000000,
    ]);

    $token = $this->spi->createToken('spi_token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->get('/api/v1/spi/reports/sales/export');

    $response->assertStatus(200);

    // Simpan file sementara untuk diverifikasi dengan Reader
    $tempFile = tempnam(sys_get_temp_dir(), 'export_test_') . '.xlsx';
    file_put_contents($tempFile, $response->streamedContent());

    $reader = new Reader();
    $reader->open($tempFile);

    $allCellValues = [];
    foreach ($reader->getSheetIterator() as $sheet) {
        foreach ($sheet->getRowIterator() as $row) {
            foreach ($row->toArray() as $val) {
                if ($val !== null && $val !== '') {
                    $allCellValues[] = (string) $val;
                }
            }
        }
    }
    $reader->close();
    @unlink($tempFile);

    // Cari nilai yang disanitasi
    $foundCustomerName = false;
    $foundNotes = false;
    $foundItemName = false;
    $foundAddress = false;

    foreach ($allCellValues as $val) {
        if (str_contains($val, '=1+1')) {
            $foundCustomerName = true;
            expect(str_starts_with($val, "'"))->toBeTrue("Cell '{$val}' harus diawali petik satu (')");
        }
        if (str_contains($val, '@SUM')) {
            $foundNotes = true;
            expect(str_starts_with($val, "'"))->toBeTrue("Cell '{$val}' harus diawali petik satu (')");
        }
        if (str_contains($val, '-2+3')) {
            $foundItemName = true;
            expect(str_starts_with($val, "'"))->toBeTrue("Cell '{$val}' harus diawali petik satu (')");
        }
        if (str_contains($val, '@x')) {
            $foundAddress = true;
            expect(str_starts_with($val, "'"))->toBeTrue("Cell '{$val}' harus diawali petik satu (')");
        }
    }

    expect($foundCustomerName)->toBeTrue('Nama pelanggan dengan formula harus ditemukan');
    expect($foundNotes)->toBeTrue('Catatan dengan tab dan formula harus ditemukan');
    expect($foundItemName)->toBeTrue('Nama barang dengan tanda minus harus ditemukan');
    expect($foundAddress)->toBeTrue('Alamat dengan tanda @ harus ditemukan');
});

test('U-8.c: AdminProductRequest menolak string foto mentah dari JSON payload dan wajib multipart', function () {
    $payload = [
        'name' => 'Bros Mutiara Baroque Gold 18K',
        'category_slug' => 'bros-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AAA',
        'ukuran_mm' => 14,
        'berat' => '8.5 gram',
        'bentuk' => 'Baroque',
        'kelompok_warna' => 'emas',
        'varian_warna' => 'Deep Champagne Gold',
        'price' => 15000000,
        'stock' => 3,
        'status' => 'published',
        'image' => 'https://evil.com/fake_image.jpg',
        'images' => ['https://evil.com/fake_image.jpg'],
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', $payload);

    // 'image' dan 'images' tidak boleh disetujui lewat JSON body
    if ($response->status() === 201) {
        $createdProduct = Product::where('name', 'Bros Mutiara Baroque Gold 18K')->first();
        expect($createdProduct->image)->not->toBe('https://evil.com/fake_image.jpg');
    } else {
        $response->assertStatus(422);
    }
});

test('U-8.d: produk baru dengan harga tidak wajar (<100rb) otomatis diset pending_approval dan tidak muncul di katalog', function () {
    $photo = UploadedFile::fake()->image('bros_mutiara.jpg', 600, 600)->size(500);

    $payload = [
        'name' => 'Liontin Mutiara Super Murah Salah Harga',
        'category_slug' => 'liontin-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AA',
        'ukuran_mm' => 10,
        'berat' => '4.2 gram',
        'bentuk' => 'Bulat',
        'kelompok_warna' => 'putih',
        'varian_warna' => 'White Silver',
        'price' => 5000, // Rp 5.000 (tidak wajar, < 100.000)
        'stock' => 10,
        'status' => 'published',
        'photos' => [$photo],
    ];

    $response = $this->actingAs($this->admin)->post('/api/v1/admin/products', $payload, [
        'Accept' => 'application/json',
    ]);

    $response->assertStatus(201);

    $product = Product::where('name', 'Liontin Mutiara Super Murah Salah Harga')->first();
    expect($product)->not->toBeNull();

    // Status otomatis pending_approval karena harga < 100.000
    expect($product->status)->toBe('pending_approval');

    // Ada pengajuan otorisasi ke SPI
    $approval = Approval::where('target_id', (string) $product->id)->first();
    expect($approval)->not->toBeNull();
    expect($approval->status)->toBe('pending');

    // Produk TIDAK boleh muncul di katalog publik
    $catalogResponse = $this->getJson('/api/v1/products');
    $catalogResponse->assertStatus(200);
    $catalogData = json_encode($catalogResponse->json('data'));
    expect($catalogData)->not->toContain('Liontin Mutiara Super Murah Salah Harga');
});
