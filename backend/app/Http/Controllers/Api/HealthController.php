<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Public system health check endpoint.
     * Returns status and response latency in milliseconds.
     */
    public function check(): JsonResponse
    {
        $startTime = microtime(true);
        $dbStatus = 'ok';

        try {
            DB::select('SELECT 1');
        } catch (\Throwable $e) {
            $dbStatus = 'disconnected';
        }

        $durationMs = round((microtime(true) - $startTime) * 1000, 2);
        $isHealthy = $dbStatus === 'ok';

        return response()->json([
            'status' => $isHealthy ? 'ok' : 'degraded',
            'ms' => $durationMs,
            'database' => $dbStatus,
            'timestamp' => now()->toIso8601String(),
        ], $isHealthy ? 200 : 503);
    }
}
