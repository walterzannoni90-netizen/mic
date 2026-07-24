import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Dumbbell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(email, password)
      const from = location.state?.from
      navigate(user.role === 'admin' && !from ? '/admin' : from || '/prenota')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di accesso.')
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
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <CardDescription>Entra nel tuo account per prenotare le lezioni.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@esempio.it" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
          <div className="mt-4 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Account demo</p>
            <p>Admin: admin@marziamicillo.it / admin123</p>
            <p>Utente: mario@example.it / mario123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
