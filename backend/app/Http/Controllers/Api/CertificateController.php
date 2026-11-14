<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends Controller
{
    /**
     * List all certificates with pagination & search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Certificate::withCount('products')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor', 'like', "%{$search}%")
                    ->orWhere('lab', 'like', "%{$search}%")
                    ->orWhere('grade', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $certificates = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $certificates->items(),
            'total' => $certificates->total(),
            'current_page' => $certificates->currentPage(),
            'last_page' => $certificates->lastPage(),
        ]);
    }

    /**
     * Public lookup to verify gemological certificate authenticity.
     */
    public function lookup(Request $request, $code): JsonResponse
    {
        $certificate = Certificate::with(['products' => fn ($q) => $q->where('status', 'published')])
            ->where('nomor', $code)
            ->whereNotNull('pdf_path')
            ->where('pdf_path', '!=', '')
            ->first();

        if (! $certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Sertifikat keaslian gemologi tidak ditemukan dalam arsip resmi CD\'E Pearls Lombok atau belum memiliki berkas terverifikasi.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sertifikat keaslian gemologi terverifikasi resmi.',
            'data' => $certificate,
        ]);
    }

    /**
     * Admin store new certificate with PDF upload.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nomor' => 'required|string|max:100|unique:certificates,nomor',
            'lab' => 'required|string|max:100', // e.g. Lembaga Gemologi Indonesia
            'grade' => 'required|string|max:20', // AAA, AA+
            'ukuran' => 'required|string|max:50', // 11.8 mm
            'tanggal' => 'required|date',
            'pdf_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
            'pdf_path' => [
                'nullable',
                'string',
                'max:500',
                function ($attribute, $value, $fail) {
                    if (str_contains($value, '..') || str_contains($value, "\0") || str_contains($value, '\\')) {
                        $fail('Jalur berkas tidak boleh mengandung path traversal (..).');
                        return;
                    }
                    if (! str_starts_with($value, '/storage/certificates/') && ! str_starts_with($value, 'https://')) {
                        $fail('Jalur PDF sertifikat harus berupa tautan aman https:// atau berkas resmi /storage/certificates/.');
                    }
                },
            ],
        ]);

        $pdfPath = $validated['pdf_path'] ?? null;
        if ($request->hasFile('pdf_file')) {
            $file = $request->file('pdf_file');
            $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
            $filename = 'cert_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $validated['nomor']) . '_' . time() . '.' . $ext;
            $pdfPath = $file->storeAs('certificates', $filename, 'public');
        }

        $certificate = Certificate::create([
            'nomor' => $validated['nomor'],
            'lab' => $validated['lab'],
            'grade' => $validated['grade'],
            'ukuran' => $validated['ukuran'],
            'tanggal' => $validated['tanggal'],
            'pdf_path' => $pdfPath ? ('/storage/' . $pdfPath) : null,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'CREATE_CERTIFICATE',
            'target_type' => 'certificate',
            'target_id' => $certificate->nomor,
            'old_value' => null,
            'new_value' => ['nomor' => $certificate->nomor, 'lab' => $certificate->lab, 'grade' => $certificate->grade],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sertifikat gemologi berhasil didaftarkan.',
            'data' => $certificate,
        ], Response::HTTP_CREATED);
    }

    /**
     * Admin update certificate.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $certificate = Certificate::findOrFail($id);

        $validated = $request->validate([
            'nomor' => "sometimes|required|string|max:100|unique:certificates,nomor,{$certificate->id}",
            'lab' => 'sometimes|required|string|max:100',
            'grade' => 'sometimes|required|string|max:20',
            'ukuran' => 'sometimes|required|string|max:50',
            'tanggal' => 'sometimes|required|date',
            'pdf_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'pdf_path' => [
                'nullable',
                'string',
                'max:500',
                function ($attribute, $value, $fail) {
                    if (str_contains($value, '..') || str_contains($value, "\0") || str_contains($value, '\\')) {
                        $fail('Jalur berkas tidak boleh mengandung path traversal (..).');
                        return;
                    }
                    if (! str_starts_with($value, '/storage/certificates/') && ! str_starts_with($value, 'https://')) {
                        $fail('Jalur PDF sertifikat harus berupa tautan aman https:// atau berkas resmi /storage/certificates/.');
                    }
                },
            ],
        ]);

        if ($request->hasFile('pdf_file')) {
            $file = $request->file('pdf_file');
            $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
            $filename = 'cert_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $certificate->nomor) . '_' . time() . '.' . $ext;
            $pdfPath = $file->storeAs('certificates', $filename, 'public');
            $validated['pdf_path'] = '/storage/' . $pdfPath;
        }

        unset($validated['pdf_file']);
        $old = $certificate->toArray();
        $certificate->update($validated);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'UPDATE_CERTIFICATE',
            'target_type' => 'certificate',
            'target_id' => $certificate->nomor,
            'old_value' => $old,
            'new_value' => $certificate->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sertifikat gemologi berhasil diperbarui.',
            'data' => $certificate,
        ]);
    }

    /**
     * Admin delete certificate.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $certificate = Certificate::findOrFail($id);

        $old = $certificate->toArray();
        $certificate->delete();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'DELETE_CERTIFICATE',
            'target_type' => 'certificate',
            'target_id' => $certificate->nomor,
            'old_value' => $old,
            'new_value' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sertifikat berhasil dihapus dari sistem.',
        ]);
    }
}

