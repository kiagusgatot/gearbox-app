<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceSchedule;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ScheduleController extends Controller
{
    #[OA\Get(
        path: "/api/schedules",
        summary: "Get semua jadwal layanan",
        tags: ["Schedules"],
        parameters: [
            new OA\Parameter(
                name: "service_id",
                in: "query",
                required: false,
                description: "Filter berdasarkan ID layanan",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
            new OA\Parameter(
                name: "date",
                in: "query",
                required: false,
                description: "Filter berdasarkan tanggal (format: Y-m-d)",
                schema: new OA\Schema(type: "string", example: "2026-05-25")
            ),
            new OA\Parameter(
                name: "is_available",
                in: "query",
                required: false,
                description: "Filter berdasarkan ketersediaan slot",
                schema: new OA\Schema(type: "boolean", example: true)
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
                description: "List jadwal dengan pagination",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "current_page", type: "integer", example: 1),
                        new OA\Property(property: "data", type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "service_id", type: "integer", example: 1),
                                    new OA\Property(property: "date", type: "string", example: "2026-05-25"),
                                    new OA\Property(property: "start_time", type: "string", example: "08:00:00"),
                                    new OA\Property(property: "end_time", type: "string", example: "10:00:00"),
                                    new OA\Property(property: "capacity", type: "integer", example: 3),
                                    new OA\Property(property: "booked_count", type: "integer", example: 1),
                                    new OA\Property(property: "is_available", type: "boolean", example: true),
                                ]
                            )
                        ),
                        new OA\Property(property: "total", type: "integer", example: 20),
                    ]
                )
            ),
        ]
    )]
    // GET /api/schedules?service_id=1&date=2026-05-20
    public function index(Request $request)
    {
        $query = ServiceSchedule::with('service');

        if ($request->has('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $schedules = $query->orderBy('date')->orderBy('start_time')
                           ->paginate($request->get('limit', 10));

        return response()->json($schedules);
    }

    #[OA\Get(
        path: "/api/schedules/{id}",
        summary: "Get detail jadwal layanan",
        tags: ["Schedules"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID jadwal",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Detail jadwal",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "service_id", type: "integer", example: 1),
                        new OA\Property(property: "date", type: "string", example: "2026-05-25"),
                        new OA\Property(property: "start_time", type: "string", example: "08:00:00"),
                        new OA\Property(property: "end_time", type: "string", example: "10:00:00"),
                        new OA\Property(property: "capacity", type: "integer", example: 3),
                        new OA\Property(property: "booked_count", type: "integer", example: 1),
                        new OA\Property(property: "is_available", type: "boolean", example: true),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Jadwal tidak ditemukan"),
        ]
    )]
    // GET /api/schedules/{id}
    public function show($id)
    {
        $schedule = ServiceSchedule::with('service')->findOrFail($id);
        return response()->json($schedule);
    }

    #[OA\Post(
        path: "/api/admin/schedules",
        summary: "Tambah jadwal baru (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["service_id", "date", "start_time", "end_time", "capacity"],
                properties: [
                    new OA\Property(property: "service_id", type: "integer", example: 1),
                    new OA\Property(property: "date", type: "string", example: "2026-06-01",
                        description: "Format: Y-m-d, tidak boleh lebih awal dari hari ini"),
                    new OA\Property(property: "start_time", type: "string", example: "08:00",
                        description: "Format: H:i"),
                    new OA\Property(property: "end_time", type: "string", example: "10:00",
                        description: "Format: H:i, harus setelah start_time"),
                    new OA\Property(property: "capacity", type: "integer", example: 3,
                        description: "Maksimal booking per slot"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Jadwal berhasil ditambahkan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Jadwal berhasil ditambahkan"),
                        new OA\Property(property: "schedule", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized — bukan admin"),
            new OA\Response(response: 422, description: "Jadwal duplikat atau validasi gagal"),
        ]
    )]
    // POST /api/admin/schedules
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'  => 'required|exists:services,id',
            'date'        => 'required|date|after_or_equal:today',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'capacity'    => 'required|integer|min:1',
        ]);

        // Cek jadwal duplikat
        $exists = ServiceSchedule::where('service_id', $validated['service_id'])
            ->where('date', $validated['date'])
            ->where('start_time', $validated['start_time'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Jadwal untuk layanan ini sudah ada di waktu tersebut.'
            ], 422);
        }

        $schedule = ServiceSchedule::create([
            'service_id'   => $validated['service_id'],
            'date'         => $validated['date'],
            'start_time'   => $validated['start_time'],
            'end_time'     => $validated['end_time'],
            'capacity'     => $validated['capacity'],
            'booked_count' => 0,
            'is_available' => true,
        ]);

        return response()->json([
            'message'  => 'Jadwal berhasil ditambahkan',
            'schedule' => $schedule->load('service'),
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/schedules/{id}",
        summary: "Update jadwal (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID jadwal",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "date", type: "string", example: "2026-06-02"),
                    new OA\Property(property: "start_time", type: "string", example: "09:00"),
                    new OA\Property(property: "end_time", type: "string", example: "11:00"),
                    new OA\Property(property: "capacity", type: "integer", example: 5),
                    new OA\Property(property: "is_available", type: "boolean", example: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Jadwal berhasil diupdate"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Jadwal tidak ditemukan"),
        ]
    )]
    // PUT /api/admin/schedules/{id}
    public function update(Request $request, $id)
    {
        $schedule = ServiceSchedule::findOrFail($id);

        $validated = $request->validate([
            'date'         => 'sometimes|date',
            'start_time'   => 'sometimes|date_format:H:i',
            'end_time'     => 'sometimes|date_format:H:i',
            'capacity'     => 'sometimes|integer|min:1',
            'is_available' => 'sometimes|boolean',
        ]);

        $schedule->update($validated);

        return response()->json([
            'message'  => 'Jadwal berhasil diupdate',
            'schedule' => $schedule->load('service'),
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/schedules/{id}",
        summary: "Hapus jadwal (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID jadwal",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "Jadwal berhasil dihapus"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 422, description: "Tidak bisa hapus — sudah ada booking aktif"),
        ]
    )]
    // DELETE /api/admin/schedules/{id}
    public function destroy($id)
    {
        $schedule = ServiceSchedule::findOrFail($id);

        if ($schedule->booked_count > 0) {
            return response()->json([
                'message' => 'Jadwal tidak bisa dihapus karena sudah ada booking.'
            ], 422);
        }

        $schedule->delete();

        return response()->json([
            'message' => 'Jadwal berhasil dihapus',
        ]);
    }
}
