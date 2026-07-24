import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/utenti', label: 'Utenti', end: false },
  { to: '/admin/pagamenti', label: 'Pagamenti', end: false },
]

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display mb-6 text-3xl font-bold uppercase">Area Admin</h1>
      <nav className="mb-8 flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
