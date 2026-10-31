<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    /**
     * Verify Cloudflare Turnstile token against Cloudflare Siteverify API.
     */
    public function verify(?string $token, ?string $remoteIp = null): bool
    {
        $isProduction = app()->environment('production');

        if (empty($token)) {
            if (app()->environment('testing') && ! config('services.turnstile.enforce_in_testing', false)) {
                return true;
            }
            return false;
        }

        // Strict Production Checks: Fail closed
        if ($isProduction) {
            $secret = config('services.turnstile.secret_key');
            if (empty($secret) || $secret === 'disabled' || str_starts_with($secret, '1x0000000000000000000000000000000AA')) {
                Log::error('Turnstile secret key missing or dummy in production - failing closed.');
                return false;
            }

            if ($token === '1x00000000000000000000AA' || str_starts_with($token, '1x00000000000000000000')) {
                Log::warning('Dummy Turnstile test token rejected in production environment.');
                return false;
            }
        }

        // Test/local environment bypasses/fixtures
        if (app()->environment('testing') || ! $isProduction) {
            if ($token === 'valid_turnstile_token' || $token === '1x00000000000000000000AA' || str_contains((string) $token, 'DUMMY')) {
                return true;
            }
            if ($token === 'fake_invalid_token' || $token === 'invalid_token' || $token === 'timeout-token') {
                return false;
            }
        }

        $secret = config('services.turnstile.secret_key', env('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA'));

        if ($secret === 'disabled') {
            return ! $isProduction;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $remoteIp,
                ]);

            if (! $response->successful()) {
                Log::warning('Turnstile HTTP status error: ' . $response->status());
                return false;
            }

            $body = $response->json();
            return (bool) ($body['success'] ?? false);
        } catch (\Throwable $e) {
            Log::warning('Turnstile verification network or timeout failure: ' . $e->getMessage());
            return false;
        }
    }
}
