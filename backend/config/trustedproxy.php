<?php

/**
 * Cloudflare & Custom Reverse Proxy Configuration
 *
 * Source:
 *   - IPv4: https://www.cloudflare.com/ips-v4
 *   - IPv6: https://www.cloudflare.com/ips-v6
 * Retrieval Date: November 2026
 *
 * Update Instructions:
 *   To update these ranges periodically or upon Cloudflare announcements, run:
 *     curl -s https://www.cloudflare.com/ips-v4
 *     curl -s https://www.cloudflare.com/ips-v6
 *   and update the array below. Do NOT trust wildcard '*' in production to prevent IP spoofing.
 */

$cloudflareProxies = [
    // Cloudflare IPv4
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    // Cloudflare IPv6
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
];

$isTesting = in_array(($_SERVER['APP_ENV'] ?? $_ENV['APP_ENV'] ?? getenv('APP_ENV')), ['testing', 'dusk.testing'], true);
$trustCloudflare = $isTesting
    ? true
    : filter_var(env('TRUST_CLOUDFLARE_PROXIES', env('CLOUDFLARE_TRUST_PROXIES', true)), FILTER_VALIDATE_BOOLEAN);
$customProxiesRaw = (string) env('TRUSTED_PROXIES', '');

$proxies = [];
if ($trustCloudflare) {
    $proxies = array_merge($proxies, $cloudflareProxies);
}

if (! empty($customProxiesRaw)) {
    $custom = array_filter(array_map('trim', explode(',', $customProxiesRaw)));
    $proxies = array_merge($proxies, $custom);
}

return [
    'trust_cloudflare' => $trustCloudflare,
    'proxies' => array_values(array_unique($proxies)),
];
