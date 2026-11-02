<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountNotFrozen
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && method_exists($user, 'isFrozen') && $user->isFrozen()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang dibekukan oleh SPI/Admin. Silakan hubungi layanan pelanggan.',
                'error' => 'ACCOUNT_FROZEN',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
