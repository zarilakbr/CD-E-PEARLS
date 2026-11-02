<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireOrderReservationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:expire-reservations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Batalkan pesanan yang belum dibayar melebihi batas waktu 2 jam dan kembalikan stok reservasi';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) (\App\Models\Setting::where('key', 'reservation_hours')->value('value')
            ?? \App\Models\Setting::where('key', 'payment_timeout_hours')->value('value')
            ?? 24);

        $expiredOrders = Order::with('items')
            ->where('payment_status', 'WAITING_PAYMENT')
            ->where('order_status', '!=', 'CANCELLED')
            ->where('created_at', '<=', now()->subHours($hours))
            ->get();

        $count = 0;

        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order) {
                // Kunci ulang order
                $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
                if (! $lockedOrder || $lockedOrder->order_status === 'CANCELLED') {
                    return;
                }

                $lockedOrder->update([
                    'order_status' => 'CANCELLED',
                    'payment_status' => 'FAILED',
                ]);

                foreach ($order->items as $item) {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $stockBefore = $product->stock;
                        $product->stock_reserved = max(0, $product->stock_reserved - $item->quantity);
                        $product->stock += $item->quantity;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'in',
                            'quantity' => $item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $product->stock,
                            'reference_type' => 'reservation_expired',
                            'reference_id' => $order->order_number,
                            'notes' => "Pengembalian stok reservasi kedaluwarsa pesanan {$order->order_number}",
                            'created_by' => 'System Cron',
                        ]);
                    }
                }

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => 'CANCELLED',
                    'notes' => "Pesanan dibatalkan otomatis oleh sistem karena batas waktu pembayaran ({$hours} jam) telah berakhir.",
                    'changed_by' => 'System Cron',
                ]);
            });

            $count++;
        }

        $this->info("Berhasil membatalkan {$count} pesanan kedaluwarsa dan mengembalikan stok.");

        return 0;
    }
}
