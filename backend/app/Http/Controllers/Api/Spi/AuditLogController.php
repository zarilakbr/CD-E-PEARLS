<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * List immutable audit logs with search, filter, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('actor:id,name,email,role')
            ->orderBy('created_at', 'desc');

        if ($request->filled('actor_role') && $request->actor_role !== 'all') {
            $query->where('actor_role', $request->actor_role);
        }

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('actor_name', 'like', "%{$search}%")
                    ->orWhere('target_id', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = (int) $request->input('per_page', 15);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'current_page' => $logs->currentPage(),
            'per_page' => $logs->perPage(),
            'total' => $logs->total(),
            'last_page' => $logs->lastPage(),
        ]);
    }

    /**
     * Real CSV Export for Audit Logs.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $query = AuditLog::orderBy('created_at', 'desc');

        if ($request->filled('actor_role') && $request->actor_role !== 'all') {
            $query->where('actor_role', $request->actor_role);
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $filename = 'cde_pearls_audit_logs_'.date('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Waktu (WITA/UTC)',
                'Nama Pelaku',
                'Peran',
                'Aksi Sistem',
                'Target Entitas',
                'ID Target',
                'Nilai Lama (JSON)',
                'Nilai Baru (JSON)',
                'Alamat IP',
                'User Agent',
            ]);

            $query->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->created_at ? $log->created_at->toIso8601String() : '',
                        $log->actor_name ?? '-',
                        strtoupper($log->actor_role ?? '-'),
                        $log->action,
                        $log->target_type ?? '-',
                        $log->target_id ?? '-',
                        $log->old_value ? json_encode($log->old_value, JSON_UNESCAPED_UNICODE) : '-',
                        $log->new_value ? json_encode($log->new_value, JSON_UNESCAPED_UNICODE) : '-',
                        $log->ip_address ?? '-',
                        $log->user_agent ?? '-',
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}

