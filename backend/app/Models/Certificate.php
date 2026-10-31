<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor',
        'lab',
        'grade',
        'ukuran',
        'tanggal',
        'pdf_path',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}

