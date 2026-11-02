<?php

namespace App\Console\Commands;

use App\Models\Payment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigratePaymentProofsToPrivateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-proofs-private';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy payment proof files from public disk to private disk';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Memulai migrasi berkas bukti transfer ke disk privat...');

        $publicDisk = Storage::disk('public');
        $privateDisk = Storage::disk('private');

        $migratedCount = 0;
        $payments = Payment::whereNotNull('proof_path')->get();

        foreach ($payments as $payment) {
            $proofPath = $payment->proof_path;

            // Normalize path (strip leading slash or /storage/ prefix if present)
            $cleanPath = ltrim(str_replace('/storage/', '', $proofPath), '/');

            if ($publicDisk->exists($cleanPath)) {
                $fileContent = $publicDisk->get($cleanPath);
                $privatePath = $cleanPath;

                // Ensure file is stored on private disk
                $privateDisk->put($privatePath, $fileContent);

                // Update database to relative private path
                $payment->update([
                    'proof_path' => $privatePath,
                ]);

                // Remove from public storage to prevent unauthenticated access
                $publicDisk->delete($cleanPath);
                $migratedCount++;
                $this->line("Migrated: {$cleanPath} -> private disk");
            }
        }

        $this->info("Migrasi selesai. Total berkas dipindahkan ke private disk: {$migratedCount}");

        return Command::SUCCESS;
    }
}

