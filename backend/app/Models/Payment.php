<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'amount',
        'payment_method',
        'proof_path',
        'status', // PENDING, VERIFIED, REJECTED
        'verified_by',
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'verified_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}

