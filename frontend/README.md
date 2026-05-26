# Gearbox — Frontend 🖥️

> Aplikasi Web Booking & Manajemen Layanan Bengkel Mobil

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)

---

## 📋 Deskripsi

Frontend aplikasi **Gearbox** — SPA (Single Page Application) yang terhubung ke Laravel API backend. Mencakup dua interface utama:

- **Customer Portal** — booking layanan, pantau status servis real-time, kelola kendaraan & dokumen
- **Admin Panel** — kelola booking, layanan, inventory, pelanggan, verifikasi dokumen, dan monitor antrian harian

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 19 | UI Framework |
| TypeScript | 5 | Type Safety |
| Vite | 6 | Build Tool & Dev Server |
| React Router | v6 | Client-side Routing |
| Laravel Echo | 1.x | WebSocket Client |
| Pusher JS | 8.x | WebSocket Transport |
| date-fns | 4.x | Format Tanggal |
| Lucide React | 0.x | Icon Library |

**Font:** Plus Jakarta Sans (semua UI) · JetBrains Mono (kode booking & plat nomor)

---

## 🚀 Instalasi & Setup

### Prasyarat
- Node.js >= 18
- npm / yarn
- Backend Gearbox berjalan di `localhost:8000`

### Langkah Instalasi

```bash
# 1. Masuk ke folder frontend
cd gearbox-app/frontend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
```

### Konfigurasi `.env`

```env
VITE_API_URL=http://localhost:8000/api

VITE_REVERB_APP_KEY=gearbox-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

### Jalankan Dev Server

```bash
npm run dev
# Berjalan di http://localhost:5173
```

### Build Production

```bash
npm run build
npm run preview
```

---

## 📁 Struktur Project

```
frontend/src/
├── components/
│   └── shared/
│       ├── AdminLayout.tsx      # Layout wrapper responsive admin panel
│       ├── Sidebar.tsx          # Sidebar sticky desktop + drawer mobile
│       ├── Modal.tsx            # Reusable modal (ESC, overlay click, scroll lock)
│       ├── ConfirmDialog.tsx    # Dialog konfirmasi (danger/warning/success/info)
│       └── Toast.tsx            # Notifikasi toast auto-dismiss 5 detik
├── context/
│   └── AuthContext.tsx          # Auth state global (login, logout, user, role)
├── hooks/
│   ├── useAdminBookings.ts      # WebSocket: booking baru + status update (admin)
│   ├── useBookingStatus.ts      # WebSocket: status update milik user
│   └── useQueueCapacity.ts      # WebSocket: update kapasitas kalender
├── pages/
│   ├── auth/
│   │   ├── Login.tsx            # Halaman login (split layout responsive)
│   │   └── Register.tsx         # Halaman register
│   ├── admin/
│   │   ├── Dashboard.tsx        # Stat cards + tabel booking terbaru + real-time
│   │   ├── Bookings.tsx         # Manajemen booking (filter status + tanggal)
│   │   ├── Services.tsx         # CRUD layanan + kategori dinamis
│   │   ├── Schedules.tsx        # Monitor antrian harian per bay
│   │   ├── Customers.tsx        # List pelanggan + modal detail
│   │   ├── Documents.tsx        # Verifikasi dokumen kendaraan
│   │   └── Reports.tsx          # Inventory suku cadang + restock
│   └── customer/
│       ├── ServiceList.tsx      # List layanan + booking langsung
│       ├── BookingHistory.tsx   # Riwayat booking + real-time status
│       └── Vehicles.tsx         # Kelola kendaraan + upload dokumen
├── services/
│   ├── api.ts                   # Axios instance + interceptor token
│   ├── authService.ts           # Login, register, logout, me
│   ├── bookingService.ts        # Booking CRUD + availability + calendar
│   ├── serviceService.ts        # Layanan bengkel
│   ├── vehicleService.ts        # Kendaraan + dokumen admin
│   └── formatPrice.ts           # Format Rupiah
├── echo.ts                      # Laravel Echo + Reverb config + custom authorizer
├── App.tsx                      # Route definitions + role guard
└── main.tsx                     # Entry point
```

---

## 🗺️ Routing

| Path | Komponen | Akses |
|------|----------|-------|
| `/` | Redirect | Tamu → `/login`, User → `/services`, Admin → `/admin` |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/services` | ServiceList | User |
| `/bookings` | BookingHistory | User |
| `/vehicles` | Vehicles | User |
| `/admin` | Dashboard | Admin |
| `/admin/bookings` | Bookings | Admin |
| `/admin/services` | Services | Admin |
| `/admin/schedules` | Schedules | Admin |
| `/admin/customers` | Customers | Admin |
| `/admin/documents` | Documents | Admin |
| `/admin/inventory` | Reports | Admin |

---

## 🎨 Design System

### Warna

| Token | Nilai | Kegunaan |
|-------|-------|----------|
| Brand Yellow | `#E8B400` | CTA, active state, aksen |
| Brand Dark | `#B8900A` | Text kuning, total harga |
| Background | `#F0F2F5` | Latar halaman admin |
| Card | `#FFFFFF` | Kartu & panel |
| Navy Sidebar | `#1C1E2E` | Background sidebar admin |

### Komponen Shared

| Komponen | Deskripsi |
|----------|-----------|
| `Modal` | Reusable modal — ESC close, overlay click, scroll lock body |
| `ConfirmDialog` | Dialog konfirmasi 4 varian: `danger` `warning` `success` `info` |
| `Toast` + `useToast` | Notifikasi floating, auto-dismiss 5 detik, 4 varian |
| `AdminLayout` | Wrapper layout admin — sidebar sticky desktop, top bar mobile |
| `Sidebar` | Sticky desktop, drawer mobile dengan hamburger button |

### Responsive Breakpoints

| Breakpoint | Perilaku |
|-----------|----------|
| `< 768px` (Mobile) | Sidebar hilang → top bar + drawer; panel kiri auth tersembunyi |
| `768px – 1023px` (Tablet) | Sidebar kecil; panel kiri auth menyempit |
| `≥ 1024px` (Desktop) | Tampilan penuh |

---

## 📦 Fitur Utama

### Customer Portal

**Booking Multi-Layanan (4-step stepper)**
1. Pilih layanan (multi-select) — summary harga + durasi real-time
2. Pilih tanggal — kalender visual dengan dot hijau/kuning/merah + info bay & jam masuk
3. Pilih kendaraan + catatan opsional
4. Ringkasan + preview nomor antrian → konfirmasi sebelum submit

**Riwayat Booking Real-time**
- Badge LIVE dengan dot animasi
- Update status otomatis via WebSocket tanpa refresh
- Toast notifikasi setiap ada perubahan status

**Kendaraan & Dokumen**
- Tambah, edit, hapus kendaraan via modal
- Upload dokumen (STNK, KIR, Plat Nomor) per kendaraan
- Badge status verifikasi dokumen

### Admin Panel

**Dashboard**
- 4 stat cards (Total, Menunggu, Diproses, Selesai)
- Tabel booking terbaru dengan update real-time
- Banner notifikasi booking baru masuk

**Manajemen Booking**
- 5 status filter cards (klik untuk filter)
- Filter tanggal dengan date picker
- Counter booking hari ini
- Modal update status dengan arrow lama→baru
- Multi-layanan ditampilkan dengan "+N lainnya"

**Monitor Antrian Harian**
- 6 Bay Cards dengan status real-time (kosong/sibuk/selesai)
- Date picker + auto-refresh setiap 60 detik
- Tabel semua antrian hari tersebut

**Inventory**
- Tabel suku cadang dengan SKU, stok, status
- Banner low stock alert
- Tambah part, restock, hapus via modal
- 42 item dummy tersedia via `PartSeeder`

**Verifikasi Dokumen**
- List dokumen per status (Menunggu/Terverifikasi/Ditolak)
- Approve atau tolak dengan catatan via modal

**Pelanggan**
- Search dengan debounce 400ms
- Modal detail: profil, kendaraan + badge dokumen, riwayat booking

---

## 🔌 WebSocket Real-time

File konfigurasi: `src/echo.ts`

Menggunakan **custom authorizer** agar token Sanctum selalu diambil fresh dari `localStorage` saat request auth ke `broadcasting/auth`:

```typescript
authorizer: (channel) => ({
  authorize: (socketId, callback) => {
    const token = localStorage.getItem('token') ?? ''
    fetch(`${BASE_URL}/broadcasting/auth`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, ... },
      body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
    })
    ...
  }
})
```

| Hook | Channel | Fungsi |
|------|---------|--------|
| `useAdminBookings` | `private-admin.bookings` | Booking baru + status update |
| `useBookingStatus` | `private-user.{id}` | Status booking milik user |
| `useQueueCapacity` | `queue.{date}` | Update kapasitas kalender |

---

## 📄 License

Project ini dibuat untuk keperluan Final Project Bootcamp Full Stack Web Development — Dibimbing.id
