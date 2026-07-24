import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { apiListProgressPhotos, apiUploadProgressPhoto, fmtDate, type ProgressPhoto } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Progresso() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [type, setType] = useState<'before' | 'after'>('before')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    setPhotos(await apiListProgressPhotos(user.id))
  }, [user])

  useEffect(() => { void load() }, [load])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      await apiUploadProgressPhoto(user.id, file, type, notes)
      setNotes('')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const before = photos.filter((p) => p.type === 'before')
  const after = photos.filter((p) => p.type === 'after')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Camera className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Foto prima e dopo</h1>
          <p className="text-sm text-muted-foreground">
            Carica le tue foto per monitorare i progressi nel tempo.
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
            />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
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
          <PhotoGrid photos={before} />
        </TabsContent>
        <TabsContent value="after">
          <PhotoGrid photos={after} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PhotoGrid({ photos }: { photos: ProgressPhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessuna foto ancora. Carica la tua prima foto!</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-2">
            <a href={p.photo_url} target="_blank" rel="noopener noreferrer">
              <img src={p.photo_url} alt={`Foto ${p.type} del ${fmtDate(p.date)}`} className="aspect-[3/4] w-full rounded-md object-cover" />
            </a>
            <div className="mt-2 px-1 pb-1">
              <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
              {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
