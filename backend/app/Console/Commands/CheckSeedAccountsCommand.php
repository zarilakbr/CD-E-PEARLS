<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CheckSeedAccountsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cde:seed-accounts {--check : Periksa status akun seed tanpa mengubah data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Periksa status akun seed (user, admin, spi) tanpa menampilkan rahasia';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $accounts = [
            'Pelanggan (User)' => [
                'email' => env('SEED_USER_EMAIL', 'siti.rahma@gmail.com'),
                'env_var' => 'SEED_USER_PASSWORD',
                'expected_role' => 'user',
            ],
            'Administrator' => [
                'email' => env('SEED_ADMIN_EMAIL', 'admin@cdepearls.com'),
                'env_var' => 'SEED_ADMIN_PASSWORD',
                'expected_role' => 'admin',
            ],
            'SPI (Pengawas)' => [
                'email' => env('SEED_SPI_EMAIL', 'owner.spi@cdepearls.com'),
                'env_var' => 'SEED_SPI_PASSWORD',
                'expected_role' => 'spi',
            ],
        ];

        $rows = [];

        foreach ($accounts as $label => $info) {
            $email = $info['email'];
            $envVar = $info['env_var'];
            $envPass = env($envVar);
            $hasEnv = ! empty($envPass);

            $user = User::where('email', $email)->first();

            $exists = $user ? 'Ya' : 'Tidak';
            $role = $user ? $user->role : '-';
            $verified = ($user && $user->email_verified_at) ? 'Ya' : 'Tidak';
            $frozen = ($user && $user->status === 'frozen') ? 'Ya (Dibekukan)' : 'Tidak';
            $locked = ($user && $user->locked_until) ? $user->locked_until->toIso8601String() : '-';

            if (! $user) {
                $matches = '-';
            } elseif (! $hasEnv) {
                $matches = 'Env Kosong';
            } else {
                $matches = Hash::check($envPass, $user->password) ? 'Ya (Cocok)' : 'Tidak Cocok';
            }

            $rows[] = [
                $label,
                $email,
                $exists,
                $role,
                $verified,
                $frozen,
                $locked,
                $matches,
            ];
        }

        $this->table(
            ['Akun', 'Email', 'Ada', 'Peran', 'Terverifikasi', 'Beku', 'Terkunci Sampai', 'Sandi Cocok .env'],
            $rows
        );

        return 0;
    }
}

