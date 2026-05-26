<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function daily(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());

        // Gunakan booking_date — lebih akurat, tidak bergantung timezone created_at
        // Tampilkan semua booking (dengan atau tanpa bay_number) untuk transparansi
        $bookings = Booking::where('booking_date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->with(['user', 'vehicle', 'bookingServices.service'])
            ->orderByRaw("CASE WHEN estimated_start IS NULL THEN 1 ELSE 0 END")
            ->orderBy('estimated_start')
            ->get();

        $capacity = Booking::getDailyCapacity($date);

        // Group per bay — hanya booking yang punya bay_number
        $bays = [];
        for ($i = 1; $i <= Booking::TOTAL_BAYS; $i++) {
            $bayBookings    = $bookings->where('bay_number', $i)->values();
            $currentBooking = $bayBookings->whereIn('status', ['confirmed', 'in_progress'])->first();
            $bays[] = [
                'bay_number'      => $i,
                'bookings'        => $bayBookings,
                'current_booking' => $currentBooking,
                'is_busy'         => $currentBooking !== null,
                'total_today'     => $bayBookings->count(),
            ];
        }

        $stats = [
            'total_queue'    => $bookings->count(),
            'pending'        => $bookings->where('status', 'pending')->count(),
            'in_progress'    => $bookings->where('status', 'in_progress')->count(),
            'completed'      => $bookings->where('status', 'completed')->count(),
            'capacity'       => $capacity,
            'last_estimated' => $bookings->whereNotNull('estimated_end')->max('estimated_end'),
        ];

        return response()->json([
            'date'     => $date,
            'bays'     => $bays,
            'stats'    => $stats,
            'bookings' => $bookings,
        ]);
    }
}
