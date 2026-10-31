<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'whatsapp_number' => 'nullable|string',
            'boutique_address' => 'nullable|string',
            'boutique_name' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        AuditLog::create([
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'action' => 'UPDATE_SETTINGS',
            'details' => 'Memperbarui konfigurasi gateway WhatsApp dan butik.',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil disimpan',
            'data' => Setting::all()->pluck('value', 'key'),
        ]);
    }
}
