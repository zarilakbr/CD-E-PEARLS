<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppLead extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_leads';

    protected $fillable = [
        'customer_name',
        'phone',
        'source',
        'product_id',
        'message',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
