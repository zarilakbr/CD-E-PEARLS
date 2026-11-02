<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\WhatsAppLead;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Comprehensive Admin Dashboard statistics & chart data.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $totalRevenue = Order::where('payment_status', 'PAID')->sum('total');
        $totalOrders = Order::count();
        $totalProducts = Product::where('status', 'published')->count();
        $totalStock = Product::where('status', 'published')->sum('stock');
        $pendingApprovals = Approval::where('status', 'pending')->count();

        $recentOrders = Order::with('items')->latest()->take(6)->get();
        $recentLeads = WhatsAppLead::with('product')->latest()->take(5)->get();

        // 7-day revenue trend
        $revenueTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $label = $date->translatedFormat('D, d M');

            $revenue = Order::where('payment_status', 'PAID')
                ->whereDate('created_at', $dateStr)
                ->sum('total');

            $ordersCount = Order::whereDate('created_at', $dateStr)->count();

            $revenueTrend[] = [
                'date' => $dateStr,
                'label' => $label,
                'revenue' => (float) $revenue,
                'orders_count' => $ordersCount,
            ];
        }

        // Category distribution
        $categoriesStats = Category::withCount(['products' => fn ($q) => $q->where('status', 'published')])->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_pearl_stock' => $totalStock,
                'pending_approvals' => $pendingApprovals,
                'revenue_trend' => $revenueTrend,
                'category_stats' => $categoriesStats,
                'recent_orders' => $recentOrders,
                'recent_leads' => $recentLeads,
            ],
        ]);
    }

    /**
     * List registered boutique customers.
     */
    public function customers(Request $request): JsonResponse
    {
        $query = User::where('role', 'user')
            ->with(['defaultAddress', 'addresses'])
            ->withCount('orders')
            ->withSum(['orders' => fn ($q) => $q->where('payment_status', 'PAID')], 'total')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $customers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'current_page' => $customers->currentPage(),
            'total' => $customers->total(),
            'last_page' => $customers->lastPage(),
        ]);
    }

    /**
     * Financial report breakdown.
     */
    public function financialReports(Request $request): JsonResponse
    {
        $totalPaidRevenue = Order::where('payment_status', 'PAID')->sum('total');
        $totalPendingRevenue = Order::where('payment_status', 'WAITING_PAYMENT')->sum('total');
        $averageOrderValue = Order::where('payment_status', 'PAID')->avg('total') ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_paid_revenue' => (float) $totalPaidRevenue,
                'total_pending_revenue' => (float) $totalPendingRevenue,
                'average_order_value' => round((float) $averageOrderValue),
            ],
        ]);
    }
}
