<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * List semua pelanggan (role = user) dengan statistik booking
     */
    public function index(Request $request)
    {
        $search = $request->query('search');

        $customers = User::where('role', 'user')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%")
                       ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->withCount('bookings')
            ->with([
                'bookings' => fn($q) => $q->latest()->limit(1),
                'vehicles' => fn($q) => $q->select('id', 'user_id', 'plate_number', 'brand', 'model', 'type'),
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($customers);
    }

    /**
     * Detail satu pelanggan beserta kendaraan dan riwayat booking
     */
    public function show($id)
    {
        $customer = User::where('role', 'user')
            ->withCount('bookings')
            ->with([
                'vehicles.documents',
                'bookings' => fn($q) => $q->with(['service', 'schedule'])
                                          ->latest()
                                          ->limit(10),
            ])
            ->findOrFail($id);

        return response()->json($customer);
    }
}
