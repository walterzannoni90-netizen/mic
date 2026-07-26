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
  cancelled_at: string | null
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

// 8:00-12:00, pausa 13-14, 14:00-20:00 (ogni ora)
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
  // Genera ID come YYYYMMDD-HHmm per consistenza (no Date.getTime/DST)
  const today = new Date()
  for (let d = -1; d <= 10; d++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
    if (day.getDay() === 0) continue
    for (const slot of SLOTS) {
      const t = LESSON_TYPES[slot.t]
      const start = new Date(
        Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), slot.h - new Date().getTimezoneOffset() / 60, slot.m),
      )
      const id = `les-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}-${slot.h}${slot.m}`
      lessons.push({ id, start: start.toISOString(), type: t.type, coach: t.coach, capacity: t.capacity, price: t.price })
    }
  }
  return lessons
}

export async function apiListLessons(): Promise<Lesson[]> {
  const rows = generateLessonRows()
  // Batch upsert (evita N+1 queries)
  const { error: upsertErr } = await supabase.from('lessons').upsert(rows, { ignoreDuplicates: true })
  if (upsertErr) throw new Error(upsertErr.message)

  const { data: lessons, error } = await supabase.from('lessons').select('*')
  if (error) throw new Error(error.message)

  const { data: attendance, error: attErr } = await supabase.from('attendance').select('*')
  if (attErr) throw new Error(attErr.message)

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
  const { data, error } = await supabase.from('bookings').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as Booking[]
}

export async function apiBookLesson(_userId: string, lessonId: string): Promise<Booking> {
  // Usa RPC atomico per evitare race condition sul capacity
  const { data, error } = await supabase.rpc('book_lesson', { p_lesson_id: lessonId })
  if (error) throw new Error(error.message)
  // Rileggi la prenotazione appena creata
  const { data: booking, error: readErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', data as string)
    .single()
  if (readErr) throw new Error(readErr.message)
  return booking as Booking
}

export const CANCEL_HOURS = 24

export function canCancel(lesson: Lesson): boolean {
  return new Date(lesson.start).getTime() - Date.now() >= CANCEL_HOURS * 3600_000
}

export async function apiCancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId })
  if (error) throw new Error(error.message)
}

// Notifica last-minute (placeholder — da collegare a Edge Function / Telegram)
export async function apiNotifySameDayCancel(booking: Booking, lesson: { type: string; start: string }): Promise<void> {
  const { data: user } = await supabase.from('profiles').select('name').eq('id', booking.user_id).single()
  const name = (user as User | null)?.name ?? booking.user_id
  const message = `⚠️ Cancellazione last-minute: ${name} ha disdetto ${lesson.type} delle ${fmtTime(lesson.start)}`
  if (import.meta.env.DEV) {
    console.debug('[notify]', message)
  }
  // TODO: invocare qui una Edge Function `notify-last-minute-cancel`
  // await supabase.functions.invoke('notify-last-minute-cancel', { body: { booking, lesson } })
}

// ---------------------------------------------------------------- SHOP -----

export async function apiListProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as Product[]
}

export async function apiPurchase(userId: string, productId: string): Promise<Purchase> {
  const { data: product, error: pErr } = await supabase.from('products').select('*').eq('id', productId).single()
  if (pErr) throw new Error(pErr.message)
  if (!product) throw new Error('Prodotto non trovato.')
  const purchase = { id: 'pur-' + uid(), user_id: userId, product_id: productId, price: product.price }
  const { data, error } = await supabase.from('purchases').insert(purchase).select().single()
  if (error) throw new Error(error.message)
  return data as Purchase
}

export async function apiMyPurchases(userId: string): Promise<Purchase[]> {
  const { data, error } = await supabase.from('purchases').select('*').eq('user_id', userId)
  if (error) throw new Error(error.message)
  return (data ?? []) as Purchase[]
}

// ---------------------------------------------------------------- ADMIN ----

export async function apiListUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*').neq('role', 'admin')
  if (error) throw new Error(error.message)
  return (data ?? []) as User[]
}

export async function apiSetAttendance(lessonId: string, userId: string, present: boolean): Promise<void> {
  if (present) {
    const { error } = await supabase
      .from('attendance')
      .upsert({ lesson_id: lessonId, user_id: userId }, { onConflict: 'lesson_id,user_id' })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .match({ lesson_id: lessonId, user_id: userId })
    if (error) throw new Error(error.message)
  }
}

export async function apiRecordPayment(userId: string, amount: number, method: string, note: string): Promise<Payment> {
  const payment = { id: 'pay-' + uid(), user_id: userId, amount, method, note }
  const { data, error } = await supabase.from('payments').insert(payment).select().single()
  if (error) throw new Error(error.message)
  return data as Payment
}

export async function apiListPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}

export async function apiListPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from('purchases').select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as Purchase[]
}

// ---------------------------------------------------------------- FINANCE ---

export interface UserFinance {
  lessonsDue: number
  shopDue: number
  total: number
  paid: number
  balance: number
  attendedLessons: Lesson[]
}

export async function apiUserFinance(
  userId: string,
  lessons: Lesson[],
  bookings: Booking[],
  purchases: Purchase[],
  payments: Payment[],
): Promise<UserFinance> {
  // Calcolo locale (usato come fallback); il canon è la view `user_finance` server-side
  const attendedLessons = lessons.filter(
    (l) => l.attendedIds.includes(userId) && bookings.some((b) => b.lesson_id === l.id && b.user_id === userId && b.status === 'attiva'),
  )
  const lessonsDue = attendedLessons.reduce((s, l) => s + l.price, 0)
  const shopDue = purchases.filter((p) => p.user_id === userId).reduce((s, p) => s + p.price, 0)
  const paid = payments.filter((p) => p.user_id === userId).reduce((s, p) => s + p.amount, 0)
  const total = lessonsDue + shopDue
  return { attendedLessons, lessonsDue, shopDue, total, paid, balance: total - paid }
}

// Compatibilità con uso esistente (firma sincrona)
export function computeUserFinance(
  userId: string,
  lessons: Lesson[],
  bookings: Booking[],
  purchases: Purchase[],
  payments: Payment[],
): UserFinance {
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

const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function apiUploadProgressPhoto(userId: string, file: File, type: 'before' | 'after', notes: string): Promise<string> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new Error('Formato non supportato. Usa JPG, PNG o WebP.')
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('File troppo grande (max 8 MB).')
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
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
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProgressPhoto[]
}

export async function apiDeleteProgressPhoto(id: string): Promise<void> {
  const { error } = await supabase.from('progress_photos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ----------------------------------------------------------- SEED (legacy) --
export function seedIfNeeded() {}
