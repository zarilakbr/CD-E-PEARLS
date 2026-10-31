<?php

use App\Models\Approval;
use App\Models\AuditFinding;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Category::create([
        'slug' => 'kalung',
        'name' => 'Kalung Mutiara',
        'is_active' => true,
    ]);
});

test('sensitive price increase above threshold creates spi approval and returns 202', function () {
    $admin = User::create([
        'name' => 'Admin Test',
        'email' => 'admin.price@cdepearls.com',
        'password' => Hash::make('Admin2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    $product = Product::create([
        'name' => 'Kalung Emas Mutiara Sire',
        'code' => 'PRD-TEST-001',
        'category_slug' => 'kalung',
        'price' => 10000000,
        'stock' => 5,
        'status' => 'published',
    ]);

    $token = $admin->createToken('test')->plainTextToken;

    // Price change: 10jt -> 14jt (+40%, > Rp 2jt threshold)
    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/v1/products/{$product->id}", [
            'price' => 14000000,
            'reason' => 'Harga lelang mutiara melonjak tajam',
        ]);

    $response->assertStatus(202)
        ->assertJson([
            'success' => true,
            'requires_approval' => true,
        ]);

    $this->assertDatabaseHas('approvals', [
        'type' => 'price_change',
        'status' => 'pending',
        'target_id' => (string) $product->id,
        'requester_id' => $admin->id,
    ]);

    // Ensure database price has NOT changed yet
    expect($product->fresh()->price)->toEqual(10000000);
});

test('four-eyes principle: requester cannot approve their own request', function () {
    $spi = User::create([
        'name' => 'Auditor SPI',
        'email' => 'spi.self@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $approval = Approval::create([
        'type' => 'price_change',
        'target_type' => 'product',
        'target_id' => '1',
        'title' => 'Test Self Approval',
        'requester_id' => $spi->id, // SPI requested it
        'status' => 'pending',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/v1/spi/approvals/{$approval->id}/approve");

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'SELF_APPROVAL_PROHIBITED',
        ]);
});

test('spi can approve pending request and execute action into database', function () {
    $admin = User::create([
        'name' => 'Admin Pengaju',
        'email' => 'admin.req@cdepearls.com',
        'password' => Hash::make('Admin2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    $spi = User::create([
        'name' => 'SPI Pemutus',
        'email' => 'spi.decider@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $product = Product::create([
        'name' => 'Cincin Emas Mutiara',
        'code' => 'PRD-TEST-002',
        'category_slug' => 'kalung',
        'price' => 5000000,
        'stock' => 3,
        'status' => 'published',
    ]);

    $approval = Approval::create([
        'type' => 'price_change',
        'target_type' => 'product',
        'target_id' => (string) $product->id,
        'title' => 'Kenaikan Harga Cincin',
        'old_value' => ['price' => 5000000],
        'new_value' => ['price' => 7500000],
        'requester_id' => $admin->id,
        'status' => 'pending',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/v1/spi/approvals/{$approval->id}/approve", [
            'reason' => 'Disetujui berdasarkan kenaikan sertifikasi gemologi',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    // Database must be updated now!
    expect($product->fresh()->price)->toEqual(7500000);
    expect($approval->fresh()->status)->toEqual('approved');
    expect($approval->fresh()->decider_id)->toEqual($spi->id);
});

test('spi rejection requires non-empty reason and updates status to rejected', function () {
    $admin = User::create([
        'name' => 'Admin Pengaju 2',
        'email' => 'admin.req2@cdepearls.com',
        'password' => Hash::make('Admin2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    $spi = User::create([
        'name' => 'SPI Pemutus 2',
        'email' => 'spi.decider2@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $approval = Approval::create([
        'type' => 'delete_product',
        'target_type' => 'product',
        'target_id' => '1',
        'title' => 'Hapus Koleksi Master',
        'requester_id' => $admin->id,
        'status' => 'pending',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    // Reject without reason fails
    $failResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/v1/spi/approvals/{$approval->id}/reject", []);

    $failResponse->assertStatus(422)
        ->assertJsonValidationErrors(['reason']);

    // Reject with valid reason succeeds
    $okResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/v1/spi/approvals/{$approval->id}/reject", [
            'reason' => 'Produk ini masih terikat dengan kontrak etalase butik Senggigi.',
        ]);

    $okResponse->assertStatus(200);
    expect($approval->fresh()->status)->toEqual('rejected');
    expect($approval->fresh()->reason)->toContain('kontrak etalase');
});

test('spi can create staff account with temporary password and force change password', function () {
    $spi = User::create([
        'name' => 'SPI HR Overseer',
        'email' => 'spi.hr@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/spi/staff', [
            'name' => 'Ahmad Kasir Butik',
            'email' => 'ahmad.kasir@cdepearls.com',
            'phone' => '08123488811',
            'role' => 'admin',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure(['temporary_password', 'user']);

    $createdStaff = User::where('email', 'ahmad.kasir@cdepearls.com')->first();
    expect($createdStaff)->not->toBeNull();
    expect($createdStaff->must_change_password)->toBeTrue();
    expect($createdStaff->status)->toEqual('active');
});

test('spi cannot freeze own account', function () {
    $spi = User::create([
        'name' => 'SPI Master',
        'email' => 'spi.master@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $token = $spi->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/v1/spi/staff/{$spi->id}/toggle-freeze");

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'CANNOT_FREEZE_SELF',
        ]);
});

test('spi freezing staff revokes tokens immediately', function () {
    $spi = User::create([
        'name' => 'SPI Admin Leader',
        'email' => 'spi.leader@cdepearls.com',
        'password' => Hash::make('SpiPass2026!'),
        'role' => 'spi',
        'status' => 'active',
    ]);

    $staff = User::create([
        'name' => 'Staf Berisiko',
        'email' => 'staf.risiko@cdepearls.com',
        'password' => Hash::make('StaffPass2026!'),
        'role' => 'admin',
        'status' => 'active',
    ]);

    // Give staff an active token
    $staffToken = $staff->createToken('session')->plainTextToken;
    expect($staff->tokens()->count())->toEqual(1);

    $spiToken = $spi->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$spiToken}")
        ->patchJson("/api/v1/spi/staff/{$staff->id}/toggle-freeze");

    $response->assertStatus(200);
    expect($staff->fresh()->status)->toEqual('frozen');
    expect($staff->tokens()->count())->toEqual(0); // All tokens revoked!
});

test('audit log is strictly append-only and prevents modification or deletion', function () {
    $log = AuditLog::create([
        'actor_name' => 'Security Test',
        'actor_role' => 'spi',
        'action' => 'TEST_APPEND_ONLY',
        'created_at' => now(),
    ]);

    // Attempt update -> RuntimeException
    expect(fn () => $log->update(['action' => 'TAMPERED']))
        ->toThrow(\RuntimeException::class);

    // Attempt delete -> RuntimeException
    expect(fn () => $log->delete())
        ->toThrow(\RuntimeException::class);
});
