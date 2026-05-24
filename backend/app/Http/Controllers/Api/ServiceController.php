<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ServiceController extends Controller
{

    #[OA\Get(
        path: "/api/services",
        summary: "Get semua layanan",
        tags: ["Services"],
        parameters: [
            new OA\Parameter(
                name: "category",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "string", enum: ["mesin", "kelistrikan", "bodi", "ac"])
            ),
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "string", enum: ["active", "inactive"])
            ),
            new OA\Parameter(
                name: "search",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer", example: 10)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "List layanan dengan pagination"),
        ]
    )]

    // GET /api/services — semua user bisa akses
    public function index(Request $request)
    {
        $query = Service::query();

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $services = $query->paginate($request->get('limit', 10));

        return response()->json($services);
    }

    #[OA\Get(
        path: "/api/services/{id}",
        summary: "Get detail layanan",
        tags: ["Services"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail layanan"),
            new OA\Response(response: 404, description: "Layanan tidak ditemukan"),
        ]
    )]

    // GET /api/services/{id}
    public function show($id)
    {
        $service = Service::findOrFail($id);
        return response()->json($service);
    }

    #[OA\Post(
        path: "/api/admin/services",
        summary: "Tambah layanan baru (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "price", "duration_minutes", "category"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Ganti Oli Mesin"),
                    new OA\Property(property: "description", type: "string", example: "Penggantian oli mesin"),
                    new OA\Property(property: "price", type: "number", example: 150000),
                    new OA\Property(property: "duration_minutes", type: "integer", example: 30),
                    new OA\Property(property: "category", type: "string", enum: ["mesin", "kelistrikan", "bodi", "ac"]),
                    new OA\Property(property: "status", type: "string", enum: ["active", "inactive"]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Layanan berhasil ditambahkan"),
            new OA\Response(response: 403, description: "Unauthorized — bukan admin"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]

    // POST /api/admin/services — hanya admin
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'category' => 'required|in:mesin,kelistrikan,bodi,ac',
            'status' => 'in:active,inactive',
        ]);

        $service = Service::create($validated);

        return response()->json([
            'message' => 'Layanan berhasil ditambahkan',
            'service' => $service,
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/services/{id}",
        summary: "Update layanan (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "price", type: "number"),
                    new OA\Property(property: "status", type: "string", enum: ["active", "inactive"]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Layanan berhasil diupdate"),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Layanan tidak ditemukan"),
        ]
    )]

    // PUT /api/admin/services/{id} — hanya admin
    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'duration_minutes' => 'sometimes|integer|min:1',
            'category' => 'sometimes|in:mesin,kelistrikan,bodi,ac',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Layanan berhasil diupdate',
            'service' => $service,
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/services/{id}",
        summary: "Hapus layanan (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "Layanan berhasil dihapus"),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Layanan tidak ditemukan"),
        ]
    )]

    // DELETE /api/admin/services/{id} — hanya admin
    public function destroy($id)
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json([
            'message' => 'Layanan berhasil dihapus',
        ]);
    }
}