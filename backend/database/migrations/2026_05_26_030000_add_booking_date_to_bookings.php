<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->date('booking_date')->nullable()->after('bay_number');
        });

        // Backfill: isi booking_date dari created_at untuk data lama
        DB::statement("UPDATE bookings SET booking_date = DATE(created_at) WHERE booking_date IS NULL");
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('booking_date');
        });
    }
};
