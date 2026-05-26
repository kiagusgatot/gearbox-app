# Gearbox — Backend API 🔧

> REST API untuk Sistem Booking & Manajemen Layanan Bengkel Mobil

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=flat&logo=php)](https://php.net)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://mysql.com)
[![Sanctum](https://img.shields.io/badge/Sanctum-Auth-FF2D20?style=flat)](https://laravel.com/docs/sanctum)
[![Reverb](https://img.shields.io/badge/Reverb-WebSocket-6366F1?style=flat)](https://reverb.laravel.com)

---

## 📋 Deskripsi

**Gearbox** adalah sistem booking dan manajemen layanan bengkel mobil berbasis web. Backend ini menyediakan REST API dan WebSocket real-time yang digunakan oleh aplikasi frontend untuk:

- Autentikasi berbasis token dengan role `admin` / `user`
- Manajemen layanan bengkel (kategori, harga, durasi)
- Sistem antrian otomatis dengan 6 bay dan nomor antrian `GBX-DDMMYY-001`
- Booking multi-layanan per sesi dengan kalkulasi durasi & harga otomatis
- Tracking status servis real-time via WebSocket (Laravel Reverb)
- Manajemen kendaraan & verifikasi dokumen (STNK, KIR, Plat Nomor)
- Inventory suku cadang dengan alert low stock
- Monitor antrian harian per bay

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Laravel | 13 | PHP Framework |
| PHP | 8.4 | Backend Language |
| MySQL | 8.0 | Database |
| Laravel Sanctum | 4.x | Token Authentication |
| Laravel Reverb | 1.x | WebSocket Server |
| Laravel Queue | — | Async Job Processing |

---

## 🗄️ Database

### Tabel

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user dengan role `admin` / `user` |
| `vehicles` | Kendaraan milik user, field `is_verified` |
| `vehicle_documents` | Dokumen kendaraan (plat_nomor, stnk, kir) |
| `services` | Jenis layanan bengkel (nama, kategori, harga, durasi) |
| `service_schedules` | Jadwal ketersediaan layanan (legacy) |
| `bookings` | Data booking dengan `booking_date`, `queue_number`, `bay_number` |
| `booking_services` | Pivot multi-layanan per booking |
| `booking_status_histories` | Audit trail perubahan status |
| `reviews` | Review pelanggan setelah servis selesai |
| `parts` | Inventory suku cadang dengan SKU & min stock |
| `stock_movements` | Riwayat perubahan stok |
| `part_usages` | Pemakaian suku cadang per booking |
| `personal_access_tokens` | Token Sanctum |

### Key Design Decisions
- **`booking_date`** — field eksplisit untuk tanggal booking (bukan `created_at`) agar timezone-safe
- **`queue_number`** — format `GBX-DDMMYY-001`, di-generate otomatis saat booking dibuat
- **`bay_number`** + **`estimated_start`** / **`estimated_end`** — dihitung otomatis oleh `findEarliestSlot()`
- **`booking_services`** — pivot agar satu booking bisa mencakup banyak layanan sekaligus
- **Cascade delete** pada semua foreign key

---

## ⚙️ Sistem Antrian

| Parameter | Nilai |
|-----------|-------|
| Jam operasional | 09:00 – 18:00 |
| Batas booking | 14:00 |
| Jumlah bay | 6 |
| Format nomor antrian | `GBX-DDMMYY-001` |
| Kapasitas maks | ~36 kendaraan/hari |

Logika antrian ada di `App\Models\Booking`:
- `findEarliestSlot($date, $duration)` — cari bay & jam paling awal tersedia
- `getDailyCapacity($date)` — hitung kapasitas & penggunaan per tanggal
- `generateQueueNumber($date)` — generate nomor antrian format `GBX-DDMMYY-XXX`

---

## 📡 WebSocket Events

| Event | Channel | Trigger |
|-------|---------|---------|
| `NewBookingCreated` | `private-admin.bookings` | Booking baru masuk |
| `BookingStatusUpdated` | `private-user.{id}` + `private-admin.bookings` | Status booking berubah |
| `QueueUpdated` | `queue.{date}` | Perubahan kapasitas antrian |

---

## 🚀 Instalasi & Setup

### Prasyarat
- PHP >= 8.2
- Composer
- MySQL 8.0
- Node.js (untuk Laravel Reverb)

### Langkah Instalasi

```bash
# 1. Masuk ke folder backend
cd gearbox-app/backend

# 2. Install dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Generate app key
php artisan key:generate
```

### Konfigurasi `.env`

```env
APP_NAME=Gearbox
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearbox_db
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=file
QUEUE_CONNECTION=database

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:5173

# Reverb WebSocket
REVERB_APP_ID=gearbox
REVERB_APP_KEY=gearbox-key
REVERB_APP_SECRET=gearbox-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

BROADCAST_CONNECTION=reverb
```

### Migration & Seeder

```bash
# Buat database gearbox_db di MySQL, lalu:
php artisan migrate

# Seed data awal (users, services, schedules)
php artisan db:seed

# Seed suku cadang inventory (42 item)
php artisan db:seed --class=PartSeeder
```

### Menjalankan Server

Butuh **4 terminal** berjalan bersamaan:

```bash
# Terminal 1 — Laravel API server
php artisan serve

# Terminal 2 — WebSocket server (Reverb)
php artisan reverb:start

# Terminal 3 — Queue worker
php artisan queue:work

# Terminal 4 — Frontend (dari folder frontend)
npm run dev
```

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/register` | — | Register user baru |
| POST | `/api/login` | — | Login & dapat token |
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

### Vehicles & Documents

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/vehicles` | Token | List kendaraan milik user |
| POST | `/api/vehicles` | Token | Tambah kendaraan |
| PUT | `/api/vehicles/{id}` | Token | Update kendaraan |
| DELETE | `/api/vehicles/{id}` | Token | Hapus kendaraan |
| GET | `/api/vehicles/{id}/documents` | Token | List dokumen kendaraan |
| POST | `/api/vehicles/{id}/documents` | Token | Upload dokumen |
| GET | `/api/admin/documents` | Admin | Semua dokumen (filter by status) |
| PUT | `/api/admin/documents/{id}/verify` | Admin | Approve / tolak dokumen |

### Bookings

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/bookings/availability` | Token | Cek ketersediaan slot |
| GET | `/api/bookings/calendar` | Token | Data kalender per range tanggal |
| GET | `/api/bookings` | Token | Riwayat booking user |
| GET | `/api/bookings/{id}` | Token | Detail booking |
| POST | `/api/bookings` | Token | Buat booking (multi-layanan) |
| PUT | `/api/bookings/{id}/cancel` | Token | Batalkan booking |
| GET | `/api/admin/bookings` | Admin | Semua booking (filter status + date) |
| PUT | `/api/admin/bookings/{id}/status` | Admin | Update status booking |

### Queue Monitor

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/queue` | Admin | Monitor antrian harian per bay |

### Inventory (Parts)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/parts` | Admin | List semua suku cadang |
| GET | `/api/admin/parts/low-stock` | Admin | List suku cadang stok rendah |
| POST | `/api/admin/parts` | Admin | Tambah suku cadang |
| PUT | `/api/admin/parts/{id}` | Admin | Update suku cadang |
| DELETE | `/api/admin/parts/{id}` | Admin | Hapus suku cadang |
| POST | `/api/admin/parts/{id}/restock` | Admin | Tambah stok |

### Customers & Reviews

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/admin/customers` | Admin | List pelanggan (search) |
| GET | `/api/admin/customers/{id}` | Admin | Detail pelanggan + kendaraan + booking |
| GET | `/api/reviews` | — | List review |
| POST | `/api/reviews` | Token | Buat review |
| DELETE | `/api/admin/reviews/{id}` | Admin | Hapus review |

---

## 🔐 Autentikasi

API menggunakan **Laravel Sanctum** dengan Bearer Token:

```
Authorization: Bearer {token}
```

### Role-based Access

| Role | Akses |
|------|-------|
| **Public** | GET services, schedules, reviews |
| **User** | Public + kelola vehicles, documents, bookings, reviews |
| **Admin** | User + semua endpoint `/api/admin/*` |

---

## 👥 Akun Default (Setelah Seeder)

| Email | Password | Role |
|-------|----------|------|
| admin@gearbox.com | password123 | Admin |
| budi@example.com | password123 | User |
| siti@example.com | password123 | User |

---

## 📁 Struktur Project

```
backend/
├── app/
│   ├── Events/                    # NewBookingCreated, BookingStatusUpdated, QueueUpdated
│   ├── Http/
│   │   ├── Controllers/Api/       # AuthController, BookingController, PartController, dst.
│   │   └── Middleware/            # RoleMiddleware
│   └── Models/                    # Booking (queue logic), Vehicle, Part, dst.
├── bootstrap/
│   └── app.php                    # Daftarkan channels.php untuk broadcasting
├── config/
│   └── cors.php                   # Izinkan localhost:5173 + broadcasting/auth
├── database/
│   ├── migrations/                # 12 file migration
│   └── seeders/                   # UserSeeder, ServiceSeeder, PartSeeder
└── routes/
    ├── api.php                    # Semua API routes
    └── channels.php               # WebSocket channel authorization
```

---

## 📄 License

Project ini dibuat untuk keperluan Final Project Bootcamp Full Stack Web Development — Dibimbing.id
