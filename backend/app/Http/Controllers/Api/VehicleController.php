<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class VehicleController extends Controller
{
    #[OA\Get(
        path: "/api/vehicles",
        summary: "Get kendaraan milik user yang sedang login",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
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
                description: "List kendaraan milik user",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "current_page", type: "integer", example: 1),
                        new OA\Property(property: "data", type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "user_id", type: "integer", example: 2),
                                    new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC"),
                                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                                    new OA\Property(property: "year", type: "integer", example: 2020),
                                    new OA\Property(property: "type", type: "string", example: "mobil"),
                                ]
                            )
                        ),
                        new OA\Property(property: "total", type: "integer", example: 2),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
        ]
    )]
    // GET /api/vehicles — kendaraan milik user yang login
    public function index(Request $request)
    {
        $vehicles = Vehicle::where('user_id', $request->user()->id)
                           ->paginate($request->get('limit', 10));

        return response()->json($vehicles);
    }

    #[OA\Get(
        path: "/api/vehicles/{vehicle}",
        summary: "Get detail kendaraan milik user",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "vehicle",
                in: "path",
                required: true,
                description: "ID kendaraan",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Detail kendaraan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC"),
                        new OA\Property(property: "brand", type: "string", example: "Toyota"),
                        new OA\Property(property: "model", type: "string", example: "Avanza"),
                        new OA\Property(property: "year", type: "integer", example: 2020),
                        new OA\Property(property: "type", type: "string", example: "mobil"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
        ]
    )]
    // GET /api/vehicles/{id}
    public function show(Request $request, $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
                          ->findOrFail($id);

        return response()->json($vehicle);
    }

    #[OA\Post(
        path: "/api/vehicles",
        summary: "Tambah kendaraan baru",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["plate_number", "brand", "model", "year", "type"],
                properties: [
                    new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC",
                        description: "Plat nomor unik kendaraan"),
                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                    new OA\Property(property: "year", type: "integer", example: 2020,
                        description: "Tahun kendaraan (1990 - sekarang)"),
                    new OA\Property(property: "type", type: "string", example: "mobil",
                        enum: ["motor", "mobil"]),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Kendaraan berhasil ditambahkan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Kendaraan berhasil ditambahkan"),
                        new OA\Property(property: "vehicle", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 422, description: "Validasi gagal atau plat nomor sudah terdaftar"),
        ]
    )]
    // POST /api/vehicles
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plate_number' => 'required|string|unique:vehicles,plate_number',
            'brand'        => 'required|string|max:100',
            'model'        => 'required|string|max:100',
            'year'         => 'required|integer|min:1990|max:' . date('Y'),
            'type'         => 'required|in:motor,mobil',
        ]);

        $vehicle = Vehicle::create([
            'plate_number' => $validated['plate_number'],
            'brand'        => $validated['brand'],
            'model'        => $validated['model'],
            'year'         => $validated['year'],
            'type'         => $validated['type'],
            'user_id'      => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Kendaraan berhasil ditambahkan',
            'vehicle' => $vehicle,
        ], 201);
    }

    #[OA\Put(
        path: "/api/vehicles/{vehicle}",
        summary: "Update kendaraan milik user",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "vehicle",
                in: "path",
                required: true,
                description: "ID kendaraan",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "plate_number", type: "string", example: "B 5678 XYZ"),
                    new OA\Property(property: "brand", type: "string", example: "Honda"),
                    new OA\Property(property: "model", type: "string", example: "Jazz"),
                    new OA\Property(property: "year", type: "integer", example: 2022),
                    new OA\Property(property: "type", type: "string", enum: ["motor", "mobil"]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Kendaraan berhasil diupdate"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    // PUT /api/vehicles/{id}
    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
                          ->findOrFail($id);

        $validated = $request->validate([
            'plate_number' => 'sometimes|string|unique:vehicles,plate_number,' . $id,
            'brand'        => 'sometimes|string|max:100',
            'model'        => 'sometimes|string|max:100',
            'year'         => 'sometimes|integer|min:1990|max:' . date('Y'),
            'type'         => 'sometimes|in:motor,mobil',
        ]);

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Kendaraan berhasil diupdate',
            'vehicle' => $vehicle,
        ]);
    }

    #[OA\Delete(
        path: "/api/vehicles/{vehicle}",
        summary: "Hapus kendaraan milik user",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "vehicle",
                in: "path",
                required: true,
                description: "ID kendaraan",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "Kendaraan berhasil dihapus"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
        ]
    )]
    // DELETE /api/vehicles/{id}
    public function destroy(Request $request, $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
                          ->findOrFail($id);

        $vehicle->delete();

        return response()->json([
            'message' => 'Kendaraan berhasil dihapus',
        ]);
    }
}
