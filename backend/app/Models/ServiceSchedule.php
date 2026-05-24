<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceSchedule extends Model
{
    protected $fillable = [
        'service_id', 'date', 'start_time', 'end_time',
        'capacity', 'booked_count', 'is_available'
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'date' => 'date',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'schedule_id');
    }
}