const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  EINGEGANGEN: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Eingegangen' },
  IN_BEARBEITUNG: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Bearbeitung' },
  ABGESCHLOSSEN: { bg: 'bg-green-100', text: 'text-green-800', label: 'Abgeschlossen' },
  EXPORTIERT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Exportiert' },
  ABGELEHNT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Abgelehnt' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}
