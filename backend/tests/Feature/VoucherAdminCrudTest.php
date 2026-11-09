<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Voucher;

beforeEach(function () {
    $this->admin = User::factory()->create([
        'role' => 'admin',
        'must_change_password' => false,
    ]);

    $this->customer = User::factory()->create([
        'role' => 'user',
        'must_change_password' => false,
    ]);
});

test('1. Tamu ditolak 401 saat mengakses rute voucher admin', function () {
    $this->getJson('/api/v1/admin/vouchers')->assertStatus(401);
    $this->postJson('/api/v1/admin/vouchers', ['code' => 'DISC10'])->assertStatus(401);
    $this->deleteJson('/api/v1/admin/vouchers/1')->assertStatus(401);
});

test('2. Pelanggan biasa ditolak 403 saat mengakses rute voucher admin', function () {
    $this->actingAs($this->customer)->getJson('/api/v1/admin/vouchers')->assertStatus(403);
    $this->actingAs($this->customer)->postJson('/api/v1/admin/vouchers', ['code' => 'DISC10'])->assertStatus(403);
    $this->actingAs($this->customer)->deleteJson('/api/v1/admin/vouchers/1')->assertStatus(403);
});

test('3. Admin berhasil membuat voucher baru dengan audit log', function () {
    $payload = [
        'code' => 'MUTIARA2026',
        'type' => 'fixed',
        'value' => 150000,
        'quota' => 50,
        'min_spend' => 1000000,
        'starts_at' => now()->toISOString(),
        'expires_at' => now()->addMonths(1)->toISOString(),
        'is_active' => true,
    ];

    $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/vouchers', $payload);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.code', 'MUTIARA2026')
        ->assertJsonPath('data.value', 150000);

    $this->assertDatabaseHas('vouchers', [
        'code' => 'MUTIARA2026',
        'value' => 150000,
        'quota' => 50,
        'used_count' => 0,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->admin->id,
        'action' => 'VOUCHER_CREATED',
    ]);
});

test('4. Validasi voucher admin: kode duplikat dan nilai negatif ditolak 422', function () {
    Voucher::create([
        'code' => 'KEMBAR100',
        'type' => 'fixed',
        'value' => 100000,
    ]);

    // Duplikat kode
    $resDup = $this->actingAs($this->admin)->postJson('/api/v1/admin/vouchers', [
        'code' => 'kembar100', // case insensitive duplicate
        'type' => 'fixed',
        'value' => 50000,
    ]);
    $resDup->assertStatus(422)->assertJsonValidationErrors(['code']);

    // Nilai negatif
    $resNeg = $this->actingAs($this->admin)->postJson('/api/v1/admin/vouchers', [
        'code' => 'MINUS50',
        'type' => 'fixed',
        'value' => -50000,
    ]);
    $resNeg->assertStatus(422)->assertJsonValidationErrors(['value']);
});

test('5. Admin dapat melihat daftar dan detail voucher', function () {
    $voucher = Voucher::create([
        'code' => 'DETAIL10',
        'type' => 'percent',
        'value' => 10,
        'quota' => 20,
    ]);

    $resIndex = $this->actingAs($this->admin)->getJson('/api/v1/admin/vouchers');
    $resIndex->assertStatus(200)
        ->assertJsonPath('success', true);

    $resShow = $this->actingAs($this->admin)->getJson("/api/v1/admin/vouchers/{$voucher->id}");
    $resShow->assertStatus(200)
        ->assertJsonPath('data.code', 'DETAIL10')
        ->assertJsonPath('data.value', 10);
});

test('6. Admin berhasil memperbarui voucher', function () {
    $voucher = Voucher::create([
        'code' => 'UPDATEABLE',
        'type' => 'fixed',
        'value' => 75000,
        'quota' => 10,
    ]);

    $resUpdate = $this->actingAs($this->admin)->putJson("/api/v1/admin/vouchers/{$voucher->id}", [
        'value' => 100000,
        'quota' => 25,
        'is_active' => false,
    ]);

    $resUpdate->assertStatus(200)
        ->assertJsonPath('data.value', 100000)
        ->assertJsonPath('data.quota', 25)
        ->assertJsonPath('data.is_active', false);

    expect($voucher->fresh()->value)->toBe(100000.0);
    expect($voucher->fresh()->is_active)->toBe(false);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->admin->id,
        'action' => 'VOUCHER_UPDATED',
        'target_id' => (string) $voucher->id,
    ]);
});

test('7. Admin berhasil menghapus voucher yang belum terpakai', function () {
    $voucher = Voucher::create([
        'code' => 'UNUSEDVOUCHER',
        'type' => 'fixed',
        'value' => 50000,
        'used_count' => 0,
    ]);

    $resDelete = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/vouchers/{$voucher->id}");
    $resDelete->assertStatus(200)
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('vouchers', ['id' => $voucher->id]);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->admin->id,
        'action' => 'VOUCHER_DELETED',
    ]);
});

test('8. Admin DITOLAK 409 saat menghapus voucher yang sudah pernah digunakan dalam transaksi', function () {
    $voucher = Voucher::create([
        'code' => 'USEDVOUCHER',
        'type' => 'fixed',
        'value' => 100000,
        'used_count' => 3, // Sudah terpakai 3 kali
    ]);

    $resDelete = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/vouchers/{$voucher->id}");
    $resDelete->assertStatus(409);
    expect($resDelete->json('message'))->toContain('tidak dapat dihapus karena telah digunakan');

    // Voucher tetap ada di database
    $this->assertDatabaseHas('vouchers', ['id' => $voucher->id]);
});

