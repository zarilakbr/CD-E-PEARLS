<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'target_type',
        'target_id',
        'title',
        'old_value',
        'new_value',
        'requester_id',
        'status', // pending, approved, rejected
        'decider_id',
        'reason',
        'decided_at',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'decided_at' => 'datetime',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function decider()
    {
        return $this->belongsTo(User::class, 'decider_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}

