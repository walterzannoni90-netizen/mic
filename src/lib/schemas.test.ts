import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, paymentSchema } from './schemas'

describe('loginSchema', () => {
  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'abcdef' })
    expect(r.success).toBe(false)
  })
  it('rejects short password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.it', password: '12345' })
    expect(r.success).toBe(false)
  })
  it('accepts valid', () => {
    const r = loginSchema.safeParse({ email: 'a@b.it', password: 'abcdef' })
    expect(r.success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('requires uppercase and number', () => {
    const r = registerSchema.safeParse({
      name: 'Anna',
      email: 'a@b.it',
      password: 'weakpassword',
      gender: 'donna',
    })
    expect(r.success).toBe(false)
  })
  it('accepts strong password', () => {
    const r = registerSchema.safeParse({
      name: 'Anna',
      email: 'a@b.it',
      password: 'Strong1pass',
      gender: 'donna',
    })
    expect(r.success).toBe(true)
  })
})

describe('paymentSchema', () => {
  it('rejects negative amount', () => {
    const r = paymentSchema.safeParse({ amount: -1, method: 'Contanti' })
    expect(r.success).toBe(false)
  })
  it('accepts valid', () => {
    const r = paymentSchema.safeParse({ amount: 50, method: 'Contanti', note: '' })
    expect(r.success).toBe(true)
  })
})