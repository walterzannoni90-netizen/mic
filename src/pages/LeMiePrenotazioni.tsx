import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarX } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import {
  apiCancelBooking,
  apiListBookings,
  apiListLessons,
  canCancel,
  fmtDate,
  fmtTime,
  type Booking,
  type Lesson,
} from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/PageLoader'

export default function LeMiePrenotazioni() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [bs, ls] = await Promise.all([apiListBookings(), apiListLessons()])
    setBookings(bs)
    setLessons(ls)
  }, [])

  useEffect(() => {
    setLoading(true)
    reload().finally(() => setLoading(false))
  }, [reload])

  const lessonById = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons])
  const mine = bookings
    .filter((b) => b.user_id === user?.id)
    .sort((a, b) => (lessonById.get(a.lesson_id)?.start ?? '').localeCompare(lessonById.get(b.lesson_id)?.start ?? ''))

  async function cancel(b: Booking) {
    setBusyId(b.id)
    try {
      await apiCancelBooking(b.id)
      toast.success('Prenotazione cancellata.')
      await reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella cancellazione.')
    } finally {
      setBusyId(b.id === null ? null : b.id)
      setBusyId(null)
    }
  }

  if (loading) return <PageLoader label="Carico le tue prenotazioni…" />

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display mb-2 text-3xl font-bold uppercase">Le mie prenotazioni</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Puoi cancellare o spostare una lezione entro il giorno prima. Non puoi disdire il giorno stesso.
      </p>

      {mine.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">Non hai ancora nessuna prenotazione.</p>
            <Button asChild>
              <Link to="/prenota">Prenota la tua prima lezione</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mine.map((b) => {
            const l = lessonById.get(b.lesson_id)
            if (!l) return null
            const cancellable = b.status === 'attiva' && canCancel(l)
            const past = new Date(l.start).getTime() < Date.now()
            const attended = l.attendedIds.includes(user?.id ?? '')
            return (
              <Card key={b.id} className={b.status === 'cancellata' ? 'opacity-60' : ''}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{l.type}</p>
                      <Badge variant={b.status === 'attiva' ? 'default' : 'secondary'}>
                        {b.status === 'attiva' ? 'Attiva' : 'Cancellata'}
                      </Badge>
                      {attended && <Badge variant="outline">Svolta ✓</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(l.start)} alle {fmtTime(l.start)}
                    </p>
                  </div>
                  {b.status === 'attiva' && !past && (
                    <div className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!cancellable || busyId === b.id}
                        onClick={() => cancel(b)}
                      >
                        {busyId === b.id ? 'Cancellazione…' : 'Cancella'}
                      </Button>
                      {!cancellable && (
                        <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                          Non puoi cancellare il giorno stesso. Disdici entro il giorno prima.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
