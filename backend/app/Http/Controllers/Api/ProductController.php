<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    /**
     * List products with category, grade, variety, search, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'certificate'])
            ->where('status', 'published');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category_slug', $request->category);
        }

        if ($request->filled('grade') && $request->grade !== 'all') {
            $query->where('grade', 'like', '%'.$request->grade.'%');
        }

        if ($request->filled('variety') && $request->variety !== 'all') {
            $query->where('varietas', 'like', '%'.$request->variety.'%');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('varietas', 'like', "%{$search}%")
                    ->orWhere('logam', 'like', "%{$search}%");
            });
        }

        $sort = $request->get('sort', 'popular');
        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'newest':
                $query->latest();
                break;
            case 'popular':
            default:
                $query->orderBy('reviews_count', 'desc')->orderBy('is_bestseller', 'desc');
                break;
        }

        $perPage = min(max((int) $request->input('per_page', 24), 1), 100);
        $products = $query->paginate($perPage);

        $payload = [
            'success' => true,
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'data' => $products->items(),
        ];

        $hasAuth = (bool) $request->user() || $request->hasHeader('Authorization');
        $isPublic = ! $hasAuth;
        if ($isPublic) {
            $etag = '"'.md5(json_encode($payload)).'"';
            if ($request->header('If-None-Match') === $etag) {
                return response()->json(null, Response::HTTP_NOT_MODIFIED, [
                    'ETag' => $etag,
                    'Cache-Control' => 'public, max-age=30, s-maxage=60',
                    'Vary' => 'Authorization',
                ]);
            }

            return response()->json($payload)
                ->header('Cache-Control', 'public, max-age=30, s-maxage=60')
                ->header('ETag', $etag)
                ->header('Vary', 'Authorization');
        }

        return response()->json($payload)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Vary', 'Authorization');
    }

    /**
     * Show single product details.
     */
    public function show($id): JsonResponse
    {
        $product = Product::where('id', $id)
            ->orWhere('code', $id)
            ->with(['category', 'certificate', 'reviews' => fn ($q) => $q->where('is_approved', true)->latest()])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Store new product.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_slug' => 'required|string|exists:categories,slug',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'varietas' => 'nullable|string',
            'grade' => 'nullable|string',
            'ukuran_mm' => 'nullable|string',
            'berat' => 'nullable|string',
            'logam' => 'nullable|string',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'certificate_id' => 'nullable|exists:certificates,id',
            'is_featured' => 'boolean',
            'is_bestseller' => 'boolean',
        ]);

        if (isset($validated['original_price']) && $validated['original_price'] > $validated['price']) {
            $validated['discount_percent'] = round((($validated['original_price'] - $validated['price']) / $validated['original_price']) * 100);
        }

        $validated['code'] = 'PRD-LMB-'.strtoupper(substr($validated['category_slug'], 0, 3)).'-'.time();
        $validated['status'] = 'published';

        $product = Product::create($validated);

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $product->stock,
            'stock_before' => 0,
            'stock_after' => $product->stock,
            'reference_type' => 'product_created',
            'reference_id' => (string) $product->id,
            'notes' => 'Pendaftaran perhiasan mutiara baru ke etalase',
            'created_by' => $user->name,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'CREATE_PRODUCT',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => null,
            'new_value' => ['name' => $product->name, 'price' => $product->price, 'stock' => $product->stock],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk perhiasan berhasil ditambahkan ke katalog CD\'E Pearls.',
            'data' => $product,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update product details with SPI threshold checks for sensitive price/discount changes.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_slug' => 'sometimes|required|string|exists:categories,slug',
            'price' => 'sometimes|required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|integer|min:0|max:100',
            'stock' => 'sometimes|required|integer|min:0',
            'varietas' => 'nullable|string',
            'grade' => 'nullable|string',
            'ukuran_mm' => 'nullable|string',
            'berat' => 'nullable|string',
            'logam' => 'nullable|string',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'certificate_id' => 'nullable|exists:certificates,id',
            'is_featured' => 'boolean',
            'is_bestseller' => 'boolean',
            'reason' => 'nullable|string',
        ]);

        // SPI Sensitivity Checks
        if (isset($validated['price'])) {
            $newPrice = (float) $validated['price'];
            $oldPrice = (float) $product->price;
            $nominalDiff = abs($newPrice - $oldPrice);
            $percentDiff = $oldPrice > 0 ? ($nominalDiff / $oldPrice) * 100 : 0;
            $newDiscount = (int) ($validated['discount_percent'] ?? $product->discount_percent);

            $requiresApproval = ($percentDiff > 10 || $nominalDiff > 2000000 || $newDiscount > 15);

            if ($requiresApproval && ! $user->isSpi()) {
                // Admin cannot directly execute; submit to SPI Approval
                $approval = Approval::create([
                    'type' => 'price_change',
                    'target_type' => 'product',
                    'target_id' => (string) $product->id,
                    'title' => "Perubahan Harga {$product->name}",
                    'old_value' => [
                        'price' => $oldPrice,
                        'discount_percent' => $product->discount_percent,
                    ],
                    'new_value' => [
                        'price' => $newPrice,
                        'discount_percent' => $newDiscount,
                        'notes' => $request->input('reason', 'Penyesuaian harga butik oleh Admin'),
                    ],
                    'requester_id' => $user->id,
                    'status' => 'pending',
                    'reason' => "Perubahan harga melebihi batas toleransi (selisih {$percentDiff}%, Rp ".number_format($nominalDiff, 0, ',', '.')."). Wajib diotorisasi SPI.",
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
                    'message' => 'Perubahan harga melebihi batas 10% / Rp 2.000.000. Berkas telah diajukan ke Otorisasi SPI.',
                    'approval' => $approval,
                ], Response::HTTP_ACCEPTED);
            }
        }

        $oldValues = $product->only(['price', 'stock', 'discount_percent', 'name']);
        $product->update($validated);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => $user->isSpi() ? 'SPI_DIRECT_UPDATE_PRODUCT' : 'UPDATE_PRODUCT',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => $oldValues,
            'new_value' => $product->only(['price', 'stock', 'discount_percent', 'name']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk perhiasan berhasil diperbarui.',
            'data' => $product->fresh(['category', 'certificate']),
        ]);
    }

    /**
     * Manual stock adjustment with SPI approval workflow for sensitive variations.
     */
    public function updateStock(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $request->validate([
            'delta' => 'required|integer',
            'reason' => 'nullable|string',
        ]);

        $delta = (int) $request->delta;
        $stockBefore = $product->stock;
        $stockAfter = max(0, $stockBefore + $delta);

        // Sensitive stock adjustment (large jump > 5 items or zeroing stock)
        if (abs($delta) > 5 && ! $user->isSpi()) {
            $approval = Approval::create([
                'type' => 'stock_adjustment',
                'target_type' => 'product',
                'target_id' => (string) $product->id,
                'title' => "Penyesuaian Stok Besar {$product->name} (".($delta > 0 ? "+{$delta}" : $delta).')',
                'old_value' => ['stock' => $stockBefore],
                'new_value' => [
                    'stock' => $stockAfter,
                    'delta' => $delta,
                    'notes' => $request->input('reason', 'Penyesuaian fisik brankas oleh Admin'),
                ],
                'requester_id' => $user->id,
                'status' => 'pending',
                'reason' => "Penyesuaian stok melebihi 5 butir. Memerlukan verifikasi opname fisik oleh SPI.",
            ]);

            AuditLog::create([
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->role,
                'action' => 'SUBMIT_STOCK_APPROVAL',
                'target_type' => 'product',
                'target_id' => (string) $product->id,
                'old_value' => ['stock' => $stockBefore],
                'new_value' => ['stock' => $stockAfter, 'approval_id' => $approval->id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'requires_approval' => true,
                'message' => 'Penyesuaian stok signifikan diajukan ke Satuan Pengawas Internal (SPI).',
                'approval' => $approval,
            ], Response::HTTP_ACCEPTED);
        }

        $product->update(['stock' => $stockAfter]);

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => $delta,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reference_type' => 'manual_admin',
            'reference_id' => (string) $product->id,
            'notes' => $request->input('reason', 'Penyesuaian stok harian butik'),
            'created_by' => $user->name,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => $user->isSpi() ? 'SPI_DIRECT_UPDATE_STOCK' : 'UPDATE_STOCK',
            'target_type' => 'product',
            'target_id' => (string) $product->id,
            'old_value' => ['stock' => $stockBefore],
            'new_value' => ['stock' => $stockAfter],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stok mutiara berhasil disesuaikan.',
            'stock' => $stockAfter,
            'product' => $product,
        ]);
    }

    /**
     * Delete/archive product with SPI approval gate.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        if (! $user->isSpi()) {
            $approval = Approval::create([
                'type' => 'delete_product',
                'target_type' => 'product',
                'target_id' => (string) $product->id,
                'title' => "Pengarsipan / Penghapusan Produk {$product->name}",
                'old_value' => [
                    'name' => $product->name,
                    'code' => $product->code,
                    'stock' => $product->stock,
                ],
                'new_value' => ['status' => 'archived', 'notes' => $request->input('reason', 'Penghapusan katalog')],
                'requester_id' => $user->id,
                'status' => 'pending',
                'reason' => 'Penghapusan produk perhiasan bernilai tinggi memerlukan otorisasi resmi SPI.',
            ]);

            AuditLog::create([
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->role,
                'action' => 'SUBMIT_DELETE_PRODUCT_APPROVAL',
                'target_type' => 'product',
                'target_id' => (string) $product->id,
                'old_value' => ['status' => $product->status],
                'new_value' => ['approval_id' => $approval->id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'requires_approval' => true,
                'message' => 'Permohonan penghapusan produk telah diteruskan ke Satuan Pengawas Internal (SPI).',
                'approval' => $approval,
            ], Response::HTTP_ACCEPTED);
        }

        $product->update(['status' => 'archived']);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'SPI_DIRECT_ARCHIVE_PRODUCT',
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
            'message' => "Produk {$product->name} berhasil diarsipkan oleh SPI.",
        ]);
    }

    /**
     * List stock mutation histories.
     */
    public function stockMovements(Request $request): JsonResponse
    {
        $query = StockMovement::with('product')->latest();

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_id', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$search}%"));
            });
        }

        $movements = $query->paginate(min(max((int) $request->input('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => $movements->items(),
            'total' => $movements->total(),
            'current_page' => $movements->currentPage(),
            'last_page' => $movements->lastPage(),
        ]);
    }
}
