<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "user_id", type: "integer", example: 2),
                                    new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC"),
                                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                                    new OA\Property(property: "year", type: "integer", example: 2020),
                                    new OA\Property(property: "type", type: "string", example: "mobil"),
                                    new OA\Property(property: "is_verified", type: "boolean", example: false),
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
    public function index(Request $request)
    {
        $vehicles = Vehicle::where('user_id', $request->user()->id)
            ->with('documents')
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
                description: "Detail kendaraan beserta dokumen",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC"),
                        new OA\Property(property: "brand", type: "string", example: "Toyota"),
                        new OA\Property(property: "model", type: "string", example: "Avanza"),
                        new OA\Property(property: "year", type: "integer", example: 2020),
                        new OA\Property(property: "type", type: "string", example: "mobil"),
                        new OA\Property(property: "is_verified", type: "boolean", example: false),
                        new OA\Property(property: "documents", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
        ]
    )]
    public function show(Request $request, $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
            ->with('documents')
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
                    new OA\Property(
                        property: "plate_number",
                        type: "string",
                        example: "B 1234 ABC",
                        description: "Plat nomor unik kendaraan"
                    ),
                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                    new OA\Property(
                        property: "year",
                        type: "integer",
                        example: 2020,
                        description: "Tahun kendaraan (1990 - sekarang)"
                    ),
                    new OA\Property(
                        property: "type",
                        type: "string",
                        example: "mobil",
                        enum: ["motor", "mobil"]
                    ),
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
            'is_verified'  => false,
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

        // Jika plat berubah, reset status verifikasi
        if (isset($validated['plate_number']) && $validated['plate_number'] !== $vehicle->plate_number) {
            $validated['is_verified'] = false;
            // Hapus dokumen lama karena plat sudah beda
            $vehicle->documents()->delete();
        }

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Kendaraan berhasil diupdate',
            'vehicle' => $vehicle->fresh('documents'),
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
    public function destroy(Request $request, $id)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
            ->findOrFail($id);

        // Hapus file dokumen dari storage sebelum delete record
        foreach ($vehicle->documents as $doc) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $vehicle->delete();

        return response()->json([
            'message' => 'Kendaraan berhasil dihapus',
        ]);
    }

    // ─────────────────────────────────────────────
    // DOCUMENT UPLOAD (User)
    // ─────────────────────────────────────────────

    #[OA\Post(
        path: "/api/vehicles/{vehicle}/documents",
        summary: "Upload dokumen kendaraan (plat nomor / STNK / KIR)",
        description: "User mengupload foto/scan dokumen. Satu kendaraan hanya bisa punya satu dokumen per jenis. Upload ulang akan menggantikan dokumen sebelumnya.",
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
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["type", "file"],
                    properties: [
                        new OA\Property(
                            property: "type",
                            type: "string",
                            enum: ["plat_nomor", "stnk", "kir"],
                            description: "Jenis dokumen"
                        ),
                        new OA\Property(
                            property: "file",
                            type: "string",
                            format: "binary",
                            description: "File dokumen (JPG/PNG/PDF, maks 2MB)"
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Dokumen berhasil diupload, menunggu verifikasi admin"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function uploadDocument(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
            ->findOrFail($vehicleId);

        $request->validate([
            'type' => 'required|in:plat_nomor,stnk,kir',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        // Hapus file lama jika sudah ada dokumen jenis yang sama
        $existingDoc = $vehicle->documents()->where('type', $request->type)->first();
        if ($existingDoc) {
            Storage::disk('public')->delete($existingDoc->file_path);
            $existingDoc->delete();
        }

        $file     = $request->file('file');
        $filePath = $file->store("documents/vehicle_{$vehicle->id}", 'public');
        $fileName = $file->getClientOriginalName();

        $document = VehicleDocument::create([
            'vehicle_id' => $vehicle->id,
            'type'       => $request->type,
            'file_path'  => $filePath,
            'file_name'  => $fileName,
            'status'     => 'pending',
        ]);

        // Reset is_verified karena ada dokumen baru yang perlu direview
        $vehicle->update(['is_verified' => false]);

        return response()->json([
            'message'  => 'Dokumen berhasil diupload, menunggu verifikasi admin.',
            'document' => $document,
        ], 201);
    }

    #[OA\Get(
        path: "/api/vehicles/{vehicle}/documents",
        summary: "Lihat status dokumen kendaraan milik user",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "vehicle",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "List dokumen beserta status verifikasi"),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
        ]
    )]
    public function getDocuments(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)
            ->findOrFail($vehicleId);

        $documents = $vehicle->documents()->with('verifier:id,name')->get();

        return response()->json([
            'vehicle_id'  => $vehicle->id,
            'is_verified' => $vehicle->is_verified,
            'documents'   => $documents,
        ]);
    }

    // ─────────────────────────────────────────────
    // ADMIN: Identifikasi kendaraan by plat nomor
    // ─────────────────────────────────────────────

    #[OA\Get(
        path: "/api/admin/vehicles/search",
        summary: "Cari kendaraan berdasarkan plat nomor (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "plate",
                in: "query",
                required: true,
                description: "Plat nomor kendaraan (bisa sebagian, minimal 3 karakter)",
                schema: new OA\Schema(type: "string", example: "B 1234")
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer", example: 10)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Data kendaraan ditemukan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Kendaraan ditemukan"),
                        new OA\Property(property: "total", type: "integer", example: 1),
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "plate_number", type: "string", example: "B 1234 ABC"),
                                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                                    new OA\Property(property: "year", type: "integer", example: 2020),
                                    new OA\Property(property: "is_verified", type: "boolean", example: true),
                                    new OA\Property(
                                        property: "owner",
                                        type: "object",
                                        properties: [
                                            new OA\Property(property: "name", type: "string", example: "Budi Santoso"),
                                            new OA\Property(property: "phone", type: "string", example: "08123456789"),
                                        ]
                                    ),
                                    new OA\Property(
                                        property: "latest_bookings",
                                        type: "array",
                                        items: new OA\Items(type: "object")
                                    ),
                                ]
                            )
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
            new OA\Response(response: 403, description: "Unauthorized"),
        ]
    )]
    public function searchByPlate(Request $request)
    {
        $request->validate([
            'plate' => 'required|string|min:3',
        ]);

        // FIX: Pakai relasi latestBookings() di model, bukan limit() di dalam with()
        // agar 5 booking terakhir benar-benar per kendaraan, bukan total global
        $vehicles = Vehicle::with([
            'user:id,name,phone',       // email dihapus — tidak perlu di-expose ke admin
            'latestBookings.service:id,name',
            'latestBookings.schedule:id,date,start_time',
            'documents',
        ])
            ->where('plate_number', 'like', '%' . $request->plate . '%')
            ->paginate($request->get('limit', 10));

        if ($vehicles->isEmpty()) {
            return response()->json([
                'message' => 'Kendaraan dengan plat nomor tersebut tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Kendaraan ditemukan',
            'total'   => $vehicles->total(),
            'data'    => $vehicles,
        ]);
    }

    // ─────────────────────────────────────────────
    // ADMIN: Verifikasi dokumen kendaraan
    // ─────────────────────────────────────────────

    #[OA\Get(
        path: "/api/admin/documents",
        summary: "List semua dokumen kendaraan yang perlu diverifikasi (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "string", enum: ["pending", "verified", "rejected"])
            ),
            new OA\Parameter(
                name: "limit",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "integer", example: 10)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "List dokumen dengan pagination"),
            new OA\Response(response: 403, description: "Unauthorized"),
        ]
    )]
    public function adminListDocuments(Request $request)
    {
        $query = VehicleDocument::with([
            'vehicle:id,plate_number,brand,model,year,user_id',
            'vehicle.user:id,name,phone',
            'verifier:id,name',
        ]);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            // Default tampilkan pending dulu
            $query->orderByRaw("FIELD(status, 'pending', 'rejected', 'verified')");
        }

        $documents = $query->latest()->paginate($request->get('limit', 10));

        return response()->json($documents);
    }

    #[OA\Put(
        path: "/api/admin/documents/{id}/verify",
        summary: "Approve atau reject dokumen kendaraan (Admin)",
        description: "Jika semua dokumen kendaraan (plat_nomor + stnk) sudah verified, is_verified pada kendaraan otomatis menjadi true.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID dokumen",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(
                        property: "status",
                        type: "string",
                        enum: ["verified", "rejected"],
                        example: "verified"
                    ),
                    new OA\Property(
                        property: "notes",
                        type: "string",
                        example: "Dokumen jelas dan valid",
                        description: "Wajib diisi jika rejected"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Status dokumen berhasil diupdate"),
            new OA\Response(response: 403, description: "Unauthorized"),
            new OA\Response(response: 404, description: "Dokumen tidak ditemukan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function verifyDocument(Request $request, $id)
    {
        $document = VehicleDocument::with('vehicle')->findOrFail($id);

        $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes'  => 'nullable|string|max:500',
        ]);

        // Notes wajib diisi jika rejected
        if ($request->status === 'rejected' && empty($request->notes)) {
            return response()->json([
                'message' => 'Catatan wajib diisi jika dokumen ditolak.',
            ], 422);
        }

        $document->update([
            'status'      => $request->status,
            'notes'       => $request->notes,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        // Cek apakah semua dokumen wajib (plat_nomor + stnk) sudah verified
        // Jika ya, set is_verified = true pada kendaraan
        $vehicle          = $document->vehicle;
        $requiredDocTypes = ['plat_nomor', 'stnk'];
        $verifiedCount    = $vehicle->documents()
            ->whereIn('type', $requiredDocTypes)
            ->where('status', 'verified')
            ->count();

        $vehicle->update([
            'is_verified' => $verifiedCount >= count($requiredDocTypes),
        ]);

        return response()->json([
            'message'     => 'Status dokumen berhasil diupdate.',
            'document'    => $document->fresh('verifier'),
            'is_verified' => $vehicle->fresh()->is_verified,
        ]);
    }
}
