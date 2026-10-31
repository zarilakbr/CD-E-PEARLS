<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with('product')->latest();

        if (! $request->user() || ! $request->user()->isAdmin()) {
            $query->where('is_approved', true);
        }

        $reviews = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'product_id' => 'nullable|integer',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5',
        ]);

        $review = Review::create([
            'user_id' => $request->user()?->id,
            'product_id' => $validated['product_id'] ?? null,
            'customer_name' => $validated['customer_name'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'is_approved' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Terima kasih atas ulasan testimoni Anda!',
            'data' => $review,
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        AuditLog::create([
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'action' => 'DELETE_REVIEW',
            'details' => "Menghapus ulasan ID #{$id}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ulasan berhasil dihapus',
        ]);
    }
}
