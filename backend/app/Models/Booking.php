<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id', 'vehicle_id', 'service_id', 'schedule_id',
        'booking_code', 'status', 'total_price', 'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function schedule()
    {
        return $this->belongsTo(ServiceSchedule::class, 'schedule_id');
    }

    public function statusHistories()
    {
        return $this->hasMany(BookingStatusHistory::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function partUsages()
    {
        return $this->hasMany(PartUsage::class);
    }
}
