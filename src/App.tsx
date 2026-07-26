import { Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
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
import Privacy from './pages/Privacy'
import Termini from './pages/Termini'

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/termini" element={<Termini />} />
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
