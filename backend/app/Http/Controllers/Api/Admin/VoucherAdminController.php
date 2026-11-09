<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VoucherAdminController extends Controller
{
    /**
     * List all vouchers (Admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Voucher::latest();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where('code', 'like', "%{$search}%");
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $vouchers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $vouchers->items(),
            'total' => $vouchers->total(),
            'current_page' => $vouchers->currentPage(),
            'last_page' => $vouchers->lastPage(),
        ]);
    }

    /**
     * Store new voucher (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code',
            'type' => 'required|in:fixed,percent',
            'value' => 'required|numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'min_spend' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ], [
            'code.required' => 'Kode voucher wajib diisi.',
            'code.unique' => 'Kode voucher sudah terdaftar dalam sistem.',
            'type.in' => 'Tipe voucher harus bernilai fixed (nominal tetap) atau percent (persentase).',
            'value.required' => 'Nilai potongan voucher wajib diisi.',
            'value.min' => 'Nilai potongan tidak boleh negatif.',
            'expires_at.after_or_equal' => 'Tanggal berakhir voucher tidak boleh mendahului tanggal mulai.',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['used_count'] = 0;

        $voucher = Voucher::create($validated);

        $actor = $request->user();
        AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Admin',
            'actor_role' => $actor?->role ?? 'admin',
            'action' => 'VOUCHER_CREATED',
            'target_type' => 'voucher',
            'target_id' => (string) $voucher->id,
            'new_value' => $voucher->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kode voucher '{$voucher->code}' berhasil ditambahkan ke sistem.",
            'data' => $voucher,
        ], Response::HTTP_CREATED);
    }

    /**
     * Show single voucher details.
     */
    public function show($id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $voucher,
        ]);
    }

    /**
     * Update voucher.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'type' => 'sometimes|required|in:fixed,percent',
            'value' => 'sometimes|required|numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'min_spend' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ], [
            'code.unique' => 'Kode voucher sudah terdaftar dalam sistem.',
            'type.in' => 'Tipe voucher harus bernilai fixed atau percent.',
            'value.min' => 'Nilai potongan tidak boleh negatif.',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $oldData = $voucher->toArray();
        $voucher->update($validated);

        $actor = $request->user();
        AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Admin',
            'actor_role' => $actor?->role ?? 'admin',
            'action' => 'VOUCHER_UPDATED',
            'target_type' => 'voucher',
            'target_id' => (string) $voucher->id,
            'old_value' => $oldData,
            'new_value' => $voucher->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Voucher '{$voucher->code}' berhasil diperbarui.",
            'data' => $voucher->fresh(),
        ]);
    }

    /**
     * Delete voucher.
     * Constraint: Tolak 409 jika voucher sudah pernah digunakan.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);

        // Tolak 409 jika sudah pernah digunakan dalam pesanan
        if ($voucher->used_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Voucher '{$voucher->code}' tidak dapat dihapus karena telah digunakan dalam riwayat pesanan pelanggan ({$voucher->used_count}x transaksi). Anda dapat menonaktifkannya.",
            ], Response::HTTP_CONFLICT);
        }

        $code = $voucher->code;
        $voucher->delete();

        $actor = $request->user();
        AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Admin',
            'actor_role' => $actor?->role ?? 'admin',
            'action' => 'VOUCHER_DELETED',
            'target_type' => 'voucher',
            'target_id' => (string) $id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Voucher '{$code}' berhasil dihapus dari sistem.",
        ]);
    }
}

