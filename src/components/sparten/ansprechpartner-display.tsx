interface AnsprechpartnerItem {
  name: string
  rolle: string | null
  telefon: string | null
  email: string | null
}

export function AnsprechpartnerDisplay({ ansprechpartner }: { ansprechpartner: AnsprechpartnerItem[] }) {
  if (ansprechpartner.length === 0) return null

  return (
    <div>
      <h3 className="font-heading text-h3 text-text-heading mb-3">Ansprechpartner</h3>
      <div className="space-y-2">
        {ansprechpartner.map((a, i) => (
          <div key={i} className="bg-white p-3 rounded-md border border-border">
            <p className="font-medium text-text-heading">{a.name}</p>
            {a.rolle && <p className="text-sm text-text-body">{a.rolle}</p>}
            <div className="flex flex-col tablet:flex-row gap-2 mt-1 text-sm">
              {a.telefon && (
                <a href={`tel:${a.telefon}`} className="text-primary hover:text-primary-hover">{a.telefon}</a>
              )}
              {a.email && (
                <a href={`mailto:${a.email}`} className="text-primary hover:text-primary-hover">{a.email}</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
