<?php
// Guard Keamanan: Skrip ini HANYA untuk otomatisasi pengujian lokal/CI dan dilarang di produksi
if (in_array(getenv('APP_ENV'), ['production', 'prod'])) {
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
    Illuminate\Support\Facades\Artisan::call('db:seed');
    $user = $role ? App\Models\User::where('role', $role)->first() : App\Models\User::first();
}
if (!$user) {
    echo "NO_USER";
    exit(1);
}

$user->forceFill([
    'must_change_password' => false,
    'status' => 'active',
    'email_verified_at' => now(),
])->save();

$user->cart?->items()?->delete();
App\Models\Product::where('stock', '<', 5)->update(['stock' => 10]);

$token = $user->createToken('test-token-' . ($role ?: 'default'))->plainTextToken;
echo "TOKEN=" . $token;
