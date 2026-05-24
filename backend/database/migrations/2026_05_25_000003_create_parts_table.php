<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parts', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique()->comment('Kode unik suku cadang');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['mesin', 'kelistrikan', 'bodi', 'ac', 'ban', 'lainnya']);
            $table->string('brand')->nullable()->comment('Merek suku cadang');
            $table->string('unit')->default('pcs')->comment('Satuan: pcs, liter, set, dll');
            $table->decimal('price', 12, 2)->comment('Harga jual ke customer');
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(5)->comment('Batas minimum stok untuk peringatan');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parts');
    }
};
