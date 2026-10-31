<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    /**
     * List orders for Admin and SPI.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items', 'statusHistories', 'payments'])->latest();

        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('order_status') && $request->order_status !== 'all') {
            $query->where('order_status', $request->order_status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 20);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'current_page' => $orders->currentPage(),
            'total' => $orders->total(),
            'last_page' => $orders->lastPage(),
        ]);
    }

    /**
     * Orders belonging strictly to the authenticated customer (IDOR Protection).
     */
    public function userOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = Order::with(['items', 'statusHistories'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Get single order by ID or order_number with strict IDOR protection.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $id)
            ->orWhere('order_number', $id)
            ->with(['items', 'statusHistories', 'payments'])
            ->firstOrFail();

        // IDOR Prevention: If regular user, they can ONLY view their own order
        if ($user && $user->isUser() && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk melihat pesanan ini.',
                'error' => 'FORBIDDEN',
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Customer checkout order placement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:30',
            'customer_address' => 'required|string',
            'notes' => 'nullable|string',
            'courier' => 'nullable|string',
            'payment_method' => 'required|string', // TRANSFER_BANK, WHATSAPP, QRIS
            'discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.product_image' => 'nullable|string',
            'items.*.pearl_size' => 'nullable|string',
            'items.*.metal' => 'nullable|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.custom_specs' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $count = Order::whereYear('created_at', date('Y'))->count() + 1;
            $orderNumber = sprintf('CDE-%s-%04d', date('Y'), $count);

            $subtotal = 0;
            $orderItemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $productId = $item['product_id'] ?? null;
                $quantity = (int) $item['quantity'];

                $product = null;
                $itemPrice = (float) $item['price'];

                if ($productId) {
                    // Pessimistic write lock on product row for atomic concurrency safety
                    $product = Product::where('id', $productId)->lockForUpdate()->first();

                    if (! $product) {
                        return response()->json([
                            'success' => false,
                            'message' => "Produk ID {$productId} tidak ditemukan dalam katalog.",
                        ], Response::HTTP_NOT_FOUND);
                    }

                    if ($product->stock < $quantity) {
                        return response()->json([
                            'success' => false,
                            'message' => "Stok produk {$product->name} tidak mencukupi (tersisa {$product->stock} butir).",
                        ], Response::HTTP_UNPROCESSABLE_ENTITY);
                    }

                    // Server authoritative price override
                    $itemPrice = (float) $product->price;
                }

                $lineSubtotal = $itemPrice * $quantity;
                $subtotal += $lineSubtotal;

                $orderItemsToCreate[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'data' => [
                        'product_id' => $product?->id,
                        'product_name' => $product?->name ?? $item['product_name'],
                        'product_image' => $product?->image ?? ($item['product_image'] ?? null),
                        'pearl_size' => $item['pearl_size'] ?? $product?->ukuran_mm,
                        'metal' => $item['metal'] ?? $product?->logam,
                        'price' => $itemPrice,
                        'quantity' => $quantity,
                        'subtotal' => $lineSubtotal,
                        'custom_specs' => $item['custom_specs'] ?? null,
                    ],
                ];
            }

            $discount = (float) ($validated['discount'] ?? 0);
            $insuranceCost = round($subtotal * 0.002); // 0.2% asuransi pengiriman
            $shippingCost = 50000; // Flat tarif pengiriman perhiasan kilat berasuransi
            $total = max(0, $subtotal - $discount + $insuranceCost + $shippingCost);

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $request->user()?->id,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_address' => $validated['customer_address'],
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'insurance_cost' => $insuranceCost,
                'total' => $total,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'WAITING_PAYMENT',
                'order_status' => 'PENDING',
                'courier' => $validated['courier'] ?? 'JNE Express / RPX Valuables',
            ]);

            foreach ($orderItemsToCreate as $entry) {
                $itemRecord = $entry['data'];
                $itemRecord['order_id'] = $order->id;
                OrderItem::create($itemRecord);

                $product = $entry['product'];
                if ($product) {
                    $stockBefore = $product->stock;
                    $stockAfter = max(0, $stockBefore - $entry['quantity']);
                    $product->update(['stock' => $stockAfter]);

                    StockMovement::create([
                        'product_id' => $product->id,
                        'type' => 'out',
                        'quantity' => $entry['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_type' => 'order_placed',
                        'reference_id' => $orderNumber,
                        'notes' => "Pesanan baru {$orderNumber} oleh {$order->customer_name}",
                        'created_by' => 'Checkout Atomic Engine',
                    ]);
                }
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'PENDING',
                'notes' => 'Pesanan berhasil dibuat. Menunggu konfirmasi pembayaran.',
                'changed_by' => $request->user()?->name ?? 'Pelanggan Butik',
            ]);

            AuditLog::create([
                'actor_id' => $request->user()?->id,
                'actor_name' => $order->customer_name,
                'actor_role' => $request->user()?->role ?? 'customer',
                'action' => 'PLACE_ORDER',
                'target_type' => 'order',
                'target_id' => $orderNumber,
                'old_value' => null,
                'new_value' => ['total' => $total, 'items_count' => count($validated['items'])],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran.',
                'data' => $order->load('items'),
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Customer cancel order (restores stock atomically).
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::where('id', $id)
            ->orWhere('order_number', $id)
            ->with('items')
            ->firstOrFail();

        // Must be own order if regular customer
        if ($user && $user->isUser() && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk membatalkan pesanan ini.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (in_array($order->order_status, ['SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'])) {
            return response()->json([
                'success' => false,
                'message' => "Pesanan dengan status {$order->order_status} tidak dapat dibatalkan langsung.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return DB::transaction(function () use ($order, $user, $request) {
            // Restore inventory atomically
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $stockBefore = $product->stock;
                        $stockAfter = $stockBefore + $item->quantity;
                        $product->update(['stock' => $stockAfter]);

                        StockMovement::create([
                            'product_id' => $product->id,
                            'type' => 'in',
                            'quantity' => $item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => 'order_cancelled',
                            'reference_id' => $order->order_number,
                            'notes' => "Pengembalian stok pembatalan pesanan {$order->order_number}",
                            'created_by' => $user?->name ?? 'Pelanggan',
                        ]);
                    }
                }
            }

            $oldStatus = $order->order_status;
            $order->update([
                'order_status' => 'CANCELLED',
                'payment_status' => 'FAILED',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'CANCELLED',
                'notes' => 'Pesanan dibatalkan oleh pelanggan. Stok otomatis dikembalikan ke katalog.',
                'changed_by' => $user?->name ?? 'Pelanggan',
            ]);

            AuditLog::create([
                'actor_id' => $user?->id,
                'actor_name' => $user?->name ?? $order->customer_name,
                'actor_role' => $user?->role ?? 'customer',
                'action' => 'CANCEL_ORDER',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $oldStatus],
                'new_value' => ['order_status' => 'CANCELLED'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Pesanan {$order->order_number} berhasil dibatalkan dan stok dikembalikan ke etalase.",
                'data' => $order->fresh(['items', 'statusHistories']),
            ]);
        });
    }

    /**
     * Upload proof of transfer payment.
     */
    public function uploadProof(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::where('id', $id)
            ->orWhere('order_number', $id)
            ->firstOrFail();

        if ($user && $user->isUser() && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk pesanan ini.',
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'proof_image' => 'required|file|mimes:jpeg,png,jpg,webp|max:3072',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $file = $request->file('proof_image');
        $filename = 'proof_' . $order->order_number . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('payments', $filename, 'public');

        $payment = Payment::create([
            'order_id' => $order->id,
            'amount' => $order->total,
            'payment_method' => $validated['payment_method'] ?? $order->payment_method,
            'proof_path' => '/storage/' . $path,
            'status' => 'PENDING',
            'notes' => $validated['notes'] ?? 'Unggah bukti transfer pembayaran oleh pelanggan',
        ]);

        $order->update([
            'payment_status' => 'PAYMENT_REVIEW',
        ]);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => 'PAYMENT_REVIEW',
            'notes' => 'Bukti transfer diunggah oleh pelanggan. Menunggu verifikasi tim kasir.',
            'changed_by' => $user?->name ?? $order->customer_name,
        ]);

        AuditLog::create([
            'actor_id' => $user?->id,
            'actor_name' => $user?->name ?? $order->customer_name,
            'actor_role' => $user?->role ?? 'customer',
            'action' => 'UPLOAD_PAYMENT_PROOF',
            'target_type' => 'order',
            'target_id' => $order->order_number,
            'old_value' => null,
            'new_value' => ['payment_id' => $payment->id, 'proof_path' => $payment->proof_path],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Tim kami segera memverifikasi transaksi Anda.',
            'data' => [
                'order' => $order->fresh(['items', 'statusHistories', 'payments']),
                'payment' => $payment,
            ],
        ]);
    }

    /**
     * Public order lookup by order number.
     */
    public function lookup(Request $request, $orderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('order_number', $orderNumber)
            ->first();

        if (! $order) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor pesanan tidak ditemukan. Periksa kembali format (contoh: CDE-2026-0001).',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Request Payment Confirmation to SPI (Replacing direct SPI override).
     */
    public function requestPaymentConfirmation(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($id);

        $request->validate([
            'notes' => 'required|string|min:5|max:1000',
        ], [
            'notes.required' => 'Catatan bukti pembayaran wajib diisi untuk pengajuan konfirmasi ke SPI.',
            'notes.min' => 'Catatan minimal 5 karakter.',
        ]);

        if ($order->payment_status === 'PAID') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah berstatus LUNAS.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $approval = Approval::create([
            'type' => 'payment_override',
            'target_type' => 'order',
            'target_id' => (string) $order->order_number,
            'title' => "Konfirmasi Pelunasan Pesanan {$order->order_number} (Rp ".number_format($order->total, 0, ',', '.').')',
            'old_value' => ['payment_status' => $order->payment_status],
            'new_value' => [
                'payment_status' => 'PAID',
                'notes' => $request->notes,
                'requested_by_admin' => $user->name,
            ],
            'requester_id' => $user->id,
            'status' => 'pending',
            'reason' => $request->notes,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SUBMIT_PAYMENT_APPROVAL',
            'target_type' => 'order',
            'target_id' => $order->order_number,
            'old_value' => ['payment_status' => $order->payment_status],
            'new_value' => ['approval_id' => $approval->id, 'notes' => $request->notes],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengajuan konfirmasi pembayaran pesanan {$order->order_number} berhasil dikirim ke SPI.",
            'approval' => $approval,
        ], Response::HTTP_ACCEPTED);
    }

    /**
     * Update payment status (SPI can set PAID directly; Admin routes to approval).
     */
    public function updatePaymentStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($id);

        $request->validate([
            'payment_status' => 'required|in:WAITING_PAYMENT,PAYMENT_REVIEW,PAID,FAILED,REFUNDED',
            'notes' => 'nullable|string',
        ]);

        $newPaymentStatus = $request->payment_status;

        // If Admin attempts to mark PAID directly -> route to Approval
        if ($newPaymentStatus === 'PAID' && ! $user->isSpi()) {
            return $this->requestPaymentConfirmation($request, $id);
        }

        $oldStatus = $order->payment_status;
        $order->payment_status = $newPaymentStatus;

        if ($newPaymentStatus === 'PAID' && in_array($order->order_status, ['PENDING', 'WAITING_PAYMENT'])) {
            $order->order_status = 'PROCESSING';
        }

        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $order->payment_status,
            'notes' => $request->input('notes', "Status pembayaran diubah oleh {$user->name}"),
            'changed_by' => $user->name,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'UPDATE_PAYMENT_STATUS',
            'target_type' => 'order',
            'target_id' => $order->order_number,
            'old_value' => ['payment_status' => $oldStatus],
            'new_value' => ['payment_status' => $order->payment_status],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status pembayaran pesanan berhasil diperbarui.',
            'data' => $order->fresh(['items', 'statusHistories']),
        ]);
    }

    /**
     * Update order workflow status (PROCESSING, READY_TO_SHIP, SHIPPED, DELIVERED, COMPLETED, CANCELLED).
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($id);

        $request->validate([
            'order_status' => 'required|in:PENDING,PROCESSING,READY_TO_SHIP,SHIPPED,DELIVERED,COMPLETED,CANCELLED',
            'notes' => 'nullable|string',
        ]);

        $newStatus = $request->order_status;

        // Cancellation requires SPI approval if initiated by Admin
        if ($newStatus === 'CANCELLED' && ! $user->isSpi()) {
            $approval = Approval::create([
                'type' => 'cancel_order',
                'target_type' => 'order',
                'target_id' => (string) $order->order_number,
                'title' => "Pembatalan Pesanan {$order->order_number}",
                'old_value' => ['order_status' => $order->order_status],
                'new_value' => ['order_status' => 'CANCELLED', 'notes' => $request->notes ?? 'Permintaan pembatalan admin'],
                'requester_id' => $user->id,
                'status' => 'pending',
                'reason' => $request->input('notes', 'Pembatalan pesanan bernilai tinggi memerlukan verifikasi SPI.'),
            ]);

            AuditLog::create([
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->role,
                'action' => 'SUBMIT_ORDER_CANCELLATION_APPROVAL',
                'target_type' => 'order',
                'target_id' => $order->order_number,
                'old_value' => ['order_status' => $order->order_status],
                'new_value' => ['approval_id' => $approval->id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'requires_approval' => true,
                'message' => 'Pembatalan pesanan diajukan ke Satuan Pengawas Internal (SPI).',
                'approval' => $approval,
            ], Response::HTTP_ACCEPTED);
        }

        $oldStatus = $order->order_status;
        $order->update(['order_status' => $newStatus]);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $newStatus,
            'notes' => $request->input('notes', "Status pesanan diubah ke {$newStatus}"),
            'changed_by' => $user->name,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'UPDATE_ORDER_STATUS',
            'target_type' => 'order',
            'target_id' => $order->order_number,
            'old_value' => ['order_status' => $oldStatus],
            'new_value' => ['order_status' => $newStatus],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui.',
            'data' => $order->fresh(['items', 'statusHistories']),
        ]);
    }

    /**
     * Update tracking number & shipping courier.
     */
    public function updateTracking(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($id);

        $request->validate([
            'tracking_number' => 'required|string|max:100',
            'courier' => 'nullable|string|max:100',
        ]);

        $order->tracking_number = $request->tracking_number;
        if ($request->filled('courier')) {
            $order->courier = $request->courier;
        }
        $order->order_status = 'SHIPPED';
        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => 'SHIPPED',
            'notes' => "Resi {$order->tracking_number} ({$order->courier}) diinput oleh {$user->name}",
            'changed_by' => $user->name,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'UPDATE_TRACKING',
            'target_type' => 'order',
            'target_id' => $order->order_number,
            'old_value' => null,
            'new_value' => ['tracking_number' => $order->tracking_number, 'courier' => $order->courier],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nomor resi pengiriman berhasil disimpan.',
            'data' => $order->fresh(['items', 'statusHistories']),
        ]);
    }
}
