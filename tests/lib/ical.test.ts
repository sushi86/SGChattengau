import { describe, it, expect } from 'vitest'
import { generateIcal } from '@/lib/ical'

describe('generateIcal', () => {
  it('generates valid iCal output with VCALENDAR', () => {
    const ical = generateIcal([])
    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('END:VCALENDAR')
    expect(ical).toContain('PRODID:-//SG 1898 Chattengau')
  })

  it('includes a VEVENT for each termin', () => {
    const termine = [{
      id: 'test1',
      titel: 'Training',
      beschreibung: 'Fußballtraining',
      startzeit: new Date('2026-05-01T18:00:00Z'),
      endzeit: new Date('2026-05-01T20:00:00Z'),
      ort: 'Sportplatz',
      ganztaegig: false,
    }]
    const ical = generateIcal(termine)
    expect(ical).toContain('BEGIN:VEVENT')
    expect(ical).toContain('SUMMARY:Training')
    expect(ical).toContain('LOCATION:Sportplatz')
    expect(ical).toContain('END:VEVENT')
  })

  it('handles all-day events', () => {
    const termine = [{
      id: 'test2',
      titel: 'Vereinsfest',
      beschreibung: null,
      startzeit: new Date('2026-06-15T00:00:00Z'),
      endzeit: null,
      ort: null,
      ganztaegig: true,
    }]
    const ical = generateIcal(termine)
    expect(ical).toContain('DTSTART;VALUE=DATE:20260615')
  })

  it('handles multiple events', () => {
    const termine = [
      { id: '1', titel: 'A', beschreibung: null, startzeit: new Date('2026-05-01T10:00:00Z'), endzeit: null, ort: null, ganztaegig: false },
      { id: '2', titel: 'B', beschreibung: null, startzeit: new Date('2026-05-02T10:00:00Z'), endzeit: null, ort: null, ganztaegig: false },
    ]
    const ical = generateIcal(termine)
    const eventCount = (ical.match(/BEGIN:VEVENT/g) || []).length
    expect(eventCount).toBe(2)
  })
})
