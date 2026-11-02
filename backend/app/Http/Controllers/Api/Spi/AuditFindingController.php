<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\AuditFinding;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditFindingController extends Controller
{
    /**
     * List audit findings with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditFinding::with('assignee:id,name,email,role')
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('severity') && $request->severity !== 'all') {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('recommendation', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);
        $findings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $findings->items(),
            'current_page' => $findings->currentPage(),
            'per_page' => $findings->perPage(),
            'total' => $findings->total(),
            'last_page' => $findings->lastPage(),
        ]);
    }

    /**
     * Store new audit finding.
     */
    public function store(Request $request): JsonResponse
    {
        $spi = $request->user();

        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'severity' => 'required|in:low,medium,high,critical',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'recommendation' => 'required|string',
            'assignee_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        // Auto-generate code e.g. AUD-2026-003
        $year = date('Y');
        $count = AuditFinding::whereYear('created_at', $year)->count() + 1;
        $code = sprintf('AUD-%s-%03d', $year, $count);

        $finding = AuditFinding::create([
            'code' => $code,
            'category' => $validated['category'],
            'severity' => $validated['severity'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'recommendation' => $validated['recommendation'],
            'assignee_id' => $validated['assignee_id'] ?? null,
            'status' => 'open',
            'due_date' => $validated['due_date'] ?? null,
        ]);

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'CREATE_AUDIT_FINDING',
            'target_type' => 'audit_finding',
            'target_id' => $code,
            'old_value' => null,
            'new_value' => [
                'code' => $code,
                'title' => $finding->title,
                'severity' => $finding->severity,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Temuan audit {$code} berhasil dicatatkan ke sistem pengawasan.",
            'data' => $finding->load('assignee'),
        ], Response::HTTP_CREATED);
    }

    /**
     * Update an audit finding.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $spi = $request->user();
        $finding = AuditFinding::findOrFail($id);

        $validated = $request->validate([
            'category' => 'sometimes|required|string|max:100',
            'severity' => 'sometimes|required|in:low,medium,high,critical',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'recommendation' => 'sometimes|required|string',
            'assignee_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|required|in:open,in_progress,resolved,closed',
            'due_date' => 'nullable|date',
        ]);

        $oldValues = $finding->only(['title', 'severity', 'status', 'assignee_id']);

        if (isset($validated['status']) && in_array($validated['status'], ['resolved', 'closed']) && ! $finding->resolved_at) {
            $validated['resolved_at'] = now();
        }

        $finding->update($validated);

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'UPDATE_AUDIT_FINDING',
            'target_type' => 'audit_finding',
            'target_id' => $finding->code,
            'old_value' => $oldValues,
            'new_value' => $finding->only(['title', 'severity', 'status', 'assignee_id']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Temuan audit {$finding->code} berhasil diperbarui.",
            'data' => $finding->fresh('assignee'),
        ]);
    }

    /**
     * Delete an audit finding.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $spi = $request->user();
        $finding = AuditFinding::findOrFail($id);
        $code = $finding->code;

        $finding->delete();

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'DELETE_AUDIT_FINDING',
            'target_type' => 'audit_finding',
            'target_id' => $code,
            'old_value' => ['code' => $code, 'title' => $finding->title],
            'new_value' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Temuan audit {$code} telah dihapus dari sistem pengawasan.",
        ]);
    }

    /**
     * Export findings as formatted downloadable report (CSV).
     */
    public function exportReport(Request $request): StreamedResponse
    {
        $query = AuditFinding::with('assignee')->orderBy('created_at', 'desc');

        $filename = 'cde_pearls_audit_findings_'.date('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'Kode Temuan',
                'Kategori',
                'Tingkat Urgensi (Severity)',
                'Judul Temuan Audit',
                'Uraian Kondisi & Masalah',
                'Rekomendasi Perbaikan SPI',
                'Penanggung Jawab',
                'Status Tindak Lanjut',
                'Batas Waktu (Due Date)',
                'Tanggal Selesai',
                'Tanggal Dicatat',
            ]);

            $query->chunk(100, function ($findings) use ($handle) {
                foreach ($findings as $f) {
                    fputcsv($handle, [
                        $f->code,
                        $f->category,
                        strtoupper($f->severity),
                        $f->title,
                        $f->description,
                        $f->recommendation,
                        $f->assignee ? $f->assignee->name : 'Belum Ditugaskan',
                        strtoupper($f->status),
                        $f->due_date ? $f->due_date->format('Y-m-d') : '-',
                        $f->resolved_at ? $f->resolved_at->format('Y-m-d') : '-',
                        $f->created_at ? $f->created_at->format('Y-m-d') : '-',
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}

