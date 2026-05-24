<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->enum('type', ['plat_nomor', 'stnk', 'kir'])->comment('Jenis dokumen kendaraan');
            $table->string('file_path')->comment('Path file di storage');
            $table->string('file_name')->comment('Nama file asli');
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->text('notes')->nullable()->comment('Catatan dari admin saat verifikasi');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            // Satu kendaraan hanya bisa punya satu dokumen per jenis
            $table->unique(['vehicle_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_documents');
    }
};
