<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminProductRequest;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ProductAdminController extends Controller
{
    /**
     * Display a listing of products with filtering and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'certificate']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all' && $request->category !== 'Semua') {
            $query->where('category_slug', $request->category);
        }

        if ($request->filled('status') && $request->status !== 'all' && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        if ($request->filled('grade') && $request->grade !== 'all' && $request->grade !== 'Semua') {
            $query->where('grade', $request->grade);
        }

        if ($request->filled('varietas') && $request->varietas !== 'all' && $request->varietas !== 'Semua') {
            $query->where('varietas', $request->varietas);
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $products = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(AdminProductRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // 1. Process multiple photo uploads with randomized filenames & true MIME
        // U-8.c: Disallow raw string images from JSON payload; only multipart files allowed
        unset($validated['image'], $validated['images']);
        $uploadedImages = [];
        $primaryImageUrl = null;
        $primaryIndex = (int) ($validated['primary_photo_index'] ?? 0);
        $photoAlts = $request->input('photo_alts', []);

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $idx => $photo) {
                if ($photo->isValid()) {
                    $extension = $photo->guessExtension() ?: 'jpg';
                    $randomFilename = Str::random(40).'.'.$extension;
                    $path = $photo->storeAs('products', $randomFilename, 'public');
                    $url = '/storage/'.$path;

                    $isPrimary = ($idx === $primaryIndex);
                    $altText = $photoAlts[$idx] ?? ($validated['name'].' - Foto '.($idx + 1));

                    $uploadedImages[] = [
                        'url' => $url,
                        'order' => $idx + 1,
                        'is_primary' => $isPrimary,
                        'alt' => $altText,
                    ];

                    if ($isPrimary || empty($primaryImageUrl)) {
                        $primaryImageUrl = $url;
                    }
                }
            }
        }

        if (! empty($uploadedImages)) {
            $validated['images'] = $uploadedImages;
            $validated['image'] = $primaryImageUrl;
        }

        // 2. Generate unique SKU/Code
        $categoryPrefix = strtoupper(substr(str_replace('-mutiara', '', $validated['category_slug']), 0, 3));
        $validated['code'] = 'PRD-LMB-'.$categoryPrefix.'-'.Str::upper(Str::random(6));

        // 3. Discount calculation if original_price is provided
        if (isset($validated['original_price']) && $validated['original_price'] > $validated['price']) {
            $validated['discount_percent'] = round((($validated['original_price'] - $validated['price']) / $validated['original_price']) * 100);
        } else {
            $validated['discount_percent'] = 0;
        }

        // 4. Default status & Price sanity gate (U-8.d)
        $price = (float) $validated['price'];
        $minPrice = 100000; // Minimal Rp 100.000 untuk perhiasan mutiara
        $maxPrice = (float) (\App\Models\Setting::where('key', 'max_product_price_threshold')->value('value') ?? 100000000);

        $requiresApproval = ($price < $minPrice || $price > $maxPrice);

        if ($requiresApproval) {
            $validated['status'] = 'pending_approval';
        } elseif (empty($validated['status'])) {
            $validated['status'] = 'published';
        }

        $product = Product::create($validated);

        if ($requiresApproval) {
            Approval::create([
                'title' => "Otorisasi Harga Produk Baru: {$product->name} (Rp ".number_format($product->price, 0, ',', '.').")",
                'type' => 'new_product_price_audit',
                'target_type' => 'product',
                'target_id' => (string) $product->id,
                'old_value' => null,
                'new_value' => ['price' => $product->price, 'status' => 'pending_approval'],
                'requester_id' => $user->id,
                'status' => 'pending',
                'reason' => "Harga produk (Rp ".number_format($price, 0, ',', '.').") berada di luar rentang wajar (Rp ".number_format($minPrice, 0, ',', '.')." - Rp ".number_format($maxPrice, 0, ',', '.')."). Membutuhkan persetujuan SPI sebelum dipublikasikan ke katalog.",
            ]);
        }

        // 5. Initial stock movement
        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $product->stock,
            'stock_before' => 0,
            'stock_after' => $product->stock,
            'reference_type' => 'product_created',
            'reference_id' => (string) $product->id,
            'notes' => 'Pendaftaran produk perhiasan mutiara baru oleh '.$user->name,
            'created_by' => $user->name,
        ]);

        // 6. Immutable Audit Log
        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'ADMIN_CREATE_PRODUCT',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => null,
            'new_value' => [
                'code' => $product->code,
                'name' => $product->name,
                'category_slug' => $product->category_slug,
                'price' => $product->price,
                'stock' => $product->stock,
                'status' => $product->status,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk perhiasan mutiara berhasil ditambahkan ke katalog CD\'E Pearls.',
            'data' => $product->fresh(['category']),
        ], Response::HTTP_CREATED);
    }

    /**
     * Update an existing product.
     */
    public function update(AdminProductRequest $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);
        $validated = $request->validated();

        // Check if price change exceeds SPI safety threshold
        if (isset($validated['price'])) {
            $newPrice = (float) $validated['price'];
            $oldPrice = (float) $product->price;
            $nominalDiff = abs($newPrice - $oldPrice);
            $percentDiff = $oldPrice > 0 ? ($nominalDiff / $oldPrice) * 100 : 0;

            if (($percentDiff > 10 || $nominalDiff > 2000000) && ! $user->isSpi()) {
                $approval = Approval::create([
                    'type' => 'price_change',
                    'target_type' => 'product',
                    'target_id' => (string) $product->id,
                    'title' => "Perubahan Harga {$product->name}",
                    'old_value' => ['price' => $oldPrice],
                    'new_value' => [
                        'price' => $newPrice,
                        'notes' => $request->input('reason', 'Perubahan harga melebihi batas toleransi 10%'),
                    ],
                    'requester_id' => $user->id,
                    'status' => 'pending',
                    'reason' => "Selisih harga Rp ".number_format($nominalDiff, 0, ',', '.')." ({$percentDiff}%). Wajib otorisasi SPI.",
                ]);

                AuditLog::create([
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'actor_role' => $user->role,
                    'action' => 'SUBMIT_PRICE_APPROVAL',
                    'target_type' => 'product',
                    'target_id' => (string) $product->id,
                    'old_value' => ['price' => $oldPrice],
                    'new_value' => ['price' => $newPrice, 'approval_id' => $approval->id],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'requires_approval' => true,
                    'message' => 'Perubahan harga signifikan diajukan ke Otorisasi SPI.',
                    'approval' => $approval,
                ], Response::HTTP_ACCEPTED);
            }
        }

        // Handle additional photos if present
        if ($request->hasFile('photos')) {
            $uploadedImages = $product->images ?: [];
            $primaryIndex = (int) ($validated['primary_photo_index'] ?? 0);
            $photoAlts = $request->input('photo_alts', []);

            foreach ($request->file('photos') as $idx => $photo) {
                if ($photo->isValid()) {
                    $extension = $photo->guessExtension() ?: 'jpg';
                    $randomFilename = Str::random(40).'.'.$extension;
                    $path = $photo->storeAs('products', $randomFilename, 'public');
                    $url = '/storage/'.$path;

                    $uploadedImages[] = [
                        'url' => $url,
                        'order' => count($uploadedImages) + 1,
                        'is_primary' => (count($uploadedImages) === 0),
                        'alt' => $photoAlts[$idx] ?? ($product->name.' - Foto'),
                    ];
                }
            }
            $validated['images'] = $uploadedImages;
        }

        $oldValues = $product->only(['name', 'price', 'stock', 'status', 'grade', 'varietas']);
        $product->update($validated);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => $user->isSpi() ? 'SPI_UPDATE_PRODUCT' : 'ADMIN_UPDATE_PRODUCT',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => $oldValues,
            'new_value' => $product->only(['name', 'price', 'stock', 'status', 'grade', 'varietas']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk perhiasan mutiara berhasil diperbarui.',
            'data' => $product->fresh(['category']),
        ]);
    }

    /**
     * Soft-delete / deactivate product.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $product->update(['status' => 'archived']);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'ADMIN_DEACTIVATE_PRODUCT',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => ['status' => 'published'],
            'new_value' => ['status' => 'archived'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk perhiasan mutiara berhasil dinonaktifkan (diarsipkan).',
            'data' => $product,
        ]);
    }
}

