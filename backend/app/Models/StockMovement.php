<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type', // in, out, adjustment
        'quantity',
        'stock_before',
        'stock_after',
        'reference_type', // order, spi_approval, manual
        'reference_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'stock_before' => 'integer',
        'stock_after' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

