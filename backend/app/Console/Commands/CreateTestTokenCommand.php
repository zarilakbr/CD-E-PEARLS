<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class CreateTestTokenCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cde:create-test-token {role? : Peran akun (admin, spi, user)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hasilkan token otentikasi uji untuk otomatisasi Playwright lokal (dilarang di produksi)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (app()->environment('production', 'prod')) {
            $this->error('DITOLAK: Perintah cde:create-test-token dilarang dijalankan pada lingkungan produksi.');
            return 1;
        }

        $role = $this->argument('role');

        $user = $role ? User::where('role', $role)->first() : User::first();

        if (! $user) {
            Artisan::call('db:seed');
            $user = $role ? User::where('role', $role)->first() : User::first();
        }

        if (! $user) {
            $this->error('NO_USER');
            return 1;
        }

        $user->forceFill([
            'must_change_password' => false,
            'status' => 'active',
            'email_verified_at' => now(),
        ])->save();

        $user->cart?->items()?->delete();
        Product::where('stock', '<', 5)->update(['stock' => 10]);

        $token = $user->createToken('test-token-'.($role ?: 'default'))->plainTextToken;
        $this->line('TOKEN='.$token);

        return 0;
    }
}

