<?php

use App\Models\Category;
use App\Models\Certificate;
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

    $this->admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'active',
    ]);
});

test('admin dapat membuat produk dengan spesifikasi teks bebas termasuk rentang ukuran dan jumlah', function () {
    $payload = [
        'code' => 'PRD-CUSTOM-001',
        'name' => 'Kalung Mutiara Gradasi Mewah',
        'description' => 'Kalung mutiara air laut dengan gradasi warna emas ke putih.',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea & Tahitian Baroq',
        'grade' => 'AAA+ Istimewa',
        'ukuran_mm' => '11.2 - 12.0 mm',
        'jumlah' => '1 untai / 45 butir',
        'berat' => '65.4 gr',
        'bentuk' => 'Bulat Sempurna',
        'kelompok_warna' => 'emas',
        'varian_warna' => 'Champagne Deep Gold',
        'price' => 18500000,
        'stock' => 2,
        'status' => 'published',
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', $payload);

    $response->assertStatus(201);
    expect($response->json('success'))->toBeTrue();

    $data = $response->json('data');
    expect($data['code'])->toBe('PRD-CUSTOM-001');
    expect($data['varietas'])->toBe('South Sea & Tahitian Baroq');
    expect($data['grade'])->toBe('AAA+ Istimewa');
    expect($data['ukuran_mm'])->toBe('11.2 - 12.0 mm');
    expect($data['jumlah'])->toBe('1 untai / 45 butir');
    expect($data['berat'])->toBe('65.4 gr');

    $this->assertDatabaseHas('products', [
        'code' => 'PRD-CUSTOM-001',
        'ukuran_mm' => '11.2 - 12.0 mm',
        'jumlah' => '1 untai / 45 butir',
        'berat' => '65.4 gr',
    ]);

    // Verifikasi public API detail produk mengembalikan field-field tersebut
    $detailResponse = $this->getJson("/api/v1/products/{$data['id']}");
    $detailResponse->assertStatus(200);
    $detail = $detailResponse->json('data');
    expect($detail['code'])->toBe('PRD-CUSTOM-001');
    expect($detail['ukuran_mm'])->toBe('11.2 - 12.0 mm');
    expect($detail['jumlah'])->toBe('1 untai / 45 butir');
});

test('admin dapat melampirkan berkas sertifikat saat membuat produk dan terhubung ke tabel certificates', function () {
    $certPdf = UploadedFile::fake()->create('sertifikat_gemologi.pdf', 500, 'application/pdf');

    $payload = [
        'name' => 'Gelang Mutiara Ratu Labuan',
        'category_slug' => 'kalung-mutiara',
        'varietas' => 'South Sea',
        'grade' => 'AAA',
        'ukuran_mm' => '12.5 mm',
        'jumlah' => '1 buah',
        'berat' => '12.8 gr',
        'price' => 12000000,
        'stock' => 1,
        'status' => 'published',
        'certificate_number' => 'CERT-LGI-2026-9988',
        'certificate_file' => $certPdf,
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', $payload);

    $response->assertStatus(201);
    $data = $response->json('data');

    expect($data['certificate_id'])->not->toBeNull();

    $cert = Certificate::find($data['certificate_id']);
    expect($cert)->not->toBeNull();
    expect($cert->nomor)->toBe('CERT-LGI-2026-9988');
    expect($cert->pdf_path)->not->toBeNull();
    expect($cert->pdf_path)->toContain('/storage/certificates/cert_CERT-LGI-2026-9988');

    // Storage file exist
    $storagePath = str_replace('/storage/', '', $cert->pdf_path);
    Storage::disk('public')->assertExists($storagePath);

    // Detail endpoint return certificate URL
    $detailResponse = $this->getJson("/api/v1/products/{$data['id']}");
    $detailResponse->assertStatus(200);
    $detail = $detailResponse->json('data');
    expect($detail['certificate_number'])->toBe('CERT-LGI-2026-9988');
    expect($detail['certificate_pdf_url'])->not->toBeNull();
    expect($detail['certificate_pdf_url'])->toContain('/storage/certificates/');
});

test('admin dapat menghubungkan nomor sertifikat tanpa berkas baru jika sertifikat sudah ada atau dibuatkan stub', function () {
    $existingCert = Certificate::create([
        'nomor' => 'CERT-EXISTING-001',
        'lab' => 'Lembaga Gemologi Indonesia',
        'grade' => 'AAA',
        'ukuran' => '13.0 mm',
        'tanggal' => '2026-01-15',
        'pdf_path' => '/storage/certificates/cert_sample.pdf',
    ]);

    $payload = [
        'name' => 'Cincin Mutiara Emas Hitam',
        'category_slug' => 'kalung-mutiara',
        'price' => 9500000,
        'stock' => 3,
        'certificate_number' => 'CERT-EXISTING-001',
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/products', $payload);
    $response->assertStatus(201);

    $product = Product::find($response->json('data.id'));
    expect($product->certificate_id)->toBe($existingCert->id);
});
