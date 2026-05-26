<?php

namespace App\Http\Controllers\Api;

use App\Events\BookingStatusUpdated;
use App\Events\NewBookingCreated;
use App\Events\QueueUpdated;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingService;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingController extends Controller
{
    // ── User endpoints ────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->with(['vehicle', 'bookingServices.service'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($bookings);
    }

    public function show(Request $request, $id)
    {
        $booking = Booking::where('user_id', $request->user()->id)
            ->with(['vehicle', 'bookingServices.service', 'statusHistories'])
            ->findOrFail($id);

        return response()->json($booking);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id'    => 'required|exists:vehicles,id',
            'service_ids'   => 'required|array|min:1',
            'service_ids.*' => 'exists:services,id',
            'date'          => 'required|date|after_or_equal:today',
            'notes'         => 'nullable|string|max:500',
        ]);

        $date = $validated['date'];

        // Validasi batas booking jam 14:00 untuk hari ini
        if ($date === Carbon::today()->toDateString()) {
            if (Carbon::now()->format('H:i') > Booking::LAST_BOOKING) {
                return response()->json([
                    'message' => 'Batas booking untuk hari ini sudah tutup (14:00).',
                ], 422);
            }
        }

        $services      = Service::whereIn('id', $validated['service_ids'])->get();
        $totalDuration = $services->sum('duration_minutes');
        $totalPrice    = $services->sum('price');

        $slot = Booking::findEarliestSlot($date, $totalDuration);
        if (!$slot) {
            return response()->json([
                'message' => 'Kapasitas bengkel sudah penuh untuk tanggal ini.',
            ], 422);
        }

        $booking = Booking::create([
            'user_id'         => $request->user()->id,
            'vehicle_id'      => $validated['vehicle_id'],
            'service_id'      => $services->first()->id,
            'booking_date'    => $date,                              // ← field baru
            'queue_number'    => Booking::generateQueueNumber($date),
            'bay_number'      => $slot['bay'],
            'estimated_start' => $slot['start'],
            'estimated_end'   => $slot['end'],
            'total_duration'  => $totalDuration,
            'booking_code'    => 'GBX-' . strtoupper(Str::random(8)),
            'status'          => 'pending',
            'total_price'     => $totalPrice,
            'notes'           => $validated['notes'] ?? null,
        ]);

        foreach ($services as $service) {
            BookingService::create([
                'booking_id'       => $booking->id,
                'service_id'       => $service->id,
                'price'            => $service->price,
                'duration_minutes' => $service->duration_minutes,
            ]);
        }

        broadcast(new NewBookingCreated($booking))->toOthers();
        broadcast(new QueueUpdated($date))->toOthers();

        return response()->json([
            'message' => 'Booking berhasil dibuat.',
            'booking' => $booking->load('bookingServices.service'),
        ], 201);
    }

    public function cancel(Request $request, $id)
    {
        $booking = Booking::where('user_id', $request->user()->id)->findOrFail($id);

        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Booking tidak dapat dibatalkan.'], 422);
        }

        $booking->update(['status' => 'cancelled']);

        broadcast(new BookingStatusUpdated($booking))->toOthers();
        broadcast(new QueueUpdated($booking->booking_date ?? Carbon::parse($booking->created_at)->toDateString()))->toOthers();

        return response()->json(['message' => 'Booking berhasil dibatalkan.']);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    public function adminIndex(Request $request)
    {
        $bookings = Booking::with(['user', 'vehicle', 'bookingServices.service'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date, fn($q) => $q->where('booking_date', $request->date))
            ->orderBy('booking_date', 'desc')
            ->orderBy('estimated_start', 'asc')
            ->paginate(20);

        return response()->json($bookings);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,in_progress,completed,cancelled',
            'notes'  => 'nullable|string',
        ]);

        $booking = Booking::findOrFail($id);
        $booking->update(['status' => $validated['status']]);

        broadcast(new BookingStatusUpdated($booking));

        if ($validated['status'] === 'cancelled') {
            $date = $booking->booking_date ?? Carbon::parse($booking->created_at)->toDateString();
            broadcast(new QueueUpdated($date));
        }

        return response()->json([
            'message' => 'Status booking diperbarui.',
            'booking' => $booking->load('bookingServices.service'),
        ]);
    }

    // ── Queue / availability endpoints ────────────────────────────────────────

    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'date'          => 'required|date|after_or_equal:today',
            'service_ids'   => 'required|array|min:1',
            'service_ids.*' => 'exists:services,id',
        ]);

        $services      = Service::whereIn('id', $validated['service_ids'])->get();
        $totalDuration = $services->sum('duration_minutes');
        $slot          = Booking::findEarliestSlot($validated['date'], $totalDuration);

        return response()->json([
            'date'           => $validated['date'],
            'total_duration' => $totalDuration,
            'capacity'       => Booking::getDailyCapacity($validated['date']),
            'next_slot'      => $slot,
            'is_available'   => $slot !== null,
        ]);
    }

    public function calendar(Request $request)
    {
        $validated = $request->validate([
            'from'          => 'required|date',
            'to'            => 'required|date|after_or_equal:from',
            'service_ids'   => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
        ]);

        $totalDuration = 30;
        if (!empty($validated['service_ids'])) {
            $totalDuration = Service::whereIn('id', $validated['service_ids'])->sum('duration_minutes');
        }

        $from   = Carbon::parse($validated['from']);
        $to     = Carbon::parse($validated['to']);
        $result = [];

        for ($date = $from->copy(); $date->lte($to); $date->addDay()) {
            $dateStr  = $date->toDateString();
            $capacity = Booking::getDailyCapacity($dateStr);
            $slot     = Booking::findEarliestSlot($dateStr, $totalDuration);

            $result[] = [
                'date'         => $dateStr,
                'queue_count'  => $capacity['queue_count'],
                'is_available' => $slot !== null,
                'next_slot'    => $slot,
            ];
        }

        return response()->json($result);
    }
}
