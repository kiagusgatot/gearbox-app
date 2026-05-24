<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use App\Models\ServiceSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class BookingController extends Controller
{
    #[OA\Get(
        path: "/api/bookings",
        summary: "Get riwayat booking milik user yang login",
        tags: ["Bookings"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                description: "Filter berdasarkan status booking",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"]
                )
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                description: "Jumlah data per halaman",
                schema: new OA\Schema(type: "integer", example: 10)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List booking milik user",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "current_page", type: "integer", example: 1),
                        new OA\Property(property: "data", type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "booking_code", type: "string", example: "GBX-A1B2C3D4"),
                                    new OA\Property(property: "status", type: "string", example: "pending"),
                                    new OA\Property(property: "total_price", type: "number", example: 150000),
                                    new OA\Property(property: "notes", type: "string", example: "Ganti oli synthetic"),
                                ]
                            )
                        ),
                        new OA\Property(property: "total", type: "integer", example: 5),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    // GET /api/bookings — riwayat booking milik user
    public function index(Request $request)
    {
        $query = Booking::with(['service', 'schedule', 'vehicle'])
                        ->where('user_id', $request->user()->id);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->orderBy('created_at', 'desc')
                          ->paginate($request->get('limit', 10));

        return response()->json($bookings);
    }

    #[OA\Get(
        path: "/api/bookings/{id}",
        summary: "Get detail booking beserta status history",
        tags: ["Bookings"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID booking",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Detail booking lengkap dengan status history",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "booking_code", type: "string", example: "GBX-A1B2C3D4"),
                        new OA\Property(property: "status", type: "string", example: "confirmed"),
                        new OA\Property(property: "total_price", type: "number", example: 150000),
                        new OA\Property(property: "service", type: "object"),
                        new OA\Property(property: "schedule", type: "object"),
                        new OA\Property(property: "vehicle", type: "object"),
                        new OA\Property(property: "status_histories", type: "array",
                            items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Booking tidak ditemukan"),
        ]
    )]
    // GET /api/bookings/{id}
    public function show(Request $request, $id)
    {
        $booking = Booking::with([
            'service', 'schedule', 'vehicle', 'statusHistories.changedBy'
        ])
        ->where('user_id', $request->user()->id)
        ->findOrFail($id);

        return response()->json($booking);
    }

    #[OA\Post(
        path: "/api/bookings",
        summary: "Buat booking layanan baru",
        description: "Membuat booking baru. Sistem akan otomatis mengecek ketersediaan slot, menggenerate booking_code unik (GBX-XXXXXXXX), dan mencatat status history awal.",
        tags: ["Bookings"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["service_id", "schedule_id", "vehicle_id"],
                properties: [
                    new OA\Property(property: "service_id", type: "integer", example: 1,
                        description: "ID layanan yang dipilih"),
                    new OA\Property(property: "schedule_id", type: "integer", example: 1,
                        description: "ID jadwal yang dipilih — harus sesuai dengan service_id"),
                    new OA\Property(property: "vehicle_id", type: "integer", example: 1,
                        description: "ID kendaraan milik user"),
                    new OA\Property(property: "notes", type: "string",
                        example: "Mohon ganti dengan oli synthetic"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Booking berhasil dibuat",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Booking berhasil dibuat"),
                        new OA\Property(property: "booking", type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 3),
                                new OA\Property(property: "booking_code", type: "string", example: "GBX-A1B2C3D4"),
                                new OA\Property(property: "status", type: "string", example: "pending"),
                                new OA\Property(property: "total_price", type: "number", example: 150000),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 422, description: "Jadwal penuh / tidak tersedia / validasi gagal"),
            new OA\Response(response: 500, description: "Server error — transaksi dibatalkan (rollback)"),
        ]
    )]
    // POST /api/bookings — user buat booking baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'  => 'required|exists:services,id',
            'schedule_id' => 'required|exists:service_schedules,id',
            'vehicle_id'  => 'required|exists:vehicles,id',
            'notes'       => 'nullable|string|max:500',
        ]);

        // Pastikan kendaraan milik user sendiri
        $vehicle = $request->user()->vehicles()->findOrFail($validated['vehicle_id']);

        // Cek ketersediaan jadwal
        $schedule = ServiceSchedule::findOrFail($validated['schedule_id']);

        if (!$schedule->is_available || $schedule->booked_count >= $schedule->capacity) {
            return response()->json([
                'message' => 'Jadwal tidak tersedia atau sudah penuh.'
            ], 422);
        }

        // Pastikan schedule sesuai service
        if ($schedule->service_id != $validated['service_id']) {
            return response()->json([
                'message' => 'Jadwal tidak sesuai dengan layanan yang dipilih.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Generate booking code
            $bookingCode = 'GBX-' . strtoupper(Str::random(8));

            // Ambil harga dari service
            $service = $schedule->service;

            $booking = Booking::create([
                'user_id'      => $request->user()->id,
                'vehicle_id'   => $validated['vehicle_id'],
                'service_id'   => $validated['service_id'],
                'schedule_id'  => $validated['schedule_id'],
                'booking_code' => $bookingCode,
                'status'       => 'pending',
                'total_price'  => $service->price,
                'notes'        => $validated['notes'] ?? null,
            ]);

            // Catat history status awal
            BookingStatusHistory::create([
                'booking_id'  => $booking->id,
                'old_status'  => null,
                'new_status'  => 'pending',
                'changed_by'  => $request->user()->id,
                'notes'       => 'Booking dibuat',
            ]);

            // Update booked_count & is_available
            $schedule->increment('booked_count');
            if ($schedule->booked_count >= $schedule->capacity) {
                $schedule->update(['is_available' => false]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Booking berhasil dibuat',
                'booking' => $booking->load(['service', 'schedule', 'vehicle']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Terjadi kesalahan, booking gagal dibuat.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    #[OA\Put(
        path: "/api/bookings/{id}/cancel",
        summary: "Batalkan booking (hanya status pending atau confirmed)",
        tags: ["Bookings"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID booking",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking berhasil dibatalkan — slot dikembalikan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Booking berhasil dibatalkan"),
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Booking tidak ditemukan"),
            new OA\Response(response: 422, description: "Booking tidak bisa dibatalkan pada status ini"),
        ]
    )]
    // PUT /api/bookings/{id}/cancel — user batalkan booking
    public function cancel(Request $request, $id)
    {
        $booking = Booking::where('user_id', $request->user()->id)->findOrFail($id);

        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Booking tidak bisa dibatalkan pada status ' . $booking->status
            ], 422);
        }

        DB::beginTransaction();
        try {
            $oldStatus = $booking->status;
            $booking->update(['status' => 'cancelled']);

            BookingStatusHistory::create([
                'booking_id' => $booking->id,
                'old_status' => $oldStatus,
                'new_status' => 'cancelled',
                'changed_by' => $request->user()->id,
                'notes'      => 'Dibatalkan oleh customer',
            ]);

            // Kembalikan slot
            $schedule = $booking->schedule;
            $schedule->decrement('booked_count');
            $schedule->update(['is_available' => true]);

            DB::commit();

            return response()->json([
                'message' => 'Booking berhasil dibatalkan',
                'booking' => $booking->fresh(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membatalkan booking.'], 500);
        }
    }

    #[OA\Get(
        path: "/api/admin/bookings",
        summary: "Get semua booking (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                description: "Filter berdasarkan status",
                schema: new OA\Schema(
                    type: "string",
                    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"]
                )
            ),
            new OA\Parameter(
                name: "date",
                in: "query",
                required: false,
                description: "Filter berdasarkan tanggal jadwal (Y-m-d)",
                schema: new OA\Schema(type: "string", example: "2026-05-25")
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer", example: 10)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "List semua booking dari semua user"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized — bukan admin"),
        ]
    )]
    // GET /api/admin/bookings — admin lihat semua booking
    public function adminIndex(Request $request)
    {
        $query = Booking::with(['user', 'service', 'schedule', 'vehicle']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->whereHas('schedule', function ($q) use ($request) {
                $q->where('date', $request->date);
            });
        }

        $bookings = $query->orderBy('created_at', 'desc')
                          ->paginate($request->get('limit', 10));

        return response()->json($bookings);
    }

    #[OA\Put(
        path: "/api/admin/bookings/{id}/status",
        summary: "Update status booking (Admin)",
        description: "Admin dapat mengubah status booking. Jika status diubah ke 'cancelled', slot jadwal akan dikembalikan secara otomatis.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID booking",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(property: "status", type: "string",
                        enum: ["confirmed", "in_progress", "completed", "cancelled"],
                        example: "confirmed"
                    ),
                    new OA\Property(property: "notes", type: "string",
                        example: "Booking dikonfirmasi, silakan datang sesuai jadwal"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Status booking berhasil diupdate",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string",
                            example: "Status booking berhasil diupdate"),
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized — bukan admin"),
            new OA\Response(response: 404, description: "Booking tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    // PUT /api/admin/bookings/{id}/status — admin update status
    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:confirmed,in_progress,completed,cancelled',
            'notes'  => 'nullable|string',
        ]);

        $oldStatus = $booking->status;
        $booking->update(['status' => $validated['status']]);

        BookingStatusHistory::create([
            'booking_id' => $booking->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'changed_by' => $request->user()->id,
            'notes'      => $validated['notes'] ?? null,
        ]);

        // Jika cancelled, kembalikan slot
        if ($validated['status'] === 'cancelled') {
            $schedule = $booking->schedule;
            $schedule->decrement('booked_count');
            $schedule->update(['is_available' => true]);
        }

        return response()->json([
            'message' => 'Status booking berhasil diupdate',
            'booking' => $booking->load(['service', 'schedule', 'vehicle', 'statusHistories']),
        ]);
    }
}
