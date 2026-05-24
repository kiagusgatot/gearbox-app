<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('capacity');
            $table->integer('booked_count')->default(0);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['service_id', 'date', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_schedules');
    }
};