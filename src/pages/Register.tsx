import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { registerSchema, type RegisterInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const {
    register: rhfRegister,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', gender: 'donna' },
  })

  const gender = watch('gender')

  async function onSubmit(values: RegisterInput) {
    setBusy(true)
    try {
      await register(values.name, values.email, values.password, values.gender)
      toast.success('Account creato. Benvenuto!')
      navigate('/prenota')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore durante la registrazione.')
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
          <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
          <CardDescription>La registrazione è necessaria per prenotare le lezioni.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="name">Nome e cognome</Label>
              <Input id="name" placeholder="Anna Verdi" autoComplete="name" aria-invalid={!!errors.name} {...rhfRegister('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="tu@esempio.it" aria-invalid={!!errors.email} {...rhfRegister('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="Minimo 8 caratteri" aria-invalid={!!errors.password} {...rhfRegister('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sesso</Label>
              <RadioGroup
                value={gender}
                onValueChange={(v) => setValue('gender', v as 'uomo' | 'donna', { shouldValidate: true })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="donna" id="g-donna" />
                  <Label htmlFor="g-donna">Donna</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="uomo" id="g-uomo" />
                  <Label htmlFor="g-uomo">Uomo</Label>
                </div>
              </RadioGroup>
            </div>
            <Button className="w-full" disabled={busy}>
              {busy ? 'Registrazione in corso…' : 'Registrati'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Hai già un account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Accedi
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
