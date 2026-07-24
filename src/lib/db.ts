// ---------------------------------------------------------------------------
// Mock backend — simula una REST API usando localStorage.
// Tutti i dati vivono nel browser; nessun server reale.
// ---------------------------------------------------------------------------

export type Gender = 'uomo' | 'donna'
export type Role = 'admin' | 'user'

export interface User {
  id: string
  name: string
  email: string
  password: string
  gender: Gender
  role: Role
  createdAt: string
}

export interface Lesson {
  id: string
  start: string // ISO datetime
  type: string
  coach: string
  capacity: number
  price: number // euro
  attendedIds: string[] // userId segnati presenti dall'admin
}

export type BookingStatus = 'attiva' | 'cancellata'

export interface Booking {
  id: string
  userId: string
  lessonId: string
  status: BookingStatus
  createdAt: string
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
  userId: string
  productId: string
  price: number
  date: string
}

export interface Payment {
  id: string
  userId: string
  amount: number
  date: string
  method: string
  note: string
}

const K = {
  users: 'mm_users',
  session: 'mm_session',
  bookings: 'mm_bookings',
  attended: 'mm_attended', // lessonId -> userId[]
  products: 'mm_products',
  purchases: 'mm_purchases',
  payments: 'mm_payments',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// ---------------------------------------------------------------- SEED -----

const LESSON_TYPES: { type: string; coach: string; capacity: number; price: number }[] = [
  { type: 'Personal Training', coach: 'Marzia Micillo', capacity: 1, price: 40 },
  { type: 'Functional Training', coach: 'Marco Ferraro', capacity: 10, price: 15 },
  { type: 'Pilates', coach: 'Sara Gentile', capacity: 8, price: 15 },
  { type: 'Boxe', coach: 'Luca Rinaldi', capacity: 8, price: 18 },
  { type: 'Total Body', coach: 'Marzia Micillo', capacity: 12, price: 15 },
]

// slot orari per giorno (indice -> LESSON_TYPES / orario)
const SLOTS: { h: number; m: number; t: number }[] = [
  { h: 7, m: 0, t: 1 },   // Functional
  { h: 9, m: 30, t: 2 },  // Pilates
  { h: 12, m: 30, t: 4 }, // Total Body
  { h: 17, m: 30, t: 3 }, // Boxe
  { h: 18, m: 30, t: 0 }, // Personal Training
  { h: 19, m: 45, t: 1 }, // Functional
]

function iso(d: Date) {
  return d.toISOString()
}

export function seedIfNeeded() {
  if (!localStorage.getItem(K.users)) {
    const now = iso(new Date())
    const users: User[] = [
      { id: 'u-admin', name: 'Marzia Micillo', email: 'admin@marziamicillo.it', password: 'admin123', gender: 'donna', role: 'admin', createdAt: now },
      { id: 'u-mario', name: 'Mario Rossi', email: 'mario@example.it', password: 'mario123', gender: 'uomo', role: 'user', createdAt: now },
      { id: 'u-giulia', name: 'Giulia Bianchi', email: 'giulia@example.it', password: 'giulia123', gender: 'donna', role: 'user', createdAt: now },
    ]
    write(K.users, users)
  }
  if (!localStorage.getItem(K.products)) {
    const products: Product[] = [
      { id: 'p-scheda-forza', name: 'Scheda Forza — 8 settimane', category: 'scheda', price: 49, duration: '8 settimane', description: 'Programma di forza progressivo per chi si allena da casa o in un\'altra palestra. 3 sedute a settimana con video degli esercizi.' },
      { id: 'p-scheda-dimagrimento', name: 'Scheda Dimagrimento', category: 'scheda', price: 45, duration: '6 settimane', description: 'Circuiti metabolici e cardio mirato per la perdita di peso, adattabile al tuo livello di partenza.' },
      { id: 'p-scheda-glutei', name: 'Scheda Glutei & Core', category: 'scheda', price: 39, duration: '6 settimane', description: 'Focus su glutei, addome e postura. Ideale come complemento al lavoro in sala.' },
      { id: 'p-alim-base', name: 'Piano Alimentare Base', category: 'alimentazione', price: 59, duration: '4 settimane', description: 'Piano alimentare personalizzato sui tuoi obiettivi, con lista della spesa e ricette semplici.' },
      { id: 'p-alim-performance', name: 'Piano Alimentare Performance', category: 'alimentazione', price: 79, duration: '8 settimane', description: 'Nutrizione sportiva avanzata: timing dei pasti, integrazione e revisione bisettimanale.' },
    ]
    write(K.products, products)
  }
  // alcuni pagamenti/acquisti dimostrativi
  if (!localStorage.getItem(K.purchases)) {
    write(K.purchases, [
      { id: 'pur-1', userId: 'u-giulia', productId: 'p-scheda-dimagrimento', price: 45, date: iso(new Date(Date.now() - 5 * 864e5)) },
    ] satisfies Purchase[])
  }
  if (!localStorage.getItem(K.payments)) {
    write(K.payments, [] satisfies Payment[])
  }
  if (!localStorage.getItem(K.bookings)) {
    write(K.bookings, [] satisfies Booking[])
  }
  if (!localStorage.getItem(K.attended)) {
    write(K.attended, {} as Record<string, string[]>)
  }
}

// Genera le lezioni per un intervallo mobile di giorni (ieri .. +10 giorni)
export function generateLessons(): Lesson[] {
  const attendedMap = read<Record<string, string[]>>(K.attended, {})
  const lessons: Lesson[] = []
  const today = new Date()
  for (let d = -1; d <= 10; d++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
    if (day.getDay() === 0) continue // domenica chiuso
    for (const slot of SLOTS) {
      const t = LESSON_TYPES[slot.t]
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.h, slot.m)
      const id = `les-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}-${slot.h}${slot.m}`
      lessons.push({
        id,
        start: iso(start),
        type: t.type,
        coach: t.coach,
        capacity: t.capacity,
        price: t.price,
        attendedIds: attendedMap[id] ?? [],
      })
    }
  }
  return lessons
}

// ---------------------------------------------------------------- AUTH -----

export async function apiRegister(name: string, email: string, password: string, gender: Gender): Promise<User> {
  await delay()
  const users = read<User[]>(K.users, [])
  email = email.trim().toLowerCase()
  if (users.some((u) => u.email === email)) throw new Error('Esiste già un account con questa email.')
  const user: User = { id: 'u-' + uid(), name: name.trim(), email, password, gender, role: 'user', createdAt: iso(new Date()) }
  users.push(user)
  write(K.users, users)
  write(K.session, user.id)
  return user
}

export async function apiLogin(email: string, password: string): Promise<User> {
  await delay()
  const users = read<User[]>(K.users, [])
  const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password)
  if (!user) throw new Error('Email o password non corretti.')
  write(K.session, user.id)
  return user
}

export function apiLogout() {
  localStorage.removeItem(K.session)
}

export function apiCurrentUser(): User | null {
  const id = read<string | null>(K.session, null)
  if (!id) return null
  return read<User[]>(K.users, []).find((u) => u.id === id) ?? null
}

// -------------------------------------------------------------- BOOKING ----

export async function apiListLessons(): Promise<Lesson[]> {
  await delay(60)
  return generateLessons()
}

export async function apiListBookings(): Promise<Booking[]> {
  await delay(60)
  return read<Booking[]>(K.bookings, [])
}

export async function apiBookLesson(userId: string, lessonId: string): Promise<Booking> {
  await delay()
  const lessons = generateLessons()
  const lesson = lessons.find((l) => l.id === lessonId)
  if (!lesson) throw new Error('Lezione non trovata.')
  if (new Date(lesson.start).getTime() < Date.now()) throw new Error('Questa lezione è già iniziata o terminata.')
  const bookings = read<Booking[]>(K.bookings, [])
  const active = bookings.filter((b) => b.lessonId === lessonId && b.status === 'attiva')
  if (active.length >= lesson.capacity) throw new Error('Lezione al completo.')
  const existing = bookings.find((b) => b.lessonId === lessonId && b.userId === userId)
  if (existing?.status === 'attiva') throw new Error('Hai già prenotato questa lezione.')
  if (existing) {
    existing.status = 'attiva'
    existing.createdAt = iso(new Date())
    write(K.bookings, bookings)
    return existing
  }
  const booking: Booking = { id: 'b-' + uid(), userId, lessonId, status: 'attiva', createdAt: iso(new Date()) }
  bookings.push(booking)
  write(K.bookings, bookings)
  return booking
}

export const CANCEL_HOURS = 2

export function canCancel(lesson: Lesson): boolean {
  return new Date(lesson.start).getTime() - Date.now() >= CANCEL_HOURS * 3600_000
}

export async function apiCancelBooking(bookingId: string): Promise<void> {
  await delay()
  const bookings = read<Booking[]>(K.bookings, [])
  const booking = bookings.find((b) => b.id === bookingId)
  if (!booking) throw new Error('Prenotazione non trovata.')
  const lesson = generateLessons().find((l) => l.id === booking.lessonId)
  if (lesson && !canCancel(lesson)) {
    throw new Error(`Non è più possibile cancellare: servono almeno ${CANCEL_HOURS} ore di preavviso.`)
  }
  booking.status = 'cancellata'
  write(K.bookings, bookings)
}

// ---------------------------------------------------------------- SHOP -----

export async function apiListProducts(): Promise<Product[]> {
  await delay(60)
  return read<Product[]>(K.products, [])
}

export async function apiPurchase(userId: string, productId: string): Promise<Purchase> {
  await delay()
  const product = read<Product[]>(K.products, []).find((p) => p.id === productId)
  if (!product) throw new Error('Prodotto non trovato.')
  const purchases = read<Purchase[]>(K.purchases, [])
  const purchase: Purchase = { id: 'pur-' + uid(), userId, productId, price: product.price, date: iso(new Date()) }
  purchases.push(purchase)
  write(K.purchases, purchases)
  return purchase
}

export async function apiMyPurchases(userId: string): Promise<Purchase[]> {
  await delay(60)
  return read<Purchase[]>(K.purchases, []).filter((p) => p.userId === userId)
}

// ---------------------------------------------------------------- ADMIN ----

export async function apiListUsers(): Promise<User[]> {
  await delay(60)
  return read<User[]>(K.users, []).filter((u) => u.role !== 'admin')
}

export async function apiSetAttendance(lessonId: string, userId: string, present: boolean): Promise<void> {
  await delay()
  const map = read<Record<string, string[]>>(K.attended, {})
  const list = new Set(map[lessonId] ?? [])
  if (present) list.add(userId)
  else list.delete(userId)
  map[lessonId] = [...list]
  write(K.attended, map)
}

export async function apiRecordPayment(userId: string, amount: number, method: string, note: string): Promise<Payment> {
  await delay()
  const payments = read<Payment[]>(K.payments, [])
  const payment: Payment = { id: 'pay-' + uid(), userId, amount, date: iso(new Date()), method, note }
  payments.push(payment)
  write(K.payments, payment)
  return payment
}

export async function apiListPayments(): Promise<Payment[]> {
  await delay(60)
  return read<Payment[]>(K.payments, [])
}

export async function apiListPurchases(): Promise<Purchase[]> {
  await delay(60)
  return read<Purchase[]>(K.purchases, [])
}

/** Riepilogo contabile per un utente */
export function computeUserFinance(
  userId: string,
  lessons: Lesson[],
  bookings: Booking[],
  purchases: Purchase[],
  payments: Payment[],
) {
  const attendedLessons = lessons.filter(
    (l) => l.attendedIds.includes(userId) && bookings.some((b) => b.lessonId === l.id && b.userId === userId && b.status === 'attiva'),
  )
  const lessonsDue = attendedLessons.reduce((s, l) => s + l.price, 0)
  const shopDue = purchases.filter((p) => p.userId === userId).reduce((s, p) => s + p.price, 0)
  const paid = payments.filter((p) => p.userId === userId).reduce((s, p) => s + p.amount, 0)
  const total = lessonsDue + shopDue
  return { attendedLessons, lessonsDue, shopDue, total, paid, balance: total - paid }
}

export function euro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function fmtDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}
export function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
