<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CartController extends Controller
{
    /**
     * Get or create active cart for authenticated user.
     */
    protected function getOrCreateUserCart(Request $request): Cart
    {
        $user = $request->user();
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    /**
     * View user's cart items with full product details and stock status.
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);

        $cart->load(['items.product.category', 'items.product.certificate']);

        $subtotal = 0;
        $itemsData = [];

        foreach ($cart->items as $item) {
            $product = $item->product;
            if (! $product) {
                continue;
            }

            $price = (float) $product->price;
            $lineTotal = $price * $item->quantity;
            $subtotal += $lineTotal;

            $itemsData[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_image' => $product->image,
                'price' => $price,
                'original_price' => (float) ($product->original_price ?? $price),
                'stock' => $product->stock,
                'is_in_stock' => $product->stock >= $item->quantity,
                'quantity' => $item->quantity,
                'custom_specs' => $item->custom_specs,
                'subtotal' => $lineTotal,
                'pearl_size' => $item->custom_specs['pearl_size'] ?? $product->ukuran_mm,
                'metal' => $item->custom_specs['metal'] ?? $product->logam,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $cart->id,
                'items' => $itemsData,
                'total_items' => count($itemsData),
                'subtotal' => $subtotal,
            ],
        ]);
    }

    /**
     * Add item to cart.
     */
    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'nullable|integer|min:1',
            'custom_specs' => 'nullable|array',
        ]);

        $quantity = $validated['quantity'] ?? 1;
        $product = Product::findOrFail($validated['product_id']);

        if ($product->stock < $quantity) {
            return response()->json([
                'success' => false,
                'message' => "Stok produk {$product->name} tidak mencukupi (tersisa {$product->stock} butir).",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $cart = $this->getOrCreateUserCart($request);

        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->first();

        if ($item) {
            $newQuantity = $item->quantity + $quantity;
            if ($product->stock < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Total jumlah di keranjang ({$newQuantity}) melebihi stok yang tersedia ({$product->stock}).",
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $item->update([
                'quantity' => $newQuantity,
                'custom_specs' => $validated['custom_specs'] ?? $item->custom_specs,
            ]);
        } else {
            $item = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'custom_specs' => $validated['custom_specs'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke keranjang belanja.',
            'data' => $item,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update item quantity in cart.
     */
    public function updateItem(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->getOrCreateUserCart($request);

        $item = CartItem::where('cart_id', $cart->id)->where('id', $id)->firstOrFail();
        $product = Product::findOrFail($item->product_id);

        if ($product->stock < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => "Stok produk {$product->name} tersisa {$product->stock} butir.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $item->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'success' => true,
            'message' => 'Jumlah produk di keranjang berhasil diperbarui.',
            'data' => $item,
        ]);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(Request $request, $id): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);

        $deleted = CartItem::where('cart_id', $cart->id)->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil dihapus dari keranjang belanja.',
            'deleted' => (bool) $deleted,
        ]);
    }

    /**
     * Clear all items in cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);
        CartItem::where('cart_id', $cart->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Keranjang belanja berhasil dikosongkan.',
        ]);
    }

    /**
     * Sync local items into user database cart.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.custom_specs' => 'nullable|array',
        ]);

        $cart = $this->getOrCreateUserCart($request);

        foreach ($validated['items'] as $raw) {
            $product = Product::find($raw['product_id']);
            if (! $product || $product->stock <= 0) {
                continue;
            }

            $desiredQty = min($raw['quantity'], $product->stock);

            $existing = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                $mergedQty = min($product->stock, $existing->quantity + $desiredQty);
                $existing->update(['quantity' => $mergedQty]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => $desiredQty,
                    'custom_specs' => $raw['custom_specs'] ?? null,
                ]);
            }
        }

        return $this->index($request);
    }
}

