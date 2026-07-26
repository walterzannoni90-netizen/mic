import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import {
  apiDeleteProgressPhoto,
  apiListProgressPhotos,
  apiUploadProgressPhoto,
  fmtDate,
  type ProgressPhoto,
} from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState, PageLoader } from '@/components/PageLoader'

export default function Progresso() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [type, setType] = useState<'before' | 'after'>('before')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    apiListProgressPhotos(user.id)
      .then(setPhotos)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Errore caricamento foto.'))
      .finally(() => setLoading(false))
  }, [user])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      await apiUploadProgressPhoto(user.id, file, type, notes)
      toast.success('Foto caricata.')
      setNotes('')
      const list = await apiListProgressPhotos(user.id)
      setPhotos(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDeleteProgressPhoto(id)
      setPhotos((p) => p.filter((x) => x.id !== id))
      toast.success('Foto eliminata.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore eliminazione.')
    }
  }

  const before = photos.filter((p) => p.type === 'before')
  const after = photos.filter((p) => p.type === 'after')

  if (loading) return <PageLoader label="Carico le tue foto…" />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Camera className="h-8 w-8 text-primary" aria-hidden />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Foto prima e dopo</h1>
          <p className="text-sm text-muted-foreground">
            Carica le tue foto per monitorare i progressi nel tempo. (Max 8 MB, JPG/PNG/WebP)
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="mb-3 font-semibold">Nuova foto</p>
          <div className="flex flex-wrap gap-3">
            <Button variant={type === 'before' ? 'default' : 'outline'} onClick={() => setType('before')}>
              Prima
            </Button>
            <Button variant={type === 'after' ? 'default' : 'outline'} onClick={() => setType('after')}>
              Dopo
            </Button>
            <Textarea
              className="w-full"
              placeholder="Note (es. peso, misurazioni, sensazioni…)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
            />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              {uploading ? 'Caricamento…' : 'Carica foto'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="before">
        <TabsList className="mb-6">
          <TabsTrigger value="before">Prima ({before.length})</TabsTrigger>
          <TabsTrigger value="after">Dopo ({after.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="before">
          {before.length === 0 ? (
            <EmptyState title="Nessuna foto 'Prima' ancora." hint="Carica la tua prima foto!" />
          ) : (
            <PhotoGrid photos={before} onDelete={handleDelete} />
          )}
        </TabsContent>
        <TabsContent value="after">
          {after.length === 0 ? (
            <EmptyState title="Nessuna foto 'Dopo' ancora." hint="Carica la tua prima foto!" />
          ) : (
            <PhotoGrid photos={after} onDelete={handleDelete} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PhotoGrid({ photos, onDelete }: { photos: ProgressPhoto[]; onDelete: (id: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-2">
            <a href={p.photo_url} target="_blank" rel="noopener noreferrer">
              <img
                src={p.photo_url}
                alt={`Foto ${p.type} del ${fmtDate(p.date)}`}
                loading="lazy"
                className="aspect-[3/4] w-full rounded-md object-cover transition-opacity hover:opacity-90"
              />
            </a>
            <div className="mt-2 flex items-start justify-between gap-2 px-1 pb-1">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
                {p.notes && <p className="truncate text-xs text-muted-foreground" title={p.notes}>{p.notes}</p>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(p.id)}
                aria-label="Elimina foto"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
