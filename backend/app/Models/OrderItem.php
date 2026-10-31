<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_image',
        'pearl_size',
        'metal',
        'price',
        'quantity',
        'subtotal',
        'custom_specs',
    ];

    protected $casts = [
        'price' => 'float',
        'subtotal' => 'float',
        'quantity' => 'integer',
        'custom_specs' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
