<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'actor_id',
        'actor_name',
        'actor_role',
        'action',
        'target_type',
        'target_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function ($log) {
            if (empty($log->created_at)) {
                $log->created_at = now();
            }
        });

        // Strict append-only enforcement: prevent update and delete
        static::updating(function () {
            throw new RuntimeException('AuditLog is append-only and cannot be updated.');
        });

        static::deleting(function () {
            throw new RuntimeException('AuditLog is append-only and cannot be deleted.');
        });
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
