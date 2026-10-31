<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ApprovalController extends Controller
{
    /**
     * List approval queue with filters, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Approval::with(['requester:id,name,email,role', 'decider:id,name,email,role'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('target_id', 'like', "%{$search}%")
                    ->orWhereHas('requester', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 10);
        $approvals = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $approvals->items(),
            'current_page' => $approvals->currentPage(),
            'per_page' => $approvals->perPage(),
            'total' => $approvals->total(),
            'last_page' => $approvals->lastPage(),
        ]);
    }

    /**
     * Approve a pending sensitive action request with idempotent execution.
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $spi = $request->user();

        if (! $spi || ! $spi->isSpi()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Satuan Pengawas Internal (SPI) yang berwenang menyetujui aksi ini.',
                'error' => 'FORBIDDEN',
            ], Response::HTTP_FORBIDDEN);
        }

        $approval = Approval::findOrFail($id);

        if ($approval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Permohonan ini telah berstatus {$approval->status} sebelumnya.",
                'error' => 'ALREADY_DECIDED',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Four-Eyes Principle: Requester cannot approve their own request
        if ($approval->requester_id === $spi->id) {
            return response()->json([
                'success' => false,
                'message' => 'Prinsip Four-Eyes: Pengaju otorisasi tidak diperkenankan menyetujui permohonannya sendiri.',
                'error' => 'SELF_APPROVAL_PROHIBITED',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $reason = $request->input('reason', 'Disetujui secara sah oleh Satuan Pengawas Internal (SPI).');

        DB::transaction(function () use ($approval, $spi, $reason, $request) {
            $newVal = $approval->new_value ?? [];

            switch ($approval->type) {
                case 'price_change':
                    if ($product = Product::find($approval->target_id)) {
                        $oldPrice = $product->price;
                        $product->update([
                            'price' => $newVal['price'] ?? $product->price,
                            'original_price' => $newVal['original_price'] ?? $product->original_price,
                            'discount_percent' => $newVal['discount_percent'] ?? $product->discount_percent,
                        ]);

                        StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'adjustment',
                            'quantity' => 0,
                            'stock_before' => $product->stock,
                            'stock_after' => $product->stock,
                            'reference_type' => 'spi_approval',
                            'reference_id' => (string) $approval->id,
                            'notes' => "Perubahan harga disetujui SPI. Harga lama: Rp {$oldPrice}, Baru: Rp {$product->price}",
                            'created_by' => $spi->name,
                        ]);
                    }
                    break;

                case 'stock_adjustment':
                    if ($product = Product::find($approval->target_id)) {
                        $stockBefore = $product->stock;
                        $adjustedStock = (int) ($newVal['stock'] ?? $stockBefore);
                        $product->update(['stock' => $adjustedStock]);

                        StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'adjustment',
                            'quantity' => $adjustedStock - $stockBefore,
                            'stock_before' => $stockBefore,
                            'stock_after' => $adjustedStock,
                            'reference_type' => 'spi_approval',
                            'reference_id' => (string) $approval->id,
                            'notes' => 'Penyesuaian stok disetujui SPI: '.($newVal['notes'] ?? '-'),
                            'created_by' => $spi->name,
                        ]);
                    }
                    break;

                case 'delete_product':
                    if ($product = Product::find($approval->target_id)) {
                        $product->update(['status' => 'archived']);
                    }
                    break;

                case 'cancel_order':
                    $order = Order::where('id', $approval->target_id)
                        ->orWhere('order_number', $approval->target_id)
                        ->first();
                    if ($order) {
                        $order->update(['order_status' => 'CANCELLED']);
                        OrderStatusHistory::create([
                            'order_id' => $order->id,
                            'status' => 'CANCELLED',
                            'notes' => 'Pembatalan pesanan disetujui oleh SPI: '.$reason,
                            'changed_by' => $spi->name,
                        ]);
                    }
                    break;

                case 'payment_override':
                    $order = Order::where('id', $approval->target_id)
                        ->orWhere('order_number', $approval->target_id)
                        ->first();
                    if ($order) {
                        $order->update(['payment_status' => 'PAID']);
                        Payment::updateOrCreate(
                            ['order_id' => $order->id],
                            [
                                'amount' => $order->total,
                                'payment_method' => $order->payment_method ?? 'TRANSFER_BANK',
                                'status' => 'VERIFIED',
                                'verified_by' => $spi->name,
                                'verified_at' => now(),
                                'notes' => 'Otorisasi pelunasan disetujui oleh SPI: '.$reason,
                            ]
                        );
                        OrderStatusHistory::create([
                            'order_id' => $order->id,
                            'status' => 'PAID',
                            'notes' => 'Pembayaran lunas dikonfirmasi oleh SPI: '.$reason,
                            'changed_by' => $spi->name,
                        ]);
                    }
                    break;

                case 'discount_over_limit':
                    if ($product = Product::find($approval->target_id)) {
                        $product->update([
                            'discount_percent' => $newVal['discount_percent'] ?? $product->discount_percent,
                        ]);
                    }
                    break;
            }

            $approval->update([
                'status' => 'approved',
                'decider_id' => $spi->id,
                'decided_at' => now(),
                'reason' => $reason,
            ]);

            AuditLog::create([
                'actor_id' => $spi->id,
                'actor_name' => $spi->name,
                'actor_role' => $spi->role,
                'action' => 'SPI_APPROVE_'.strtoupper($approval->type),
                'target_type' => $approval->target_type,
                'target_id' => $approval->target_id,
                'old_value' => $approval->old_value,
                'new_value' => $approval->new_value,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Permohonan otorisasi telah disetujui dan dieksekusi secara otomatis ke database.',
            'approval' => $approval->fresh(['requester', 'decider']),
        ]);
    }

    /**
     * Reject a pending approval with mandatory reason.
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $spi = $request->user();

        if (! $spi || ! $spi->isSpi()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Satuan Pengawas Internal (SPI) yang berwenang menolak permohonan ini.',
                'error' => 'FORBIDDEN',
            ], Response::HTTP_FORBIDDEN);
        }

        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ], [
            'reason.required' => 'Catatan alasan penolakan wajib diisi untuk kepatuhan audit.',
            'reason.min' => 'Catatan alasan penolakan minimal 5 karakter.',
        ]);

        $approval = Approval::findOrFail($id);

        if ($approval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Permohonan ini telah berstatus {$approval->status} sebelumnya.",
                'error' => 'ALREADY_DECIDED',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $approval->update([
            'status' => 'rejected',
            'decider_id' => $spi->id,
            'decided_at' => now(),
            'reason' => $request->reason,
        ]);

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'SPI_REJECT_'.strtoupper($approval->type),
            'target_type' => $approval->target_type,
            'target_id' => $approval->target_id,
            'old_value' => $approval->old_value,
            'new_value' => ['rejection_reason' => $request->reason],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permohonan otorisasi telah ditolak secara resmi dan dicatat di log audit.',
            'approval' => $approval->fresh(['requester', 'decider']),
        ]);
    }

    /**
     * Direct execution by SPI with mandatory note.
     */
    public function directExecute(Request $request): JsonResponse
    {
        $spi = $request->user();

        if (! $spi || ! $spi->isSpi()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya SPI yang dapat melakukan eksekusi langsung.',
            ], Response::HTTP_FORBIDDEN);
        }

        $request->validate([
            'action_type' => 'required|string',
            'target_id' => 'required',
            'note' => 'required|string|min:5',
        ]);

        $newValue = is_array($request->new_value) ? $request->new_value : ['value' => $request->new_value];
        $oldValue = is_array($request->old_value) ? $request->old_value : (is_null($request->old_value) ? null : ['value' => $request->old_value]);

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'SPI_DIRECT_EXECUTE_'.strtoupper($request->action_type),
            'target_type' => $request->action_type,
            'target_id' => (string) $request->target_id,
            'old_value' => $oldValue,
            'new_value' => array_merge($newValue, [
                'audit_note' => 'Dieksekusi langsung oleh SPI: '.$request->note,
                'spi_note' => 'Dieksekusi langsung oleh SPI',
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tindakan berhasil dieksekusi langsung oleh SPI dan tercatat di Log Audit.',
        ]);
    }
}

