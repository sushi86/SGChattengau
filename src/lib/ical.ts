interface TerminForIcal {
  id: string
  titel: string
  beschreibung: string | null
  startzeit: Date
  endzeit: Date | null
  ort: string | null
  ganztaegig: boolean
}

function formatDateTimeUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function escapeIcalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateIcal(termine: TerminForIcal[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SG 1898 Chattengau//Terminkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SG 1898 Chattengau Termine',
    'X-WR-TIMEZONE:Europe/Berlin',
  ]

  for (const t of termine) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${t.id}@sg1898chattengau.de`)

    if (t.ganztaegig) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(t.startzeit)}`)
      if (t.endzeit) lines.push(`DTEND;VALUE=DATE:${formatDateOnly(t.endzeit)}`)
    } else {
      lines.push(`DTSTART:${formatDateTimeUTC(t.startzeit)}`)
      if (t.endzeit) lines.push(`DTEND:${formatDateTimeUTC(t.endzeit)}`)
    }

    lines.push(`SUMMARY:${escapeIcalText(t.titel)}`)
    if (t.beschreibung) lines.push(`DESCRIPTION:${escapeIcalText(t.beschreibung)}`)
    if (t.ort) lines.push(`LOCATION:${escapeIcalText(t.ort)}`)
    lines.push(`DTSTAMP:${formatDateTimeUTC(new Date())}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
