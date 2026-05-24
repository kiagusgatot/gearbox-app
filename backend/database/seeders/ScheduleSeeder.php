<?php

namespace Database\Seeders;

use App\Models\ServiceSchedule;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        for ($day = 0; $day < 7; $day++) {
            $date = $today->copy()->addDays($day);

            // Skip Minggu
            if ($date->isSunday()) continue;

            for ($serviceId = 1; $serviceId <= 5; $serviceId++) {
                $slots = [
                    ['start' => '08:00', 'end' => '10:00'],
                    ['start' => '10:00', 'end' => '12:00'],
                    ['start' => '13:00', 'end' => '15:00'],
                    ['start' => '15:00', 'end' => '17:00'],
                ];

                foreach ($slots as $slot) {
                    ServiceSchedule::create([
                        'service_id'   => $serviceId,
                        'date'         => $date->format('Y-m-d'),
                        'start_time'   => $slot['start'],
                        'end_time'     => $slot['end'],
                        'capacity'     => 3,
                        'booked_count' => 0,
                        'is_available' => true,
                    ]);
                }
            }
        }
    }
}