<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SetStaffPasswordCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cde:set-password {email : Email akun yang akan diubah kata sandinya}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Atur atau ganti kata sandi akun butik/staf secara aman dari CLI tanpa menampilkan rahasia';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("Akun dengan email [{$email}] tidak ditemukan di database.");
            return 1;
        }

        // Hidden input for password - never printed
        $password = $this->secret('Masukkan kata sandi baru: ');
        if (empty($password) || strlen($password) < 8) {
            $this->error('Kata sandi minimal 8 karakter dan tidak boleh kosong.');
            return 1;
        }

        $confirmation = $this->secret('Konfirmasi kata sandi baru: ');
        if ($password !== $confirmation) {
            $this->error('Konfirmasi kata sandi tidak cocok.');
            return 1;
        }

        $user->update([
            'password' => Hash::make($password),
            'must_change_password' => false,
            'failed_logins' => 0,
            'locked_until' => null,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => 'CLI Admin',
            'actor_role' => 'admin',
            'action' => 'SET_PASSWORD_CLI',
            'target_type' => 'user',
            'target_id' => (string) $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'artisan/cli',
            'created_at' => now(),
        ]);

        $this->info("Kata sandi untuk akun [{$email}] (Peran: {$user->role}) berhasil diperbarui.");
        return 0;
    }
}

