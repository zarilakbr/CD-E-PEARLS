<?php
// Guard Keamanan: Skrip ini HANYA untuk otomatisasi pengujian lokal/CI dan dilarang di produksi
if (in_array(getenv('APP_ENV'), ['production', 'prod']) || in_array(env('APP_ENV'), ['production', 'prod'])) {
    fwrite(STDERR, "DITOLAK: create-test-token.php dilarang dijalankan pada lingkungan produksi.\n");
    exit(1);
}

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

if (app()->environment('production')) {
    fwrite(STDERR, "DITOLAK: create-test-token.php dilarang pada lingkungan produksi.\n");
    exit(1);
}

$role = $argv[1] ?? null;
if ($role) {
    $user = App\Models\User::where('role', $role)->first();
} else {
    $user = App\Models\User::first();
}
if (!$user) {
    echo "NO_USER";
    exit(1);
}

$token = $user->createToken('test-token-' . ($role ?: 'default'))->plainTextToken;
echo "TOKEN=" . $token;
