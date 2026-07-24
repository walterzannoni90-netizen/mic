import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  apiBookLesson,
  apiListBookings,
  apiListLessons,
  fmtDate,
  fmtTime,
  type Booking,
  type Lesson,
} from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Prenota() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [ls, bs] = await Promise.all([apiListLessons(), apiListBookings()])
    setLessons(ls)
    setBookings(bs)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const myActive = useMemo(
    () => new Set(bookings.filter((b) => b.userId === user?.id && b.status === 'attiva').map((b) => b.lessonId)),
    [bookings, user],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, Lesson[]>()
    lessons
      .filter((l) => new Date(l.start).getTime() > Date.now() - 3600_000)
      .forEach((l) => {
        const key = new Date(l.start).toDateString()
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(l)
      })
    return [...map.entries()]
  }, [lessons])

  async function book(lessonId: string) {
    if (!user) return
    setBusyId(lessonId)
    setMessage('')
    try {
      await apiBookLesson(user.id, lessonId)
      setMessage('Prenotazione confermata! La trovi in "Le mie prenotazioni".')
      await reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Errore nella prenotazione.')
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = (l: Lesson) => bookings.filter((b) => b.lessonId === l.id && b.status === 'attiva').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <CalendarDays className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Prenota una lezione</h1>
          <p className="text-sm text-muted-foreground">
            Scegli data, orario e tipo di allenamento. Posti limitati, primo arrivato primo servito.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">{message}</div>
      )}

      <Tabs defaultValue="0">
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
          {byDay.map(([day, ls], i) => (
            <TabsTrigger key={day} value={String(i)} className="capitalize">
              {fmtDate(ls[0].start)}
            </TabsTrigger>
          ))}
        </TabsList>
        {byDay.map(([day, ls], i) => (
          <TabsContent key={day} value={String(i)}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ls.map((l) => {
                const taken = activeCount(l)
                const full = taken >= l.capacity
                const past = new Date(l.start).getTime() < Date.now()
                const booked = myActive.has(l.id)
                return (
                  <Card key={l.id} className={booked ? 'border-primary/70' : ''}>
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="text-2xl font-bold">{fmtTime(l.start)}</p>
                          <p className="font-semibold">{l.type}</p>
                        </div>
                        <Badge variant={full ? 'destructive' : booked ? 'default' : 'secondary'}>
                          {booked ? 'Prenotata' : full ? 'Completo' : `${l.capacity - taken} posti`}
                        </Badge>
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Coach: {l.coach} · {taken}/{l.capacity} iscritti
                      </p>
                      <Button
                        className="w-full"
                        variant={booked ? 'outline' : 'default'}
                        disabled={booked || full || past || busyId === l.id}
                        onClick={() => book(l.id)}
                      >
                        {busyId === l.id
                          ? 'Prenotazione…'
                          : booked
                            ? 'Già prenotata'
                            : full
                              ? 'Nessun posto disponibile'
                              : past
                                ? 'Lezione passata'
                                : 'Prenota'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
