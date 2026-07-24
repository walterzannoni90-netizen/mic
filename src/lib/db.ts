import { supabase } from './supabase'

// Types used by the rest of the app (snake_case in DB, camelCase in TS)
export type Gender = 'uomo' | 'donna'
export type Role = 'admin' | 'user'
export type BookingStatus = 'attiva' | 'cancellata'

export interface User {
  id: string
  email: string
  name: string
  gender: Gender
  role: Role
  created_at: string
}

export interface Lesson {
  id: string
  start: string
  type: string
  coach: string
  capacity: number
  price: number
  attendedIds: string[]
}

export interface Booking {
  id: string
  user_id: string
  lesson_id: string
  status: BookingStatus
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: 'scheda' | 'alimentazione'
  price: number
  duration: string
  description: string
}

export interface Purchase {
  id: string
  user_id: string
  product_id: string
  price: number
  date: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  date: string
  method: string
  note: string
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// ---------------------------------------------------------------- LESSONS ----

const LESSON_TYPES: { type: string; coach: string; capacity: number; price: number }[] = [
  { type: 'Personal Training', coach: 'Marzia Micillo', capacity: 2, price: 40 },
]

// Orari: 8:00-12:00, pausa 13-14, 14:00-20:00 (ogni ora)
const SLOTS: { h: number; m: number; t: number }[] = [
  { h: 8, m: 0, t: 0 },
  { h: 9, m: 0, t: 0 },
  { h: 10, m: 0, t: 0 },
  { h: 11, m: 0, t: 0 },
  { h: 12, m: 0, t: 0 },
  // pausa 13-14
  { h: 14, m: 0, t: 0 },
  { h: 15, m: 0, t: 0 },
  { h: 16, m: 0, t: 0 },
  { h: 17, m: 0, t: 0 },
  { h: 18, m: 0, t: 0 },
  { h: 19, m: 0, t: 0 },
  { h: 20, m: 0, t: 0 },
]

function generateLessonRows() {
  const lessons: Array<Omit<Lesson, 'attendedIds'>> = []
  const today = new Date()
  for (let d = -1; d <= 10; d++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
    if (day.getDay() === 0) continue
    for (const slot of SLOTS) {
      const t = LESSON_TYPES[slot.t]
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.h, slot.m)
      const id = `les-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}-${slot.h}${slot.m}`
      lessons.push({ id, start: start.toISOString(), type: t.type, coach: t.coach, capacity: t.capacity, price: t.price })
    }
  }
  return lessons
}

export async function apiListLessons(): Promise<Lesson[]> {
  const rows = generateLessonRows()
  const { data: existing } = await supabase.from('lessons').select('id')
  const existingIds = new Set((existing ?? []).map((l: any) => l.id))
  const toInsert = rows.filter((r) => !existingIds.has(r.id))
  for (const r of toInsert) {
    await supabase.from('lessons').upsert(r, { ignoreDuplicates: true })
  }

  const { data: lessons } = await supabase.from('lessons').select('*')
  const { data: attendance } = await supabase.from('attendance').select('*')

  const attMap = new Map<string, string[]>()
  for (const a of (attendance ?? []) as Array<{ lesson_id: string; user_id: string }>) {
    if (!attMap.has(a.lesson_id)) attMap.set(a.lesson_id, [])
    attMap.get(a.lesson_id)!.push(a.user_id)
  }

  return ((lessons ?? []) as Array<Omit<Lesson, 'attendedIds'>>).map((l) => ({
    ...l,
    attendedIds: attMap.get(l.id) ?? [],
  }))
}

// ---------------------------------------------------------------- BOOKING ----

export async function apiListBookings(): Promise<Booking[]> {
  const { data } = await supabase.from('bookings').select('*')
  return (data ?? []) as Booking[]
}

export async function apiBookLesson(userId: string, lessonId: string): Promise<Booking> {
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
  if (!lesson) throw new Error('Lezione non trovata.')
  if (new Date((lesson as any).start).getTime() < Date.now()) throw new Error('Questa lezione è già iniziata o terminata.')

  const { data: allBookings } = await supabase.from('bookings').select('*').eq('lesson_id', lessonId)
  const bs = (allBookings ?? []) as Booking[]
  const active = bs.filter((b) => b.status === 'attiva')
  if (active.length >= (lesson as any).capacity) throw new Error('Lezione al completo.')

  const existing = bs.find((b) => b.user_id === userId)
  if (existing?.status === 'attiva') throw new Error('Hai già prenotato questa lezione.')
  if (existing) {
    const { data } = await supabase.from('bookings').update({ status: 'attiva', created_at: new Date().toISOString() } as any).eq('id', existing.id).select().single()
    return data as Booking
  }

  const booking = { id: 'b-' + uid(), user_id: userId, lesson_id: lessonId, status: 'attiva' as const }
  const { data } = await supabase.from('bookings').insert(booking).select().single()
  return data as Booking
}

export const CANCEL_HOURS = 24

export function canCancel(lesson: Lesson): boolean {
  return new Date(lesson.start).getTime() - Date.now() >= CANCEL_HOURS * 3600_000
}

export async function apiCancelBooking(bookingId: string): Promise<void> {
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
  if (!booking) throw new Error('Prenotazione non trovata.')
  const b = booking as Booking
  const { data: lessons } = await supabase.from('lessons').select('*').eq('id', b.lesson_id)
  const lesson = (lessons ?? [])[0] as any
  if (lesson && !canCancel({ ...lesson, attendedIds: [] })) {
    throw new Error(`Non è più possibile cancellare: devi disdire entro il giorno prima.`)
  }

  // Se è una cancellazione lo stesso giorno, invia notifica
  if (lesson) {
    const lessonDate = new Date((lesson as any).start)
    const today = new Date()
    const isSameDay = lessonDate.getDate() === today.getDate() &&
      lessonDate.getMonth() === today.getMonth() &&
      lessonDate.getFullYear() === today.getFullYear()
    if (isSameDay) {
      await apiNotifySameDayCancel(b, lesson as Lesson)
    }
  }

  await supabase.from('bookings').update({ status: 'cancellata' } as any).eq('id', bookingId)
}

// Notifica per cancellazioni stesso giorno (placeholder — da collegare a Telegram/email)
export async function apiNotifySameDayCancel(booking: Booking, lesson: { type: string; start: string }): Promise<void> {
  const { data: user } = await supabase.from('profiles').select('name').eq('id', booking.user_id).single()
  const name = (user as any)?.name ?? booking.user_id
  const msg = `⚠️ Cancellazione last-minute: ${name} ha disdetto ${lesson.type} delle ${fmtTime(lesson.start)}`
  console.log(msg)
  // TODO: integrare notifica via Telegram / email
  // const { error } = await supabase.functions.invoke('notify', { body: { message: msg } })
}

// ---------------------------------------------------------------- SHOP -----

export async function apiListProducts(): Promise<Product[]> {
  const { data } = await supabase.from('products').select('*')
  return (data ?? []) as Product[]
}

export async function apiPurchase(userId: string, productId: string): Promise<Purchase> {
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
  if (!product) throw new Error('Prodotto non trovato.')
  const purchase = { id: 'pur-' + uid(), user_id: userId, product_id: productId, price: (product as any).price }
  const { data } = await supabase.from('purchases').insert(purchase).select().single()
  return data as Purchase
}

export async function apiMyPurchases(userId: string): Promise<Purchase[]> {
  const { data } = await supabase.from('purchases').select('*').eq('user_id', userId)
  return (data ?? []) as Purchase[]
}

// ---------------------------------------------------------------- ADMIN ----

export async function apiListUsers(): Promise<User[]> {
  const { data } = await supabase.from('profiles').select('*').neq('role', 'admin')
  return (data ?? []) as User[]
}

export async function apiSetAttendance(lessonId: string, userId: string, present: boolean): Promise<void> {
  if (present) {
    await supabase.from('attendance').upsert({ lesson_id: lessonId, user_id: userId }, { onConflict: 'lesson_id,user_id' } as any)
  } else {
    await supabase.from('attendance').delete().match({ lesson_id: lessonId, user_id: userId } as any)
  }
}

export async function apiRecordPayment(userId: string, amount: number, method: string, note: string): Promise<Payment> {
  const payment = { id: 'pay-' + uid(), user_id: userId, amount, method, note }
  const { data } = await supabase.from('payments').insert(payment).select().single()
  return data as Payment
}

export async function apiListPayments(): Promise<Payment[]> {
  const { data } = await supabase.from('payments').select('*')
  return (data ?? []) as Payment[]
}

export async function apiListPurchases(): Promise<Purchase[]> {
  const { data } = await supabase.from('purchases').select('*')
  return (data ?? []) as Purchase[]
}

// ---------------------------------------------------------------- FINANCE ---

export function computeUserFinance(
  userId: string,
  lessons: Lesson[],
  bookings: Booking[],
  purchases: Purchase[],
  payments: Payment[],
) {
  const attendedLessons = lessons.filter(
    (l) => l.attendedIds.includes(userId) && bookings.some((b) => b.lesson_id === l.id && b.user_id === userId && b.status === 'attiva'),
  )
  const lessonsDue = attendedLessons.reduce((s, l) => s + l.price, 0)
  const shopDue = purchases.filter((p) => p.user_id === userId).reduce((s, p) => s + p.price, 0)
  const paid = payments.filter((p) => p.user_id === userId).reduce((s, p) => s + p.amount, 0)
  const total = lessonsDue + shopDue
  return { attendedLessons, lessonsDue, shopDue, total, paid, balance: total - paid }
}

// ---------------------------------------------------------------- FORMAT ---

export function euro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function fmtDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// -------------------------------------------------------- PROGRESS PHOTOS ---

export interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  type: 'before' | 'after'
  date: string
  notes: string
}

export async function apiUploadProgressPhoto(userId: string, file: File, type: 'before' | 'after', notes: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${type}_${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file)
  if (uploadError) throw new Error('Errore upload foto: ' + uploadError.message)

  const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(path)

  const { error: dbError } = await supabase.from('progress_photos').insert({
    id: 'pp-' + uid(),
    user_id: userId,
    photo_url: publicUrl,
    type,
    notes,
  })
  if (dbError) throw new Error('Errore salvataggio foto: ' + dbError.message)

  return publicUrl
}

export async function apiListProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const { data } = await supabase.from('progress_photos').select('*').eq('user_id', userId).order('date', { ascending: false })
  return (data ?? []) as ProgressPhoto[]
}

// ----------------------------------------------------------- SEED (legacy) --
export function seedIfNeeded() {}
