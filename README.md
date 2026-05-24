# Gearbox 🔧

Sistem booking & manajemen layanan bengkel mobil berbasis web.

## Tech Stack

**Backend:** Laravel 11, PHP 8.2, MySQL, Laravel Sanctum  
**Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui

## Struktur Project

```
gearbox-app/
├── backend/     # Laravel 11 API
└── frontend/    # React 19 + TypeScript
```

## Cara Menjalankan

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## ERD
Lihat folder `backend/database/` untuk skema lengkap.
