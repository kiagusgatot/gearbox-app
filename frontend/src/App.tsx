import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/customer/Home'
import ServiceList from './pages/customer/ServiceList'
import Vehicles from './pages/customer/Vehicles'
import BookingHistory from './pages/customer/BookingHistory'
import AdminDashboard from './pages/admin/Dashboard'
import AdminBookings from './pages/admin/Bookings'
import AdminServices from './pages/admin/Services'
import AdminSchedules from './pages/admin/Schedules'
import AdminCustomers from './pages/admin/Customers'
import AdminDocuments from './pages/admin/Documents'
import AdminInventory from './pages/admin/Reports'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Home />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/services" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />

          {/* /booking/create redirect ke /bookings agar tidak error jika ada link lama */}
          <Route path="/booking/create" element={<ProtectedRoute><Navigate to="/bookings" replace /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute adminOnly><AdminServices /></ProtectedRoute>} />
          <Route path="/admin/schedules" element={<ProtectedRoute adminOnly><AdminSchedules /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute adminOnly><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute adminOnly><AdminDocuments /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute adminOnly><AdminInventory /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
