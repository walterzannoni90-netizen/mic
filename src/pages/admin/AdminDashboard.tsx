import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Euro, Users } from 'lucide-react'
import {
  apiListBookings,
  apiListLessons,
  apiListPayments,
  apiListUsers,
  apiSetAttendance,
  euro,
  fmtTime,
  type Booking,
  type Lesson,
  type Payment,
  type User,
} from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

function isToday(isoStr: string) {
  const d = new Date(isoStr)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const reload = useCallback(async () => {
    const [u, l, b, p] = await Promise.all([apiListUsers(), apiListLessons(), apiListBookings(), apiListPayments()])
    setUsers(u)
    setLessons(l)
    setBookings(b)
    setPayments(p)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const todayLessons = useMemo(() => lessons.filter((l) => isToday(l.start)), [lessons])
  const incassi = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments])
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  async function toggleAttendance(lessonId: string, userId: string, present: boolean) {
    await apiSetAttendance(lessonId, userId, present)
    await reload()
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale utenti</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-black">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lezioni oggi</CardTitle>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-black">{todayLessons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incassi totali</CardTitle>
            <Euro className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-black">{euro(incassi)}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-display mb-4 text-xl font-bold uppercase">Lezioni di oggi — presenze</h2>
        {todayLessons.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessuna lezione in programma oggi.</p>
        )}
        <div className="space-y-4">
          {todayLessons.map((l) => {
            const attendees = bookings.filter((b) => b.lesson_id === l.id && b.status === 'attiva')
            return (
              <Card key={l.id}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {fmtTime(l.start)} — {l.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Coach: {l.coach} · {attendees.length}/{l.capacity} prenotati
                      </p>
                    </div>
                    <Badge variant="secondary">{euro(l.price)} / lezione</Badge>
                  </div>
                  {attendees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessun iscritto.</p>
                  ) : (
                    <ul className="space-y-2">
                      {attendees.map((b) => {
                        const u = userById.get(b.user_id)
                        const present = l.attendedIds.includes(b.user_id)
                        return (
                          <li key={b.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                            <span>
                              {u?.name ?? b.user_id}{' '}
                              <span className="text-muted-foreground">({u?.gender === 'uomo' ? 'U' : 'D'})</span>
                            </span>
                            <label className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {present ? 'Presente' : 'Assente'}
                              </span>
                              <Checkbox
                                checked={present}
                                onCheckedChange={(v) => toggleAttendance(l.id, b.user_id, v === true)}
                              />
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
