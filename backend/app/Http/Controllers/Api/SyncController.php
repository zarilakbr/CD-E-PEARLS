<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SyncController extends Controller
{
    /**
     * Lightweight role-based status sync endpoint for dashboards.
     * Supports ETag (If-None-Match) returning 304 Not Modified and updated_since query.
     */
    public function status(Request $request): JsonResponse|Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = $user->role;
        $updatedSince = $request->query('updated_since');

        $payload = [
            'role' => $role,
            'user_id' => $user->id,
            'server_time' => now()->toISOString(),
        ];

        if ($role === 'user') {
            // Strict IDOR isolation: Customer ONLY queries their own records
            $ordersQuery = Order::where('user_id', $user->id);

            $latestOrder = (clone $ordersQuery)
                ->latest('updated_at')
                ->first(['id', 'order_number', 'order_status', 'payment_status', 'tracking_number', 'courier', 'updated_at']);

            $activeCount = (clone $ordersQuery)
                ->whereIn('order_status', ['PROCESSING', 'SHIPPED', 'READY_TO_SHIP', 'Dikemas', 'Dikirim'])
                ->count();

            $pendingCount = (clone $ordersQuery)
                ->whereIn('order_status', ['PENDING', 'Menunggu Pembayaran'])
                ->count();

            $unreadNotif = Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->count();

            $payload['orders_count'] = (clone $ordersQuery)->count();
            $payload['active_orders_count'] = $activeCount;
            $payload['pending_payment_count'] = $pendingCount;
            $payload['latest_order'] = $latestOrder ? [
                'id' => $latestOrder->id,
                'order_number' => $latestOrder->order_number,
                'order_status' => $latestOrder->order_status,
                'payment_status' => $latestOrder->payment_status,
                'tracking_number' => $latestOrder->tracking_number,
                'courier' => $latestOrder->courier,
                'updated_at' => $latestOrder->updated_at?->toISOString(),
            ] : null;
            $payload['unread_notifications'] = $unreadNotif;
            $payload['max_updated_at'] = $latestOrder?->updated_at?->toISOString();

        } elseif ($role === 'admin') {
            // Admin Operational Overview
            $latestOrder = Order::latest('updated_at')->first(['updated_at']);
            $totalOrders = Order::count();
            $pendingOrders = Order::whereIn('order_status', ['PENDING', 'Menunggu Pembayaran'])->count();
            $processingOrders = Order::whereIn('order_status', ['PROCESSING', 'Dikemas'])->count();
            $lowStockCount = Product::where('stock', '<=', 2)->count();
            $pendingApprovals = Approval::where('status', 'pending')->count();

            $payload['total_orders'] = $totalOrders;
            $payload['pending_orders'] = $pendingOrders;
            $payload['processing_orders'] = $processingOrders;
            $payload['low_stock_count'] = $lowStockCount;
            $payload['pending_approvals_count'] = $pendingApprovals;
            $payload['max_updated_at'] = $latestOrder?->updated_at?->toISOString();

        } else {
            // SPI Supervisory Overview
            $todayRevenue = Order::whereDate('created_at', today())
                ->where('order_status', '!=', 'CANCELLED')
                ->sum('total');

            $pendingApprovals = Approval::where('status', 'pending')->count();
            $latestOrder = Order::latest('updated_at')->first(['updated_at']);
            $latestAudit = AuditLog::latest('id')->first(['id', 'created_at']);

            $ordersByStatus = Order::selectRaw('order_status, count(*) as count')
                ->groupBy('order_status')
                ->pluck('count', 'order_status')
                ->toArray();

            $payload['today_revenue'] = (float) $todayRevenue;
            $payload['pending_approvals_count'] = $pendingApprovals;
            $payload['orders_by_status'] = $ordersByStatus;
            $payload['latest_audit_id'] = $latestAudit?->id;
            $payload['max_updated_at'] = $latestOrder?->updated_at?->toISOString();
        }

        // Generate ETag based on serialized data payload (excluding current clock)
        $etagPayload = $payload;
        unset($etagPayload['server_time']);
        $etag = '"' . md5(json_encode($etagPayload)) . '"';

        // Check updated_since filter if provided
        if ($updatedSince && !empty($payload['max_updated_at'])) {
            if (strtotime($payload['max_updated_at']) <= strtotime($updatedSince)) {
                // No modification since specified time
                return response('', 304)
                    ->header('ETag', $etag)
                    ->header('Cache-Control', 'private, no-cache');
            }
        }

        // Check If-None-Match header
        $clientEtag = $request->header('If-None-Match');
        if ($clientEtag && trim($clientEtag, " \t\n\r\0\x0B\"") === trim($etag, " \t\n\r\0\x0B\"")) {
            return response('', 304)
                ->header('ETag', $etag)
                ->header('Cache-Control', 'private, no-cache');
        }

        return response()->json([
            'success' => true,
            'data' => $payload,
        ], 200)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, no-cache');
    }
}
