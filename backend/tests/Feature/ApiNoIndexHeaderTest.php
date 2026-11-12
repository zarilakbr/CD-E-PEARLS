<?php

test('1. Endpoint API publik dan health mengirim header X-Robots-Tag noindex', function () {
    $health = $this->getJson('/api/v1/health');
    $health->assertStatus(200);
    $health->assertHeader('X-Robots-Tag', 'noindex');

    $products = $this->getJson('/api/v1/products');
    $products->assertStatus(200);
    $products->assertHeader('X-Robots-Tag', 'noindex');
});

test('2. Endpoint API 404 juga mengirim header X-Robots-Tag noindex', function () {
    $notFound = $this->getJson('/api/v1/products/99999999');
    $notFound->assertStatus(404);
    $notFound->assertHeader('X-Robots-Tag', 'noindex');
});

