<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartUsage extends Model
{
    protected $fillable = [
        'booking_id',
        'part_id',
        'quantity',
        'price_at_usage',
    ];

    protected $casts = [
        'price_at_usage' => 'decimal:2',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function part()
    {
        return $this->belongsTo(Part::class);
    }
}
