<?php

namespace App\Http\Controllers\Api\Spi;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditFinding;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpiSummaryController extends Controller
{
    /**
     * Return KPI metrics, real badge count, and daily activity chart.
     */
    public function summary(Request $request): JsonResponse
    {
        $pendingApprovalsCount = Approval::where('status', 'pending')->count();
        $openFindingsCount = AuditFinding::whereIn('status', ['open', 'in_progress'])->count();
        $totalLogsToday = AuditLog::whereDate('created_at', Carbon::today())->count();
        $totalStaff = User::whereIn('role', ['admin', 'spi'])->count();
        $frozenStaff = User::whereIn('role', ['admin', 'spi'])->where('status', 'frozen')->count();

        // 7-day daily activity chart
        $dailyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $label = $date->translatedFormat('D, d M');

            $logsCount = AuditLog::whereDate('created_at', $dateStr)->count();
            $approvalsDecided = Approval::whereNotNull('decided_at')
                ->whereDate('decided_at', $dateStr)
                ->count();
            $findingsCreated = AuditFinding::whereDate('created_at', $dateStr)->count();

            $dailyActivity[] = [
                'date' => $dateStr,
                'label' => $label,
                'logs_count' => $logsCount,
                'approvals_count' => $approvalsDecided,
                'findings_count' => $findingsCreated,
                'total_actions' => $logsCount + $approvalsDecided + $findingsCreated,
            ];
        }

        return response()->json([
            'success' => true,
            'kpi' => [
                'pending_approvals' => $pendingApprovalsCount,
                'open_findings' => $openFindingsCount,
                'logs_today' => $totalLogsToday,
                'total_staff' => $totalStaff,
                'frozen_staff' => $frozenStaff,
                'badge_count' => $pendingApprovalsCount + $openFindingsCount,
            ],
            'daily_activity' => $dailyActivity,
            'recent_critical_logs' => AuditLog::where('action', 'LIKE', '%SPI%')
                ->orWhere('action', 'LIKE', '%APPROVAL%')
                ->orWhere('action', 'LIKE', '%LOCK%')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),
        ]);
    }
}

