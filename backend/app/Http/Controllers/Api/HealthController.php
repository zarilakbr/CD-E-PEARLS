<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Public system health check endpoint.
     * Returns server status only.
     */
    public function check(): JsonResponse
    {
        $isHealthy = true;

        try {
            DB::select('SELECT 1');
        } catch (\Throwable $e) {
            $isHealthy = false;
        }

        return response()->json([
            'status' => $isHealthy ? 'ok' : 'degraded',
        ], $isHealthy ? 200 : 503);
    }
}
