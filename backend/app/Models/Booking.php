<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Booking extends Model
{
    protected $fillable = [
        'user_id', 'vehicle_id', 'service_id', 'schedule_id',
        'booking_code', 'queue_number', 'bay_number', 'booking_date',
        'estimated_start', 'estimated_end', 'total_duration',
        'status', 'total_price', 'notes',
    ];

    protected $casts = [
        'booking_date' => 'date',
    ];

    // ── Relasi ────────────────────────────────────────────────────────────────

    public function user()           { return $this->belongsTo(User::class); }
    public function vehicle()        { return $this->belongsTo(Vehicle::class); }
    public function service()        { return $this->belongsTo(Service::class); }
    public function schedule()       { return $this->belongsTo(ServiceSchedule::class, 'schedule_id'); }
    public function review()         { return $this->hasOne(Review::class); }
    public function statusHistories(){ return $this->hasMany(BookingStatusHistory::class); }

    public function bookingServices()
    {
        return $this->hasMany(BookingService::class)->with('service');
    }

    // ── Konstanta operasional ─────────────────────────────────────────────────

    const OPEN_TIME    = '09:00';
    const CLOSE_TIME   = '18:00';
    const LAST_BOOKING = '14:00';
    const TOTAL_BAYS   = 6;
    const QUEUE_PREFIX = 'GBX';

    // ── Logic queue ───────────────────────────────────────────────────────────

    /**
     * Cari bay dan jam mulai paling cepat tersedia
     */
    public static function findEarliestSlot(string $date, int $totalDuration): ?array
    {
        $openMinutes  = self::timeToMinutes(self::OPEN_TIME);
        $closeMinutes = self::timeToMinutes(self::CLOSE_TIME);
        $lastBooking  = self::timeToMinutes(self::LAST_BOOKING);

        // Gunakan booking_date untuk query — lebih akurat dari created_at
        $bookings = self::where('booking_date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->whereNotNull('bay_number')
            ->whereNotNull('estimated_end')
            ->get(['bay_number', 'estimated_start', 'estimated_end']);

        // Hitung jam selesai terakhir per bay
        $bayEndTimes = [];
        for ($bay = 1; $bay <= self::TOTAL_BAYS; $bay++) {
            $bayEndTimes[$bay] = $openMinutes;
        }

        foreach ($bookings as $b) {
            $endMin = self::timeToMinutes($b->estimated_end);
            if ($endMin > ($bayEndTimes[$b->bay_number] ?? $openMinutes)) {
                $bayEndTimes[$b->bay_number] = $endMin;
            }
        }

        // Cari bay dengan waktu selesai paling awal
        asort($bayEndTimes);

        foreach ($bayEndTimes as $bay => $startMin) {
            $endMin = $startMin + $totalDuration;

            if ($startMin > $lastBooking) continue;
            if ($endMin > $closeMinutes) continue;

            return [
                'bay'   => $bay,
                'start' => self::minutesToTime($startMin),
                'end'   => self::minutesToTime($endMin),
            ];
        }

        return null;
    }

    /**
     * Hitung kapasitas dan penggunaan untuk sebuah tanggal
     */
    public static function getDailyCapacity(string $date): array
    {
        $openMin          = self::timeToMinutes(self::OPEN_TIME);
        $closeMin         = self::timeToMinutes(self::CLOSE_TIME);
        $totalCapacityMin = ($closeMin - $openMin) * self::TOTAL_BAYS;

        // Gunakan booking_date
        $bookings = self::where('booking_date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->whereNotNull('total_duration')
            ->get(['bay_number', 'estimated_start', 'estimated_end', 'total_duration']);

        $usedMinutes = $bookings->sum('total_duration');
        $queueCount  = $bookings->count();
        $nextSlot    = self::findEarliestSlot($date, 30);

        return [
            'date'             => $date,
            'total_bays'       => self::TOTAL_BAYS,
            'queue_count'      => $queueCount,
            'used_minutes'     => $usedMinutes,
            'capacity_minutes' => $totalCapacityMin,
            'is_available'     => $nextSlot !== null,
            'open_time'        => self::OPEN_TIME,
            'close_time'       => self::CLOSE_TIME,
            'last_booking'     => self::LAST_BOOKING,
        ];
    }

    /**
     * Generate nomor antrian — pakai booking_date
     */
    public static function generateQueueNumber(string $date): string
    {
        $dateFormatted = Carbon::parse($date)->format('dmy');
        $count = self::where('booking_date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->count() + 1;

        return sprintf('%s-%s-%03d', self::QUEUE_PREFIX, $dateFormatted, $count);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    public static function timeToMinutes(string $time): int
    {
        [$h, $m] = explode(':', $time);
        return ((int)$h * 60) + (int)$m;
    }

    public static function minutesToTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}
