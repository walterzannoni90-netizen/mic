import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email obbligatoria').email('Email non valida'),
  password: z.string().min(6, 'Almeno 6 caratteri'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Inserisci il tuo nome').max(80, 'Troppo lungo'),
  email: z.string().min(1, 'Email obbligatoria').email('Email non valida'),
  password: z
    .string()
    .min(8, 'Almeno 8 caratteri')
    .regex(/[A-Z]/, 'Serve almeno una maiuscola')
    .regex(/[0-9]/, 'Serve almeno un numero'),
  gender: z.enum(['uomo', 'donna']),
})

export const progressPhotoSchema = z.object({
  notes: z.string().max(500, 'Note troppo lunghe').optional(),
  type: z.enum(['before', 'after']),
})

export const paymentSchema = z.object({
  amount: z.number().positive('Importo deve essere positivo').finite(),
  method: z.string().min(1, 'Metodo richiesto').max(40),
  note: z.string().max(200).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProgressPhotoInput = z.infer<typeof progressPhotoSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
