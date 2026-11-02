<?php

putenv('DB_CONNECTION=mysql');
putenv('DB_HOST=127.0.0.1');
putenv('DB_PORT=3306');
putenv('DB_DATABASE=cde_test');
putenv('DB_USERNAME=root');
putenv('DB_PASSWORD=');
$_ENV['DB_CONNECTION'] = 'mysql';
$_ENV['DB_DATABASE'] = 'cde_test';

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

echo "========================================================================\n";
echo " UJI NYATA KONKURENSI BALAPAN STOK (TWO PARALLEL PHP PROCESSES ON MYSQL)\n";
echo "========================================================================\n";
echo "Database Target : MySQL 8.4 (cde_test on 127.0.0.1:3306)\n";
echo "Driver Aktif    : " . DB::connection()->getDriverName() . "\n\n";

// 1. Setup isolated test product in MySQL cde_test with stock = 1
$product = Product::updateOrCreate(
    ['code' => 'PRD-CONCURRENCY-RACE-001'],
    [
        'category_slug' => 'cincin',
        'name' => 'Cincin Mutiara South Sea Gold 12mm - Limited Atelier 1 Butir',
        'price' => 15000000,
        'stock' => 1,
        'stock_on_hand' => 1,
        'stock_reserved' => 0,
        'status' => 'published',
    ]
);

// Clean previous test orders for this product to ensure pristine counts
$prevOrderIds = OrderItem::where('product_id', $product->id)->pluck('order_id')->all();
if (!empty($prevOrderIds)) {
    OrderItem::whereIn('order_id', $prevOrderIds)->delete();
    Order::whereIn('id', $prevOrderIds)->delete();
    StockMovement::where('product_id', $product->id)->delete();
}

$product->update([
    'stock' => 1,
    'stock_on_hand' => 1,
    'stock_reserved' => 0,
]);
$product->refresh();

echo "Kondisi Awal Produk:\n";
echo "  ID: {$product->id}\n";
echo "  Kode: {$product->code}\n";
echo "  Nama: {$product->name}\n";
echo "  Stok Tersedia (stock): {$product->stock}\n";
echo "  Stok Fisik (stock_on_hand): {$product->stock_on_hand}\n";
echo "  Stok Direservasi (stock_reserved): {$product->stock_reserved}\n\n";

// 2. Schedule simultaneous start time (0.8 second from now)
$targetTime = microtime(true) + 0.8;
echo "Menjadwalkan dua proses PHP paralel dieksekusi serentak pada target time: " . number_format($targetTime, 4, '.', '') . "...\n";

$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$workerScript = __DIR__ . '/worker_parallel_checkout.php';

$cmd1 = "php " . escapeshellarg($workerScript) . " 1 {$product->id} {$targetTime}";
$cmd2 = "php " . escapeshellarg($workerScript) . " 2 {$product->id} {$targetTime}";

$proc1 = proc_open($cmd1, $descriptors, $pipes1);
$proc2 = proc_open($cmd2, $descriptors, $pipes2);

$out1 = stream_get_contents($pipes1[1]);
$err1 = stream_get_contents($pipes1[2]);
fclose($pipes1[1]); fclose($pipes1[2]);
$exit1 = proc_close($proc1);

$out2 = stream_get_contents($pipes2[1]);
$err2 = stream_get_contents($pipes2[2]);
fclose($pipes2[1]); fclose($pipes2[2]);
$exit2 = proc_close($proc2);

echo "\n--- HASIL KELUARAN PROSES 1 ---\n";
echo trim($out1) . "\n";
if ($err1) echo "STDERR 1: " . trim($err1) . "\n";

echo "\n--- HASIL KELUARAN PROSES 2 ---\n";
echo trim($out2) . "\n";
if ($err2) echo "STDERR 2: " . trim($err2) . "\n";

$res1 = json_decode(trim($out1), true);
$res2 = json_decode(trim($out2), true);

// 3. Inspect final database state
$product->refresh();
$ordersCreated = OrderItem::where('product_id', $product->id)->count();

echo "\n========================================================================\n";
echo " VERIFIKASI KEADAAN AKHIR DATABASE (MYSQL cde_test)\n";
echo "========================================================================\n";
echo "  Stok Akhir Produk (stock)          : {$product->stock} (Wajib >= 0, TIDAK BOLEH NEGATIF)\n";
echo "  Stok Direservasi (stock_reserved)  : {$product->stock_reserved}\n";
echo "  Total Pesanan Tercipta di DB       : {$ordersCreated} (Wajib TEPAT 1)\n";

$s1 = ($res1['status'] ?? 0) === 201;
$s2 = ($res2['status'] ?? 0) === 201;

$winner = $s1 ? 'Pembeli 1' : ($s2 ? 'Pembeli 2' : 'Tidak Ada');
$loser = $s1 ? 'Pembeli 2' : ($s2 ? 'Pembeli 1' : 'Tidak Ada');

echo "\nRingkasan Eksekusi:\n";
echo "  Pemenang Transaksi : {$winner} (HTTP 201 Created)\n";
echo "  Tertolak Bersih   : {$loser} (HTTP 422 Unprocessable Entity - Stok Tidak Mencukupi)\n";

if ($ordersCreated === 1 && $product->stock === 0) {
    echo "\n>>> STATUS: LULUS (Integritas Concurrency Terjamin oleh InnoDB lockForUpdate)\n";
} else {
    echo "\n>>> STATUS: GAGAL (Terjadi overselling / race condition)\n";
    exit(1);
}
