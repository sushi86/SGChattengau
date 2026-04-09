const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

interface Trainingszeit {
  wochentag: number
  startzeit: string
  endzeit: string
  ort: string | null
  hinweis: string | null
}

export function TrainingszeitenDisplay({ trainingszeiten }: { trainingszeiten: Trainingszeit[] }) {
  if (trainingszeiten.length === 0) return null

  return (
    <div>
      <h3 className="font-heading text-h3 text-text-heading mb-3">Trainingszeiten</h3>
      <div className="space-y-2">
        {trainingszeiten.map((t, i) => (
          <div key={i} className="bg-white p-3 rounded-md border border-border">
            <div className="flex justify-between items-center">
              <span className="font-medium text-text-heading">{WOCHENTAGE[t.wochentag]}</span>
              <span className="text-primary font-medium">{t.startzeit} &ndash; {t.endzeit}</span>
            </div>
            {t.ort && <p className="text-sm text-text-body mt-1">{t.ort}</p>}
            {t.hinweis && <p className="text-xs text-text-body mt-1 italic">{t.hinweis}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
