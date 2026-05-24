<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Audit trail semua pergerakan stok
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('part_id')->constrained('parts')->cascadeOnDelete();
            $table->enum('type', ['restock', 'usage', 'correction', 'return'])
                  ->comment('restock=masuk, usage=terpakai, correction=koreksi manual, return=dikembalikan');
            $table->integer('quantity')->comment('Positif = masuk, negatif = keluar');
            $table->integer('stock_before')->comment('Stok sebelum pergerakan');
            $table->integer('stock_after')->comment('Stok setelah pergerakan');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete()
                  ->comment('Diisi jika movement terkait booking tertentu');
            $table->timestamps();
        });

        // Part yang dipakai per booking (detail pemakaian)
        Schema::create('part_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('part_id')->constrained('parts')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('price_at_usage', 12, 2)->comment('Harga part saat dipakai (snapshot)');
            $table->timestamps();

            $table->unique(['booking_id', 'part_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_usages');
        Schema::dropIfExists('stock_movements');
    }
};
