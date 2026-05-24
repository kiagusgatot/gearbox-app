<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'     => 'Admin Gearbox',
            'email'    => 'admin@gearbox.com',
            'password' => Hash::make('password123'),
            'phone'    => '081234567890',
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Budi Santoso',
            'email'    => 'budi@example.com',
            'password' => Hash::make('password123'),
            'phone'    => '089876543210',
            'role'     => 'user',
        ]);

        User::create([
            'name'     => 'Siti Rahayu',
            'email'    => 'siti@example.com',
            'password' => Hash::make('password123'),
            'phone'    => '082345678901',
            'role'     => 'user',
        ]);
    }
}