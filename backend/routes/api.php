<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\PartController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\DocumentController;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/services',       [ServiceController::class,  'index']);
Route::get('/services/{id}',  [ServiceController::class,  'show']);
Route::get('/schedules',      [ScheduleController::class, 'index']);
Route::get('/schedules/{id}', [ScheduleController::class, 'show']);
Route::get('/reviews',        [ReviewController::class,   'index']);

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Vehicles
    Route::apiResource('/vehicles', VehicleController::class);

    // Vehicle documents — user upload
    Route::get('/vehicles/{vehicleId}/documents',  [DocumentController::class, 'index']);
    Route::post('/vehicles/{vehicleId}/documents', [DocumentController::class, 'store']);

    // Queue & availability — HARUS sebelum /bookings/{id}
    Route::get('/bookings/availability', [BookingController::class, 'checkAvailability']);
    Route::get('/bookings/calendar',     [BookingController::class, 'calendar']);

    // Bookings — user
    Route::get('/bookings',             [BookingController::class, 'index']);
    Route::get('/bookings/{id}',        [BookingController::class, 'show']);
    Route::post('/bookings',            [BookingController::class, 'store']);
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Reviews — user
    Route::post('/reviews', [ReviewController::class, 'store']);

    // ── Admin ─────────────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Services
        Route::post('/services',        [ServiceController::class, 'store']);
        Route::put('/services/{id}',    [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

        // Schedules (legacy)
        Route::post('/schedules',        [ScheduleController::class, 'store']);
        Route::put('/schedules/{id}',    [ScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

        // Bookings — admin
        Route::get('/bookings',             [BookingController::class, 'adminIndex']);
        Route::put('/bookings/{id}/status', [BookingController::class, 'updateStatus']);

        // Reviews
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

        // Customers
        Route::get('/customers',      [CustomerController::class, 'index']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);

        // Parts / Inventory — low-stock HARUS sebelum {id}
        Route::get('/parts/low-stock',     [PartController::class, 'lowStock']);
        Route::get('/parts',               [PartController::class, 'index']);
        Route::post('/parts',              [PartController::class, 'store']);
        Route::put('/parts/{id}',          [PartController::class, 'update']);
        Route::delete('/parts/{id}',       [PartController::class, 'destroy']);
        Route::post('/parts/{id}/restock', [PartController::class, 'restock']);

        // Queue monitor harian
        Route::get('/queue', [QueueController::class, 'daily']);

        // Documents — admin verifikasi
        Route::get('/documents',          [DocumentController::class, 'adminIndex']);
        Route::put('/documents/{id}/verify', [DocumentController::class, 'verify']);
    });
});
