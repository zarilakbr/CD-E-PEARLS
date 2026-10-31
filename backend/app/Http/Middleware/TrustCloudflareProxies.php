<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrustCloudflareProxies
{
    /**
     * Resolve actual client IP behind Cloudflare or reverse proxy.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($cfIp = $request->header('CF-Connecting-IP')) {
            $request->server->set('REMOTE_ADDR', $cfIp);
        }

        return $next($request);
    }
}

