<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom queue ke tabel bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('queue_number')->nullable()->after('booking_code');
            $table->integer('bay_number')->nullable()->after('queue_number');
            $table->time('estimated_start')->nullable()->after('bay_number');
            $table->time('estimated_end')->nullable()->after('estimated_start');
            $table->integer('total_duration')->nullable()->after('estimated_end'); // menit
            // service_id jadi nullable karena multi layanan
            $table->unsignedBigInteger('service_id')->nullable()->change();
        });

        // 2. Tabel pivot booking_services (multi layanan per booking)
        Schema::create('booking_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->integer('price');
            $table->integer('duration_minutes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_services');
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['queue_number','bay_number','estimated_start','estimated_end','total_duration']);
            $table->unsignedBigInteger('service_id')->nullable(false)->change();
        });
    }
};
