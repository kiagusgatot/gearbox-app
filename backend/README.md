# Gearbox — Backend API 🔧

> REST API untuk Sistem Booking & Manajemen Layanan Bengkel Mobil

[![Laravel](https://img.shields.io/badge/Laravel-13.11.1-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=flat&logo=php)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://mysql.com)
[![Sanctum](https://img.shields.io/badge/Sanctum-4.3.2-FF2D20?style=flat)](https://laravel.com/docs/sanctum)

---

## 📋 Deskripsi

**Gearbox** adalah sistem booking dan manajemen layanan bengkel mobil berbasis web. Backend ini menyediakan REST API yang digunakan oleh aplikasi frontend untuk:

- Mengelola layanan bengkel (jenis servis, harga, durasi)
- Mengatur jadwal ketersediaan layanan
- Memproses booking dari pelanggan
- Tracking status servis secara real-time
- Manajemen kendaraan pelanggan beserta verifikasi dokumen (plat nomor / STNK)
- Manajemen inventory suku cadang dan sinkronisasi stok otomatis

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Laravel | 13.11.1 | PHP Framework |
| PHP | 8.4 | Backend Language |
| MySQL | 8.0 | Database |
| Laravel Sanctum | 4.3.2 | API Authentication |
| L5-Swagger | latest | API Documentation |

---

## 🗄️ Database Design

### ERD

🔗 **[Lihat ERD di dbdiagram.io](https://dbdiagram.io/d/GEARBOX-ERD-69a2a47da3f0aa31e16030a4)**

### Tabel

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user dengan role admin/user |
| `vehicles` | Kendaraan milik user beserta status verifikasi |
| `vehicle_documents` | Dokumen kendaraan (plat nomor, STNK, KIR) untuk verifikasi |
| `services` | Jenis layanan bengkel |
| `service_schedules` | Jadwal ketersediaan layanan |
| `bookings` | Data booking pelanggan |
| `booking_status_histories` | Audit trail perubahan status booking |
| `reviews` | Review pelanggan setelah servis selesai |
| `parts` | Master data suku cadang (inventory) |
| `vehicle_specs` | Spesifikasi kendaraan untuk kompatibilitas suku cadang |
| `part_vehicle_specs` | Relasi many-to-many part ↔ vehicle_specs |
| `stock_movements` | Audit trail pergerakan stok masuk/keluar |
| `part_usages` | Detail suku cadang yang dipakai per booking |

### Key Design Decisions
- **Composite unique key** pada `service_schedules` — mencegah jadwal duplikat
- **cascadeOnDelete** pada semua Foreign Key
- **booking_code** auto-generate format `GBX-XXXXXXXX`
- **booking_status_histories** — audit trail lengkap setiap perubahan status
- **vehicle_documents** — verifikasi dokumen oleh admin sebelum kendaraan dinyatakan valid
- **stock_movements** — audit trail lengkap setiap pergerakan stok (restock, usage, correction)
- **part_usages** — snapshot harga suku cadang saat dipakai agar tidak terpengaruh perubahan harga di masa depan

---

## 🚀 Cara Menjalankan

### Prasyarat
- PHP >= 8.2
- Composer
- MySQL
- XAMPP / Laragon (untuk development lokal)

### Langkah Instalasi

```bash
# 1. Masuk ke folder backend (dari root monorepo)
cd backend

# 2. Install dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Generate app key
php artisan key:generate
```

### Konfigurasi Database

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearbox_db
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=file
```

### Jalankan Migration & Seeder

```bash
# Buat database gearbox_db di MySQL terlebih dahulu, lalu:
php artisan migrate --seed
```

### Setup Storage (untuk upload dokumen)

```bash
php artisan storage:link
```

### Jalankan Server

```bash
php artisan serve
# Server berjalan di http://127.0.0.1:8000
```

---

## 📚 API Documentation

Setelah server berjalan, akses **Swagger UI** di:

```
http://127.0.0.1:8000/api/documentation
```

Untuk generate ulang dokumentasi:

```bash
php artisan l5-swagger:generate
```

---

## 👥 Default Accounts (Setelah Seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@gearbox.com | password123 | Admin |
| budi@example.com | password123 | User |
| siti@example.com | password123 | User |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/register` | — | Register user baru |
| POST | `/api/login` | — | Login & mendapat token |
| POST | `/api/logout` | Token | Logout |
| GET | `/api/me` | Token | Data user yang login |

### Services
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/services` | — | List semua layanan |
| GET | `/api/services/{id}` | — | Detail layanan |
| POST | `/api/admin/services` | Admin | Tambah layanan |
| PUT | `/api/admin/services/{id}` | Admin | Update layanan |
| DELETE | `/api/admin/services/{id}` | Admin | Hapus layanan |

### Schedules
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/schedules` | — | List jadwal (filter: service_id, date, is_available) |
| GET | `/api/schedules/{id}` | — | Detail jadwal |
| POST | `/api/admin/schedules` | Admin | Tambah jadwal |
| PUT | `/api/admin/schedules/{id}` | Admin | Update jadwal |
| DELETE | `/api/admin/schedules/{id}` | Admin | Hapus jadwal |

### Vehicles
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/vehicles` | Token | List kendaraan milik user |
| GET | `/api/vehicles/{id}` | Token | Detail kendaraan beserta dokumen |
| POST | `/api/vehicles` | Token | Tambah kendaraan |
| PUT | `/api/vehicles/{id}` | Token | Update kendaraan |
| DELETE | `/api/vehicles/{id}` | Token | Hapus kendaraan |
| POST | `/api/vehicles/{id}/documents` | Token | Upload dokumen (plat nomor / STNK / KIR) |
| GET | `/api/vehicles/{id}/documents` | Token | Lihat status verifikasi dokumen |
| GET | `/api/vehicles/{id}/compatible-parts` | Token | Part yang kompatibel dengan kendaraan |

### Bookings
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/bookings` | Token | Riwayat booking user |
| GET | `/api/bookings/{id}` | Token | Detail booking + status history |
| POST | `/api/bookings` | Token | Buat booking baru |
| PUT | `/api/bookings/{id}/cancel` | Token | Batalkan booking |
| GET | `/api/admin/bookings` | Admin | Semua booking |
| PUT | `/api/admin/bookings/{id}/status` | Admin | Update status booking |
| POST | `/api/admin/bookings/{id}/parts` | Admin | Catat pemakaian suku cadang + sync stok |

### Reviews
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reviews` | — | List review (filter: service_id) |
| POST | `/api/reviews` | Token | Buat review (booking harus completed) |
| DELETE | `/api/admin/reviews/{id}` | Admin | Hapus review |

### Verifikasi Dokumen (Admin)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/vehicles/search` | Admin | Cari kendaraan by plat nomor |
| GET | `/api/admin/documents` | Admin | List semua dokumen (filter: status) |
| PUT | `/api/admin/documents/{id}/verify` | Admin | Approve / reject dokumen |

### Inventory — Suku Cadang (Admin)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/parts` | Admin | List suku cadang (filter: kategori, status, search) |
| GET | `/api/admin/parts/low-stock` | Admin | Part di bawah batas minimum stok |
| GET | `/api/admin/parts/{id}` | Admin | Detail part + riwayat stok |
| POST | `/api/admin/parts` | Admin | Tambah suku cadang baru |
| PUT | `/api/admin/parts/{id}` | Admin | Update data suku cadang |
| DELETE | `/api/admin/parts/{id}` | Admin | Hapus suku cadang |
| POST | `/api/admin/parts/{id}/restock` | Admin | Tambah stok masuk |
| POST | `/api/admin/vehicle-specs` | Admin | Tambah master spesifikasi kendaraan |
| PUT | `/api/admin/vehicle-specs/{id}/parts` | Admin | Sync part kompatibel ke spec kendaraan |

---

## 🔐 Authentication

API menggunakan **Laravel Sanctum** dengan Bearer Token.

```
Authorization: Bearer {token}
```

Token didapat setelah berhasil login melalui `POST /api/login`.

### Role-based Access

| Role | Akses |
|------|-------|
| **Public** | GET services, schedules, reviews |
| **User** | Semua public + kelola vehicles & dokumen, bookings, reviews |
| **Admin** | Semua user + CRUD services & schedules + kelola booking + verifikasi dokumen + inventory |

---

## ✅ Testing

API sudah ditest menggunakan **Postman** dengan **25 skenario** — semua lulus 100%.

| Kategori | Skenario |
|----------|----------|
| Auth & User Flow | Register, Login, Me, Logout |
| CRUD & Business Logic | Create booking + GBX-code auto-generate |
| Slot Validation | Booking jadwal penuh → 422 |
| Security | User akses admin → 403, Review duplikat → 422 |

---

## 📁 Struktur Project

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # AuthController, BookingController, InventoryController, dst.
│   │   ├── Middleware/         # RoleMiddleware
│   │   └── Requests/           # Form Request Validation
│   └── Models/                 # Eloquent Models (13 model)
├── database/
│   ├── migrations/             # 13 file migration
│   └── seeders/                # UserSeeder, ServiceSeeder, ScheduleSeeder
└── routes/
    └── api.php                 # 48 API routes
```

---

## 📄 License

Project ini dibuat untuk keperluan Final Project Bootcamp Full Stack Web Development — Dibimbing.id
