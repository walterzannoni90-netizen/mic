import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarCheck, Camera, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiListLessons, fmtDate, fmtTime, type Lesson } from '@/lib/db'

export default function Home() {
  const [upcoming, setUpcoming] = useState<Lesson[]>([])

  useEffect(() => {
    apiListLessons().then((ls) => {
      setUpcoming(ls.filter((l) => new Date(l.start).getTime() > Date.now()).slice(0, 6))
    })
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 20%, hsl(328 100% 44% / 0.35), transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, hsl(0 0% 100% / 0.06), transparent 70%)',
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div className="flex flex-col items-start gap-8">
            <Badge variant="outline" className="border-primary/50 text-primary">
              Back in Shape · Personal Training · Marzia Micillo
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
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-primary/20 blur-2xl" aria-hidden />
            <img
              src="images/hero-marzia.jpeg"
              alt="Marzia Micillo personal trainer nella sua palestra"
              className="relative aspect-[3/4] w-full rounded-2xl border border-primary/30 object-cover object-top shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary to-background">
            <img
              src="images/logo.jpeg"
              alt="Logo Back in Shape - Marzia Micillo"
              className="h-full w-full object-cover"
            />
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
                      {fmtDate(l.start)} · {fmtTime(l.start)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* INFO / CONTATTI */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Contatti</p>
          <h2 className="font-display mb-10 text-4xl font-bold uppercase">Dove trovarmi</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Via Tullio Ostilio 8, Milano</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>333 932 4861</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>marzia.micillo91@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-primary" />
                  <a href="https://instagram.com/backinshape_marziamicillo" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    @backinshape_marziamicillo
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-6">
                <p className="font-semibold">Orari</p>
                <p className="text-sm text-muted-foreground">Lun – Ven: 8:00 – 20:00</p>
                <p className="text-sm text-muted-foreground">Pausa: 13:00 – 14:00</p>
                <p className="text-sm text-muted-foreground">Sabato: 8:00 – 13:00</p>
                <p className="text-sm text-muted-foreground">Domenica: chiuso</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <Camera className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h2 className="font-display mb-4 text-4xl font-bold uppercase md:text-5xl">
          Pronto a cominciare?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Crea il tuo account e prenota la tua prima sessione. Seguo i tuoi progressi con foto
          prima/dopo e un programma su misura per te.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/registrati">Crea account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/shop">Schede & alimentazione</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
