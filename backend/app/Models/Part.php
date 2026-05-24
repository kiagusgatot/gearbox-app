<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'description',
        'category',
        'brand',
        'unit',
        'price',
        'stock',
        'min_stock',
        'status',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'stock'     => 'integer',
        'min_stock' => 'integer',
    ];

    // Apakah stok di bawah batas minimum
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function partUsages()
    {
        return $this->hasMany(PartUsage::class);
    }

    public function vehicleSpecs()
    {
        return $this->belongsToMany(VehicleSpec::class, 'part_vehicle_specs');
    }
}
