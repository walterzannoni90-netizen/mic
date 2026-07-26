# Back in Shape — Marzia Micillo

App di gestione per **Back in Shape**, il personal training di **Marzia Micillo** a Milano.

Funzionalità:

- 🏋️ Prenotazione lezioni (con policy di cancellazione 24h)
- 🛒 Shop di schede di allenamento e piani alimentari
- 📸 Foto prima/dopo con storage sicuro
- 👤 Autenticazione Supabase (email/password)
- 🛡️ Area admin: gestione utenti, presenze, contabilità

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3 (variabili CSS + utility classes)
- shadcn/ui (subset minimo: button, card, input, label, dialog, badge, tabs, checkbox, textarea, radio-group)
- Supabase (Auth, Postgres, Storage, RLS)
- Zod + react-hook-form per validazione
- Sonner per toast
- Vitest + Testing Library per i test

## Quick Start

```bash
npm install
cp .env.example .env       # poi inserisci le chiavi Supabase
npm run dev                # http://localhost:7100
```

### Setup Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai in **SQL Editor** ed esegui `supabase/migrations/00001_schema.sql`
3. Crea un bucket Storage chiamato `progress-photos` (pubblico)
4. In **Authentication → Providers** abilita Email
5. Crea un utente admin: registrati normalmente, poi nel DB esegui:
   ```sql
   update public.profiles set role = 'admin' where email = 'tu@email.it';
   ```

## Scripts

| Comando          | Descrizione                              |
|------------------|------------------------------------------|
| `npm run dev`    | Avvia il dev server                      |
| `npm run build`  | Build di produzione (TypeScript + Vite)  |
| `npm run preview`| Anteprima build                          |
| `npm run lint`   | ESLint                                   |
| `npm run test`   | Test con Vitest                          |

## Architettura

```
src/
├── App.tsx                  # router + Toaster
├── main.tsx
├── index.css
├── components/
│   ├── Layout.tsx           # header, footer, RequireAuth/RequireAdmin
│   ├── PageLoader.tsx
│   └── ui/                  # 10 componenti shadcn effettivamente usati
├── hooks/
│   ├── use-mobile.ts
│   └── useApi.ts
├── lib/
│   ├── auth.tsx             # AuthProvider + useAuth
│   ├── db.ts                # API client + types
│   ├── schemas.ts           # Zod schemas
│   ├── site.ts              # config centralizzata
│   ├── supabase.ts          # client Supabase
│   ├── utils.ts             # cn()
│   └── database.types.ts
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx            # react-hook-form + Zod
│   ├── Register.tsx
│   ├── Prenota.tsx
│   ├── LeMiePrenotazioni.tsx
│   ├── Shop.tsx
│   ├── Progresso.tsx
│   ├── Privacy.tsx
│   ├── Termini.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminUtenti.tsx
│       └── AdminPagamenti.tsx
└── test/
    └── setup.ts
```

## Sicurezza

- **RLS abilitato** su tutte le tabelle
- Funzione `is_admin()` stabile e `security definer` per evitare subquery per riga
- RPC atomica `book_lesson` con `SELECT ... FOR UPDATE` per evitare race condition sul `capacity`
- RPC atomica `cancel_booking` con policy 24h lato server
- Validazione input con Zod lato client (e CHECK constraints lato DB)
- Validazione mime + dimensione file per upload foto (max 8MB, JPG/PNG/WebP)
- Nessuna `SERVICE_ROLE_KEY` esposta nel client

## Note operative

- Le lezioni vengono **generate automaticamente** dal client al primo caricamento (id deterministico basato su data+ora), upsert in batch
- I prezzi dei prodotti vengono letti dal DB (non dal client) per evitare manomissioni
- Il calcolo delle finance è attualmente lato client (fallback) ma esiste la view server-side `user_finance` come riferimento canonico