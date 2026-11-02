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
use Illuminate\Http\Request;
use App\Http\Controllers\Api\OrderController;

$buyerId = $argv[1] ?? '1';
$productId = (int) ($argv[2] ?? 15);

// Sync barrier: wait for start timestamp if provided
if (isset($argv[3])) {
    $targetTime = (float) $argv[3];
    while (microtime(true) < $targetTime) {
        usleep(100); // 0.1ms spin wait for tight synchronization
    }
}

$requestData = [
    'customer_name' => "Pembeli {$buyerId}",
    'customer_phone' => "08123456789{$buyerId}",
    'customer_address' => "Alamat Pembeli {$buyerId}, Mataram",
    'payment_method' => 'TRANSFER_BCA',
    'turnstile_token' => '1x00000000000000000000AA',
    'items' => [
        [
            'product_id' => $productId,
            'quantity' => 1,
        ],
    ],
];

$request = Request::create('/api/v1/orders', 'POST', $requestData);
$request->headers->set('Accept', 'application/json');

$controller = new OrderController();

$startTs = microtime(true);
try {
    $response = $controller->store($request);
    $duration = round((microtime(true) - $startTs) * 1000, 2);
    $status = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);

    echo json_encode([
        'worker' => $buyerId,
        'pid' => getmypid(),
        'status' => $status,
        'duration_ms' => $duration,
        'success' => $data['success'] ?? ($status === 201),
        'message' => $data['message'] ?? ($data['data']['message'] ?? null),
        'order_number' => $data['order']['order_number'] ?? ($data['data']['order_number'] ?? null),
    ]) . "\n";
} catch (\Throwable $e) {
    echo json_encode([
        'worker' => $buyerId,
        'pid' => getmypid(),
        'error' => $e->getMessage(),
    ]) . "\n";
}
