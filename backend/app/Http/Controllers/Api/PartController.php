<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use Illuminate\Http\Request;

class PartController extends Controller
{
    public function index(Request $request)
    {
        $parts = Part::when($request->search, fn($q) =>
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('sku', 'like', "%{$request->search}%")
        )
        ->when($request->category, fn($q) =>
            $q->where('category', $request->category)
        )
        ->orderBy('name')
        ->paginate(20);

        return response()->json($parts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku'       => 'required|string|unique:parts,sku',
            'name'      => 'required|string|max:255',
            'category'  => 'required|string',
            'unit'      => 'required|string',
            'price'     => 'required|integer|min:0',
            'stock'     => 'nullable|integer|min:0',
            'min_stock' => 'nullable|integer|min:0',
        ]);

        $part = Part::create([
            ...$validated,
            'stock'     => $validated['stock']     ?? 0,
            'min_stock' => $validated['min_stock'] ?? 5,
        ]);

        return response()->json($part, 201);
    }

    public function update(Request $request, $id)
    {
        $part = Part::findOrFail($id);

        $validated = $request->validate([
            'sku'       => "required|string|unique:parts,sku,{$id}",
            'name'      => 'required|string|max:255',
            'category'  => 'required|string',
            'unit'      => 'required|string',
            'price'     => 'required|integer|min:0',
            'min_stock' => 'nullable|integer|min:0',
        ]);

        $part->update($validated);

        return response()->json($part);
    }

    public function destroy($id)
    {
        Part::findOrFail($id)->delete();
        return response()->json(['message' => 'Suku cadang berhasil dihapus.']);
    }

    public function restock(Request $request, $id)
    {
        $part = Part::findOrFail($id);

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $part->increment('stock', $validated['quantity']);

        return response()->json([
            'message' => "Stok berhasil ditambah {$validated['quantity']} {$part->unit}.",
            'part'    => $part->fresh(),
        ]);
    }

    public function lowStock()
    {
        $parts = Part::whereRaw('stock <= min_stock')->orderBy('stock')->get();
        return response()->json(['data' => $parts]);
    }
}
