<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Certificate;
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
            'data' => ProductResource::collection($products->items())->resolve($request),
            'total' => $products->total(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
        ]);
    }

    /**
     * Upload standalone product image with EXIF stripping, dimension validation (max 4000px), WebP conversion, and randomized filename.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
                'dimensions:max_width=4000,max_height=4000',
            ],
        ], [
            'image.dimensions' => 'Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.',
        ]);

        $url = $this->processAndStoreImage($request->file('image'));
        $webpUrl = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $url);

        return response()->json([
            'success' => true,
            'url' => $url,
            'webp_url' => $webpUrl,
            'message' => 'Gambar produk berhasil diunggah.',
        ], Response::HTTP_CREATED);
    }

    /**
     * Process and store uploaded image with EXIF stripping, WebP version, and randomized filename.
     */
    protected function processAndStoreImage($file): string
    {
        $extension = strtolower($file->guessExtension() ?: 'jpg');
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $extension = 'jpg';
        }
        $cleanExt = ($extension === 'jpeg') ? 'jpg' : $extension;
        $randomBase = Str::random(40);
        $randomFilename = 'products/' . $randomBase . '.' . $cleanExt;
        $webpFilename = 'products/' . $randomBase . '.webp';

        $realPath = $file->getRealPath();
        if (function_exists('imagecreatefromstring')) {
            $content = file_get_contents($realPath);
            $gd = @imagecreatefromstring($content);
            if ($gd !== false) {
                $origWidth = imagesx($gd);
                $origHeight = imagesy($gd);
                if (max($origWidth, $origHeight) > 4000) {
                    imagedestroy($gd);
                    abort(422, 'Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.');
                }

                // 1. Simpan berkas utama (jpg/png/webp) tanpa EXIF
                ob_start();
                if ($cleanExt === 'png') {
                    imagepng($gd, null, 8);
                } elseif ($cleanExt === 'webp') {
                    imagewebp($gd, null, 85);
                } else {
                    imagejpeg($gd, null, 85);
                }
                $cleanData = ob_get_clean();
                Storage::disk('public')->put($randomFilename, $cleanData);

                // 2. Simpan juga versi WebP bila berkas asli bukan WebP
                if ($cleanExt !== 'webp') {
                    ob_start();
                    imagewebp($gd, null, 85);
                    $webpData = ob_get_clean();
                    Storage::disk('public')->put($webpFilename, $webpData);
                }

                imagedestroy($gd);

                return '/storage/' . $randomFilename;
            }
        }

        $path = $file->storeAs('products', basename($randomFilename), 'public');
        return '/storage/' . $path;
    }

    /**
     * Delete stored image file and associated WebP if exists in public storage.
     */
    protected function deleteStoredImage(?string $url): void
    {
        if (empty($url) || ! str_starts_with($url, '/storage/products/')) {
            return;
        }

        $relativePath = str_replace('/storage/', '', $url);
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }

        // Hapus juga file WebP pendamping bila format asli adalah jpg atau png
        $info = pathinfo($relativePath);
        if (($info['extension'] ?? '') !== 'webp') {
            $webpPath = ($info['dirname'] !== '.' ? $info['dirname'] . '/' : '') . $info['filename'] . '.webp';
            if (Storage::disk('public')->exists($webpPath)) {
                Storage::disk('public')->delete($webpPath);
            }
        }
    }

    /**
     * Handle certificate attachment, creation, or update when saving a product.
     */
    protected function handleCertificateAttachment(Request $request, array &$validated, ?int $existingCertId = null): ?int
    {
        $certId = $validated['certificate_id'] ?? $existingCertId;
        $certNumber = trim((string) ($request->input('certificate_number') ?? $request->input('nomor') ?? ''));

        // 1. Certificate file is uploaded (PDF, JPG, PNG)
        if ($request->hasFile('certificate_file')) {
            $file = $request->file('certificate_file');
            $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
            $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
            $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
            $mime = $file->getMimeType();

            if (! in_array($ext, $allowedExtensions, true) || ! in_array($mime, $allowedMimes, true)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'certificate_file' => 'Berkas sertifikat harus berupa dokumen PDF atau gambar JPG/PNG yang valid.',
                ]);
            }

            if ($file->getSize() > 10 * 1024 * 1024) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'certificate_file' => 'Ukuran berkas sertifikat tidak boleh melebihi 10MB.',
                ]);
            }

            $safeNomor = preg_replace('/[^A-Za-z0-9_-]/', '_', $certNumber ?: 'CERT');
            $filename = 'cert_' . $safeNomor . '_' . time() . '_' . Str::random(6) . '.' . $ext;
            $storedPath = $file->storeAs('certificates', $filename, 'public');
            $pdfPath = '/storage/' . $storedPath;

            $cert = null;
            if (! empty($certNumber)) {
                $cert = Certificate::where('nomor', $certNumber)->first();
            }
            if (! $cert && $certId) {
                $cert = Certificate::find($certId);
            }

            if ($cert) {
                $updateData = ['pdf_path' => $pdfPath];
                if (! empty($certNumber)) {
                    $updateData['nomor'] = $certNumber;
                }
                if (! empty($validated['grade'])) {
                    $updateData['grade'] = $validated['grade'];
                }
                if (! empty($validated['ukuran_mm'])) {
                    $updateData['ukuran'] = $validated['ukuran_mm'];
                }
                $cert->update($updateData);

                $validated['certificate_id'] = $cert->id;
                $validated['certificate_number'] = $cert->nomor;

                return $cert->id;
            }

            $cert = Certificate::create([
                'nomor' => $certNumber ?: ('CERT-' . ($validated['code'] ?? Str::upper(Str::random(8)))),
                'lab' => $request->input('certificate_lab') ?? 'Laboratorium Gemologi CD\'E Pearls',
                'grade' => $validated['grade'] ?? 'AAA',
                'ukuran' => $validated['ukuran_mm'] ?? '-',
                'tanggal' => now()->toDateString(),
                'pdf_path' => $pdfPath,
            ]);

            $validated['certificate_id'] = $cert->id;
            $validated['certificate_number'] = $cert->nomor;

            return $cert->id;
        }

        // 2. Certificate number is provided without a new file upload
        if (! empty($certNumber)) {
            $cert = Certificate::where('nomor', $certNumber)->first();
            if ($cert) {
                // Skenario 1: Tautkan ke sertifikat yang sudah ada di database
                $validated['certificate_id'] = $cert->id;
                $validated['certificate_number'] = $cert->nomor;

                return $cert->id;
            }

            // Skenario 2: Nomor BARU & TIDAK ADA berkas
            // DILARANG buat baris bodong di tabel certificates. Simpan sebagai teks pada produk.
            $validated['certificate_id'] = null;
            $validated['certificate_number'] = $certNumber;

            return null;
        }

        // 3. Explicit certificate_id provided or unlinked
        if (array_key_exists('certificate_id', $validated)) {
            $resolvedId = $validated['certificate_id'] ? (int) $validated['certificate_id'] : null;
            $validated['certificate_id'] = $resolvedId;
            if ($resolvedId) {
                $cert = Certificate::find($resolvedId);
                $validated['certificate_number'] = $cert?->nomor;
            } else {
                $validated['certificate_number'] = null;
            }

            return $resolvedId;
        }

        // 4. If certificate_number was explicitly submitted as empty string, clear it
        if ($request->has('certificate_number') && empty($certNumber)) {
            $validated['certificate_id'] = null;
            $validated['certificate_number'] = null;

            return null;
        }

        return $certId;
    }

    /**
     * Store a newly created product.
     */
    public function store(AdminProductRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // 1. Process multiple photo uploads with randomized filenames, true MIME & EXIF stripping
        unset($validated['images']);
        $uploadedImages = [];
        $primaryImageUrl = $request->input('image_url') ?? null;
        $primaryIndex = (int) ($validated['primary_photo_index'] ?? 0);
        $photoAlts = $request->input('photo_alts', []);

        if ($request->hasFile('image')) {
            $primaryImageUrl = $this->processAndStoreImage($request->file('image'));
            $uploadedImages[] = [
                'url' => $primaryImageUrl,
                'order' => 1,
                'is_primary' => true,
                'alt' => $validated['name'].' - Foto Utama',
            ];
        } elseif (! empty($primaryImageUrl)) {
            $uploadedImages[] = [
                'url' => $primaryImageUrl,
                'order' => 1,
                'is_primary' => true,
                'alt' => $validated['name'].' - Foto Utama',
            ];
        }

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $idx => $photo) {
                if ($photo->isValid()) {
                    $url = $this->processAndStoreImage($photo);
                    $isPrimary = ($idx === $primaryIndex) && empty($primaryImageUrl);
                    $altText = $photoAlts[$idx] ?? ($validated['name'].' - Foto '.($idx + 1));

                    $uploadedImages[] = [
                        'url' => $url,
                        'order' => count($uploadedImages) + 1,
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
        }
        if (! empty($primaryImageUrl)) {
            $validated['image'] = $primaryImageUrl;
        }

        // 2. Generate or preserve SKU/Code
        if (empty($validated['code'])) {
            $categoryPrefix = strtoupper(substr(str_replace('-mutiara', '', $validated['category_slug'] ?? 'kalung'), 0, 3));
            $validated['code'] = 'PRD-LMB-'.$categoryPrefix.'-'.Str::upper(Str::random(6));
        }

        // Handle Certificate Attachment
        $certId = $this->handleCertificateAttachment($request, $validated);
        if ($certId !== null || array_key_exists('certificate_id', $validated)) {
            $validated['certificate_id'] = $certId;
        }

        // 3. Discount calculation if original_price is provided
        if (isset($validated['original_price']) && $validated['original_price'] > $validated['price']) {
            $validated['discount_percent'] = round((($validated['original_price'] - $validated['price']) / $validated['original_price']) * 100);
        } else {
            $validated['discount_percent'] = 0;
        }

        // 4. Default status & Price sanity gate (U-8.d)
        $price = (float) $validated['price'];
        $minPrice = (float) (\App\Models\Setting::where('key', 'min_product_price_threshold')->value('value') ?? 100000);
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
            'data' => $product->fresh(['category', 'certificate']),
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

        // Handle image replacement with old file deletion
        if ($request->hasFile('image')) {
            $this->deleteStoredImage($product->image);
            $primaryImageUrl = $this->processAndStoreImage($request->file('image'));
            $validated['image'] = $primaryImageUrl;
        }

        // Handle additional photos if present
        if ($request->hasFile('photos')) {
            $uploadedImages = $product->images ?: [];
            $primaryIndex = (int) ($validated['primary_photo_index'] ?? 0);
            $photoAlts = $request->input('photo_alts', []);

            // If replacing, remove previous photos from storage
            if (! empty($uploadedImages)) {
                foreach ($uploadedImages as $oldImg) {
                    $this->deleteStoredImage(is_array($oldImg) ? ($oldImg['url'] ?? null) : $oldImg);
                }
                $uploadedImages = [];
            }

            foreach ($request->file('photos') as $idx => $photo) {
                if ($photo->isValid()) {
                    $url = $this->processAndStoreImage($photo);
                    $uploadedImages[] = [
                        'url' => $url,
                        'order' => count($uploadedImages) + 1,
                        'is_primary' => ($idx === $primaryIndex),
                        'alt' => $photoAlts[$idx] ?? ($product->name.' - Foto '.($idx + 1)),
                    ];
                }
            }
            $validated['images'] = $uploadedImages;
            if (! empty($uploadedImages[0]['url']) && empty($validated['image'])) {
                $validated['image'] = $uploadedImages[0]['url'];
            }
        }

        $oldValues = $product->only(['name', 'price', 'stock', 'status', 'grade', 'varietas']);

        // Handle Certificate Attachment
        $certId = $this->handleCertificateAttachment($request, $validated, $product->certificate_id);
        if ($certId !== null || array_key_exists('certificate_id', $validated)) {
            $validated['certificate_id'] = $certId;
        }

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
            'data' => $product->fresh(['category', 'certificate']),
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

