import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  apiListBookings,
  apiListLessons,
  apiListPurchases,
  apiListUsers,
  computeUserFinance,
  apiListPayments,
  apiListProducts,
  euro,
  fmtDate,
  fmtTime,
  type Booking,
  type Lesson,
  type Payment,
  type Product,
  type Purchase,
  type User,
} from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/PageLoader'

export default function AdminUtenti() {
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [u, l, b, pu, pa, pr] = await Promise.all([
        apiListUsers(),
        apiListLessons(),
        apiListBookings(),
        apiListPurchases(),
        apiListPayments(),
        apiListProducts(),
      ])
      setUsers(u)
      setLessons(l)
      setBookings(b)
      setPurchases(pu)
      setPayments(pa)
      setProducts(pr)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore caricamento utenti.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  )

  const selected = users.find((u) => u.id === selectedId) ?? null
  const lessonById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons])
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  if (loading) return <PageLoader label="Carico utenti…" />

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Cerca per nome o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedId(u.id)}
              className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                selectedId === u.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-semibold">{u.name}</p>
              <p className="text-muted-foreground">{u.email}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nessun utente trovato.</p>}
        </div>
      </div>

      <div>
        {!selected ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Seleziona un utente per vedere il dettaglio.
            </CardContent>
          </Card>
        ) : (
          <UserDetail
            user={selected}
            bookings={bookings.filter((b) => b.user_id === selected.id)}
            lessonById={lessonById}
            purchases={purchases.filter((p) => p.user_id === selected.id)}
            productById={productById}
            finance={computeUserFinance(selected.id, lessons, bookings, purchases, payments)}
          />
        )}
      </div>
    </div>
  )
}

function UserDetail({
  user,
  bookings,
  lessonById,
  purchases,
  productById,
  finance,
}: {
  user: User
  bookings: Booking[]
  lessonById: Map<string, Lesson>
  purchases: Purchase[]
  productById: Map<string, Product>
  finance: ReturnType<typeof computeUserFinance>
}) {
  const attended = bookings.filter(
    (b) => b.status === 'attiva' && (lessonById.get(b.lesson_id)?.attendedIds ?? []).includes(user.id),
  )
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sesso: <span className="capitalize">{user.gender}</span> · Registrato il{' '}
              {fmtDate(user.created_at)}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="font-display text-2xl font-black text-primary">{attended.length}</p>
              <p className="text-xs text-muted-foreground">Lezioni svolte</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-primary">
                {bookings.filter((b) => b.status === 'attiva').length}
              </p>
              <p className="text-xs text-muted-foreground">Prenotazioni attive</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-primary">{euro(finance.balance)}</p>
              <p className="text-xs text-muted-foreground">Da pagare</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 font-semibold">Lezioni svolte</p>
          {attended.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna lezione completata finora.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {attended.map((b) => {
                const l = lessonById.get(b.lesson_id)!
                return (
                  <li key={b.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span>
                      {l.type} · {fmtDate(l.start)} {fmtTime(l.start)}
                    </span>
                    <Badge variant="outline">{euro(l.price)}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 font-semibold">Acquisti shop</p>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun acquisto.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <span>
                    {productById.get(p.product_id)?.name ?? p.product_id} · {fmtDate(p.date)}
                  </span>
                  <Badge variant="outline">{euro(p.price)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
