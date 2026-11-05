<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    /**
     * Exempt routes that a user with must_change_password may still access
     * to fulfill the password change requirement or safely log out.
     */
    protected array $except = [
        'api/v1/auth/password',
        'api/v1/auth/me',
        'api/v1/auth/logout',
        'api/v1/auth/providers',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! empty($user->must_change_password)) {
            foreach ($this->except as $except) {
                if ($request->is($except)) {
                    return $next($request);
                }
            }

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'MUST_CHANGE_PASSWORD',
                    'message' => 'Anda wajib memperbarui kata sandi akun sebelum dapat mengakses fitur lain.',
                    'must_change_password' => true,
                    'redirect' => '/auth/change-password',
                ], Response::HTTP_FORBIDDEN);
            }

            return redirect()->guest('/auth/change-password');
        }

        return $next($request);
    }
}

