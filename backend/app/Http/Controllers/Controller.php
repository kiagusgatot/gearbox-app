<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: "Gearbox API",
    version: "1.0.0",
    description: "REST API untuk Sistem Booking & Manajemen Layanan Bengkel Mobil",
    contact: new OA\Contact(email: "admin@gearbox.com")
)]
#[OA\Server(
    url: "http://127.0.0.1:8000",
    description: "Local Development Server"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Masukkan token dari response login"
)]
#[OA\Tag(name: "Auth", description: "Register, Login, Logout")]
#[OA\Tag(name: "Services", description: "Manajemen layanan bengkel")]
#[OA\Tag(name: "Schedules", description: "Manajemen jadwal layanan")]
#[OA\Tag(name: "Vehicles", description: "Manajemen kendaraan user")]
#[OA\Tag(name: "Bookings", description: "Booking layanan")]
#[OA\Tag(name: "Reviews", description: "Review setelah servis selesai")]
#[OA\Tag(name: "Admin", description: "Endpoint khusus admin")]
abstract class Controller
{
    //
}