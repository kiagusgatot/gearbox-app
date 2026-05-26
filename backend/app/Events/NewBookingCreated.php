<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewBookingCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking)
    {
        $this->booking->load(['bookingServices.service', 'vehicle', 'user']);
    }

    public function broadcastOn(): array
    {
        return [
            // Hanya admin yang perlu tahu ada booking baru
            new PrivateChannel('admin.bookings'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'booking.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->booking->id,
            'booking_code'    => $this->booking->booking_code,
            'queue_number'    => $this->booking->queue_number,
            'bay_number'      => $this->booking->bay_number,
            'status'          => $this->booking->status,
            'total_price'     => $this->booking->total_price,
            'estimated_start' => $this->booking->estimated_start,
            'estimated_end'   => $this->booking->estimated_end,
            'user'            => [
                'id'   => $this->booking->user->id,
                'name' => $this->booking->user->name,
            ],
            'vehicle'         => $this->booking->vehicle ? [
                'brand'        => $this->booking->vehicle->brand,
                'model'        => $this->booking->vehicle->model,
                'plate_number' => $this->booking->vehicle->plate_number,
            ] : null,
            'services'        => $this->booking->bookingServices->map(fn($bs) => [
                'name'             => $bs->service->name,
                'duration_minutes' => $bs->duration_minutes,
            ]),
            'created_at'      => $this->booking->created_at->toISOString(),
        ];
    }
}
