<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Models\StockMovement;
use App\Models\Vehicle;
use App\Models\VehicleSpec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class InventoryController extends Controller
{
    // ─────────────────────────────────────────────
    // PUBLIC: Part yang kompatibel dengan kendaraan user
    // ─────────────────────────────────────────────

    #[OA\Get(
        path: "/api/vehicles/{vehicle}/compatible-parts",
        summary: "Get suku cadang yang kompatibel dengan kendaraan",
        description: "Mencocokkan merek, model, dan tahun kendaraan dengan data vehicle_specs.",
        tags: ["Vehicles"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "vehicle",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer", example: 1)
            ),
            new OA\Parameter(
                name: "category",
                in: "query",
                required: false,
                schema: new OA\Schema(type: "string", enum: ["mesin", "kelistrikan", "bodi", "ac", "ban", "lainnya"])
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: "List part yang kompatibel"),
            new OA\Response(response: 404, description: "Kendaraan tidak ditemukan"),
        ]
    )]
    public function compatibleParts(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)->findOrFail($vehicleId);

        // Cari vehicle_spec yang cocok dengan kendaraan
        $spec = VehicleSpec::where('brand', $vehicle->brand)
            ->where('model', $vehicle->model)
            ->where('year_from', '<=', $vehicle->year)
            ->where(function ($q) use ($vehicle) {
                $q->whereNull('year_to')
                    ->orWhere('year_to', '>=', $vehicle->year);
            })
            ->first();

        if (!$spec) {
            return response()->json([
                'message' => 'Spesifikasi kendaraan belum tersedia di database.',
                'data'    => [],
            ]);
        }

        $query = $spec->parts()->where('status', 'active')->where('stock', '>', 0);

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $parts = $query->get();

        return response()->json([
            'vehicle' => [
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'year'  => $vehicle->year,
            ],
            'spec'  => $spec,
            'parts' => $parts,
        ]);
    }

    // ─────────────────────────────────────────────
    // ADMIN: CRUD Parts
    // ─────────────────────────────────────────────

    #[OA\Get(
        path: "/api/admin/parts",
        summary: "List semua suku cadang (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "category", in: "query", required: false,
                schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "status", in: "query", required: false,
                schema: new OA\Schema(type: "string", enum: ["active", "inactive"])),
            new OA\Parameter(name: "search", in: "query", required: false,
                schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "limit", in: "query", required: false,
                schema: new OA\Schema(type: "integer", example: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: "List suku cadang dengan pagination"),
            new OA\Response(response: 403, description: "Unauthorized"),
        ]
    )]
    public function index(Request $request)
    {
        $query = Part::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('sku', 'like', '%' . $request->search . '%')
                    ->orWhere('brand', 'like', '%' . $request->search . '%');
            });
        }

        $parts = $query->orderBy('name')->paginate($request->get('limit', 10));

        return response()->json($parts);
    }

    #[OA\Get(
        path: "/api/admin/parts/low-stock",
        summary: "List suku cadang dengan stok di bawah minimum (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "List part yang perlu di-restock"),
            new OA\Response(response: 403, description: "Unauthorized"),
        ]
    )]
    public function lowStock()
    {
        $parts = Part::whereColumn('stock', '<=', 'min_stock')
            ->where('status', 'active')
            ->orderBy('stock')
            ->get();

        return response()->json([
            'total' => $parts->count(),
            'data'  => $parts,
        ]);
    }

    #[OA\Get(
        path: "/api/admin/parts/{id}",
        summary: "Detail suku cadang (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: "Detail part beserta riwayat stok terbaru"),
            new OA\Response(response: 404, description: "Part tidak ditemukan"),
        ]
    )]
    public function show($id)
    {
        $part = Part::with([
            'vehicleSpecs',
            'stockMovements' => fn ($q) => $q->with('creator:id,name')->latest()->limit(10),
        ])->findOrFail($id);

        return response()->json($part);
    }

    #[OA\Post(
        path: "/api/admin/parts",
        summary: "Tambah suku cadang baru (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["sku", "name", "category", "unit", "price"],
                properties: [
                    new OA\Property(property: "sku", type: "string", example: "OLI-TOY-001"),
                    new OA\Property(property: "name", type: "string", example: "Oli Mesin Toyota 1L"),
                    new OA\Property(property: "description", type: "string", nullable: true),
                    new OA\Property(property: "category", type: "string",
                        enum: ["mesin", "kelistrikan", "bodi", "ac", "ban", "lainnya"]),
                    new OA\Property(property: "brand", type: "string", example: "Castrol", nullable: true),
                    new OA\Property(property: "unit", type: "string", example: "liter"),
                    new OA\Property(property: "price", type: "number", example: 85000),
                    new OA\Property(property: "stock", type: "integer", example: 50),
                    new OA\Property(property: "min_stock", type: "integer", example: 10),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Part berhasil ditambahkan"),
            new OA\Response(response: 422, description: "Validasi gagal atau SKU sudah dipakai"),
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku'         => 'required|string|unique:parts,sku',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'required|in:mesin,kelistrikan,bodi,ac,ban,lainnya',
            'brand'       => 'nullable|string|max:100',
            'unit'        => 'required|string|max:20',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'integer|min:0',
            'min_stock'   => 'integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $part = Part::create($validated);

            // Catat stok awal sebagai stock_movement jika ada
            if (($validated['stock'] ?? 0) > 0) {
                StockMovement::create([
                    'part_id'      => $part->id,
                    'type'         => 'restock',
                    'quantity'     => $part->stock,
                    'stock_before' => 0,
                    'stock_after'  => $part->stock,
                    'notes'        => 'Stok awal saat part ditambahkan',
                    'created_by'   => $request->user()->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Suku cadang berhasil ditambahkan',
                'part'    => $part,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menambahkan part.', 'error' => $e->getMessage()], 500);
        }
    }

    #[OA\Put(
        path: "/api/admin/parts/{id}",
        summary: "Update data suku cadang (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "price", type: "number"),
                    new OA\Property(property: "min_stock", type: "integer"),
                    new OA\Property(property: "status", type: "string", enum: ["active", "inactive"]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Part berhasil diupdate"),
            new OA\Response(response: 404, description: "Part tidak ditemukan"),
        ]
    )]
    public function update(Request $request, $id)
    {
        $part = Part::findOrFail($id);

        $validated = $request->validate([
            'sku'         => 'sometimes|string|unique:parts,sku,' . $id,
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'sometimes|in:mesin,kelistrikan,bodi,ac,ban,lainnya',
            'brand'       => 'nullable|string|max:100',
            'unit'        => 'sometimes|string|max:20',
            'price'       => 'sometimes|numeric|min:0',
            'min_stock'   => 'sometimes|integer|min:0',
            'status'      => 'sometimes|in:active,inactive',
        ]);

        // Stok tidak bisa diupdate langsung — harus lewat restock/correction
        unset($validated['stock']);

        $part->update($validated);

        return response()->json([
            'message' => 'Suku cadang berhasil diupdate',
            'part'    => $part->fresh(),
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/parts/{id}",
        summary: "Hapus suku cadang (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: "Part berhasil dihapus"),
            new OA\Response(response: 422, description: "Part masih digunakan di booking"),
        ]
    )]
    public function destroy($id)
    {
        $part = Part::findOrFail($id);

        if ($part->partUsages()->exists()) {
            return response()->json([
                'message' => 'Suku cadang tidak bisa dihapus karena sudah pernah digunakan di booking. Nonaktifkan saja.',
            ], 422);
        }

        $part->delete();

        return response()->json(['message' => 'Suku cadang berhasil dihapus']);
    }

    // ─────────────────────────────────────────────
    // ADMIN: Restock
    // ─────────────────────────────────────────────

    #[OA\Post(
        path: "/api/admin/parts/{id}/restock",
        summary: "Tambah stok suku cadang (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["quantity"],
                properties: [
                    new OA\Property(property: "quantity", type: "integer", example: 20,
                        description: "Jumlah stok yang ditambahkan"),
                    new OA\Property(property: "notes", type: "string", example: "Restock dari supplier ABC"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Stok berhasil ditambahkan"),
            new OA\Response(response: 404, description: "Part tidak ditemukan"),
        ]
    )]
    public function restock(Request $request, $id)
    {
        $part = Part::findOrFail($id);

        $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes'    => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $stockBefore = $part->stock;
            $part->increment('stock', $request->quantity);

            StockMovement::create([
                'part_id'      => $part->id,
                'type'         => 'restock',
                'quantity'     => $request->quantity,
                'stock_before' => $stockBefore,
                'stock_after'  => $part->fresh()->stock,
                'notes'        => $request->notes ?? 'Restock manual',
                'created_by'   => $request->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'message'       => 'Stok berhasil ditambahkan',
                'part'          => $part->fresh(),
                'stock_before'  => $stockBefore,
                'stock_after'   => $part->fresh()->stock,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal melakukan restock.'], 500);
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Sync stock saat booking selesai
    // ─────────────────────────────────────────────

    #[OA\Post(
        path: "/api/admin/bookings/{id}/parts",
        summary: "Catat pemakaian suku cadang untuk booking (Admin)",
        description: "Dipanggil saat booking in_progress atau completed. Stok akan dikurangi otomatis dan dicatat di stock_movements.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                description: "ID booking",
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["parts"],
                properties: [
                    new OA\Property(
                        property: "parts",
                        type: "array",
                        items: new OA\Items(
                            required: ["part_id", "quantity"],
                            properties: [
                                new OA\Property(property: "part_id", type: "integer", example: 1),
                                new OA\Property(property: "quantity", type: "integer", example: 2),
                            ]
                        )
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Pemakaian part berhasil dicatat, stok dikurangi, total_price diupdate"),
            new OA\Response(response: 422, description: "Stok tidak cukup"),
            new OA\Response(response: 404, description: "Booking atau part tidak ditemukan"),
        ]
    )]
    public function recordPartUsage(Request $request, $bookingId)
    {
        $booking = \App\Models\Booking::findOrFail($bookingId);

        if (!in_array($booking->status, ['confirmed', 'in_progress'])) {
            return response()->json([
                'message' => 'Pemakaian part hanya bisa dicatat untuk booking yang sudah confirmed atau in_progress.',
            ], 422);
        }

        $request->validate([
            'parts'             => 'required|array|min:1',
            'parts.*.part_id'   => 'required|exists:parts,id',
            'parts.*.quantity'  => 'required|integer|min:1',
        ]);

        // Validasi stok semua part dulu sebelum mulai transaksi
        $partData = [];
        foreach ($request->parts as $item) {
            $part = Part::findOrFail($item['part_id']);
            if ($part->stock < $item['quantity']) {
                return response()->json([
                    'message' => "Stok '{$part->name}' tidak cukup. Stok tersedia: {$part->stock}, diminta: {$item['quantity']}.",
                ], 422);
            }
            $partData[] = ['part' => $part, 'quantity' => $item['quantity']];
        }

        DB::beginTransaction();
        try {
            $additionalCost = 0;

            foreach ($partData as $item) {
                $part     = $item['part'];
                $quantity = $item['quantity'];

                $stockBefore = $part->stock;
                $part->decrement('stock', $quantity);

                // Catat di stock_movements
                StockMovement::create([
                    'part_id'      => $part->id,
                    'type'         => 'usage',
                    'quantity'     => -$quantity,
                    'stock_before' => $stockBefore,
                    'stock_after'  => $part->fresh()->stock,
                    'notes'        => "Digunakan untuk booking #{$booking->booking_code}",
                    'created_by'   => $request->user()->id,
                    'booking_id'   => $booking->id,
                ]);

                // Simpan pemakaian per booking (upsert jika sudah ada)
                \App\Models\PartUsage::updateOrCreate(
                    ['booking_id' => $booking->id, 'part_id' => $part->id],
                    ['quantity' => $quantity, 'price_at_usage' => $part->price]
                );

                $additionalCost += $part->price * $quantity;
            }

            // Update total_price booking
            $booking->increment('total_price', $additionalCost);

            DB::commit();

            return response()->json([
                'message'         => 'Pemakaian part berhasil dicatat.',
                'additional_cost' => $additionalCost,
                'total_price'     => $booking->fresh()->total_price,
                'parts_used'      => $booking->partUsages()->with('part')->get(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mencatat pemakaian part.', 'error' => $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────
    // ADMIN: Vehicle Specs (master data kompatibilitas)
    // ─────────────────────────────────────────────

    #[OA\Post(
        path: "/api/admin/vehicle-specs",
        summary: "Tambah spesifikasi kendaraan baru (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["brand", "model", "year_from"],
                properties: [
                    new OA\Property(property: "brand", type: "string", example: "Toyota"),
                    new OA\Property(property: "model", type: "string", example: "Avanza"),
                    new OA\Property(property: "year_from", type: "integer", example: 2015),
                    new OA\Property(property: "year_to", type: "integer", example: 2021, nullable: true),
                    new OA\Property(property: "engine_type", type: "string", example: "1NZ-FE", nullable: true),
                    new OA\Property(property: "transmission", type: "string",
                        enum: ["manual", "automatic", "cvt", "dct"], nullable: true),
                    new OA\Property(property: "fuel_type", type: "string",
                        enum: ["bensin", "diesel", "hybrid", "electric"]),
                    new OA\Property(
                        property: "part_ids",
                        type: "array",
                        items: new OA\Items(type: "integer"),
                        description: "ID part yang kompatibel dengan spec ini",
                        nullable: true
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Spec kendaraan berhasil ditambahkan"),
            new OA\Response(response: 422, description: "Validasi gagal"),
        ]
    )]
    public function storeVehicleSpec(Request $request)
    {
        $validated = $request->validate([
            'brand'        => 'required|string|max:100',
            'model'        => 'required|string|max:100',
            'year_from'    => 'required|integer|min:1990|max:' . date('Y'),
            'year_to'      => 'nullable|integer|min:1990|max:' . (date('Y') + 1),
            'engine_type'  => 'nullable|string|max:50',
            'transmission' => 'nullable|in:manual,automatic,cvt,dct',
            'fuel_type'    => 'in:bensin,diesel,hybrid,electric',
            'part_ids'     => 'nullable|array',
            'part_ids.*'   => 'exists:parts,id',
        ]);

        $spec = VehicleSpec::create($validated);

        if (!empty($validated['part_ids'])) {
            $spec->parts()->sync($validated['part_ids']);
        }

        return response()->json([
            'message' => 'Spesifikasi kendaraan berhasil ditambahkan',
            'spec'    => $spec->load('parts'),
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/vehicle-specs/{id}/parts",
        summary: "Sync part yang kompatibel dengan spec kendaraan (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true,
                schema: new OA\Schema(type: "integer", example: 1)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["part_ids"],
                properties: [
                    new OA\Property(
                        property: "part_ids",
                        type: "array",
                        items: new OA\Items(type: "integer"),
                        description: "List ID part yang kompatibel (akan menggantikan list sebelumnya)"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Kompatibilitas part berhasil diupdate"),
            new OA\Response(response: 404, description: "Spec tidak ditemukan"),
        ]
    )]
    public function syncSpecParts(Request $request, $id)
    {
        $spec = VehicleSpec::findOrFail($id);

        $request->validate([
            'part_ids'   => 'required|array',
            'part_ids.*' => 'exists:parts,id',
        ]);

        $spec->parts()->sync($request->part_ids);

        return response()->json([
            'message'      => 'Kompatibilitas part berhasil diupdate',
            'spec'         => $spec->load('parts'),
            'parts_count'  => $spec->parts()->count(),
        ]);
    }
}
