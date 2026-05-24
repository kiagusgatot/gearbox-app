# Gearbox 🔧

Sistem booking & manajemen layanan bengkel mobil berbasis web.

## Tech Stack

**Backend:** Laravel 13.11, PHP 8.4, MySQL 8.0, Laravel Sanctum  
**Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui

---

## Struktur Project

```
gearbox-app/
├── backend/     # Laravel 13 REST API
└── frontend/    # React 19 + TypeScript
```

---

## Cara Menjalankan

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
# API berjalan di http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# App berjalan di http://localhost:5173
```

---

## Dokumentasi API

Swagger UI tersedia setelah backend berjalan:

```
http://127.0.0.1:8000/api/documentation
```

Untuk detail lengkap endpoint, lihat [`backend/README.md`](./backend/README.md).
