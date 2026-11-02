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
        'user_name',
        'actor_role',
        'action',
        'target_type',
        'target_id',
        'old_value',
        'new_value',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    public function setUserNameAttribute($value): void
    {
        $this->attributes['actor_name'] = $value;
    }

    public function getUserNameAttribute(): ?string
    {
        return $this->attributes['actor_name'] ?? null;
    }

    public function setDetailsAttribute($value): void
    {
        if (is_array($value)) {
            $this->attributes['new_value'] = json_encode($value);
        } elseif (is_string($value)) {
            $this->attributes['new_value'] = json_encode(['details' => $value]);
        }
    }

    public function getDetailsAttribute(): ?array
    {
        return $this->new_value;
    }

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
