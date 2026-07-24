import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './lib/auth'
import { Layout, RequireAdmin, RequireAuth } from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Prenota from './pages/Prenota'
import LeMiePrenotazioni from './pages/LeMiePrenotazioni'
import Shop from './pages/Shop'
import Progresso from './pages/Progresso'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUtenti from './pages/admin/AdminUtenti'
import AdminPagamenti from './pages/admin/AdminPagamenti'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrati" element={<Register />} />
          <Route
            path="/prenota"
            element={
              <RequireAuth>
                <Prenota />
              </RequireAuth>
            }
          />
          <Route
            path="/le-mie-prenotazioni"
            element={
              <RequireAuth>
                <LeMiePrenotazioni />
              </RequireAuth>
            }
          />
          <Route path="/shop" element={<Shop />} />
          <Route
            path="/progresso"
            element={
              <RequireAuth>
                <Progresso />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="utenti" element={<AdminUtenti />} />
            <Route path="pagamenti" element={<AdminPagamenti />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
