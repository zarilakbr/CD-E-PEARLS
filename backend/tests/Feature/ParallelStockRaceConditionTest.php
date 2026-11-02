<?php

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

test('real parallel stock race condition on MySQL: two concurrent processes racing for stock 1 results in exactly one success and non-negative stock', function () {
    // Skip if running on SQLite in-memory without multi-process support
    if (DB::connection()->getDriverName() !== 'mysql') {
        $this->markTestSkipped('Tes balapan stok nyata memerlukan database MySQL sungguhan.');
    }

    // Commit current test transaction so external worker processes can see the seeded row in MySQL
    while (DB::transactionLevel() > 0) {
        DB::commit();
    }

    $product = Product::updateOrCreate(
        ['code' => 'PRD-CONCURRENCY-PEST-RACE-001'],
        [
            'category_slug' => 'cincin',
            'name' => 'Cincin Mutiara South Sea Gold 12mm - Pest Concurrency',
            'price' => 15000000,
            'stock' => 1,
            'stock_on_hand' => 1,
            'stock_reserved' => 0,
            'status' => 'published',
        ]
    );

    // Clean previous test orders for this product
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

    $targetTime = microtime(true) + 0.8;
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $workerScript = base_path('scripts/worker_parallel_checkout.php');
    $cmd1 = "php " . escapeshellarg($workerScript) . " 1 {$product->id} {$targetTime}";
    $cmd2 = "php " . escapeshellarg($workerScript) . " 2 {$product->id} {$targetTime}";

    $proc1 = proc_open($cmd1, $descriptors, $pipes1);
    $proc2 = proc_open($cmd2, $descriptors, $pipes2);

    $out1 = stream_get_contents($pipes1[1]);
    $err1 = stream_get_contents($pipes1[2]);
    fclose($pipes1[1]); fclose($pipes1[2]);
    proc_close($proc1);

    $out2 = stream_get_contents($pipes2[1]);
    $err2 = stream_get_contents($pipes2[2]);
    fclose($pipes2[1]); fclose($pipes2[2]);
    proc_close($proc2);

    $res1 = json_decode(trim($out1), true);
    $res2 = json_decode(trim($out2), true);

    $s1 = ($res1['status'] ?? 0) === 201;
    $s2 = ($res2['status'] ?? 0) === 201;

    // Exactly one must succeed (201) and one must be rejected (422)
    expect($s1 xor $s2)->toBeTrue();
    expect(in_array(422, [$res1['status'] ?? 0, $res2['status'] ?? 0]))->toBeTrue();

    $product->refresh();
    $ordersCreated = OrderItem::where('product_id', $product->id)->count();

    expect($ordersCreated)->toBe(1);
    expect($product->stock)->toBe(0);
    expect($product->stock)->toBeGreaterThanOrEqual(0);
    expect($product->stock_reserved)->toBe(1);

    // Clean up created test data
    $createdOrderIds = OrderItem::where('product_id', $product->id)->pluck('order_id')->all();
    if (!empty($createdOrderIds)) {
        OrderItem::whereIn('order_id', $createdOrderIds)->delete();
        Order::whereIn('id', $createdOrderIds)->delete();
        StockMovement::where('product_id', $product->id)->delete();
    }
    $product->delete();
});
