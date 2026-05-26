# Gearbox 🔧

> Sistem Booking & Manajemen Layanan Bengkel Mobil Berbasis Web

[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://mysql.com)

---

## 🧱 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 13, PHP 8.4, MySQL 8.0 |
| **Auth** | Laravel Sanctum (token-based) |
| **WebSocket** | Laravel Reverb + Laravel Echo |
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS + Plus Jakarta Sans |

---

## 📁 Struktur Project

```
gearbox-app/
├── backend/     # Laravel 13 REST API + WebSocket server
└── frontend/    # React 19 SPA
```

---

## 🚀 Cara Menjalankan

Butuh **4 terminal** berjalan bersamaan:

```bash
# Terminal 1 — Laravel API
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve

# Terminal 2 — WebSocket server
cd backend
php artisan reverb:start

# Terminal 3 — Queue worker
cd backend
php artisan queue:work

# Terminal 4 — Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Frontend | http://localhost:5173 |
| WebSocket | ws://localhost:8080 |
| Swagger | http://localhost:8000/api/documentation |

---

## 👥 Akun Demo

| Email | Password | Role |
|-------|----------|------|
| admin@gearbox.com | password123 | Admin |
| budi@example.com | password123 | User |

---

## 📚 Dokumentasi Lengkap

- [Backend README](./backend/README.md) — API endpoints, database schema, sistem antrian
- [Frontend README](./frontend/README.md) — Struktur komponen, routing, design system, WebSocket

---

## 📄 License

Final Project Bootcamp Full Stack Web Development — Dibimbing.id
