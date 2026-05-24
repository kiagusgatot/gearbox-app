<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name'             => 'Ganti Oli Mesin',
                'description'      => 'Penggantian oli mesin dengan oli berkualitas tinggi',
                'price'            => 150000,
                'duration_minutes' => 30,
                'category'         => 'mesin',
                'status'           => 'active',
            ],
            [
                'name'             => 'Tune Up Mesin',
                'description'      => 'Perawatan menyeluruh mesin untuk performa optimal',
                'price'            => 350000,
                'duration_minutes' => 90,
                'category'         => 'mesin',
                'status'           => 'active',
            ],
            [
                'name'             => 'Servis AC Mobil',
                'description'      => 'Pembersihan dan pengisian freon AC mobil',
                'price'            => 250000,
                'duration_minutes' => 60,
                'category'         => 'ac',
                'status'           => 'active',
            ],
            [
                'name'             => 'Perbaikan Kelistrikan',
                'description'      => 'Diagnosa dan perbaikan sistem kelistrikan kendaraan',
                'price'            => 200000,
                'duration_minutes' => 60,
                'category'         => 'kelistrikan',
                'status'           => 'active',
            ],
            [
                'name'             => 'Perbaikan Bodi',
                'description'      => 'Perbaikan penyok dan pengecatan bodi kendaraan',
                'price'            => 500000,
                'duration_minutes' => 180,
                'category'         => 'bodi',
                'status'           => 'active',
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}