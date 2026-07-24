import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { Gender } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState<Gender>('donna')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.')
      return
    }
    setBusy(true)
    try {
      await register(name, email, password, gender)
      navigate('/prenota')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Dumbbell className="h-6 w-6" />
      </span>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
          <CardDescription>La registrazione è necessaria per prenotare le lezioni.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome e cognome</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Anna Verdi" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@esempio.it" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caratteri" />
            </div>
            <div className="space-y-2">
              <Label>Sesso</Label>
              <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-6">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
