export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      lessons: {
        Row: Lesson
        Insert: Lesson
        Update: Partial<Lesson>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'created_at'>
        Update: Partial<Booking>
      }
      attendance: {
        Row: Attendance
        Insert: Attendance
        Update: Partial<Attendance>
      }
      products: {
        Row: Product
        Insert: Product
        Update: Partial<Product>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'date'>
        Update: Partial<Purchase>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'date'>
        Update: Partial<Payment>
      }
    }
  }
}

export interface Profile {
  id: string
  email: string
  name: string
  gender: 'uomo' | 'donna'
  role: 'admin' | 'user'
  created_at: string
}

export interface Lesson {
  id: string
  start: string
  type: string
  coach: string
  capacity: number
  price: number
}

export interface Booking {
  id: string
  user_id: string
  lesson_id: string
  status: 'attiva' | 'cancellata'
  created_at: string
}

export interface Attendance {
  lesson_id: string
  user_id: string
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
