<?php

use App\Models\User;

test('rute lama /api/admin/products dan /api/spi/summary mengembalikan 404 setelah penghapusan alias non-v1', function () {
    $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    $spi = User::factory()->create(['role' => 'spi', 'status' => 'active']);

    $this->getJson('/api/admin/products')->assertStatus(404);
    $this->actingAs($admin)->getJson('/api/admin/products')->assertStatus(404);
    $this->actingAs($admin)->postJson('/api/admin/products', [])->assertStatus(404);

    $this->getJson('/api/spi/summary')->assertStatus(404);
    $this->actingAs($spi)->getJson('/api/spi/summary')->assertStatus(404);
    $this->actingAs($spi)->getJson('/api/spi/orders')->assertStatus(404);
    $this->actingAs($spi)->getJson('/api/spi/audit-logs')->assertStatus(404);
});
