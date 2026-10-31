<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'category_slug',
        'certificate_id',
        'name',
        'price',
        'original_price',
        'discount_percent',
        'stock',
        'rating',
        'reviews_count',
        'varietas',
        'grade',
        'logam',
        'ukuran_mm',
        'berat',
        'is_featured',
        'is_bestseller',
        'image',
        'images',
        'description',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'original_price' => 'float',
        'discount_percent' => 'integer',
        'stock' => 'integer',
        'rating' => 'float',
        'reviews_count' => 'integer',
        'is_featured' => 'boolean',
        'is_bestseller' => 'boolean',
        'images' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_slug', 'slug');
    }

    public function certificate()
    {
        return $this->belongsTo(Certificate::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
