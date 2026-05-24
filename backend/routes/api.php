<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\InventoryController;

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);
Route::get('/schedules', [ScheduleController::class, 'index']);
Route::get('/schedules/{id}', [ScheduleController::class, 'show']);
Route::get('/reviews', [ReviewController::class, 'index']);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (login required)
// ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Vehicles — CRUD milik user sendiri
    Route::apiResource('/vehicles', VehicleController::class);

    // Vehicle Documents — upload & lihat status (user)
    Route::post('/vehicles/{vehicle}/documents', [VehicleController::class, 'uploadDocument']);
    Route::get('/vehicles/{vehicle}/documents', [VehicleController::class, 'getDocuments']);

    // Compatible parts untuk kendaraan user
    Route::get('/vehicles/{vehicle}/compatible-parts', [InventoryController::class, 'compatibleParts']);

    // Bookings — user
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Reviews — user
    Route::post('/reviews', [ReviewController::class, 'store']);

    // ─────────────────────────────────────────────
    // ADMIN ONLY ROUTES
    // ─────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Services
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{id}', [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

        // Schedules
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::put('/schedules/{id}', [ScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

        // Bookings — admin
        Route::get('/bookings', [BookingController::class, 'adminIndex']);
        Route::put('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
        Route::post('/bookings/{id}/parts', [InventoryController::class, 'recordPartUsage']);

        // Reviews — admin
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

        // Vehicles — identifikasi & verifikasi dokumen
        Route::get('/vehicles/search', [VehicleController::class, 'searchByPlate']);
        Route::get('/documents', [VehicleController::class, 'adminListDocuments']);
        Route::put('/documents/{id}/verify', [VehicleController::class, 'verifyDocument']);

        // Inventory — Parts CRUD
        Route::get('/parts', [InventoryController::class, 'index']);
        Route::get('/parts/low-stock', [InventoryController::class, 'lowStock']);
        Route::get('/parts/{id}', [InventoryController::class, 'show']);
        Route::post('/parts', [InventoryController::class, 'store']);
        Route::put('/parts/{id}', [InventoryController::class, 'update']);
        Route::delete('/parts/{id}', [InventoryController::class, 'destroy']);
        Route::post('/parts/{id}/restock', [InventoryController::class, 'restock']);

        // Vehicle Specs (master kompatibilitas)
        Route::post('/vehicle-specs', [InventoryController::class, 'storeVehicleSpec']);
        Route::put('/vehicle-specs/{id}/parts', [InventoryController::class, 'syncSpecParts']);
    });
});
