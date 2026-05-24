<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = [
        'user_id',
        'plate_number',
        'brand',
        'model',
        'year',
        'type',
        'is_verified',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    // Relasi untuk 5 booking terakhir — aman dipakai di eager loading
    public function latestBookings()
    {
        return $this->hasMany(Booking::class)->latest()->limit(5);
    }

    public function documents()
    {
        return $this->hasMany(VehicleDocument::class);
    }
}
