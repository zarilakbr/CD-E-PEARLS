<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddressController extends Controller
{
    /**
     * List authenticated customer's shipping addresses.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $addresses = Address::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Store new shipping address.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'address_line' => 'required|string',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'is_default' => 'nullable|boolean',
        ]);

        $isDefault = $validated['is_default'] ?? false;
        $count = Address::where('user_id', $user->id)->count();

        // If first address, auto make default
        if ($count === 0) {
            $isDefault = true;
        }

        if ($isDefault) {
            Address::where('user_id', $user->id)->update(['is_default' => false]);
        }

        $address = Address::create([
            'user_id' => $user->id,
            'label' => $validated['label'] ?? 'Rumah',
            'recipient_name' => $validated['recipient_name'],
            'phone' => $validated['phone'],
            'address_line' => $validated['address_line'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'postal_code' => $validated['postal_code'],
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alamat pengiriman berhasil ditambahkan.',
            'data' => $address,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update address.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $address = Address::where('user_id', $user->id)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'label' => 'sometimes|nullable|string|max:50',
            'recipient_name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:30',
            'address_line' => 'sometimes|required|string',
            'city' => 'sometimes|required|string|max:100',
            'province' => 'sometimes|required|string|max:100',
            'postal_code' => 'sometimes|required|string|max:20',
            'is_default' => 'sometimes|nullable|boolean',
        ]);

        if (! empty($validated['is_default'])) {
            Address::where('user_id', $user->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Alamat pengiriman berhasil diperbarui.',
            'data' => $address,
        ]);
    }

    /**
     * Delete address.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $address = Address::where('user_id', $user->id)->where('id', $id)->firstOrFail();
        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted was default, make the next one default
        if ($wasDefault) {
            $next = Address::where('user_id', $user->id)->latest()->first();
            $next?->update(['is_default' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Alamat pengiriman berhasil dihapus.',
        ]);
    }

    /**
     * Set specific address as default.
     */
    public function setDefault(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $address = Address::where('user_id', $user->id)->where('id', $id)->firstOrFail();

        Address::where('user_id', $user->id)->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Alamat utama berhasil diperbarui.',
            'data' => $address,
        ]);
    }
}

