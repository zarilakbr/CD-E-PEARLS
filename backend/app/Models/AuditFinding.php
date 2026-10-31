<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditFinding extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'category',
        'severity',
        'title',
        'description',
        'recommendation',
        'assignee_id',
        'status',
        'due_date',
        'resolved_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'resolved_at' => 'datetime',
    ];

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}

