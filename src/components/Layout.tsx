import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? 'text-primary' : 'text-muted-foreground'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="images/logo.jpeg"
              alt="Back in Shape - Marzia Micillo"
              className="h-10 w-10 rounded-full border border-primary/40 object-cover"
            />
            <span className="font-display text-lg font-bold uppercase tracking-widest">
              Back <span className="text-primary">in</span> Shape
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/prenota" className={navLinkClass}>
              Prenota
            </NavLink>
            <NavLink to="/shop" className={navLinkClass}>
              Shop
            </NavLink>
            {user && (
              <NavLink to="/le-mie-prenotazioni" className={navLinkClass}>
                Le mie prenotazioni
              </NavLink>
            )}
            {user && (
              <NavLink to="/progresso" className={navLinkClass}>
                Progresso
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  <UserIcon className="h-4 w-4" /> {user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut className="mr-1 h-4 w-4" /> Esci
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Accedi</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/registrati">Registrati</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <img
              src="images/logo.jpeg"
              alt="Back in Shape - Marzia Micillo"
              className="h-9 w-9 rounded-full border border-primary/40 object-cover"
            />
            <span className="font-display font-bold uppercase tracking-widest">Back in Shape</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Personal training su misura a Milano. La tua trasformazione inizia qui.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold uppercase tracking-wider text-primary">Contatti</p>
          <p className="text-muted-foreground">Via Tullio Ostilio 8, Milano</p>
          <p className="text-muted-foreground">marzia.micillo91@gmail.com</p>
          <p className="text-muted-foreground">333 932 4861</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold uppercase tracking-wider text-primary">Orari</p>
          <p className="text-muted-foreground">Lun – Ven: 8:00 – 20:00</p>
          <p className="text-muted-foreground">Sabato: 8:00 – 13:00</p>
          <p className="text-muted-foreground">Domenica: chiuso</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Marzia Micillo — Back in Shape
      </div>
    </footer>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
