<?php

use App\Models\Product;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('U-11.3: migrasi stok memindahkan data stock lama ke stock_on_hand dan rollback berjalan aman', function () {
    // 1. Verifikasi kolom stock_on_hand dan stock_reserved ada
    expect(Schema::hasColumn('products', 'stock_on_hand'))->toBeTrue();
    expect(Schema::hasColumn('products', 'stock_reserved'))->toBeTrue();

    // 2. Buat produk sampel dengan stock 15
    $product = Product::create([
        'code' => 'PRD-MIG-TEST-001',
        'name' => 'Kalung Mutiara Sampel Migrasi',
        'category_slug' => 'kalung-mutiara',
        'price' => 7500000,
        'stock' => 15,
        'stock_on_hand' => 15,
        'stock_reserved' => 0,
        'status' => 'published',
    ]);

    expect((int) $product->stock_on_hand)->toBe(15);

    // 3. Uji rollback migrasi kolom stok
    $stockMigrationPath = 'database/migrations/2026_11_02_000004_add_stock_columns_to_products_table.php';
    $rollbackExit = Artisan::call('migrate:rollback', ['--path' => $stockMigrationPath]);
    expect($rollbackExit)->toBe(0);

    // Setelah rollback, kolom stock_on_hand dan stock_reserved terhapus tanpa merusak tabel products
    expect(Schema::hasColumn('products', 'stock_on_hand'))->toBeFalse();
    expect(Schema::hasColumn('products', 'stock_reserved'))->toBeFalse();
    expect(Schema::hasColumn('products', 'stock'))->toBeTrue();

    // Data produk dan nilai stock lama tetap utuh
    $rawProduct = DB::table('products')->where('code', 'PRD-MIG-TEST-001')->first();
    expect($rawProduct)->not->toBeNull();
    expect((int) $rawProduct->stock)->toBe(15);

    // 4. Uji migrate kembali (up)
    $migrateExit = Artisan::call('migrate', ['--path' => $stockMigrationPath]);
    expect($migrateExit)->toBe(0);

    // Kolom kembali dibuat dan stock_on_hand terisi otomatis dari stock lama
    expect(Schema::hasColumn('products', 'stock_on_hand'))->toBeTrue();
    expect(Schema::hasColumn('products', 'stock_reserved'))->toBeTrue();

    $migratedProduct = DB::table('products')->where('code', 'PRD-MIG-TEST-001')->first();
    expect((int) $migratedProduct->stock_on_hand)->toBe(15);
    expect((int) $migratedProduct->stock_reserved)->toBe(0);
});

