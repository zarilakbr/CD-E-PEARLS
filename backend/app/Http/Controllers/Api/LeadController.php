<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\WhatsAppLead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = WhatsAppLead::with('product')->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $leads = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $leads,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'source' => 'nullable|string',
            'product_id' => 'nullable|integer',
            'message' => 'nullable|string',
        ]);

        $lead = WhatsAppLead::create([
            'customer_name' => $validated['customer_name'],
            'phone' => $validated['phone'],
            'source' => $validated['source'] ?? 'PRODUCT_CONSULTATION',
            'product_id' => $validated['product_id'] ?? null,
            'message' => $validated['message'] ?? 'Konsultasi perhiasan mutiara via WhatsApp',
            'status' => 'NEW',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lead berhasil dicatat',
            'data' => $lead,
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $lead = WhatsAppLead::findOrFail($id);
        $request->validate(['status' => 'required|string']);

        $lead->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Status follow-up berhasil diubah',
            'data' => $lead,
        ]);
    }
}
