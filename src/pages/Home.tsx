import { Link } from 'react-router'
import { ArrowRight, CalendarCheck, Dumbbell, Flame, HeartPulse, Salad, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateLessons, fmtDate, fmtTime, euro } from '@/lib/db'

const services = [
  { icon: Dumbbell, title: 'Personal Training', desc: 'Sedute 1-a-1 con Marzia: tecnica, progressioni e motivazione su misura per te.' },
  { icon: Flame, title: 'Functional Training', desc: 'Allenamenti ad alta intensità per forza, resistenza e mobilità in piccoli gruppi.' },
  { icon: HeartPulse, title: 'Pilates', desc: 'Postura, core e flessibilità. Perfetto per prevenire dolori e migliorare il controllo del corpo.' },
  { icon: Users, title: 'Boxe', desc: 'Tecnica di pugilato e conditioning: scarica lo stress e costruisci un fisico atletico.' },
]

const plans = [
  { name: 'Sala Open', price: 49, period: '/mese', features: ['Accesso sala pesi libero', '1 lezione di gruppo a settimana', 'Valutazione iniziale'] },
  { name: 'All Access', price: 89, period: '/mese', highlight: true, features: ['Lezioni di gruppo illimitate', '1 Personal Training al mese', 'Scheda aggiornata ogni 6 settimane', 'Accesso prioritario alle prenotazioni'] },
  { name: 'Transformation', price: 199, period: '/mese', features: ['2 Personal Training a settimana', 'Piano alimentare personalizzato', 'Check-in settimanale con Marzia'] },
]

const testimonials = [
  { name: 'Federica M.', text: 'In 4 mesi ho perso 9 kg e soprattutto ho imparato ad allenarmi bene. Marzia ti segue in tutto, anche fuori dalla sala.' },
  { name: 'Alessandro T.', text: 'Dopo anni di mal di schiena, grazie al percorso di forza e postura sono tornato a correre. Professionalità rara.' },
  { name: 'Chiara D.', text: 'Le lezioni di functional sono toste ma divertenti. Ambiente accogliente, zero giudizio, tanti risultati.' },
]

export default function Home() {
  const upcoming = generateLessons()
    .filter((l) => new Date(l.start).getTime() > Date.now())
    .slice(0, 6)

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 20%, hsl(36 95% 55% / 0.35), transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, hsl(0 0% 100% / 0.06), transparent 70%)',
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-24 md:py-36">
          <Badge variant="outline" className="border-primary/50 text-primary">
            Palestra · Personal Training · Milano
          </Badge>
          <h1 className="font-display max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Allenati con <span className="text-primary">Marzia</span>.<br />
            Diventa la tua versione più forte.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Personal training, lezioni di gruppo e programmi a distanza. Un metodo concreto,
            misurabile e costruito intorno alla tua vita — non il contrario.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/prenota">
                Prenota una lezione <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/shop">Schede & programmi online</Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-8 text-center md:gap-16">
            {[
              ['10+', 'anni di esperienza'],
              ['300+', 'clienti seguiti'],
              ['6', 'giorni a settimana'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl font-black text-primary md:text-4xl">{n}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-border bg-gradient-to-br from-secondary to-background">
            <Dumbbell className="h-24 w-24 text-primary/40" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Chi sono</p>
            <h2 className="font-display mb-4 text-4xl font-bold uppercase">Marzia Micillo</h2>
            <p className="mb-4 text-muted-foreground">
              Personal trainer certificata con oltre dieci anni di esperienza in sala pesi e nella
              preparazione atletica. Credo in un allenamento intelligente: pochi esercizi fatti
              bene, progressioni misurabili e un piano alimentare sostenibile.
            </p>
            <p className="mb-6 text-muted-foreground">
              Nella mia palestra non esistono schede fotocopiate: ogni percorso parte da una
              valutazione e si adatta ai tuoi obiettivi, al tuo corpo e ai tuoi orari.
            </p>
            <Button variant="outline" asChild>
              <Link to="/registrati">Inizia il tuo percorso</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Servizi</p>
        <h2 className="font-display mb-10 text-4xl font-bold uppercase">Come posso aiutarti</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Card key={s.title} className="transition-colors hover:border-primary/60">
              <CardHeader>
                <s.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{s.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SCHEDULE PREVIEW */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Calendario</p>
              <h2 className="font-display text-4xl font-bold uppercase">Prossime lezioni</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/prenota">
                Vedi tutto <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcoming.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(l.start)} · {fmtTime(l.start)} · {l.coach}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Abbonamenti</p>
        <h2 className="font-display mb-10 text-4xl font-bold uppercase">Scegli il tuo piano</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className={p.highlight ? 'border-primary shadow-[0_0_40px_-10px] shadow-primary/30' : ''}>
              <CardHeader>
                <CardTitle className="uppercase tracking-wide">{p.name}</CardTitle>
                <p className="font-display text-4xl font-black">
                  {euro(p.price)}
                  <span className="text-base font-normal text-muted-foreground">{p.period}</span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={p.highlight ? 'default' : 'outline'} asChild>
                  <Link to="/registrati">Registrati e inizia</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Testimonianze</p>
          <h2 className="font-display mb-10 text-4xl font-bold uppercase">Dicono di noi</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">"{t.text}"</p>
                  <p className="text-sm font-semibold">{t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Salad className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="font-display mb-4 text-4xl font-bold uppercase md:text-5xl">
          Pronto a cominciare?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Crea il tuo account gratuito e prenota la prima lezione di prova. Se non ti alleni da noi,
          puoi comunque acquistare schede e piani alimentari online.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/registrati">Crea account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/shop">Vai allo shop</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
