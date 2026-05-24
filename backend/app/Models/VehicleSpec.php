<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleSpec extends Model
{
    protected $fillable = [
        'brand',
        'model',
        'year_from',
        'year_to',
        'engine_type',
        'transmission',
        'fuel_type',
    ];

    public function parts()
    {
        return $this->belongsToMany(Part::class, 'part_vehicle_specs');
    }
}
