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
        if (empty($token)) {
            // If in testing and enforce_in_testing is not enabled, allow other tests to pass
            if (app()->environment('testing') && ! config('services.turnstile.enforce_in_testing', false)) {
                return true;
            }
            return false;
        }

        $secret = config('services.turnstile.secret_key', env('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA'));

        if ($secret === 'disabled') {
            return true;
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
            // Fail closed as required
            return false;
        }
    }
}
