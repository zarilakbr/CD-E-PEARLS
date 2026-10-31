<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        if (! $request->user() || $request->user()->isUser()) {
            $query->where('is_active', true);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Store new category (Admin & SPI).
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
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'sparkles',
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
            'data' => $category,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update category.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => "sometimes|required|string|max:100|unique:categories,name,{$category->id}",
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $old = $category->toArray();
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
            'data' => $category,
        ]);
    }

    /**
     * Delete category.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $category = Category::where('id', $id)->orWhere('slug', $id)->firstOrFail();

        $productsCount = $category->products()->count();
        if ($productsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat menghapus kategori yang masih memiliki {$productsCount} perhiasan aktif.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

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
}
