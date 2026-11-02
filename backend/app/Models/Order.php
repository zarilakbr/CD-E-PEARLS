<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'notes',
        'subtotal',
        'discount',
        'shipping_cost',
        'insurance_cost',
        'total',
        'payment_method',
        'payment_status',
        'order_status',
        'tracking_token',
        'tracking_number',
        'courier',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount' => 'float',
        'shipping_cost' => 'float',
        'insurance_cost' => 'float',
        'total' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
