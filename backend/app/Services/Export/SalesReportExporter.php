<?php

namespace App\Services\Export;

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SalesReportExporter
{
    /**
     * Sanitasi formula injection untuk proteksi spreadsheet (awali kutip tunggal jika dimulai =, +, -, @).
     */
    private function sanitizeValue(mixed $value): mixed
    {
        if (is_string($value) && $value !== '') {
            $firstChar = $value[0];
            if (in_array($firstChar, ['=', '+', '-', '@'], true)) {
                return "'".$value;
            }
        }

        return $value;
    }

    /**
     * Generate file Excel laporan penjualan dengan 3 Sheet: Ringkasan, Rincian Pesanan, Rincian Barang.
     */
    public function export(Request $request): BinaryFileResponse
    {
        // Support token in query for direct download links if header not present
        if (!$request->user() && $request->filled('token')) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->token);
            if ($accessToken && $accessToken->tokenable && $accessToken->tokenable->role === 'spi') {
                \Illuminate\Support\Facades\Auth::setUser($accessToken->tokenable);
            }
        }

        $user = $request->user();
        if (!$user || $user->role !== 'spi') {
            abort(403, 'Akses khusus Satuan Pengawas Internal (SPI).');
        }

        // 1. Filter parameters
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : null;
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : null;
        $status = $request->filled('status') && $request->status !== 'all' ? $request->status : null;
        $category = $request->filled('category') && $request->category !== 'all' ? $request->category : null;

        // 2. Query Orders
        $orderQuery = Order::with(['items.product', 'user']);

        if ($startDate && $endDate) {
            $orderQuery->whereBetween('created_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $orderQuery->where('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $orderQuery->where('created_at', '<=', $endDate);
        }

        if ($status) {
            $orderQuery->where('order_status', $status);
        }

        if ($category) {
            $orderQuery->whereHas('items.product', function ($q) use ($category) {
                $q->where('category_slug', $category);
            });
        }

        $orders = $orderQuery->orderBy('id', 'desc')->get();

        // 3. Setup Temp File & OpenSpout Writer
        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $filename = 'Laporan_Penjualan_CDE_Pearls_' . Carbon::now()->format('Ymd_His') . '.xlsx';
        $filePath = $tempDir . '/' . $filename;

        $options = new Options();
        $writer = new Writer($options);
        $writer->openToFile($filePath);

        $boldStyle = (new Style())->withFontBold(true);

        // =========================================================================
        // SHEET 1: RINGKASAN
        // =========================================================================
        $sheet1 = $writer->getCurrentSheet();
        $sheet1->setName('Ringkasan');

        // Judul & Metadata Laporan
        $writer->addRow(new Row([Cell::fromValue("LAPORAN PENJUALAN RESMI CD'E PEARLS LOMBOK", $boldStyle)]));
        $writer->addRow(Row::fromValues(['Waktu Ekspor', Carbon::now()->format('Y-m-d H:i:s')]));
        $writer->addRow(Row::fromValues(['Diekspor Oleh', ($user ? $user->name : 'Satuan Pengawas Internal') . ' (' . ($user ? $user->email : 'SPI') . ')']));
        $writer->addRow(Row::fromValues(['Filter Rentang Tanggal', ($startDate ? $startDate->format('Y-m-d') : 'Awal') . ' s/d ' . ($endDate ? $endDate->format('Y-m-d') : 'Hari Ini')]));
        $writer->addRow(Row::fromValues(['Filter Status Pesanan', $status ?: 'Semua Status']));
        $writer->addRow(Row::fromValues(['Filter Kategori Produk', $category ?: 'Semua Kategori']));
        $writer->addRow(Row::fromValues([])); // Blank spacer

        // Perhitungan Agregat (hanya pesanan valid yang tidak dibatalkan untuk omzet riil)
        $validOrders = $orders->where('order_status', '!=', 'CANCELLED');
        $totalOmzet = (float) $validOrders->sum('total');
        $totalOrdersCount = $orders->count();
        $completedOrdersCount = $orders->where('order_status', 'COMPLETED')->count();
        $cancelledOrdersCount = $orders->where('order_status', 'CANCELLED')->count();
        $averageOrderValue = $validOrders->count() > 0 ? (float) ($totalOmzet / $validOrders->count()) : 0.0;

        $totalItemsSold = 0;
        foreach ($validOrders as $ord) {
            foreach ($ord->items as $it) {
                if (!$category || ($it->product && $it->product->category_slug === $category)) {
                    $totalItemsSold += (int) $it->quantity;
                }
            }
        }

        // Header Ringkasan Metrik
        $summaryHeaders = ['Indikator Metrik Kinerja', 'Nilai Angka / Hasil'];
        $writer->addRow(new Row(array_map(fn($h) => Cell::fromValue($h, $boldStyle), $summaryHeaders)));

        $writer->addRow(Row::fromValues(['Total Omzet Penjualan Sah (Rp)', $totalOmzet]));
        $writer->addRow(Row::fromValues(['Total Transaksi Pesanan', $totalOrdersCount]));
        $writer->addRow(Row::fromValues(['Pesanan Selesai (COMPLETED)', $completedOrdersCount]));
        $writer->addRow(Row::fromValues(['Pesanan Dibatalkan (CANCELLED)', $cancelledOrdersCount]));
        $writer->addRow(Row::fromValues(['Rata-rata Nilai Pesanan / AOV (Rp)', $averageOrderValue]));
        $writer->addRow(Row::fromValues(['Total Kuantitas Mutiara Terjual (Unit)', $totalItemsSold]));

        // =========================================================================
        // SHEET 2: RINCIAN PESANAN
        // =========================================================================
        $sheet2 = $writer->addNewSheetAndMakeItCurrent();
        $sheet2->setName('Rincian Pesanan');

        $orderHeaders = [
            'No. Pesanan',
            'Tanggal Transaksi',
            'Nama Pelanggan',
            'Nomor Telepon',
            'Alamat Pengiriman',
            'Status Pesanan',
            'Status Pembayaran',
            'Metode Pembayaran',
            'Subtotal (Rp)',
            'Ongkir (Rp)',
            'Diskon (Rp)',
            'Total Transaksi (Rp)',
        ];
        $writer->addRow(new Row(array_map(fn($h) => Cell::fromValue($h, $boldStyle), $orderHeaders)));

        foreach ($orders as $ord) {
            $writer->addRow(Row::fromValues([
                $this->sanitizeValue($ord->order_number),
                $ord->created_at ? Carbon::parse($ord->created_at)->format('Y-m-d H:i') : '-',
                $this->sanitizeValue($ord->customer_name),
                $this->sanitizeValue($ord->customer_phone ?: '-'),
                $this->sanitizeValue($ord->customer_address ?: '-'),
                $this->sanitizeValue($ord->order_status),
                $this->sanitizeValue($ord->payment_status),
                $this->sanitizeValue($ord->payment_method),
                (float) ($ord->subtotal ?? 0),
                (float) ($ord->shipping_cost ?? 0),
                (float) ($ord->discount ?? 0),
                (float) ($ord->total ?? 0),
            ]));
        }

        // =========================================================================
        // SHEET 3: RINCIAN BARANG
        // =========================================================================
        $sheet3 = $writer->addNewSheetAndMakeItCurrent();
        $sheet3->setName('Rincian Barang');

        $itemHeaders = [
            'No. Pesanan',
            'Tanggal Transaksi',
            'Kode SKU',
            'Nama Produk Mutiara',
            'Kategori',
            'Varietas Mutiara',
            'Grade Mutiara',
            'Ukuran (mm)',
            'Harga Satuan (Rp)',
            'Jumlah Terjual',
            'Subtotal Barang (Rp)',
        ];
        $writer->addRow(new Row(array_map(fn($h) => Cell::fromValue($h, $boldStyle), $itemHeaders)));

        foreach ($orders as $ord) {
            foreach ($ord->items as $item) {
                $prod = $item->product;
                if ($category && $prod && $prod->category_slug !== $category) {
                    continue;
                }

                $writer->addRow(Row::fromValues([
                    $this->sanitizeValue($ord->order_number),
                    $ord->created_at ? Carbon::parse($ord->created_at)->format('Y-m-d H:i') : '-',
                    $this->sanitizeValue($prod ? $prod->code : '-'),
                    $this->sanitizeValue($item->product_name),
                    $this->sanitizeValue($prod ? $prod->category_slug : '-'),
                    $this->sanitizeValue($prod ? ($prod->pearl_variety ?: 'South Sea') : '-'),
                    $this->sanitizeValue($prod ? ($prod->pearl_grade ?: '-') : '-'),
                    $this->sanitizeValue($prod ? ($prod->pearl_size ?: '-') : '-'),
                    (float) ($item->price ?? 0),
                    (int) ($item->quantity ?? 1),
                    (float) ($item->subtotal ?? (($item->price ?? 0) * ($item->quantity ?? 1))),
                ]));
            }
        }

        $writer->close();

        // 4. Catat Audit Log Ekspor
        AuditLog::create([
            'actor_id' => $user ? $user->id : 0,
            'actor_name' => $user ? $user->name : 'Satuan Pengawas Internal',
            'actor_role' => $user ? $user->role : 'spi',
            'action' => 'SPI_EXPORT_SALES_REPORT',
            'target_type' => 'report',
            'target_id' => $filename,
            'old_value' => null,
            'new_value' => [
                'filename' => $filename,
                'total_orders' => $totalOrdersCount,
                'total_omzet' => $totalOmzet,
                'filter_status' => $status,
                'filter_category' => $category,
                'filter_start_date' => $startDate ? $startDate->format('Y-m-d') : null,
                'filter_end_date' => $endDate ? $endDate->format('Y-m-d') : null,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ])->deleteFileAfterSend(true);
    }
}
