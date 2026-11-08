<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class SpiControlCenterController extends Controller
{
    /**
     * S-2.1 Ringkasan KPI Database Nyata.
     */
    public function summary(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $startToday = Carbon::today();
        $start7d = Carbon::today()->subDays(7);
        $start30d = Carbon::today()->subDays(30);

        // Omzet (hanya pesanan yang tidak dibatalkan)
        $revenueToday = (float) Order::where('created_at', '>=', $startToday)
            ->where('order_status', '!=', 'CANCELLED')
            ->sum('total');

        $revenue7d = (float) Order::where('created_at', '>=', $start7d)
            ->where('order_status', '!=', 'CANCELLED')
            ->sum('total');

        $revenue30d = (float) Order::where('created_at', '>=', $start30d)
            ->where('order_status', '!=', 'CANCELLED')
            ->sum('total');

        // Jumlah pesanan per status
        $ordersByStatus = Order::select('order_status', DB::raw('count(*) as count'))
            ->groupBy('order_status')
            ->get()
            ->pluck('count', 'order_status')
            ->toArray();

        // Produk Terlaris (dari order_items yang tidak dibatalkan)
        $topProducts = OrderItem::select('product_name', 'product_id', DB::raw('sum(quantity) as total_sold'), DB::raw('sum(subtotal) as total_revenue'))
            ->groupBy('product_name', 'product_id')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        // Stok Menipis (stok <= 3 dan status != archived)
        $lowStockProducts = Product::where('status', '!=', 'archived')
            ->where('stock', '<=', 3)
            ->orderBy('stock', 'asc')
            ->take(10)
            ->get(['id', 'code', 'name', 'stock', 'price', 'category_slug']);

        // Pelanggan Baru (30 hari terakhir)
        $newCustomersCount = User::where('role', 'user')
            ->where('created_at', '>=', $start30d)
            ->count();

        $recentCustomers = User::where('role', 'user')
            ->latest('created_at')
            ->take(5)
            ->get(['id', 'name', 'email', 'phone', 'status', 'created_at']);

        return response()->json([
            'success' => true,
            'revenue' => [
                'today' => $revenueToday,
                'days_7' => $revenue7d,
                'days_30' => $revenue30d,
            ],
            'orders_by_status' => $ordersByStatus,
            'top_products' => $topProducts,
            'low_stock_products' => $lowStockProducts,
            'new_customers_count' => $newCustomersCount,
            'recent_customers' => $recentCustomers,
        ]);
    }

    /**
     * S-2.2 Pesanan: Daftar, Filter, Detail, Ubah Status.
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['items', 'user']);

        if ($request->filled('status') && $request->status !== 'all' && $request->status !== 'Semua') {
            $query->where('order_status', $request->status);
        }

        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $orders = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'total' => $orders->total(),
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
        ]);
    }

    public function orderDetail($id): JsonResponse
    {
        $order = Order::with(['items.product', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($id);

        if (! $request->has('order_status') && $request->has('status')) {
            $request->merge(['order_status' => $request->input('status')]);
        }

        $validated = $request->validate([
            'order_status' => ['required', 'string', Rule::in(['PENDING_PAYMENT', 'PENDING', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'Menunggu Pembayaran', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'])],
            'notes' => ['nullable', 'string'],
        ]);

        $oldStatus = $order->order_status;
        $order->update([
            'order_status' => $validated['order_status'],
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_UPDATE_ORDER_STATUS',
            'target_type' => 'order',
            'target_id' => (string) $order->id,
            'old_value' => ['order_status' => $oldStatus],
            'new_value' => [
                'order_status' => $order->order_status,
                'notes' => $validated['notes'] ?? null,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status pesanan {$order->order_number} berhasil diperbarui ke {$order->order_status}.",
            'data' => $order,
        ]);
    }

    /**
     * S-2.3 Produk dan Stok: Lihat dan Koreksi Stok.
     */
    public function stock(Request $request): JsonResponse
    {
        $query = Product::where('status', '!=', 'archived');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%");
            });
        }

        if ($request->filled('low_stock_only') && filter_var($request->low_stock_only, FILTER_VALIDATE_BOOLEAN)) {
            $query->where('stock', '<=', 3);
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $products = $query->orderBy('stock', 'asc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
        ]);
    }

    public function adjustStock(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $request->validate([
            'delta' => ['required', 'integer'],
            'reason' => ['required', 'string'],
        ]);

        $delta = (int) $request->delta;
        $stockBefore = $product->stock;
        $stockAfter = max(0, $stockBefore + $delta);

        $product->update(['stock' => $stockAfter]);

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => $delta,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reference_type' => 'spi_control_center',
            'reference_id' => (string) $product->id,
            'notes' => $request->reason,
            'created_by' => $user->name.' (SPI)',
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_ADJUST_STOCK',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => ['stock' => $stockBefore],
            'new_value' => [
                'stock' => $stockAfter,
                'delta' => $delta,
                'reason' => $request->reason,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Stok {$product->name} berhasil dikoreksi menjadi {$stockAfter} unit.",
            'product' => $product,
        ]);
    }

    /**
     * S-2.4 Pengguna: Daftar, Ubah Peran, Nonaktifkan; SPI DILARANG Menurunkan Dirinya Sendiri.
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at');

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $users = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'total' => $users->total(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
        ]);
    }

    public function updateUserRole(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $targetUser = User::findOrFail($id);

        $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'user', 'spi'])],
        ]);

        // CRITICAL AUDIT RULE: SPI tidak bisa menurunkan perannya sendiri
        if ((int) $user->id === (int) $targetUser->id && $request->role !== 'spi') {
            return response()->json([
                'success' => false,
                'message' => 'Satuan Pengawas Internal (SPI) dilarang menurunkan perannya sendiri demi menjamin independensi audit.',
            ], Response::HTTP_FORBIDDEN);
        }

        $oldRole = $targetUser->role;
        $targetUser->update(['role' => $request->role]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_CHANGE_USER_ROLE',
            'target_type' => 'user',
            'target_id' => (string) $targetUser->id,
            'old_value' => ['role' => $oldRole],
            'new_value' => ['role' => $targetUser->role],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Peran pengguna {$targetUser->name} berhasil diubah menjadi {$targetUser->role}.",
            'user' => $targetUser,
        ]);
    }

    public function toggleUserStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $targetUser = User::findOrFail($id);

        // CRITICAL AUDIT RULE: SPI tidak bisa membekukan / menonaktifkan akunnya sendiri
        if ((int) $user->id === (int) $targetUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Satuan Pengawas Internal (SPI) dilarang menonaktifkan akun kepengawasannya sendiri.',
            ], Response::HTTP_FORBIDDEN);
        }

        $oldStatus = $targetUser->status;
        $newStatus = ($oldStatus === 'active') ? 'frozen' : 'active';
        $targetUser->update(['status' => $newStatus]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_TOGGLE_USER_STATUS',
            'target_type' => 'user',
            'target_id' => (string) $targetUser->id,
            'old_value' => ['status' => $oldStatus],
            'new_value' => ['status' => $newStatus],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status akun {$targetUser->name} berhasil diubah menjadi {$newStatus}.",
            'user' => $targetUser,
        ]);
    }

    /**
     * S-2.5 Audit Log: Siapa, Aksi, Kapan, IP; Append-Only.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('actor_name', 'like', "%{$s}%")
                    ->orWhere('action', 'like', "%{$s}%")
                    ->orWhere('target_type', 'like', "%{$s}%")
                    ->orWhere('ip_address', 'like', "%{$s}%");
            });
        }

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        $perPage = (int) $request->input('per_page', 25);
        $logs = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'total' => $logs->total(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
        ]);
    }

    /**
     * S-2.6 Pengaturan Toko: Nama, Kontak, Rekening, Biaya Kirim, Batas Bayar.
     */
    public function getSettings(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        // Defaults
        $defaults = [
            'store_name' => 'CD\'E Pearls Lombok',
            'contact_phone' => '081239887733',
            'bank_accounts' => 'BCA 056-8899-221 a.n CD\'E Pearls Lombok; Mandiri 161-00-8877-112 a.n CD\'E Pearls',
            'shipping_flat_cost' => 50000,
            'payment_timeout_hours' => 24,
            'reservation_hours' => 24,
            'min_product_price_threshold' => 100000,
            'max_product_price_threshold' => 100000000,
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($defaults, $settings),
        ]);
    }

    public function exportSalesReport(Request $request, \App\Services\Export\SalesReportExporter $exporter)
    {
        return $exporter->export($request);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'bank_accounts' => ['required', 'string'],
            'shipping_flat_cost' => ['required', 'numeric', 'min:0'],
            'payment_timeout_hours' => ['required', 'integer', 'min:1', 'max:168'],
            'reservation_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'min_product_price_threshold' => ['nullable', 'numeric', 'min:0'],
            'max_product_price_threshold' => ['nullable', 'numeric', 'min:0'],
        ]);

        $oldSettings = Setting::whereIn('key', array_keys($validated))->pluck('value', 'key')->toArray();

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
        }

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_UPDATE_STORE_SETTINGS',
            'target_type' => 'setting',
            'target_id' => 'store_config',
            'old_value' => $oldSettings,
            'new_value' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan toko berhasil diperbarui oleh SPI.',
            'data' => $validated,
        ]);
    }
}
