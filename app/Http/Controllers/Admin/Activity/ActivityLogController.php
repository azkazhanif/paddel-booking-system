<?php

namespace App\Http\Controllers\Admin\Activity;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Jejak aksi staff & admin (uang, akses, kebijakan) untuk owner — BR-10.
 */
class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $logs = ActivityLog::query()
            ->with('user:id,name,role')
            ->when($filters['action'] ?? null, fn (Builder $query, string $action) => $query->where('action', $action))
            ->when($filters['user_id'] ?? null, fn (Builder $query, int $userId) => $query->where('user_id', $userId))
            ->when($filters['date_from'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'label' => $log->label(),
                'properties' => $log->properties,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'role' => $log->user->role?->value,
                ] : null,
                'subject' => $log->subject_type ? class_basename($log->subject_type).' #'.$log->subject_id : null,
            ]);

        return Inertia::render('Admin/Activity/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'actions' => ActivityLog::query()
                ->distinct()
                ->orderBy('action')
                ->pluck('action')
                ->map(fn (string $action) => ['value' => $action, 'label' => (new ActivityLog(['action' => $action]))->label()])
                ->values(),
            'users' => User::query()->internal()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
