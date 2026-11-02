<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$updated = \App\Models\Order::where('payment_status', 'WAITING_PAYMENT')->update([
    'order_status' => 'CANCELLED',
    'payment_status' => 'FAILED',
]);

\App\Models\Product::where('id', 1)->update([
    'stock' => 20,
    'stock_on_hand' => 20,
    'stock_reserved' => 0,
]);

\Illuminate\Support\Facades\Cache::flush();

echo "Reset {$updated} waiting payment orders, restored Product #1 stock, and flushed rate limiter cache.\n";
