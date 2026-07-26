import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { loginSchema, type LoginInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    setBusy(true)
    try {
      const user = await login(values.email, values.password)
      const from = location.state?.from
      const target = user.role === 'admin' && !from ? '/admin' : from || '/prenota'
      toast.success(`Benvenuto, ${user.name}!`)
      navigate(target)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore di accesso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Dumbbell className="h-6 w-6" aria-hidden />
      </span>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <CardDescription>Entra nel tuo account per prenotare le lezioni.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@esempio.it"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button className="w-full" disabled={busy}>
              {busy ? 'Accesso in corso…' : 'Accedi'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Non hai un account?{' '}
            <Link to="/registrati" className="text-primary hover:underline">
              Registrati
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
