<?php

use Illuminate\Support\Facades\Broadcast;

/**
 * Private channel: user.{userId}
 * Hanya user yang bersangkutan yang bisa subscribe
 */
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/**
 * Private channel: admin.bookings
 * Hanya user dengan role admin yang bisa subscribe
 */
Broadcast::channel('admin.bookings', function ($user) {
    return $user->role === 'admin';
});

/**
 * Public channel: queue.{date}
 * Semua user authenticated bisa subscribe untuk cek kapasitas
 */
Broadcast::channel('queue.{date}', function ($user) {
    return auth()->check();
});
