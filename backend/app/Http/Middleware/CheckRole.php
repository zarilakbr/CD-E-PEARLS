<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan masuk terlebih dahulu untuk mengakses layanan ini.',
                'error' => 'UNAUTHENTICATED',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Account active / freeze check
        if (! $user->isActive()) {
            $msg = $user->isFrozen()
                ? 'Akun Anda sedang dibekukan oleh SPI. Akses dinonaktifkan sementara.'
                : 'Akun Anda tidak aktif. Akses dinonaktifkan.';
            return response()->json([
                'success' => false,
                'message' => $msg,
                'error' => $user->isFrozen() ? 'ACCOUNT_FROZEN' : 'ACCOUNT_INACTIVE',
            ], Response::HTTP_FORBIDDEN);
        }

        // SPI can access any role route (including admin)
        if ($user->isSpi()) {
            return $next($request);
        }

        // Check if user has one of the allowed roles
        if (in_array($user->role, $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki hak akses untuk tindakan atau halaman ini.',
            'error' => 'FORBIDDEN',
            'required_roles' => $roles,
            'current_role' => $user->role,
        ], Response::HTTP_FORBIDDEN);
    }
}

