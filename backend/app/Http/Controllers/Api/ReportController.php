<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Export Real Sales Report as CSV.
     */
    public function exportSalesCsv(Request $request): StreamedResponse
    {
        $user = $request->user();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'EXPORT_SALES_REPORT',
            'target_type' => 'report',
            'target_id' => 'sales_csv',
            'old_value' => null,
            'new_value' => ['timestamp' => now()->toIso8601String()],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $filename = 'laporan-penjualan-cde-pearls-' . date('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($request) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Nomor Pesanan',
                'Tanggal',
                'Nama Pelanggan',
                'No. Telepon',
                'Metode Pembayaran',
                'Subtotal (IDR)',
                'Diskon (IDR)',
                'Asuransi (IDR)',
                'Ongkir (IDR)',
                'Total (IDR)',
                'Status Pembayaran',
                'Status Pesanan',
                'Kurir',
                'Nomor Resi',
            ]);

            $query = Order::query()->latest();

            if ($request->filled('payment_status')) {
                $query->where('payment_status', $request->payment_status);
            }
            if ($request->filled('order_status')) {
                $query->where('order_status', $request->order_status);
            }

            $query->chunk(100, function ($orders) use ($handle) {
                foreach ($orders as $order) {
                    fputcsv($handle, [
                        $order->order_number,
                        $order->created_at->format('Y-m-d H:i:s'),
                        $order->customer_name,
                        $order->customer_phone,
                        $order->payment_method,
                        $order->subtotal,
                        $order->discount,
                        $order->insurance_cost,
                        $order->shipping_cost,
                        $order->total,
                        $order->payment_status,
                        $order->order_status,
                        $order->courier,
                        $order->tracking_number,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Export Real Inventory & Stock Valuation Report as CSV.
     */
    public function exportInventoryCsv(Request $request): StreamedResponse
    {
        $user = $request->user();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'EXPORT_INVENTORY_REPORT',
            'target_type' => 'report',
            'target_id' => 'inventory_csv',
            'old_value' => null,
            'new_value' => ['timestamp' => now()->toIso8601String()],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $filename = 'laporan-stok-mutasi-cde-pearls-' . date('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Kode Produk',
                'Kategori',
                'Nama Perhiasan Mutiara',
                'Varietas',
                'Grade',
                'Logam',
                'Ukuran (mm)',
                'Berat',
                'Stok Fisik',
                'Harga Satuan (IDR)',
                'Total Nilai Aset (IDR)',
                'Status Katalog',
            ]);

            Product::with('category')->chunk(100, function ($products) use ($handle) {
                foreach ($products as $p) {
                    $totalAssetVal = $p->price * $p->stock;
                    fputcsv($handle, [
                        $p->code,
                        $p->category?->name ?? $p->category_slug,
                        $p->name,
                        $p->varietas,
                        $p->grade,
                        $p->logam,
                        $p->ukuran_mm,
                        $p->berat,
                        $p->stock,
                        $p->price,
                        $totalAssetVal,
                        $p->status,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}

