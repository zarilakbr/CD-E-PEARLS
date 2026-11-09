<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderStateMachineService
{
    /**
     * Pembeli mengunggah bukti transfer pembayaran.
     * Alur: WAITING_PAYMENT -> PAYMENT_REVIEW
     */
    public function uploadProof(Order $order, UploadedFile $file, ?string $notes = null, ?User $actor = null): Payment
    {
        if ($order->order_status === 'CANCELLED') {
            throw ValidationException::withMessages([
                'order' => ['Pesanan telah dibatalkan dan tidak dapat menerima bukti transfer.'],
            ]);
        }

        if ($order->payment_status === 'PAID') {
            throw ValidationException::withMessages([
                'payment_status' => ['Pesanan ini sudah berstatus Lunas (PAID).'],
            ]);
        }

        return DB::transaction(function () use ($order, $file, $notes, $actor) {
            $uuid = (string) Str::uuid();
            $ext = $file->guessExtension() ?: $file->getClientOriginalExtension();
            $filename = $uuid . '.' . $ext;
            $path = $file->storeAs('payments', $filename, 'private');

            $payment = Payment::create([
                'order_id' => $order->id,
                'amount' => $order->total,
                'payment_method' => $order->payment_method ?? 'TRANSFER_BANK',
                'proof_path' => $path,
                'status' => 'PENDING',
                'notes' => $notes ?: 'Unggah bukti transfer pembayaran oleh pelanggan',
            ]);

            $order->update([
                'payment_status' => 'PAYMENT_REVIEW',
            ]);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'PAYMENT_REVIEW',
                'notes' => 'Pelanggan mengunggah bukti transfer pembayaran.' . ($notes ? ' Catatan: ' . $notes : ''),
                'changed_by' => $actor?->name ?? $order->customer_name,
            ]);

            AuditLog::create([
                'actor_id' => $actor?->id ?? $order->user_id,
                'actor_name' => $actor?->name ?? $order->customer_name,
                'actor_role' => $actor?->role ?? 'user',
                'action' => 'ORDER_PROOF_UPLOADED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['payment_status' => 'WAITING_PAYMENT'],
                'new_value' => ['payment_status' => 'PAYMENT_REVIEW', 'proof_path' => $path],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Bukti Transfer Diterima',
                    'message' => "Bukti transfer untuk pesanan {$order->order_number} berhasil diunggah dan sedang dalam antrean verifikasi pembayaran oleh Admin.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'payment_status' => 'PAYMENT_REVIEW',
                    ],
                ]);
            }

            return $payment;
        });
    }

    /**
     * Admin memverifikasi pembayaran (Lunas).
     * Alur: PAYMENT_REVIEW -> PAID
     */
    public function verifyPayment(Order $order, User $actor, ?string $notes = null): Order
    {
        if ($actor->role !== 'admin') {
            abort(Response::HTTP_FORBIDDEN, 'Hanya Admin operasional yang berwenang memverifikasi pembayaran.');
        }

        if ($order->order_status === 'CANCELLED' || $order->order_status === 'COMPLETED') {
            throw ValidationException::withMessages([
                'order' => ["Pesanan telah berstatus {$order->order_status} dan tidak dapat diverifikasi pembayarannya."],
            ]);
        }

        // Idempoten jika sudah PAID
        if ($order->payment_status === 'PAID') {
            return $order;
        }

        if ($order->payment_status !== 'PAYMENT_REVIEW') {
            throw ValidationException::withMessages([
                'payment_status' => ["Hanya pesanan dengan status 'PAYMENT_REVIEW' (Menunggu Verifikasi) yang dapat diverifikasi lunas. Status saat ini: {$order->payment_status}."],
            ]);
        }

        return DB::transaction(function () use ($order, $actor, $notes) {
            $oldPaymentStatus = $order->payment_status;
            $oldOrderStatus = $order->order_status;

            $order->update([
                'payment_status' => 'PAID',
                'order_status' => 'PAID',
            ]);
            $order->touch();

            // Perbarui payment record terakhir
            $latestPayment = Payment::where('order_id', $order->id)->latest('id')->first();
            if ($latestPayment) {
                $latestPayment->update([
                    'status' => 'VERIFIED',
                    'verified_by' => $actor->name,
                    'verified_at' => now(),
                    'notes' => $notes ?: 'Pembayaran diverifikasi sah oleh Admin.',
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'PAID',
                'notes' => $notes ?: "Pembayaran telah diverifikasi sah oleh {$actor->name}.",
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_PAYMENT_VERIFIED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['payment_status' => $oldPaymentStatus, 'order_status' => $oldOrderStatus],
                'new_value' => ['payment_status' => 'PAID', 'order_status' => 'PAID'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Pembayaran Diverifikasi Lunas',
                    'message' => "Pembayaran untuk pesanan {$order->order_number} telah diverifikasi lunas oleh Admin. Pesanan Anda akan segera diteruskan ke tim pengawas (SPI) untuk diproses.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'payment_status' => 'PAID',
                        'order_status' => 'PAID',
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * Admin menolak bukti pembayaran dengan alasan wajib.
     * Alur: PAYMENT_REVIEW -> WAITING_PAYMENT (pembeli boleh unggah ulang)
     */
    public function rejectPayment(Order $order, User $actor, string $reason): Order
    {
        if ($actor->role !== 'admin') {
            abort(Response::HTTP_FORBIDDEN, 'Hanya Admin operasional yang berwenang menolak bukti pembayaran.');
        }

        $trimmedReason = trim($reason);
        if (mb_strlen($trimmedReason) < 5) {
            throw ValidationException::withMessages([
                'reason' => ['Alasan penolakan pembayaran wajib diisi dengan jelas (minimal 5 karakter).'],
            ]);
        }

        if ($order->order_status === 'CANCELLED' || $order->order_status === 'COMPLETED') {
            throw ValidationException::withMessages([
                'order' => ["Pesanan telah berstatus {$order->order_status}."],
            ]);
        }

        if ($order->payment_status !== 'PAYMENT_REVIEW') {
            throw ValidationException::withMessages([
                'payment_status' => ["Hanya pesanan dalam antrean 'PAYMENT_REVIEW' yang dapat ditolak pembayarannya. Status saat ini: {$order->payment_status}."],
            ]);
        }

        return DB::transaction(function () use ($order, $actor, $trimmedReason) {
            $oldPaymentStatus = $order->payment_status;

            $order->update([
                'payment_status' => 'WAITING_PAYMENT',
                'order_status' => 'PENDING',
                'notes' => 'Bukti pembayaran ditolak: ' . $trimmedReason,
            ]);
            $order->touch();

            $latestPayment = Payment::where('order_id', $order->id)->latest('id')->first();
            if ($latestPayment) {
                $latestPayment->update([
                    'status' => 'REJECTED',
                    'notes' => 'Ditolak oleh ' . $actor->name . ': ' . $trimmedReason,
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'WAITING_PAYMENT',
                'notes' => "Bukti pembayaran ditolak oleh {$actor->name}: {$trimmedReason}. Silakan unggah ulang bukti transfer yang valid.",
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_PAYMENT_REJECTED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['payment_status' => $oldPaymentStatus],
                'new_value' => ['payment_status' => 'WAITING_PAYMENT', 'rejection_reason' => $trimmedReason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Bukti Pembayaran Ditolak',
                    'message' => "Bukti pembayaran pesanan {$order->order_number} belum dapat diverifikasi: {$trimmedReason}. Silakan unggah ulang bukti transfer yang valid pada dashboard Anda.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'payment_status' => 'WAITING_PAYMENT',
                        'reason' => $trimmedReason,
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * SPI memproses pesanan (PAID -> PROCESSING).
     */
    public function processOrder(Order $order, User $actor, ?string $notes = null): Order
    {
        if (! $actor->isSpi()) {
            abort(Response::HTTP_FORBIDDEN, 'Admin operasional hanya berwenang memverifikasi pembayaran. Pemrosesan dan pengaturan pengiriman pesanan hanya dapat dilakukan oleh SPI.');
        }

        if ($order->order_status === 'CANCELLED' || $order->order_status === 'COMPLETED') {
            throw ValidationException::withMessages([
                'order' => ["Pesanan telah berstatus {$order->order_status} dan tidak dapat diproses."],
            ]);
        }

        if ($order->payment_status !== 'PAID') {
            throw ValidationException::withMessages([
                'payment_status' => ["Pesanan belum berstatus Lunas (PAID). Pembayaran harus diverifikasi terlebih dahulu sebelum pesanan diproses. Status saat ini: {$order->payment_status}."],
            ]);
        }

        if ($order->order_status === 'PROCESSING') {
            return $order;
        }

        return DB::transaction(function () use ($order, $actor, $notes) {
            $oldStatus = $order->order_status;
            $order->update([
                'order_status' => 'PROCESSING',
            ]);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'PROCESSING',
                'notes' => $notes ?: 'Pesanan sedang diproses dan disiapkan oleh tim SPI.',
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_PROCESSING',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldStatus],
                'new_value' => ['order_status' => 'PROCESSING'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Pesanan Sedang Diproses',
                    'message' => "Pesanan {$order->order_number} sedang disiapkan dan dikemas dengan standar mutu CD'E Pearls Lombok.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'order_status' => 'PROCESSING',
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * SPI mengirim pesanan (PROCESSING / PAID -> SHIPPED).
     * Nomor resi dan kurir WAJIB diisi.
     */
    public function shipOrder(Order $order, User $actor, string $trackingNumber, string $courier, ?string $notes = null): Order
    {
        if (! $actor->isSpi()) {
            abort(Response::HTTP_FORBIDDEN, 'Admin operasional tidak berwenang mengirim pesanan. Pengaturan pengiriman dan penginputan nomor resi hanya dapat dilakukan oleh SPI.');
        }

        $trimmedResi = trim($trackingNumber);
        $trimmedCourier = trim($courier);

        if (empty($trimmedResi) || empty($trimmedCourier)) {
            throw ValidationException::withMessages([
                'tracking_number' => ['Nomor resi pengiriman dan kurir wajib diisi saat mengubah status ke SHIPPED.'],
            ]);
        }

        if ($order->payment_status !== 'PAID') {
            throw ValidationException::withMessages([
                'payment_status' => ['Pesanan belum berstatus Lunas (PAID). Pesanan tidak dapat dikirim sebelum verifikasi pembayaran.'],
            ]);
        }

        if (! in_array($order->order_status, ['PAID', 'PROCESSING', 'READY_TO_SHIP'])) {
            throw ValidationException::withMessages([
                'order_status' => ["Pesanan hanya dapat dikirim jika sudah berstatus 'PAID', 'PROCESSING', atau 'READY_TO_SHIP'. Status saat ini: {$order->order_status}."],
            ]);
        }

        return DB::transaction(function () use ($order, $actor, $trimmedResi, $trimmedCourier, $notes) {
            $oldStatus = $order->order_status;
            $order->update([
                'order_status' => 'SHIPPED',
                'tracking_number' => $trimmedResi,
                'courier' => $trimmedCourier,
            ]);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'SHIPPED',
                'notes' => "Pesanan telah dikirim via {$trimmedCourier} (Resi: {$trimmedResi})." . ($notes ? ' ' . $notes : ''),
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_SHIPPED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldStatus],
                'new_value' => [
                    'order_status' => 'SHIPPED',
                    'tracking_number' => $trimmedResi,
                    'courier' => $trimmedCourier,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Pesanan Telah Dikirim',
                    'message' => "Pesanan {$order->order_number} telah dikirim menggunakan kurir {$trimmedCourier} dengan nomor resi {$trimmedResi}.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'order_status' => 'SHIPPED',
                        'tracking_number' => $trimmedResi,
                        'courier' => $trimmedCourier,
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * SPI menyelesaikan pesanan (SHIPPED -> COMPLETED).
     */
    public function completeOrder(Order $order, User $actor, ?string $notes = null): Order
    {
        if (! $actor->isSpi()) {
            abort(Response::HTTP_FORBIDDEN, 'Admin operasional tidak berwenang menyelesaikan pesanan. Penyelesaian pesanan hanya dapat dilakukan oleh SPI.');
        }

        if ($order->order_status !== 'SHIPPED') {
            throw ValidationException::withMessages([
                'order_status' => ["Pesanan hanya dapat diselesaikan setelah berstatus 'SHIPPED' (Dikirim). Status saat ini: {$order->order_status}."],
            ]);
        }

        return DB::transaction(function () use ($order, $actor, $notes) {
            $oldStatus = $order->order_status;
            $order->update([
                'order_status' => 'COMPLETED',
            ]);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'COMPLETED',
                'notes' => $notes ?: 'Pesanan telah selesai dan diterima dengan baik oleh pelanggan.',
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_COMPLETED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldStatus],
                'new_value' => ['order_status' => 'COMPLETED'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Pesanan Selesai',
                    'message' => "Pesanan {$order->order_number} telah selesai. Terima kasih telah berbelanja di CD'E Pearls Lombok.",
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'order_status' => 'COMPLETED',
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * Pembatalan pesanan dan pengembalian stok idempoten (tepat satu kali).
     * Pembeli hanya saat WAITING_PAYMENT.
     */
    public function cancelOrder(Order $order, ?User $actor = null, ?string $reason = null): Order
    {
        // Idempoten jika sudah CANCELLED: langsung return tanpa melempar validasi atau mengembalikan stok berulang
        if ($order->order_status === 'CANCELLED') {
            return $order;
        }

        // Jika pembeli yang membatalkan, pastikan hanya saat WAITING_PAYMENT
        if ($actor && $actor->isUser()) {
            if ($order->payment_status !== 'WAITING_PAYMENT' || in_array($order->order_status, ['SHIPPED', 'DELIVERED', 'COMPLETED'])) {
                throw ValidationException::withMessages([
                    'order' => ['Pesanan tidak dapat dibatalkan karena pembayaran sedang diverifikasi atau pesanan telah diproses.'],
                ]);
            }
        }

        return DB::transaction(function () use ($order, $actor, $reason) {
            $oldOrderStatus = $order->order_status;
            $oldPaymentStatus = $order->payment_status;

            // Kembalikan stok item pesanan tepat satu kali
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    $product = Product::lockForUpdate()->find($item->product_id);
                    if ($product) {
                        $stockBefore = (int) $product->stock;
                        $stockAfter = $stockBefore + $item->quantity;
                        $product->stock = $stockAfter;
                        $product->stock_on_hand = (int) ($product->stock_on_hand ?? $stockBefore) + $item->quantity;
                        $product->stock_reserved = max(0, (int) ($product->stock_reserved ?? 0) - $item->quantity);
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'in',
                            'quantity' => $item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => 'order_cancelled',
                            'reference_id' => (string) $order->order_number,
                            'notes' => 'Pengembalian stok dari pembatalan pesanan ' . $order->order_number,
                            'created_by' => $actor?->name ?? 'System',
                        ]);
                    }
                }
            }

            $order->update([
                'order_status' => 'CANCELLED',
                'payment_status' => 'FAILED',
                'notes' => $reason ?: ($order->notes ? $order->notes . ' | Dibatalkan' : 'Dibatalkan'),
            ]);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'CANCELLED',
                'notes' => $reason ?: 'Pesanan dibatalkan dan stok dikembalikan.',
                'changed_by' => $actor?->name ?? 'System',
            ]);

            AuditLog::create([
                'actor_id' => $actor?->id ?? $order->user_id,
                'actor_name' => $actor?->name ?? ($order->customer_name ?: 'System'),
                'actor_role' => $actor?->role ?? 'user',
                'action' => 'ORDER_CANCELLED',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldOrderStatus, 'payment_status' => $oldPaymentStatus],
                'new_value' => ['order_status' => 'CANCELLED', 'payment_status' => 'FAILED'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            if ($order->user_id) {
                Notification::create([
                    'user_id' => $order->user_id,
                    'type' => 'order_status',
                    'title' => 'Pesanan Dibatalkan',
                    'message' => "Pesanan {$order->order_number} telah dibatalkan." . ($reason ? " Alasan: {$reason}." : ''),
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'order_status' => 'CANCELLED',
                    ],
                ]);
            }

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }

    /**
     * Dispatcher transisi umum untuk integrasi dengan controller legacy.
     */
    public function transition(Order $order, string $targetStatus, User $actor, array $payload = []): Order
    {
        $normalizedStatus = strtoupper(trim($targetStatus));

        // Normalisasi status bahasa Indonesia ke standar
        $map = [
            'MENUNGGU PEMBAYARAN' => 'WAITING_PAYMENT',
            'PENDING_PAYMENT' => 'WAITING_PAYMENT',
            'MENUNGGU VERIFIKASI' => 'PAYMENT_REVIEW',
            'DIKEMAS' => 'PROCESSING',
            'DIKIRIM' => 'SHIPPED',
            'SELESAI' => 'COMPLETED',
            'DIBATALKAN' => 'CANCELLED',
        ];

        $target = $map[$normalizedStatus] ?? $normalizedStatus;

        if ($target === 'PAID') {
            if ($actor->role !== 'admin') {
                abort(Response::HTTP_FORBIDDEN, 'Hanya Admin operasional yang berwenang memverifikasi pembayaran.');
            }
            return $this->verifyPayment($order, $actor, $payload['notes'] ?? null);
        }

        if ($target === 'WAITING_PAYMENT' && $order->payment_status === 'PAYMENT_REVIEW') {
            if ($actor->role !== 'admin') {
                abort(Response::HTTP_FORBIDDEN, 'Hanya Admin operasional yang berwenang menolak pembayaran.');
            }
            return $this->rejectPayment($order, $actor, $payload['notes'] ?? $payload['reason'] ?? 'Bukti pembayaran ditolak oleh Admin.');
        }

        if (in_array($target, ['PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED']) && ! $actor->isSpi()) {
            abort(Response::HTTP_FORBIDDEN, 'Admin operasional tidak berwenang mengubah status ke tahap logistik/pengiriman. Wewenang ini khusus untuk SPI.');
        }

        return match ($target) {
            'PAID' => $this->verifyPayment($order, $actor, $payload['notes'] ?? null),
            'PROCESSING' => $this->processOrder($order, $actor, $payload['notes'] ?? null),
            'READY_TO_SHIP' => $this->readyToShipOrder($order, $actor, $payload['notes'] ?? null),
            'SHIPPED' => $this->shipOrder(
                $order,
                $actor,
                $payload['tracking_number'] ?? $order->tracking_number ?? ('JNE-' . $order->order_number),
                $payload['courier'] ?? $order->courier ?? 'JNE Express',
                $payload['notes'] ?? null
            ),
            'COMPLETED' => $this->completeOrder($order, $actor, $payload['notes'] ?? null),
            'CANCELLED' => $this->cancelOrder($order, $actor, $payload['notes'] ?? null),
            default => throw ValidationException::withMessages([
                'status' => ["Transisi status pesanan ke '{$targetStatus}' tidak didukung atau tidak sah."],
            ]),
        };
    }

    /**
     * SPI: Set pesanan siap dikirim (PROCESSING -> READY_TO_SHIP).
     */
    public function readyToShipOrder(Order $order, User $actor, ?string $notes = null): Order
    {
        if (! $actor->isSpi()) {
            abort(Response::HTTP_FORBIDDEN, 'Hanya SPI yang berwenang mengatur status pengiriman pesanan.');
        }

        return DB::transaction(function () use ($order, $actor, $notes) {
            $oldStatus = $order->order_status;
            $order->update(['order_status' => 'READY_TO_SHIP']);
            $order->touch();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'READY_TO_SHIP',
                'notes' => $notes ?: 'Pesanan siap untuk dikirim.',
                'changed_by' => $actor->name,
            ]);

            AuditLog::create([
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'action' => 'ORDER_READY_TO_SHIP',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldStatus],
                'new_value' => ['order_status' => 'READY_TO_SHIP'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $order->fresh(['items', 'statusHistories', 'payments']);
        });
    }
}

