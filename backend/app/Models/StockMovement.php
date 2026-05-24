<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'part_id',
        'type',
        'quantity',
        'stock_before',
        'stock_after',
        'notes',
        'created_by',
        'booking_id',
    ];

    public function part()
    {
        return $this->belongsTo(Part::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
