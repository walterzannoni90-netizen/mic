import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { LogOut, User as UserIcon, Menu } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { siteConfig } from '@/lib/site'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? 'text-primary' : 'text-muted-foreground'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = (
    <>
      <NavLink to="/" className={navLinkClass} end onClick={() => setMobileOpen(false)}>
        Home
      </NavLink>
      <NavLink to="/prenota" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Prenota
      </NavLink>
      <NavLink to="/shop" className={navLinkClass} onClick={() => setMobileOpen(false)}>
        Shop
      </NavLink>
      {user && (
        <NavLink to="/le-mie-prenotazioni" className={navLinkClass} onClick={() => setMobileOpen(false)}>
          Le mie prenotazioni
        </NavLink>
      )}
      {user && (
        <NavLink to="/progresso" className={navLinkClass} onClick={() => setMobileOpen(false)}>
          Progresso
        </NavLink>
      )}
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
          Admin
        </NavLink>
      )}
    </>
  )

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={siteConfig.brand.logoSrc}
              alt={`${siteConfig.brand.name} logo`}
              className="h-10 w-10 rounded-full border border-primary/40 object-cover"
              width={40}
              height={40}
            />
            <span className="font-display text-lg font-bold uppercase tracking-widest">
              Back <span className="text-primary">in</span> Shape
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigazione principale">
            {navLinks}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  <UserIcon className="h-4 w-4" aria-hidden /> {user.name}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" aria-hidden /> Esci
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Apri menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="flex flex-col gap-2 border-t border-border/60 p-4 md:hidden" aria-label="Navigazione mobile">
            {navLinks}
          </nav>
        )}
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
              src={siteConfig.brand.logoSrc}
              alt={`${siteConfig.brand.name} logo`}
              className="h-9 w-9 rounded-full border border-primary/40 object-cover"
              width={36}
              height={36}
            />
            <span className="font-display font-bold uppercase tracking-widest">Back in Shape</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Personal training su misura a Milano. La tua trasformazione inizia qui.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold uppercase tracking-wider text-primary">Contatti</p>
          <p className="text-muted-foreground">{siteConfig.contact.address}</p>
          <a href={`mailto:${siteConfig.contact.email}`} className="block text-muted-foreground hover:text-primary">
            {siteConfig.contact.email}
          </a>
          <a href={siteConfig.contact.phoneHref} className="block text-muted-foreground hover:text-primary">
            {siteConfig.contact.phone}
          </a>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold uppercase tracking-wider text-primary">Orari</p>
          <p className="text-muted-foreground">{siteConfig.hours.weekday}</p>
          <p className="text-muted-foreground">{siteConfig.hours.weekdayBreak}</p>
          <p className="text-muted-foreground">{siteConfig.hours.saturday}</p>
          <p className="text-muted-foreground">{siteConfig.hours.sunday}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground md:px-0">
        <span className="mx-auto md:mx-0">{siteConfig.legal.copyright(new Date().getFullYear())}</span>
        <span className="flex gap-4">
          <Link to="/privacy" className="hover:text-primary">Privacy</Link>
          <Link to="/termini" className="hover:text-primary">Termini</Link>
        </span>
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
