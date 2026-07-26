import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  apiListBookings,
  apiListLessons,
  apiListPayments,
  apiListPurchases,
  apiListUsers,
  apiRecordPayment,
  computeUserFinance,
  euro,
  fmtDate,
  type Booking,
  type Lesson,
  type Payment,
  type Purchase,
  type User,
} from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageLoader } from '@/components/PageLoader'

export default function AdminPagamenti() {
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [payUser, setPayUser] = useState<User | null>(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Contanti')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [u, l, b, pu, pa] = await Promise.all([
        apiListUsers(),
        apiListLessons(),
        apiListBookings(),
        apiListPurchases(),
        apiListPayments(),
      ])
      setUsers(u)
      setLessons(l)
      setBookings(b)
      setPurchases(pu)
      setPayments(pa)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Errore caricamento pagamenti.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const rows = useMemo(
    () =>
      users.map((u) => ({
        user: u,
        finance: computeUserFinance(u.id, lessons, bookings, purchases, payments),
      })),
    [users, lessons, bookings, purchases, payments],
  )

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  function openPay(u: User, balance: number) {
    setPayUser(u)
    setAmount(balance > 0 ? String(balance) : '')
    setNote('')
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault()
    if (!payUser) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Importo non valido.')
      return
    }
    setBusy(true)
    try {
      await apiRecordPayment(payUser.id, value, method, note)
      toast.success('Pagamento registrato.')
      setPayUser(null)
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore registrazione pagamento.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Carico pagamenti…" />

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Situazione contabile per utente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4">Utente</th>
                  <th className="py-2 pr-4">Lezioni svolte</th>
                  <th className="py-2 pr-4">Shop</th>
                  <th className="py-2 pr-4">Totale dovuto</th>
                  <th className="py-2 pr-4">Pagato</th>
                  <th className="py-2 pr-4">Saldo</th>
                  <th className="py-2 pr-4">Stato</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ user, finance }) => (
                  <tr key={user.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {finance.attendedLessons.length} ({euro(finance.lessonsDue)})
                    </td>
                    <td className="py-3 pr-4">{euro(finance.shopDue)}</td>
                    <td className="py-3 pr-4">{euro(finance.total)}</td>
                    <td className="py-3 pr-4">{euro(finance.paid)}</td>
                    <td className="py-3 pr-4 font-semibold">{euro(finance.balance)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={finance.balance <= 0 ? 'default' : 'destructive'}>
                        {finance.balance <= 0 ? 'Pagato' : 'Da pagare'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" onClick={() => openPay(user, finance.balance)}>
                        Registra pagamento
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      Nessun utente registrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamenti registrati</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun pagamento registrato.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...payments].reverse().map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2">
                  <span>
                    <span className="font-semibold">{userById.get(p.user_id)?.name ?? p.user_id}</span> ·{' '}
                    {fmtDate(p.date)} · {p.method}
                    {p.note && <span className="text-muted-foreground"> — {p.note}</span>}
                  </span>
                  <Badge variant="outline">{euro(p.amount)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payUser} onOpenChange={(o) => !o && setPayUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra pagamento — {payUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="method">Metodo</Label>
              <Input id="method" value={method} onChange={(e) => setMethod(e.target.value)} maxLength={40} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">Nota (opzionale)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayUser(null)}>
                Annulla
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Salvataggio…' : 'Salva pagamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
