'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Bild {
  id: string
  url: string
  alt: string | null
}

interface Props {
  initial: Bild[]
  sparteSlug: string
}

export function BildUpload({ initial, sparteSlug }: Props) {
  const [bilder, setBilder] = useState<Bild[]>(initial)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/v1/sparten/${sparteSlug}/bilder`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const body = await res.json()
        setBilder([...bilder, body.data])
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(bildId: string) {
    const res = await fetch(`/api/v1/sparten/${sparteSlug}/bilder?id=${bildId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setBilder(bilder.filter((b) => b.id !== bildId))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-h3 text-text-heading">Bilder</h3>
        <label className="cursor-pointer">
          <Button variant="outline" className="text-sm pointer-events-none" disabled={uploading}>
            {uploading ? 'Hochladen...' : '+ Bild hochladen'}
          </Button>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {bilder.length === 0 && <p className="text-sm text-text-body">Noch keine Bilder hochgeladen.</p>}

      <div className="grid grid-cols-2 tablet:grid-cols-3 gap-3">
        {bilder.map((bild) => (
          <div key={bild.id} className="relative group">
            <div className="aspect-video relative rounded-md overflow-hidden border border-border">
              <Image src={bild.url} alt={bild.alt || ''} fill className="object-cover" sizes="200px" />
            </div>
            <button
              onClick={() => handleDelete(bild.id)}
              className="absolute top-1 right-1 bg-error text-white rounded-full w-6 h-6 text-xs
                opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
