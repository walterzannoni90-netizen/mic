import { Loader2 } from 'lucide-react'

export function PageLoader({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
      <p className="text-sm">{title}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  )
}
