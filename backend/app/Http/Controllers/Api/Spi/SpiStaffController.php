<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SpiStaffController extends Controller
{
    /**
     * List all staff accounts (Admin and SPI).
     */
    public function index(Request $request): JsonResponse
    {
        $staff = User::whereIn('role', ['admin', 'spi'])
            ->orderByRaw("CASE WHEN role = 'spi' THEN 0 ELSE 1 END")
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Create new staff account with auto-generated temporary password.
     */
    public function store(Request $request): JsonResponse
    {
        $spi = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,spi',
        ], [
            'name.required' => 'Nama staf wajib diisi.',
            'email.required' => 'Email staf wajib diisi.',
            'email.unique' => 'Email ini sudah terdaftar sebagai pengguna sistem.',
            'role.in' => 'Peran staf harus Admin atau SPI.',
        ]);

        // Generate strong single-use temporary password: e.g. CdeStaff#2026xK9
        $temporaryPassword = 'Cde#'.Str::random(6).'9'.strtoupper(Str::random(2));

        $newStaff = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => 'active',
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => true,
            'email_verified_at' => now(),
        ]);

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'CREATE_STAFF_ACCOUNT',
            'target_type' => 'user',
            'target_id' => (string) $newStaff->id,
            'old_value' => null,
            'new_value' => [
                'name' => $newStaff->name,
                'email' => $newStaff->email,
                'role' => $newStaff->role,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun staf berhasil dibuat. Berikan kata sandi sementara ini kepada staf.',
            'user' => $newStaff,
            'temporary_password' => $temporaryPassword,
        ], Response::HTTP_CREATED);
    }

    /**
     * Toggle freeze/unfreeze status for a staff account.
     */
    public function toggleFreeze(Request $request, $id): JsonResponse
    {
        $spi = $request->user();
        $targetUser = User::findOrFail($id);

        // Security Rule 1: Cannot freeze own account
        if ($targetUser->id === $spi->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat membekukan akun Anda sendiri.',
                'error' => 'CANNOT_FREEZE_SELF',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Security Rule 2: Cannot freeze the last active SPI
        if ($targetUser->isSpi()) {
            $activeSpiCount = User::where('role', 'spi')->where('status', 'active')->count();
            if ($activeSpiCount <= 1 && $targetUser->status === 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat membekukan satu-satunya akun SPI aktif di sistem demi kelangsungan pengawasan.',
                    'error' => 'LAST_SPI_PROTECTION',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $newStatus = $targetUser->status === 'active' ? 'frozen' : 'active';
        $oldStatus = $targetUser->status;

        $targetUser->update(['status' => $newStatus]);

        // If frozen, revoke all tokens and active sessions immediately
        if ($newStatus === 'frozen') {
            $targetUser->tokens()->delete();
            DB::table('sessions')->where('user_id', $targetUser->id)->delete();
        }

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => $newStatus === 'frozen' ? 'FREEZE_STAFF_ACCOUNT' : 'UNFREEZE_STAFF_ACCOUNT',
            'target_type' => 'user',
            'target_id' => (string) $targetUser->id,
            'old_value' => ['status' => $oldStatus],
            'new_value' => ['status' => $newStatus],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $statusText = $newStatus === 'frozen' ? 'dibekukan' : 'diaktifkan kembali';

        return response()->json([
            'success' => true,
            'message' => "Akun staf {$targetUser->name} berhasil {$statusText}.",
            'user' => $targetUser->fresh(),
        ]);
    }

    /**
     * Reset staff password with single-use temporary password.
     */
    public function resetPassword(Request $request, $id): JsonResponse
    {
        $spi = $request->user();
        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $spi->id) {
            return response()->json([
                'success' => false,
                'message' => 'Untuk mengganti kata sandi sendiri, silakan gunakan menu Pengaturan Profil.',
                'error' => 'USE_SELF_PASSWORD_CHANGE',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $temporaryPassword = 'Cde#'.Str::random(6).'9'.strtoupper(Str::random(2));

        $targetUser->update([
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => true,
            'failed_logins' => 0,
            'locked_until' => null,
        ]);

        // Revoke active sessions
        $targetUser->tokens()->delete();
        DB::table('sessions')->where('user_id', $targetUser->id)->delete();

        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => $spi->role,
            'action' => 'RESET_STAFF_PASSWORD',
            'target_type' => 'user',
            'target_id' => (string) $targetUser->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diatur ulang. Staf wajib mengganti kata sandi saat login berikutnya.',
            'temporary_password' => $temporaryPassword,
        ]);
    }
}

