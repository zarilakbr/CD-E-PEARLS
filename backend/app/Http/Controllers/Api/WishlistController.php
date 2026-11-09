<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WishlistController extends Controller
{
    /**
     * Get authenticated customer's wishlist items.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $wishlists = Wishlist::with(['product' => function ($q) {
            $q->with('category', 'certificate');
        }])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $products = $wishlists->pluck('product')->filter()->values();

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products),
            'total' => $wishlists->count(),
        ]);
    }

    /**
     * Add product to wishlist.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        $item = Wishlist::firstOrCreate([
            'user_id' => $user->id,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke Wishlist Anda.',
            'data' => $item,
        ], Response::HTTP_CREATED);
    }

    /**
     * Remove product from wishlist.
     */
    public function destroy(Request $request, $productId): JsonResponse
    {
        $user = $request->user();

        $deleted = Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari Wishlist.',
            'deleted' => (bool) $deleted,
        ]);
    }

    /**
     * Toggle wishlist item status.
     */
    public function toggle(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        $existing = Wishlist::where('user_id', $user->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'success' => true,
                'in_wishlist' => false,
                'message' => 'Produk dihapus dari Wishlist.',
            ]);
        }

        Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json([
            'success' => true,
            'in_wishlist' => true,
            'message' => 'Produk ditambahkan ke Wishlist.',
        ]);
    }
}

