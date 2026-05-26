<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category',
        'unit',
        'price',
        'stock',
        'min_stock',
    ];

    protected $casts = [
        'price'     => 'integer',
        'stock'     => 'integer',
        'min_stock' => 'integer',
    ];

    public function isLowStock(): bool
    {
        return $this->stock <= $this->min_stock;
    }
}
