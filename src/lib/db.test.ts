import { describe, it, expect } from 'vitest'
import { euro, fmtDate, fmtTime, computeUserFinance } from './db'
import type { Booking, Lesson, Payment, Purchase } from './db'

const lesson: Lesson = {
  id: 'l1',
  start: '2026-07-26T10:00:00.000Z',
  type: 'Personal Training',
  coach: 'Marzia',
  capacity: 2,
  price: 40,
  attendedIds: ['u1'],
}

describe('euro', () => {
  it('formats EUR currency', () => {
    expect(euro(40)).toMatch(/40/)
    expect(euro(1234.5)).toMatch(/[\d.,]+/)
  })
})

describe('fmtDate / fmtTime', () => {
  it('returns non-empty strings', () => {
    expect(fmtDate('2026-07-26T10:00:00.000Z').length).toBeGreaterThan(0)
    expect(fmtTime('2026-07-26T10:00:00.000Z').length).toBeGreaterThan(0)
  })
})

describe('computeUserFinance', () => {
  const bookings: Booking[] = [
    { id: 'b1', user_id: 'u1', lesson_id: 'l1', status: 'attiva', created_at: '', cancelled_at: null },
  ]
  const purchases: Purchase[] = [
    { id: 'p1', user_id: 'u1', product_id: 'pr1', price: 50, date: '2026-07-26T10:00:00.000Z' },
  ]
  const payments: Payment[] = [
    { id: 'pay1', user_id: 'u1', amount: 50, date: '2026-07-26T10:00:00.000Z', method: 'Contanti', note: '' },
  ]

  it('sums attended lessons, shop, payments', () => {
    const f = computeUserFinance('u1', [lesson], bookings, purchases, payments)
    expect(f.lessonsDue).toBe(40)
    expect(f.shopDue).toBe(50)
    expect(f.total).toBe(90)
    expect(f.paid).toBe(50)
    expect(f.balance).toBe(40)
  })

  it('returns zero for unknown user', () => {
    const f = computeUserFinance('unknown', [lesson], bookings, purchases, payments)
    expect(f.lessonsDue).toBe(0)
    expect(f.balance).toBe(0)
  })

  it('ignores cancelled bookings', () => {
    const cancelled = [{ ...bookings[0], status: 'cancellata' as const }]
    const f = computeUserFinance('u1', [lesson], cancelled, purchases, payments)
    // attiva mancante, lessonsDue non si applica
    expect(f.balance).toBe(0)
  })
})