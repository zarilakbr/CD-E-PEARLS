<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::first();
if (!$user) {
    echo "NO_USER";
    exit(1);
}

$token = $user->createToken('real-logout-e2e')->plainTextToken;
echo "TOKEN=" . $token;
