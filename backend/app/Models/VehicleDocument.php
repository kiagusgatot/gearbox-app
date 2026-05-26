<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleDocument extends Model
{
    protected $fillable = [
        'vehicle_id',
        'type',
        'file_path',
        'file_name',
        'status',
        'notes',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class)->with('user');
    }
}
