<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\Spi\ApprovalController;
use App\Http\Controllers\Api\Spi\AuditFindingController;
use App\Http\Controllers\Api\Spi\AuditLogController;
use App\Http\Controllers\Api\Spi\SpiStaffController;
use App\Http\Controllers\Api\Spi\SpiSummaryController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CD'E Pearls Lombok API v1 Routes
|--------------------------------------------------------------------------
| All API endpoints are organized under /api/v1 with single source of truth,
| zero duplicate routes, strict rate limiting, and RBAC middleware.
*/

Route::prefix('v1')->group(function () {
    // 1. Public Authentication, OAuth & Password Management
    Route::prefix('auth')->group(function () {
        Route::get('/providers', [AuthController::class, 'providers']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']); // Safe logout for all states
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
        Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
        Route::get('/google/callback', [AuthController::class, 'googleCallback']);
    });

    // 2. Public Catalog & Content
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/certificates/lookup/{code}', [CertificateController::class, 'lookup']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/settings', [SettingController::class, 'index']);

    // 3. Public Order & Leads
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/lookup/{orderNumber}', [OrderController::class, 'lookup']);
    Route::post('/leads', [LeadController::class, 'store']);

    // 4. Authenticated Routes (Sanctum SPA Session / Token)
    Route::middleware('auth:sanctum')->group(function () {
        // Authenticated User Profile & Security
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/me', [AuthController::class, 'updateProfile']);
            Route::put('/password', [AuthController::class, 'updatePassword']);
            Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
        });

        // Wishlist API
        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist', [WishlistController::class, 'store']);
        Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);
        Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);

        // Shopping Cart API
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::patch('/cart/items/{id}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
        Route::delete('/cart', [CartController::class, 'clear']);
        Route::post('/cart/sync', [CartController::class, 'sync']);

        // Address Management (Customer)
        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{id}', [AddressController::class, 'update']);
        Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
        Route::patch('/addresses/{id}/set-default', [AddressController::class, 'setDefault']);

        // In-App Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

        // Customer Own Orders & Actions (Strict IDOR Protected)
        Route::get('/user/orders', [OrderController::class, 'userOrders']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::post('/orders/{id}/upload-proof', [OrderController::class, 'uploadProof']);

        // 5. Admin & SPI Management Routes (SPI inherits full access)
        Route::middleware('role:admin,spi')->group(function () {
            Route::prefix('admin')->group(function () {
                Route::get('/dashboard', [AdminController::class, 'dashboard']);
                Route::get('/customers', [AdminController::class, 'customers']);
                Route::get('/financial-reports', [AdminController::class, 'financialReports']);
                Route::get('/stock-movements', [ProductController::class, 'stockMovements']);

                // Real CSV/File Exports
                Route::get('/reports/sales/csv', [ReportController::class, 'exportSalesCsv']);
                Route::get('/reports/inventory/csv', [ReportController::class, 'exportInventoryCsv']);
            });

            // Category Management
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{id}', [CategoryController::class, 'update']);
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

            // Product Catalog Management
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{id}', [ProductController::class, 'update']);
            Route::delete('/products/{id}', [ProductController::class, 'destroy']);
            Route::post('/products/{id}/stock', [ProductController::class, 'updateStock']);

            // Gemological Certificates
            Route::get('/certificates', [CertificateController::class, 'index']);
            Route::post('/certificates', [CertificateController::class, 'store']);
            Route::put('/certificates/{id}', [CertificateController::class, 'update']);
            Route::delete('/certificates/{id}', [CertificateController::class, 'destroy']);

            // Order Operations & Approval Gate
            Route::get('/orders', [OrderController::class, 'index']);
            Route::put('/orders/{id}/payment-status', [OrderController::class, 'updatePaymentStatus']);
            Route::put('/orders/{id}/order-status', [OrderController::class, 'updateOrderStatus']);
            Route::put('/orders/{id}/tracking', [OrderController::class, 'updateTracking']);
            Route::post('/orders/{id}/request-payment-confirmation', [OrderController::class, 'requestPaymentConfirmation']);

            // Leads & Reviews Moderation
            Route::get('/leads', [LeadController::class, 'index']);
            Route::put('/leads/{id}/status', [LeadController::class, 'updateStatus']);
            Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
            Route::post('/settings', [SettingController::class, 'update']);
        });

        // 6. SPI Exclusive Supervisory Routes (Role 'spi' ONLY)
        Route::middleware('role:spi')->prefix('spi')->group(function () {
            // Summary Dashboard & Realtime KPIs
            Route::get('/summary', [SpiSummaryController::class, 'summary']);

            // Approvals Workflow Queue
            Route::get('/approvals', [ApprovalController::class, 'index']);
            Route::post('/approvals/{id}/approve', [ApprovalController::class, 'approve']);
            Route::post('/approvals/{id}/reject', [ApprovalController::class, 'reject']);
            Route::post('/direct-execute', [ApprovalController::class, 'directExecute']);

            // Append-Only Audit Trail & CSV Export
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            Route::get('/audit-logs/export-csv', [AuditLogController::class, 'exportCsv']);

            // Staff & Role Governance
            Route::get('/staff', [SpiStaffController::class, 'index']);
            Route::post('/staff', [SpiStaffController::class, 'store']);
            Route::patch('/staff/{id}/toggle-freeze', [SpiStaffController::class, 'toggleFreeze']);
            Route::post('/staff/{id}/reset-password', [SpiStaffController::class, 'resetPassword']);

            // Audit Findings (SPI Quality Assurance)
            Route::get('/audit-findings', [AuditFindingController::class, 'index']);
            Route::post('/audit-findings', [AuditFindingController::class, 'store']);
            Route::put('/audit-findings/{id}', [AuditFindingController::class, 'update']);
            Route::delete('/audit-findings/{id}', [AuditFindingController::class, 'destroy']);
            Route::get('/audit-findings/export-report', [AuditFindingController::class, 'exportReport']);
        });
    });
});
