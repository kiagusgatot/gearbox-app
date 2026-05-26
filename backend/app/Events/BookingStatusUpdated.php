<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking)
    {
        $this->booking->load(['bookingServices.service', 'vehicle', 'user']);
    }

    /**
     * Channel yang digunakan:
     * - Private channel per user  → user bisa dengar update booking miliknya sendiri
     * - Private channel admin     → semua admin dengar semua update booking
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->booking->user_id}"),
            new PrivateChannel('admin.bookings'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'booking.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->booking->id,
            'booking_code'    => $this->booking->booking_code,
            'queue_number'    => $this->booking->queue_number,
            'bay_number'      => $this->booking->bay_number,
            'status'          => $this->booking->status,
            'estimated_start' => $this->booking->estimated_start,
            'estimated_end'   => $this->booking->estimated_end,
            'total_price'     => $this->booking->total_price,
            'services'        => $this->booking->bookingServices->map(fn($bs) => [
                'name'  => $bs->service->name,
                'price' => $bs->price,
            ]),
            'vehicle'         => $this->booking->vehicle ? [
                'brand'        => $this->booking->vehicle->brand,
                'model'        => $this->booking->vehicle->model,
                'plate_number' => $this->booking->vehicle->plate_number,
            ] : null,
            'updated_at'      => $this->booking->updated_at->toISOString(),
        ];
    }
}
