<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel master spesifikasi kendaraan
        Schema::create('vehicle_specs', function (Blueprint $table) {
            $table->id();
            $table->string('brand')->comment('Merek: Toyota, Honda, dll');
            $table->string('model')->comment('Model: Avanza, Jazz, dll');
            $table->year('year_from')->comment('Tahun produksi mulai berlaku');
            $table->year('year_to')->nullable()->comment('Tahun produksi akhir, null = masih diproduksi');
            $table->string('engine_type')->nullable()->comment('Tipe mesin: 1NZ-FE, K20A, dll');
            $table->enum('transmission', ['manual', 'automatic', 'cvt', 'dct'])->nullable();
            $table->enum('fuel_type', ['bensin', 'diesel', 'hybrid', 'electric'])->default('bensin');
            $table->timestamps();

            $table->unique(['brand', 'model', 'year_from', 'engine_type']);
        });

        // Tabel pivot: part ↔ vehicle_spec (many-to-many)
        Schema::create('part_vehicle_specs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('part_id')->constrained('parts')->cascadeOnDelete();
            $table->foreignId('vehicle_spec_id')->constrained('vehicle_specs')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['part_id', 'vehicle_spec_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_vehicle_specs');
        Schema::dropIfExists('vehicle_specs');
    }
};
