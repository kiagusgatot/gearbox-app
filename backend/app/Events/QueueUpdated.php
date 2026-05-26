<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $capacity;

    public function __construct(public string $date)
    {
        $this->capacity = Booking::getDailyCapacity($date);
    }

    public function broadcastOn(): array
    {
        // Public channel — semua user yang sedang buka kalender booking bisa dengar
        return [
            new Channel("queue.{$this->date}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'queue.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'date'         => $this->date,
            'queue_count'  => $this->capacity['queue_count'],
            'is_available' => $this->capacity['is_available'],
        ];
    }
}
