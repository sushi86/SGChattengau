interface ZehnerkarteStatusProps {
  verbleibend: number
  kursName: string
}

export function ZehnerkarteStatus({ verbleibend, kursName }: ZehnerkarteStatusProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-white">
      <p className="font-medium text-text-heading">{kursName} — 10er-Karte</p>
      <div className="flex items-center gap-4 mt-2">
        <div>
          <span className={`text-2xl font-bold ${verbleibend > 2 ? 'text-success' : verbleibend > 0 ? 'text-warning' : 'text-error'}`}>
            {verbleibend}
          </span>
          <span className="text-sm text-text-body"> / 10 übrig</span>
        </div>
      </div>
      {/* Fortschrittsbalken */}
      <div className="h-2 bg-border-light rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${verbleibend > 2 ? 'bg-success' : verbleibend > 0 ? 'bg-warning' : 'bg-error'}`}
          style={{ width: `${(verbleibend / 10) * 100}%` }}
        />
      </div>
    </div>
  )
}
