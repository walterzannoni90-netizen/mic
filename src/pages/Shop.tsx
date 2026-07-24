import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2, ClipboardList, Salad } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { apiListProducts, apiPurchase, euro, type Product } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Shop() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setProducts(await apiListProducts())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCheckout(p: Product) {
    if (!user) {
      navigate('/login', { state: { from: '/shop' } })
      return
    }
    setSelected(p)
    setDone(false)
    setError('')
  }

  async function confirm() {
    if (!selected || !user) return
    setBusy(true)
    setError('')
    try {
      await apiPurchase(user.id, selected.id)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'acquisto.')
    } finally {
      setBusy(false)
    }
  }

  const renderCard = (p: Product) => (
    <Card key={p.id} className="flex flex-col transition-colors hover:border-primary/60">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          {p.category === 'scheda' ? (
            <ClipboardList className="h-7 w-7 text-primary" />
          ) : (
            <Salad className="h-7 w-7 text-primary" />
          )}
          <Badge variant="secondary">{p.category === 'scheda' ? 'Scheda' : 'Alimentazione'}</Badge>
        </div>
        <CardTitle>{p.name}</CardTitle>
        <p className="text-sm text-muted-foreground">Durata: {p.duration}</p>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground">{p.description}</CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="font-display text-2xl font-black">{euro(p.price)}</p>
        <Button onClick={() => openCheckout(p)}>Acquista</Button>
      </CardFooter>
    </Card>
  )

  const schede = products.filter((p) => p.category === 'scheda')
  const alimentazioni = products.filter((p) => p.category === 'alimentazione')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display mb-2 text-3xl font-bold uppercase">Schede & Programmi</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        Per chi non si allena in palestra: schede di allenamento e piani alimentari da seguire ovunque.
        <span className="ml-1 text-xs">(Prodotti di esempio — verranno personalizzati in seguito.)</span>
      </p>

      <h2 className="font-display mb-4 text-xl font-bold uppercase tracking-wide text-primary">
        Schede di allenamento
      </h2>
      <div className="mb-10 grid gap-6 md:grid-cols-3">{schede.map(renderCard)}</div>

      <h2 className="font-display mb-4 text-xl font-bold uppercase tracking-wide text-primary">
        Piani alimentari
      </h2>
      <div className="grid gap-6 md:grid-cols-3">{alimentazioni.map(renderCard)}</div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Acquisto completato
                </DialogTitle>
                <DialogDescription>
                  "{selected?.name}" è stato aggiunto al tuo profilo. L'importo risulta ora nei tuoi
                  pagamenti da saldare in palestra.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setSelected(null)}>Chiudi</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Checkout (demo)</DialogTitle>
                <DialogDescription>
                  Stai acquistando <strong>{selected?.name}</strong> a{' '}
                  <strong>{selected ? euro(selected.price) : ''}</strong>. Nessun pagamento reale:
                  l'addebito verrà registrato sul tuo conto in palestra.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Annulla
                </Button>
                <Button onClick={confirm} disabled={busy}>
                  {busy ? 'Elaborazione…' : 'Conferma acquisto'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
