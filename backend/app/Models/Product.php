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
        'certificate_number',
        'name',
        'price',
        'original_price',
        'discount_percent',
        'stock',
        'stock_on_hand',
        'stock_reserved',
        'rating',
        'reviews_count',
        'varietas',
        'grade',
        'logam',
        'ukuran_mm',
        'jumlah',
        'berat',
        'bentuk',
        'kelompok_warna',
        'varian_warna',
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
        'stock_on_hand' => 'integer',
        'stock_reserved' => 'integer',
        'rating' => 'float',
        'reviews_count' => 'integer',
        'is_featured' => 'boolean',
        'is_bestseller' => 'boolean',
        'images' => 'array',
    ];

    protected $appends = [
        'webp_url',
        'certificate_pdf_url',
        'certificate_number',
    ];

    public function getCertificatePdfUrlAttribute(): ?string
    {
        $cert = $this->certificate;
        if (! $cert || empty($cert->pdf_path)) {
            return null;
        }
        if (str_starts_with($cert->pdf_path, 'http://') || str_starts_with($cert->pdf_path, 'https://')) {
            return $cert->pdf_path;
        }
        return rtrim(config('app.url'), '/') . '/' . ltrim($cert->pdf_path, '/');
    }

    public function getCertificateNumberAttribute(): ?string
    {
        return $this->certificate?->nomor ?? ($this->attributes['certificate_number'] ?? null);
    }

    public function getWebpUrlAttribute(): ?string
    {
        $image = $this->attributes['image'] ?? null;
        if (empty($image)) {
            return null;
        }
        if (! str_starts_with($image, 'http://') && ! str_starts_with($image, 'https://')) {
            $image = rtrim(config('app.url'), '/') . '/' . ltrim($image, '/');
        }
        return preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $image);
    }

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
