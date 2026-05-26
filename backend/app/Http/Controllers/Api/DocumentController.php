<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    /**
     * Upload dokumen kendaraan (user)
     * POST /api/vehicles/{vehicleId}/documents
     */
    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::where('user_id', $request->user()->id)->findOrFail($vehicleId);

        $validated = $request->validate([
            'type' => 'required|in:plat_nomor,stnk,kir',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $filePath = $file->store("documents/vehicle_{$vehicleId}", 'public');

        // Hapus dokumen lama dengan tipe yang sama jika ada
        VehicleDocument::where('vehicle_id', $vehicleId)
            ->where('type', $validated['type'])
            ->delete();

        $document = VehicleDocument::create([
            'vehicle_id' => $vehicleId,
            'type'       => $validated['type'],
            'file_path'  => $filePath,
            'file_name'  => $fileName,
            'status'     => 'pending',
            'notes'      => null,
        ]);

        return response()->json($document, 201);
    }

    /**
     * List dokumen milik user
     * GET /api/vehicles/{vehicleId}/documents
     */
    public function index(Request $request, $vehicleId)
    {
        $vehicle   = Vehicle::where('user_id', $request->user()->id)->findOrFail($vehicleId);
        $documents = VehicleDocument::where('vehicle_id', $vehicleId)->get();

        return response()->json($documents);
    }

    /**
     * List semua dokumen untuk admin, filter by status
     * GET /api/admin/documents?status=pending
     */
    public function adminIndex(Request $request)
    {
        $status = $request->query('status', 'pending');

        $documents = VehicleDocument::with('vehicle.user')
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    /**
     * Approve atau tolak dokumen (admin)
     * PUT /api/admin/documents/{id}/verify
     */
    public function verify(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes'  => 'nullable|string|max:500',
        ]);

        $document = VehicleDocument::with('vehicle')->findOrFail($id);
        $document->update([
            'status' => $validated['status'],
            'notes'  => $validated['notes'] ?? null,
        ]);

        // Jika semua dokumen kendaraan verified, set is_verified = true
        if ($validated['status'] === 'verified') {
            $vehicle       = $document->vehicle;
            $allVerified   = VehicleDocument::where('vehicle_id', $vehicle->id)
                ->where('status', '!=', 'verified')
                ->doesntExist();

            if ($allVerified && VehicleDocument::where('vehicle_id', $vehicle->id)->exists()) {
                $vehicle->update(['is_verified' => true]);
            }
        }

        return response()->json([
            'message'  => $validated['status'] === 'verified' ? 'Dokumen disetujui.' : 'Dokumen ditolak.',
            'document' => $document,
        ]);
    }
}
