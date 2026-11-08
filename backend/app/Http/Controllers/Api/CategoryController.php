<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\AuditLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    /**
     * List categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount(['products' => fn ($q) => $q->where('status', '!=', 'archived')]);

        $hasAuth = (bool) $request->user() || $request->hasHeader('Authorization');
        $isPublic = ! $hasAuth;
        if ($isPublic) {
            $query->where('is_active', true);
        }

        $categories = $query->get();
        $payload = [
            'success' => true,
            'data' => CategoryResource::collection($categories)->resolve($request),
        ];

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
     * Show single category.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $category = Category::withCount(['products' => fn ($q) => $q->where('status', '!=', 'archived')])
            ->where('id', $id)
            ->orWhere('slug', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => (new CategoryResource($category))->resolve($request),
        ]);
    }

    /**
     * Store new category (Admin & SPI).
     * Image is strictly required, with EXIF stripping, max 4000px dimension, and WebP generation.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
            'slug' => 'nullable|string|max:100|unique:categories,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'image' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
                'dimensions:max_width=4000,max_height=4000',
            ],
        ], [
            'image.required' => 'Foto kategori perhiasan mutiara wajib diunggah.',
            'image.file' => 'Berkas gambar kategori tidak valid.',
            'image.mimes' => 'Format gambar harus berupa JPEG, JPG, PNG, atau WebP.',
            'image.mimetypes' => 'Format MIME gambar harus berupa JPEG, PNG, atau WebP.',
            'image.max' => 'Ukuran berkas gambar tidak boleh melebihi 5 MB.',
            'image.dimensions' => 'Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.',
        ]);

        $imageUrls = $this->processAndStoreCategoryImage($request->file('image'));

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'sparkles',
            'image' => $imageUrls['image'],
            'webp_url' => $imageUrls['webp_url'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'CREATE_CATEGORY',
            'target_type' => 'category',
            'target_id' => $category->slug,
            'old_value' => null,
            'new_value' => $category->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori perhiasan berhasil ditambahkan.',
            'data' => (new CategoryResource($category))->resolve($request),
        ], Response::HTTP_CREATED);
    }

    /**
     * Update category.
     * Image is optional IF category already has an image; mandatory IF category does not yet have an image.
     * Replacing image removes old files from storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $imageRules = [
            'file',
            'mimes:jpeg,jpg,png,webp',
            'mimetypes:image/jpeg,image/png,image/webp',
            'max:5120',
            'dimensions:max_width=4000,max_height=4000',
        ];

        if (empty($category->image)) {
            array_unshift($imageRules, 'required');
        } else {
            array_unshift($imageRules, 'nullable');
        }

        $validated = $request->validate([
            'name' => "sometimes|required|string|max:100|unique:categories,name,{$category->id}",
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'image' => $imageRules,
        ], [
            'image.required' => 'Foto kategori perhiasan mutiara wajib diunggah karena kategori belum memiliki gambar.',
            'image.file' => 'Berkas gambar kategori tidak valid.',
            'image.mimes' => 'Format gambar harus berupa JPEG, JPG, PNG, atau WebP.',
            'image.mimetypes' => 'Format MIME gambar harus berupa JPEG, PNG, atau WebP.',
            'image.max' => 'Ukuran berkas gambar tidak boleh melebihi 5 MB.',
            'image.dimensions' => 'Dimensi gambar tidak boleh melebihi 4000 piksel pada sisi terpanjang.',
        ]);

        $old = $category->toArray();

        if ($request->hasFile('image')) {
            $this->deleteStoredCategoryImage($category->image, $category->webp_url);
            $imageUrls = $this->processAndStoreCategoryImage($request->file('image'));
            $validated['image'] = $imageUrls['image'];
            $validated['webp_url'] = $imageUrls['webp_url'];
        } else {
            unset($validated['image']);
        }

        $category->update($validated);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'UPDATE_CATEGORY',
            'target_type' => 'category',
            'target_id' => $category->slug,
            'old_value' => $old,
            'new_value' => $category->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data' => (new CategoryResource($category))->resolve($request),
        ]);
    }

    /**
     * Delete category.
     * Rejects with HTTP 409 if category still has products registered.
     * Deletes stored images upon successful removal.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $productsCount = $category->products()->count();
        if ($productsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori masih memiliki produk, silakan pindahkan atau hapus produk terlebih dahulu.',
            ], Response::HTTP_CONFLICT);
        }

        $this->deleteStoredCategoryImage($category->image, $category->webp_url);

        $old = $category->toArray();
        $category->delete();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => $user->role,
            'action' => 'DELETE_CATEGORY',
            'target_type' => 'category',
            'target_id' => $category->slug,
            'old_value' => $old,
            'new_value' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }

    /**
     * Process and store uploaded category image with EXIF stripping, WebP companion, and random name.
     */
    protected function processAndStoreCategoryImage($file): array
    {
        $extension = strtolower($file->guessExtension() ?: 'jpg');
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $extension = 'jpg';
        }
        $cleanExt = ($extension === 'jpeg') ? 'jpg' : $extension;
        $randomBase = Str::random(40);
        $randomFilename = 'categories/' . $randomBase . '.' . $cleanExt;
        $webpFilename = 'categories/' . $randomBase . '.webp';

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

                // 1. Save original format without EXIF
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

                // 2. Save companion WebP version
                if ($cleanExt !== 'webp') {
                    ob_start();
                    imagewebp($gd, null, 85);
                    $webpData = ob_get_clean();
                    Storage::disk('public')->put($webpFilename, $webpData);
                } else {
                    // For WebP input, original is already WebP
                    Storage::disk('public')->put($webpFilename, $cleanData);
                }

                imagedestroy($gd);

                return [
                    'image' => '/storage/' . $randomFilename,
                    'webp_url' => '/storage/' . $webpFilename,
                ];
            }
        }

        $path = $file->storeAs('categories', basename($randomFilename), 'public');
        return [
            'image' => '/storage/' . $path,
            'webp_url' => '/storage/' . preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $path),
        ];
    }

    /**
     * Delete stored category image and associated WebP if exists.
     */
    protected function deleteStoredCategoryImage(?string $imageUrl, ?string $webpUrl = null): void
    {
        $urls = array_filter([$imageUrl, $webpUrl]);
        foreach ($urls as $url) {
            if (empty($url)) {
                continue;
            }
            // Strip app URL or relative prefix
            $parsed = parse_url($url, PHP_URL_PATH);
            $cleanPath = $parsed ? ltrim($parsed, '/') : ltrim($url, '/');
            if (str_starts_with($cleanPath, 'storage/')) {
                $cleanPath = substr($cleanPath, strlen('storage/'));
            }
            if (str_starts_with($cleanPath, 'categories/') && Storage::disk('public')->exists($cleanPath)) {
                Storage::disk('public')->delete($cleanPath);
            }
        }
    }
}
