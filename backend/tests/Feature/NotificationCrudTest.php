<?php

use App\Models\Notification;
use App\Models\User;

beforeEach(function () {
    $this->userA = User::factory()->create([
        'role' => 'user',
        'must_change_password' => false,
    ]);

    $this->userB = User::factory()->create([
        'role' => 'user',
        'must_change_password' => false,
    ]);
});

test('1. Pelanggan dapat menghapus 1 notifikasi miliknya', function () {
    $notif = Notification::create([
        'user_id' => $this->userA->id,
        'type' => 'order_status',
        'title' => 'Pembayaran Berhasil',
        'message' => 'Pesanan #ORD-001 berhasil diverifikasi.',
    ]);

    $response = $this->actingAs($this->userA)->deleteJson("/api/v1/notifications/{$notif->id}");
    $response->assertStatus(200)
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('notifications', ['id' => $notif->id]);
});

test('2. Pelanggan DITOLAK 404 saat mencoba menghapus notifikasi milik orang lain (IDOR Protection)', function () {
    $notifB = Notification::create([
        'user_id' => $this->userB->id,
        'type' => 'order_status',
        'title' => 'Rahasia Pelanggan B',
        'message' => 'Notifikasi privat milik B.',
    ]);

    $response = $this->actingAs($this->userA)->deleteJson("/api/v1/notifications/{$notifB->id}");
    $response->assertStatus(404);

    $this->assertDatabaseHas('notifications', ['id' => $notifB->id]);
});

test('3. Pelanggan dapat membersihkan seluruh notifikasinya sekaligus', function () {
    Notification::create(['user_id' => $this->userA->id, 'type' => 'info', 'title' => 'Notif 1', 'message' => 'Pesan 1']);
    Notification::create(['user_id' => $this->userA->id, 'type' => 'info', 'title' => 'Notif 2', 'message' => 'Pesan 2']);
    $notifB = Notification::create(['user_id' => $this->userB->id, 'type' => 'info', 'title' => 'Notif B', 'message' => 'Pesan B']);

    $response = $this->actingAs($this->userA)->deleteJson('/api/v1/notifications');
    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('unread_count', 0);

    expect(Notification::where('user_id', $this->userA->id)->count())->toBe(0);
    // Notifikasi user B tidak terhapus
    $this->assertDatabaseHas('notifications', ['id' => $notifB->id]);
});

