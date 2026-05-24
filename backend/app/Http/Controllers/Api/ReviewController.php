<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Booking;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ReviewController extends Controller
{
    #[OA\Get(
        path: "/api/reviews",
        summary: "Get semua review (public)",
        tags: ["Reviews"],
        parameters: [
            new OA\Parameter(
                name: "service_id",
                in: "query",
                required: false,
                description: "Filter berdasarkan ID layanan",
                schema: new OA\Schema(type: "integer", example: 1)
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
                description: "List review dengan pagination",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "current_page", type: "integer", example: 1),
                        new OA\Property(property: "data", type: "array",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "booking_id", type: "integer", example: 1),
                                    new OA\Property(property: "service_id", type: "integer", example: 1),
                                    new OA\Property(property: "rating", type: "integer", example: 5),
                                    new OA\Property(property: "comment", type: "string",
                                        example: "Pelayanan sangat memuaskan!"),
                                    new OA\Property(property: "user", type: "object"),
                                    new OA\Property(property: "service", type: "object"),
                                ]
                            )
                        ),
                        new OA\Property(property: "total", type: "integer", example: 10),
                    ]
                )
            ),
        ]
    )]
    // GET /api/reviews?service_id=1
    public function index(Request $request)
    {
        $query = Review::with(['user', 'service']);

        if ($request->has('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        $reviews = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('limit', 10));

        return response()->json($reviews);
    }

    #[OA\Post(
        path: "/api/reviews",
        summary: "Buat review untuk booking yang sudah completed",
        description: "Review hanya bisa dibuat untuk booking dengan status 'completed'. Setiap booking hanya bisa direview 1 kali.",
        tags: ["Reviews"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["booking_id", "rating"],
                properties: [
                    new OA\Property(property: "booking_id", type: "integer", example: 1,
                        description: "ID booking yang sudah completed"),
                    new OA\Property(property: "rating", type: "integer", example: 5,
                        description: "Rating 1-5"),
                    new OA\Property(property: "comment", type: "string",
                        example: "Pelayanan sangat memuaskan, mekanik profesional!"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Review berhasil ditambahkan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string",
                            example: "Review berhasil ditambahkan"),
                        new OA\Property(property: "review", type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "booking_id", type: "integer", example: 1),
                                new OA\Property(property: "service_id", type: "integer", example: 1),
                                new OA\Property(property: "rating", type: "integer", example: 5),
                                new OA\Property(property: "comment", type: "string"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 404, description: "Booking tidak ditemukan"),
            new OA\Response(response: 422, description: "Booking belum completed atau sudah pernah direview"),
        ]
    )]
    // POST /api/reviews — user buat review setelah booking completed
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        // Pastikan booking milik user sendiri
        $booking = Booking::where('user_id', $request->user()->id)
                          ->findOrFail($validated['booking_id']);

        // Hanya bisa review kalau status completed
        if ($booking->status !== 'completed') {
            return response()->json([
                'message' => 'Hanya booking yang sudah selesai yang bisa direview.'
            ], 422);
        }

        // Cek apakah sudah pernah review
        $existingReview = Review::where('booking_id', $validated['booking_id'])->first();
        if ($existingReview) {
            return response()->json([
                'message' => 'Booking ini sudah pernah direview.'
            ], 422);
        }

        $review = Review::create([
            'booking_id' => $validated['booking_id'],
            'service_id' => $booking->service_id,
            'user_id'    => $request->user()->id,
            'rating'     => $validated['rating'],
            'comment'    => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Review berhasil ditambahkan',
            'review'  => $review->load(['user', 'service']),
        ], 201);
    }

    #[OA\Delete(
        path: "/api/admin/reviews/{id}",
        summary: "Hapus review (Admin)",
        tags: ["Admin"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID review",
                schema: new OA\Schema(type: "integer", example: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Review berhasil dihapus",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string",
                            example: "Review berhasil dihapus"),
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated"),
            new OA\Response(response: 403, description: "Unauthorized — bukan admin"),
            new OA\Response(response: 404, description: "Review tidak ditemukan"),
        ]
    )]
    // DELETE /api/admin/reviews/{id} — admin hapus review
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json([
            'message' => 'Review berhasil dihapus',
        ]);
    }
}
