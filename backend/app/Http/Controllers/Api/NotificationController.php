<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * List authenticated user's notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->paginate(min(max((int) $request->input('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $notifications->items(),
            'total' => $notifications->total(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
        ]);
    }

    /**
     * Mark single notification as read.
     */
    public function markRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'unread_count' => $unreadCount,
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications of user as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'unread_count' => 0,
            'message' => 'Semua notifikasi berhasil ditandai sudah dibaca.',
        ]);
    }

    /**
     * Delete single notification belonging strictly to authenticated user.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (! $notification) {
            abort(404, 'Notifikasi tidak ditemukan.');
        }

        $notification->delete();

        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus.',
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Clear all notifications of authenticated user.
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'unread_count' => 0,
            'message' => 'Seluruh notifikasi berhasil dibersihkan.',
        ]);
    }
}

