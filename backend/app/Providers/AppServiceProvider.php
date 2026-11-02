<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Production Guard (U-9): APP_DEBUG must never be true in production
        if (app()->environment('production') && config('app.debug')) {
            throw new \RuntimeException('FATAL SECURITY ERROR: APP_DEBUG cannot be true in production environment!');
        }

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Strict rate limit for orders (U-3) per user and per IP
        RateLimiter::for('orders', function (Request $request) {
            $user = $request->user();
            $key = $user ? 'user_'.$user->id : 'ip_'.$request->ip();
            return Limit::perMinutes(10, 5)->by($key);
        });
    }
}
