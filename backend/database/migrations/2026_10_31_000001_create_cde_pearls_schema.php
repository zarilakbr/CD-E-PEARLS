<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Addresses
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label')->default('Rumah'); // Rumah, Kantor
            $table->string('recipient_name');
            $table->string('phone');
            $table->text('address_line');
            $table->string('city');
            $table->string('province');
            $table->string('postal_code');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // 2. Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->default('sparkles');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Certificates
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('nomor')->unique();
            $table->string('lab'); // e.g. Lembaga Gemologi Indonesia
            $table->string('grade'); // AAA, AA+
            $table->string('ukuran'); // 11.8 mm
            $table->date('tanggal');
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });

        // 4. Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable()->unique();
            $table->string('category_slug')->index();
            $table->foreignId('certificate_id')->nullable()->constrained('certificates')->nullOnDelete();
            $table->string('name');
            $table->decimal('price', 14, 2);
            $table->decimal('original_price', 14, 2)->nullable();
            $table->integer('discount_percent')->default(0);
            $table->integer('stock')->default(5);
            $table->decimal('rating', 3, 2)->default(5.0);
            $table->integer('reviews_count')->default(0);
            $table->string('varietas')->nullable(); // Mutiara Air Laut Emas, Putih Perak, Hitam Tahiti
            $table->string('grade')->nullable(); // AAA, AA, A
            $table->string('logam')->nullable(); // Emas 18K Kuning, Emas 18K Putih, Perak 925
            $table->string('ukuran_mm')->nullable(); // 11.2 - 12.0 mm
            $table->string('berat')->nullable(); // 4.8 gr
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_bestseller')->default(false);
            $table->string('image')->nullable();
            $table->json('images')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('published'); // published, draft, archived
            $table->timestamps();
        });

        // 5. Wishlists
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unique(['user_id', 'product_id']);
            $table->timestamps();
        });

        // 6. Carts & Cart Items
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->json('custom_specs')->nullable();
            $table->timestamps();
        });

        // 7. Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('customer_address');
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 14, 2);
            $table->decimal('discount', 14, 2)->default(0);
            $table->decimal('shipping_cost', 14, 2)->default(0);
            $table->decimal('insurance_cost', 14, 2)->default(0);
            $table->decimal('total', 14, 2);
            $table->string('payment_method')->default('TRANSFER_BANK');
            $table->string('payment_status')->default('WAITING_PAYMENT'); // WAITING_PAYMENT, PAYMENT_REVIEW, PAID, FAILED, REFUNDED
            $table->string('order_status')->default('PENDING'); // PENDING, PROCESSING, READY_TO_SHIP, SHIPPED, DELIVERED, COMPLETED, CANCELLED
            $table->string('tracking_number')->nullable();
            $table->string('courier')->nullable();
            $table->timestamps();
        });

        // 8. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->string('product_image')->nullable();
            $table->string('pearl_size')->nullable();
            $table->string('metal')->nullable();
            $table->decimal('price', 14, 2); // Snapshot price
            $table->integer('quantity')->default(1);
            $table->decimal('subtotal', 14, 2);
            $table->json('custom_specs')->nullable();
            $table->timestamps();
        });

        // 9. Order Status Histories
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('status');
            $table->text('notes')->nullable();
            $table->string('changed_by')->nullable();
            $table->timestamps();
        });

        // 10. Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('payment_method');
            $table->string('proof_path')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, VERIFIED, REJECTED
            $table->string('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 11. Stock Movements
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('type'); // in, out, adjustment
            $table->integer('quantity');
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->string('reference_type')->nullable(); // order, spi_approval, manual
            $table->string('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // 12. Approvals (SPI Workflow)
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // price_change, delete_product, stock_adjustment, cancel_order, discount_over_limit, payment_override
            $table->string('target_type')->nullable(); // product, order
            $table->string('target_id')->nullable();
            $table->string('title');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->foreignId('decider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });

        // 13. Audit Logs (Append-Only)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->string('target_id')->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // 14. Audit Findings (SPI Quality Assurance)
        Schema::create('audit_findings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // AUD-2026-001
            $table->string('category');
            $table->string('severity')->default('medium'); // low, medium, high, critical
            $table->string('title');
            $table->text('description');
            $table->text('recommendation');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('open'); // open, in_progress, resolved, closed
            $table->date('due_date')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        // 15. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // 16. Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // 17. WhatsApp Leads CRM
        Schema::create('whatsapp_leads', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('phone');
            $table->string('source')->default('PRODUCT_CONSULTATION');
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->text('message')->nullable();
            $table->string('status')->default('NEW'); // NEW, CONTACTED, DEAL, CANCELLED
            $table->timestamps();
        });

        // 18. Reviews
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('customer_name');
            $table->integer('rating')->default(5);
            $table->text('comment');
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('whatsapp_leads');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_findings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('approvals');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('products');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('addresses');
    }
};

